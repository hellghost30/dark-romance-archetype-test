// src/app/test/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import questions from '@/data/questions.json';

const STORAGE_KEY = 'partnerGender';

// ✅ зберігаємо останній result qs, щоб після оплати повернутись саме на нього
const LAST_RESULT_QS_KEY = 'lastResultQs';

export default function TestPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);

  const [partnerGender, setPartnerGender] = useState(null); // 'male' | 'female' | null

  const router = useRouter();
  const { status } = useSession();

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
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

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
    const partner = partnerGender || 'male';

    const qs = new URLSearchParams({
      ...finalVector,
      partner,
    }).toString();

    // ✅ збережемо qs, щоб після оплати повернутись саме на цей результат
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_RESULT_QS_KEY, qs);
    }

    router.push(`/result?${qs}`);
  };

  if (!partnerGender) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-white text-xl">Підготовка тесту...</p>
      </main>
    );
  }

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-white text-xl">Завантаження...</p>
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
          />
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
