// src/app/result/page.js
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { findBestMatch } from '@/utils/matching';
import Link from 'next/link';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';
import compatibilityTexts from '@/data/compatibility_texts.json';

// BYPASS EMAILS
const BYPASS_EMAILS = (process.env.NEXT_PUBLIC_BYPASS_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// ✅ Ціна підписки (грн)
const PRICE_UAH = Number(process.env.NEXT_PUBLIC_PRICE_UAH || 49);

// ✅ ключ для останнього інвойсу
const LAST_INVOICE_KEY = 'lastMonoInvoiceId';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const userEmail = (session?.user?.email || '').toLowerCase();
  const isBypassUser = Boolean(userEmail && BYPASS_EMAILS.includes(userEmail));

  // доступ
  const [accessLoading, setAccessLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // pay states
  const [isPaying, setIsPaying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // result ui
  const [activeTab, setActiveTab] = useState('portrait');
  const [matchedArchetype, setMatchedArchetype] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isCalcLoading, setIsCalcLoading] = useState(true);

  // tooltip "?"
  const [showImageDisclaimer, setShowImageDisclaimer] = useState(false);
  const disclaimerRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (!showImageDisclaimer) return;
      if (!disclaimerRef.current) return;
      if (!disclaimerRef.current.contains(e.target)) setShowImageDisclaimer(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showImageDisclaimer]);

  // helper: load access
  const loadAccess = async () => {
    const res = await fetch('/api/user');
    if (!res.ok) return { isPremium: false, subscriptionActiveUntil: null };
    return await res.json();
  };

  // 1) auth gate
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      // ✅ без авторизації результат теж не показуємо
      signIn('google', { callbackUrl: window.location.href });
      return;
    }

    if (status === 'authenticated') {
      (async () => {
        try {
          const data = await loadAccess();

          let premiumByDate = false;
          if (data?.subscriptionActiveUntil) {
            const until = new Date(data.subscriptionActiveUntil).getTime();
            premiumByDate = Number.isFinite(until) && until > Date.now();
          }

          const premium = Boolean(premiumByDate || data?.isPremium);
          setIsPremium(premium);
        } finally {
          setAccessLoading(false);
        }
      })();
    }
  }, [status]);

  // 2) якщо повернулись з оплати — sync invoice і перезавантажити access
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status !== 'authenticated') return;

    const url = new URL(window.location.href);
    const paid = url.searchParams.get('paid');
    if (paid !== '1') return;

    const invoiceId = window.localStorage.getItem(LAST_INVOICE_KEY);
    if (!invoiceId) return;

    (async () => {
      try {
        setIsSyncing(true);

        const syncRes = await fetch('/api/mono/sync', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ invoiceId }),
        });

        await syncRes.json().catch(() => null);

        const data = await loadAccess();

        let premiumByDate = false;
        if (data?.subscriptionActiveUntil) {
          const until = new Date(data.subscriptionActiveUntil).getTime();
          premiumByDate = Number.isFinite(until) && until > Date.now();
        }

        const premium = Boolean(premiumByDate || data?.isPremium);
        setIsPremium(premium);

        // прибираємо paid=1 з URL
        url.searchParams.delete('paid');
        window.history.replaceState({}, '', url.toString());

        // прибираємо invoiceId
        window.localStorage.removeItem(LAST_INVOICE_KEY);
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [status]);

  // 3) якщо доступ є — рахуємо результат
  useEffect(() => {
    // поки не відомий доступ — не рахуємо
    if (accessLoading) return;

    // якщо не premium і не bypass — не показуємо результат
    if (!isBypassUser && !isPremium) {
      setIsCalcLoading(false);
      setMatchedArchetype(null);
      return;
    }

    if (!searchParams.has('dominance')) {
      setIsCalcLoading(false);
      return;
    }

    const userVector = {
      dominance: parseInt(searchParams.get('dominance'), 10),
      empathy: parseInt(searchParams.get('empathy'), 10),
      possessiveness: parseInt(searchParams.get('possessiveness'), 10),
      social_status: parseInt(searchParams.get('social_status'), 10),
      chaos: parseInt(searchParams.get('chaos'), 10),
      darkness: parseInt(searchParams.get('darkness'), 10),
    };

    if (isNaN(userVector.dominance)) {
      setIsCalcLoading(false);
      return;
    }

    const partnerGender = (searchParams.get('partner') || 'male').toLowerCase();

    let match = findBestMatch(userVector, { partnerGender });

    if (match) {
      const compatText = compatibilityTexts.find((t) => t.id === match.id);
      if (compatText) match.compatibility_text = compatText.text;
    }

    setMatchedArchetype(match);
    setIsCalcLoading(false);

    let interval;
    if (match) {
      const targetScore = match.compatibility;
      setAnimatedScore(0);
      if (targetScore > 0) {
        interval = setInterval(() => {
          setAnimatedScore((prev) => {
            if (prev < targetScore) return prev + 1;
            clearInterval(interval);
            return targetScore;
          });
        }, 20);
      } else {
        setAnimatedScore(targetScore);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [accessLoading, isPremium, isBypassUser, searchParams]);

  // loaders
  if (status === 'loading' || accessLoading) {
    return <p className="text-white">Перевірка доступу...</p>;
  }

  // ✅ PAYWALL НА РЕЗУЛЬТАТІ (З ПЕРШОГО РАЗУ)
  if (!isBypassUser && !isPremium) {
    return (
      <div className="w-full max-w-md mx-auto bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden p-6">
        <h1 className="text-3xl font-serif font-bold">Результат доступний після оплати</h1>
        <p className="mt-3 text-gray-300">
          Активуй підписку на 1 місяць і отримай доступ до результатів (безлімітні проходження).
        </p>

        <button
          onClick={async () => {
            if (isPaying || isSyncing) return;
            setIsPaying(true);

            try {
              const res = await fetch('/api/mono/create-invoice', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ amountUah: PRICE_UAH }),
              });

              const json = await res.json();
              if (!res.ok || !json?.pageUrl || !json?.invoiceId) {
                alert(json?.error || 'Не вдалося створити інвойс Monobank');
                setIsPaying(false);
                return;
              }

              window.localStorage.setItem(LAST_INVOICE_KEY, String(json.invoiceId));
              window.location.href = json.pageUrl;
            } catch (e) {
              alert('Не вдалося створити оплату. Перевір /api/mono/create-invoice та env на Render.');
              setIsPaying(false);
            }
          }}
          className="mt-6 w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-lg disabled:opacity-60"
          disabled={isPaying || isSyncing}
        >
          {isSyncing ? 'Перевірка оплати...' : isPaying ? 'Переадресація...' : `Підписка на 1 місяць — ${PRICE_UAH} грн`}
        </button>

        <p className="mt-3 text-xs text-gray-500">
          Після оплати повернись на сайт — підписка активується автоматично.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold"
          >
            На головну
          </button>
          <button
            onClick={() => router.push('/test')}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
          >
            Пройти ще раз
          </button>
        </div>
      </div>
    );
  }

  // якщо нема параметрів — просимо пройти тест
  if (!searchParams.has('dominance')) {
    return (
      <div className="text-center p-8">
        <h1 className="text-3xl font-serif text-white">Спочатку пройдіть тест</h1>
        <p className="text-gray-400 mt-2">Щоб дізнатися свій ідеальний архетип.</p>
        <Link href="/test">
          <button className="mt-8 px-8 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-xl">
            Почати Тест
          </button>
        </Link>
      </div>
    );
  }

  if (isCalcLoading) {
    return <p className="text-white">Розрахунок результату...</p>;
  }

  if (!matchedArchetype) {
    return <p className="text-white">Не вдалося сформувати результат. Спробуй пройти тест ще раз.</p>;
  }

  const archetypeImages = [
    `/images/archetypes/archetype_${matchedArchetype.id}(1).png`,
    `/images/archetypes/archetype_${matchedArchetype.id}(2).png`,
    `/images/archetypes/archetype_${matchedArchetype.id}(3).png`,
    `/images/archetypes/archetype_${matchedArchetype.id}(4).png`,
  ];

  return (
    <div className="w-full max-w-md mx-auto bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden">
      <div className="relative">
        <Carousel
          showThumbs={false}
          showStatus={false}
          infiniteLoop={true}
          autoPlay={true}
          interval={5000}
          className="rounded-t-lg"
        >
          {archetypeImages.map((url, index) => (
            <div key={index}>
              <img
                src={url}
                alt={`${matchedArchetype.name} - variation ${index + 1}`}
                className="w-full h-96 object-cover"
              />
            </div>
          ))}
        </Carousel>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/70 to-transparent">
          <h1 className="text-4xl font-serif font-bold text-white">{matchedArchetype.name}</h1>
          <p className="text-xl text-red-300 uppercase tracking-widest">{matchedArchetype.archetype_type}</p>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="bg-black/50 px-3 py-1 rounded-full">
            <p className="text-white font-bold">{animatedScore}% сумісність</p>
          </div>

          <div
            ref={disclaimerRef}
            className="relative"
            onMouseEnter={() => setShowImageDisclaimer(true)}
            onMouseLeave={() => setShowImageDisclaimer(false)}
          >
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white font-bold flex items-center justify-center backdrop-blur transition"
              aria-label="Інформація про зображення"
              onClick={() => setShowImageDisclaimer((v) => !v)}
            >
              ?
            </button>

            {showImageDisclaimer && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-black/80 text-white text-sm p-3 shadow-lg border border-white/10">
                Зображення може не збігатися із зовнішністю персонажа та представлено в ознайомчих цілях.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex border-b border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('portrait')}
            className={`py-2 px-4 ${activeTab === 'portrait' ? 'text-white border-b-2 border-red-500' : 'text-gray-400'}`}
          >
            Портрет
          </button>
          <button
            onClick={() => setActiveTab('compatibility')}
            className={`py-2 px-4 ${activeTab === 'compatibility' ? 'text-white border-b-2 border-red-500' : 'text-gray-400'}`}
          >
            Сумісність
          </button>
        </div>

        <div>
          {activeTab === 'portrait' && (
            <div>
              <p className="text-gray-300">{matchedArchetype.long_description}</p>
              {matchedArchetype.quote && (
                <blockquote className="mt-4 border-l-4 border-red-800 pl-4 italic text-gray-400">
                  "{matchedArchetype.quote}"
                </blockquote>
              )}
            </div>
          )}

          {activeTab === 'compatibility' && (
            <div>
              <h3 className="font-bold text-lg mb-2">Чому він тобі підходить:</h3>
              <p className="text-gray-300">
                {matchedArchetype.compatibility_text || 'Текст сумісності для цього архетипу ще не додано.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-black/20">
        <Link href={`/share/${matchedArchetype.id}`} target="_blank" rel="noopener noreferrer">
          <button className="w-full mb-3 px-8 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-lg transition-transform transform hover:scale-105">
            Поділитися результатом
          </button>
        </Link>

        <Link href="/test">
          <button className="w-full px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-lg">
            Пройти тест заново
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
      <Suspense fallback={<p className="text-white">Завантаження результату...</p>}>
        <ResultContent />
      </Suspense>
    </main>
  );
}
