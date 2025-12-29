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

// ✅ Нова нижча ціна з env (або дефолт)
const PRICE_UAH = Number(process.env.NEXT_PUBLIC_PRICE_UAH || 49);

// ✅ ключ localStorage
const STORAGE_KEY = 'partnerGender';

export default function TestPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ NEW: преміум
  const [isPremium, setIsPremium] = useState(false);

  // ✅ стать партнера: тепер підтягуємо ТІЛЬКИ з localStorage
  const [partnerGender, setPartnerGender] = useState(null); // 'male' | 'female' | null

  const router = useRouter();
  const { data: session, status } = useSession();

  const userEmail = (session?.user?.email || '').toLowerCase();
  const isBypassUser = Boolean(userEmail && BYPASS_EMAILS.includes(userEmail));

  // ✅ ВАРІАНТ B:
  // якщо нема partnerGender -> повертаємо на головну (вибір робиться тільки там)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved === 'male' || saved === 'female') {
      setPartnerGender(saved);
    } else {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/user')
        .then(async (res) => {
          if (!res.ok) return { freeAttemptsUsed: isBypassUser ? 0 : 1, isPremium: false };
          return await res.json();
        })
        .then((data) => {
          const premium = Boolean(data?.isPremium);
          setIsPremium(premium);

          // ✅ Paywall тільки якщо:
          // - не bypass
          // - не premium
          // - вже використав безкоштовну спробу
          if (!isBypassUser && !premium && (data?.freeAttemptsUsed ?? 0) > 0) setShowPaywall(true);
          else setShowPaywall(false);

          setIsLoading(false);
        })
        .catch(() => {
          // якщо API впало — для безпеки: блокуємо лише небайпасних (як і було)
          setIsPremium(false);
          setShowPaywall(!isBypassUser);
          setIsLoading(false);
        });
    }
  }, [status, router, isBypassUser]);

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

    // ✅ Важливо: інкрементимо freeAttemptsUsed тільки якщо:
    // - не bypass
    // - не premium
    if (!isBypassUser && !isPremium) {
      try {
        await fetch('/api/user/update', { method: 'POST' });
      } catch (e) {
        // навіть якщо не вдалось — все одно покажемо результат
      }
    }

    // ✅ partner береться з localStorage (вибір на головній)
    const partner = partnerGender || 'male';

    const qs = new URLSearchParams({
      ...finalVector,
      partner,
    }).toString();

    router.push(`/result?${qs}`);
  };

  // якщо ще не підхопили partnerGender — показуємо лоадер (інакше мигне UI)
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
        <p className="mt-4 text-lg text-gray-300">Придбайте підписку для доступу до повторних генерацій.</p>

        <button
  onClick={async () => {
    try {
      const res = await fetch("/api/liqpay/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: PRICE_UAH }),
      });

      const json = await res.json();
      if (!res.ok || !json?.data || !json?.signature) {
        alert(json?.error || "Checkout error");
        return;
      }

      // Створюємо форму і редіректимо на LiqPay
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://www.liqpay.ua/api/3/checkout";
      form.acceptCharset = "utf-8";

      const dataInput = document.createElement("input");
      dataInput.type = "hidden";
      dataInput.name = "data";
      dataInput.value = json.data;

      const sigInput = document.createElement("input");
      sigInput.type = "hidden";
      sigInput.name = "signature";
      sigInput.value = json.signature;

      form.appendChild(dataInput);
      form.appendChild(sigInput);
      document.body.appendChild(form);
      form.submit();
      form.remove();
    } catch (e) {
      alert("Не вдалося створити оплату. Перевір /api/liqpay/checkout та env на Render.");
    }
  }}
  className="mt-8 px-8 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-xl"
>
  Придбати ({PRICE_UAH} грн)
</button>


        <p className="mt-2 text-sm text-gray-500">(Сторінка оплати в розробці)</p>
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
