'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const [activeTab, setActiveTab] = useState('portrait');
  const [matchedArchetype, setMatchedArchetype] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ доступ
  const [accessLoading, setAccessLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [freeAttemptsUsed, setFreeAttemptsUsed] = useState(0);

  // ✅ оплата
  const [isPaying, setIsPaying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ✅ tooltip "?"
  const [showImageDisclaimer, setShowImageDisclaimer] = useState(false);
  const disclaimerRef = useRef(null);

  // ✅ щоб free attempt не інкрементилось 2 рази
  const consumedFreeRef = useRef(false);

  const userEmail = (session?.user?.email || '').toLowerCase();
  const isBypassUser = Boolean(userEmail && BYPASS_EMAILS.includes(userEmail));

  useEffect(() => {
    function handleOutsideClick(e) {
      if (!showImageDisclaimer) return;
      if (!disclaimerRef.current) return;
      if (!disclaimerRef.current.contains(e.target)) {
        setShowImageDisclaimer(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showImageDisclaimer]);

  // ✅ 1) Рахуємо результат з querystring (як було)
  useEffect(() => {
    if (!searchParams.has('dominance')) {
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    const partnerGender = (searchParams.get('partner') || 'male').toLowerCase();
    let match = findBestMatch(userVector, { partnerGender });

    if (match) {
      const compatText = compatibilityTexts.find((t) => t.id === match.id);
      if (compatText) match.compatibility_text = compatText.text;
    }

    setMatchedArchetype(match);
    setIsLoading(false);

    let interval;
    if (match) {
      const targetScore = match.compatibility;
      setAnimatedScore(0);
      if (targetScore > 0) {
        interval = setInterval(() => {
          setAnimatedScore((prevScore) => {
            if (prevScore < targetScore) return prevScore + 1;
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
  }, [searchParams]);

  // ✅ 2) Перевіряємо доступ (premium/дата/1 free)
  const loadAccess = async () => {
    const res = await fetch('/api/user');
    if (!res.ok) return { freeAttemptsUsed: isBypassUser ? 0 : 1, isPremium: false, subscriptionActiveUntil: null };
    return await res.json();
  };

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    // result як і test: тільки для залогінених (просте і надійне)
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (sessionStatus === 'authenticated') {
      setAccessLoading(true);
      loadAccess()
        .then((data) => {
          setFreeAttemptsUsed(data?.freeAttemptsUsed ?? 0);

          let premiumByDate = false;
          if (data?.subscriptionActiveUntil) {
            const until = new Date(data.subscriptionActiveUntil).getTime();
            premiumByDate = Number.isFinite(until) && until > Date.now();
          }

          const premium = Boolean(isBypassUser || premiumByDate || data?.isPremium);
          setIsPremium(premium);
        })
        .finally(() => setAccessLoading(false));
    }
  }, [sessionStatus, isBypassUser, router]);

  // ✅ 3) Якщо повернулися з оплати — sync і оновити доступ
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStatus !== 'authenticated') return;

    const url = new URL(window.location.href);
    const paid = url.searchParams.get('paid');
    if (paid !== '1') return;

    const invoiceId = window.localStorage.getItem(LAST_INVOICE_KEY);
    if (!invoiceId) {
      url.searchParams.delete('paid');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    (async () => {
      try {
        setIsSyncing(true);

        await fetch('/api/mono/sync', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ invoiceId }),
        }).then((r) => r.json().catch(() => null));

        const data = await loadAccess();

        setFreeAttemptsUsed(data?.freeAttemptsUsed ?? 0);

        let premiumByDate = false;
        if (data?.subscriptionActiveUntil) {
          const until = new Date(data.subscriptionActiveUntil).getTime();
          premiumByDate = Number.isFinite(until) && until > Date.now();
        }

        const premium = Boolean(isBypassUser || premiumByDate || data?.isPremium);
        setIsPremium(premium);

        // прибираємо paid=1 з URL
        url.searchParams.delete('paid');
        window.history.replaceState({}, '', url.toString());

        // прибираємо invoiceId щоб не було повторних sync
        window.localStorage.removeItem(LAST_INVOICE_KEY);
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [sessionStatus, isBypassUser]);

  // ✅ 4) Логіка “чи можна показати результат”
  const hasFree = (freeAttemptsUsed ?? 0) === 0;
  const canView = Boolean(isBypassUser || isPremium || hasFree);

  // ✅ 5) Якщо показали результат по free — списуємо freeAttemptsUsed (разово)
  useEffect(() => {
    if (!matchedArchetype) return;
    if (accessLoading) return;
    if (isBypassUser) return;
    if (isPremium) return;

    // якщо є free і ми відкрили результат — спалюємо free
    if (hasFree && !consumedFreeRef.current) {
      consumedFreeRef.current = true;
      fetch('/api/user/update', { method: 'POST' }).catch(() => {});
      setFreeAttemptsUsed(1); // локально, щоб одразу показувало paywall при повторі
    }
  }, [matchedArchetype, accessLoading, isBypassUser, isPremium, hasFree]);

  if (isLoading || sessionStatus === 'loading' || accessLoading) {
    return <p className="text-white">Завантаження...</p>;
  }

  if (!matchedArchetype) {
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

  // ✅ PAYWALL НА РЕЗУЛЬТАТІ
  if (!canView) {
    return (
      <div className="w-full max-w-md mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
        <div className="p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
          <div className="relative">
            <h1 className="text-2xl font-serif font-bold">Твій результат готовий 🔒</h1>
            <p className="mt-2 text-gray-300 text-sm">
              Щоб побачити архетип, опис і сумісність — потрібна підписка на 1 місяць.
            </p>

            <div className="mt-5 rounded-xl border border-gray-800 bg-black/20 p-4">
              <p className="text-gray-300 text-sm">
                ✔ Безлімітні проходження протягом 30 днів <br />
                ✔ Відкриття результатів без обмежень
              </p>
            </div>

            <button
              onClick={async () => {
                if (isPaying) return;
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
              className="mt-6 w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-xl text-lg disabled:opacity-60"
              disabled={isPaying || isSyncing}
            >
              {isSyncing ? 'Перевірка оплати...' : isPaying ? 'Переадресація...' : `Розблокувати за ${PRICE_UAH} грн`}
            </button>

            <p className="mt-3 text-xs text-gray-500">
              Після оплати повернись на сайт — доступ активується автоматично.
            </p>

            <div className="mt-4 flex gap-3">
              <Link href="/test" className="w-full">
                <button className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-sm">
                  Пройти ще раз
                </button>
              </Link>
              <Link href="/" className="w-full">
                <button className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-sm">
                  На головну
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ ПОВНИЙ РЕЗУЛЬТАТ (преміум/байпас/або 1 free)
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
