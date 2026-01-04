// src/app/result/ResultClient.js
"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { findBestMatch } from "@/utils/matching";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import compatibilityTexts from "@/data/compatibility_texts.json";

function clamp01to100(n) {
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

function parseClampedInt(searchParams, key) {
  const raw = searchParams.get(key);
  const n = parseInt(raw, 10);
  return clamp01to100(n);
}

function ResultInner() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("portrait");
  const [matchedArchetype, setMatchedArchetype] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isCalcLoading, setIsCalcLoading] = useState(true);

  const [showImageDisclaimer, setShowImageDisclaimer] = useState(false);
  const disclaimerRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (!showImageDisclaimer) return;
      if (!disclaimerRef.current) return;
      if (!disclaimerRef.current.contains(e.target)) setShowImageDisclaimer(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showImageDisclaimer]);

  useEffect(() => {
    // мінімум для результату
    if (!searchParams.has("dominance")) {
      setIsCalcLoading(false);
      return;
    }

    const userVector = {
      dominance: parseClampedInt(searchParams, "dominance"),
      empathy: parseClampedInt(searchParams, "empathy"),
      possessiveness: parseClampedInt(searchParams, "possessiveness"),
      social_status: parseClampedInt(searchParams, "social_status"),
      chaos: parseClampedInt(searchParams, "chaos"),
      darkness: parseClampedInt(searchParams, "darkness"),
    };

    // якщо ключові поля відсутні/NaN — не рахуємо
    if (userVector.dominance === null) {
      setIsCalcLoading(false);
      return;
    }

    // інші — якщо null, підставляємо 0 (або можеш зробити 50)
    for (const k of Object.keys(userVector)) {
      if (userVector[k] === null) userVector[k] = 0;
    }

    // partnerGender whitelist
    const rawPartner = String(searchParams.get("partner") || "male").toLowerCase();
    const partnerGender = rawPartner === "female" ? "female" : "male";

    setIsCalcLoading(true);

    const match = findBestMatch(userVector, { partnerGender });

    if (match) {
      const compatText = compatibilityTexts.find((t) => t.id === match.id);
      if (compatText) match.compatibility_text = compatText.text;
    }

    setMatchedArchetype(match);
    setIsCalcLoading(false);

    // animate score
    if (!match) return;

    const targetScore = Number(match.compatibility) || 0;
    setAnimatedScore(0);

    if (targetScore <= 0) {
      setAnimatedScore(targetScore);
      return;
    }

    const id = setInterval(() => {
      setAnimatedScore((prev) => {
        const next = prev + 1;
        if (next >= targetScore) {
          clearInterval(id);
          return targetScore;
        }
        return next;
      });
    }, 20);

    return () => clearInterval(id);
  }, [searchParams]);

  if (!searchParams.has("dominance")) {
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

  if (isCalcLoading) return <p className="text-white">Розрахунок результату...</p>;
  if (!matchedArchetype) return <p className="text-white">Не вдалося сформувати результат. Спробуй пройти тест ще раз.</p>;

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
            onClick={() => setActiveTab("portrait")}
            className={`py-2 px-4 ${activeTab === "portrait" ? "text-white border-b-2 border-red-500" : "text-gray-400"}`}
          >
            Портрет
          </button>
          <button
            onClick={() => setActiveTab("compatibility")}
            className={`py-2 px-4 ${activeTab === "compatibility" ? "text-white border-b-2 border-red-500" : "text-gray-400"}`}
          >
            Сумісність
          </button>
        </div>

        <div>
          {activeTab === "portrait" && (
            <div>
              <p className="text-gray-300">{matchedArchetype.long_description}</p>
              {matchedArchetype.quote && (
                <blockquote className="mt-4 border-l-4 border-red-800 pl-4 italic text-gray-400">
                  "{matchedArchetype.quote}"
                </blockquote>
              )}
            </div>
          )}

          {activeTab === "compatibility" && (
            <div>
              <h3 className="font-bold text-lg mb-2">Чому він тобі підходить:</h3>
              <p className="text-gray-300">
                {matchedArchetype.compatibility_text || "Текст сумісності для цього архетипу ще не додано."}
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

export default function ResultClient() {
  return (
    <Suspense fallback={<p className="text-white">Завантаження результату...</p>}>
      <ResultInner />
    </Suspense>
  );
}
