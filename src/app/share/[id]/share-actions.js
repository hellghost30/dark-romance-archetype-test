"use client";

import React, { useMemo, useState } from "react";

/**
 * Компонент для шерінгу результату тесту.
 *
 * @param {string} shareUrl URL сторінки результату
 * @param {string} shareText Текст для копіювання/шерінгу
 * @param {string} imageUrl fallback-URL для єдиного зображення (старий підхід)
 * @param {string[]} images масив URL-ів зображень (новий підхід). Якщо масив не передали, використовується imageUrl
 */
export default function ShareActions({ shareUrl, shareText, imageUrl, images }) {
  const [copied, setCopied] = useState(false);

  // Якщо images передано, використовувати його, інакше створити масив із одного елемента imageUrl
  const imageList = images?.length ? images : [imageUrl];
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Текст для буферу обміну
  const fullText = useMemo(() => `${shareText}\n${shareUrl}`, [shareText, shareUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "Dark Romance Archetype",
        text: fullText,
        url: shareUrl,
      });
    } catch {
      // user canceled or share failed – нічого не робимо
    }
  };

  // Ім'я файлу для завантаження. Додаємо індекс, щоб зображення не перекривали одне одного
  const downloadName = `dark-romance-archetype-${selectedIndex + 1}.png`;

  return (
    <div className="space-y-3">
      <button
        onClick={copyLink}
        className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-lg"
      >
        {copied ? "Скопійовано ✅" : "Скопіювати посилання"}
      </button>

      {typeof navigator !== "undefined" && navigator.share ? (
        <button
          onClick={nativeShare}
          className="w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-lg"
        >
          Поділитися (телефон)
        </button>
      ) : null}

      {/* Карусель зображень. Клік по мініатюрі змінює обране зображення */}
      <div className="flex gap-2 overflow-x-auto mt-2">
        {imageList.map((src, idx) => (
          <img
            key={`${src}-${idx}`}
            src={src}
            alt={`Зображення ${idx + 1}`}
            onClick={() => setSelectedIndex(idx)}
            className={`h-20 w-20 rounded-lg cursor-pointer object-cover ${
              idx === selectedIndex ? "ring-2 ring-offset-1 ring-red-500" : "opacity-70 hover:opacity-100"
            }`}
          />
        ))}
      </div>

      {/* Посилання на завантаження вибраного зображення */}
      <a
        href={imageList[selectedIndex]}
        download={downloadName}
        className="block w-full text-center px-6 py-3 bg-black/40 hover:bg-black/60 text-white font-bold rounded-lg text-lg"
      >
        Завантажити картинку (для Instagram)
      </a>

      <div className="mt-2 p-3 rounded-lg bg-black/30 text-sm text-gray-300">
        <p className="font-semibold mb-1">Порада для Instagram:</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Натисни «Завантажити картинку».</li>
          <li>Залий її в сторіс/пост у Instagram.</li>
          <li>Посилання встав у біо/стікер-лінк (або просто додай в текст).</li>
        </ol>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-gray-400 hover:text-gray-200">
          Показати текст для копіювання
        </summary>
        <textarea
          readOnly
          value={fullText}
          className="mt-2 w-full min-h-[90px] bg-gray-800 text-gray-200 rounded-lg p-3 text-sm"
        />
      </details>
    </div>
  );
}
