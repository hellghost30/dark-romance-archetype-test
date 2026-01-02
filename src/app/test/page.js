// src/app/test/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import questions from '@/data/questions.json';

// BYPASS EMAILS
const BYPASS_EMAILS = (process.env.NEXT_PUBLIC_BYPASS_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// ✅ Ціна підписки (грн)
const PRICE_UAH = Number(process.env.NEXT_PUBLIC_PRICE_UAH || 49);

// ✅ ключ localStorage
const STORAGE_KEY = 'partnerGender';

// ✅ ключ для останнього інвойсу
const LAST_INVOICE_KEY = 'lastMonoInvoiceId';

export default function TestPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ преміум
  const [isPremium, setIsPremium] = useState(false);

  // ✅ для кнопки оплати (щоб не клікали 100 раз)
  const [isPaying, setIsPaying] = useState(false);

  // ✅ для “повернувся з оплати — синкаємо”
  const [isSyncing, setIsSyncing] = useState(false);

  // ✅ стать партнера: з localStorage
  const [partnerGender, setPartnerGender] = useState(null); // 'male' | 'female' | null

  const router = useRouter();
  const { data: session, status } = useSession();

  const userEmail = (session?.user?.email || '').toLowerCase();
  const isBypassUser = Boolean(userEmail && BYPASS_EMAILS.includes(userEmail));

  // якщо нема partnerGender -> на головну
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved === 'male' || saved === 'female') {
      setPartnerGender(saved);
    } else {
      router.push('/');
    }
  }, [router]);

  // ✅ helper: підвантажити доступ (user)
  const loadAccess = async () => {
    const res = await fetch('/api/user');
    if (!res.ok) {
      return { freeAttemptsUsed: isBypassUser ? 0 : 1, isPremium: false, subscriptionActiveUntil: null };
    }
    return await res.json();
  };

  // ✅ первинна перевірка доступу
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      loadAccess()
        .then((data) => {
          let premiumByDate = false;
          if (data?.subscriptionActiveUntil) {
            const until = new Date(data.subscriptionActiveUntil).getTime();
            premiumByDate = Number.isFinite(until) && until > Date.now();
          }

          const premium = Boolean(premiumByDate || data?.isPremium);
          setIsPremium(premium);

          if (!isBypassUser && !premium && (data?.freeAttemptsUsed ?? 0) > 0) setShowPaywall(true);
          else setShowPaywall(false);

          setIsLoading(false);
        })
        .catch(() => {
          setIsPremium(false);
          setShowPaywall(!isBypassUser);
          setIsLoading(false);
        });
    }
  }, [status, router, isBypassUser]);

  // ✅ NEW: якщо повернулись з оплати — синкнути інвойс і оновити доступ
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

        // після синку — підтягуємо юзера заново
        const data = await loadAccess();

        let premiumByDate = false;
        if (data?.subscriptionActiveUntil) {
          const until = new Date(data.subscriptionActiveUntil).getTime();
          premiumByDate = Number.isFinite(until) && until > Date.now();
        }

        const premium = Boolean(premiumByDate || data?.isPremium);
        setIsPremium(premium);

        if (!isBypassUser && !premium && (data?.freeAttemptsUsed ?? 0) > 0) setShowPaywall(true);
        else setShowPaywall(false);

        // прибираємо paid=1 з URL, щоб не синкало кожен раз
        url.searchParams.delete('paid');
        window.history.replaceState({}, '', url.toString());

        // (опційно) прибираємо invoiceId, щоб не було повторних синків
        window.localStorage.removeItem(LAST_INVOICE_KEY);
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [status, isBypassUser]);

  const calculateFinalVector = (answers) => {
    const initialVector = {
      dominance: 50,
      empathy: 50,
      possessiveness: 50,
      social_status: 50,
      chaos: 50,
      darkness: 50,
    };

    answers.forEach((effects) => {
      for (const key in effects) {
        if (Object.prototype.hasOwnProperty.call(initialVector, key)) {
          initialVector[key] += effects[key];
        }
      }
    });

    return initialVector;
  };

  const handleAnswer = async (answer) => {
    const nextAnswers = [...userAnswers, answer.effects];

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswers(nextAnswers);
      return;
    }

    // ✅ Кінець тесту
    const finalVector = calculateFinalVector(nextAnswers);

    // інкрементимо freeAttemptsUsed тільки якщо:
    // - не bypass
    // - не premium
    if (!isBypassUser && !isPremium) {
      try {
        await fetch('/api/user/update', { method: 'POST' });
      } catch (e) {}
    }

    const partner = partnerGender || 'male';

    const qs = new URLSearchParams({
      ...finalVector,
      partner,
    }).toString();

    router.push(`/result?${qs}`);
  };

  if (!partnerGender) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-white text-xl">Підготовка тесту...</p>
      </main>
    );
  }

  if (isLoading || status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-white text-xl">Перевірка доступу...</p>
      </main>
    );
  }

  if (showPaywall) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8 text-center">
        <h1 className="text-4xl font-serif">Ви вже використали свою безкоштовну спробу</h1>
        <p className="mt-4 text-lg text-gray-300">Придбайте підписку на 1 місяць для безлімітного доступу.</p>

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

              // ✅ зберігаємо invoiceId щоб після повернення зробити sync
              window.localStorage.setItem(LAST_INVOICE_KEY, String(json.invoiceId));

              // ✅ редірект на оплату mono
              window.location.href = json.pageUrl;
            } catch (e) {
              alert('Не вдалося створити оплату. Перевір /api/mono/create-invoice та env на Render.');
              setIsPaying(false);
            }
          }}
          className="mt-8 px-8 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-xl disabled:opacity-60"
          disabled={isPaying || isSyncing}
        >
          {isSyncing ? 'Перевірка оплати...' : isPaying ? 'Переадресація...' : `Підписка на 1 місяць — ${PRICE_UAH} грн`}
        </button>

        <p className="mt-3 text-xs text-gray-500">
          Після оплати повернись на сайт — підписка активується автоматично.
        </p>
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const imageUrl = `/images/questions/q${currentQuestion.id}.png`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4 md:p-8">
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between mb-2 text-sm text-gray-400">
          <span>Партнер: {partnerGender === 'male' ? 'чоловік' : 'жінка'}</span>
        </div>

        <div className="bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="w-full max-w-2xl text-center">
        <img
          key={currentQuestion.id}
          src={imageUrl}
          alt={`Illustration for question ${currentQuestion.id}`}
          className="w-full max-w-sm h-auto object-contain rounded-lg mb-6 mx-auto"
        />

        <h2 className="text-2xl md:text-3xl font-serif mb-8 px-4">{currentQuestion.question_text}</h2>

        <div className="space-y-4">
          {currentQuestion.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(answer)}
              className="w-full p-4 bg-gray-800 hover:bg-red-800 rounded-lg text-lg transition-colors duration-200"
            >
              {answer.text}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
