// src/app/share/[id]/share-actions.js
"use client";

import React, { useMemo, useState } from "react";

/**
 * Компонент ShareActions дозволяє обрати одне з кількох зображень для завантаження
 * і поділитись результатом. Приймає:
 * - shareUrl: URL сторінки із результатом
 * - shareText: текст, який додається при копіюванні/шерінгу
 * - imageUrl: (за потреби) один URL зображення для сумісності з попередньою версією
 * - imageUrls: масив URL-ів зображень для вибору
 */
export default function ShareActions({ shareUrl, shareText, imageUrl, imageUrls = [] }) {
  const [copied, setCopied] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Якщо масив не передано, використовуємо одиночний imageUrl
  const availableImages = imageUrls && imageUrls.length > 0 ? imageUrls : [imageUrl];
  const selectedImageUrl = availableImages[selectedImageIndex];

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
      await navigator.share({ title: "Dark Romance Archetype", text: fullText, url: shareUrl });
    } catch {
      /* користувач міг відхилити запит на шеринґ */
    }
  };

  // Ім'я для завантажуваного файлу. Можна змінити за потреби.
  const downloadName = "dark-romance-archetype.png";

  return (
    <div className="space-y-3">
      {/* Кнопка копіювання посилання */}
      <button
        onClick={copyLink}
        className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-lg"
      >
        {copied ? "Скопійовано ✅" : "Скопіювати посилання"}
      </button>

      {/* Кнопка нативного шеринґу (мобільні пристрої) */}
      {typeof navigator !== "undefined" && navigator.share ? (
        <button
          onClick={nativeShare}
          className="w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-lg"
        >
          Поділитися (телефон)
        </button>
      ) : null}

      {/* Блок вибору картинки, якщо зображень більше одного */}
      {availableImages.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 my-2">
          {availableImages.map((img, idx) => (
            <button
              key={img}
              type="button"
              className={`border-2 rounded-md overflow-hidden ${
                idx === selectedImageIndex ? "border-red-700" : "border-transparent"
              }`}
              onClick={() => setSelectedImageIndex(idx)}
            >
              <img
                src={img}
                alt={`archetype-${idx + 1}`}
                className="w-16 h-16 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Кнопка/посилання завантажити обрану картинку */}
      <a
        href={selectedImageUrl}
        download={downloadName}
        className="block w-full text-center px-6 py-3 bg-black/40 hover:bg-black/60 text-white font-bold rounded-lg text-lg"
      >
        Завантажити обрану картинку (для Instagram)
      </a>

      {/* Поради для Instagram */}
      <div className="mt-2 p-3 rounded-lg bg-black/30 text-sm text-gray-300">
        <p className="font-semibold mb-1">Порада для Instagram:</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Натисни “Завантажити обрану картинку”.</li>
          <li>Залий її в сторіс/пост у Instagram.</li>
          <li>Посилання встав у біо/стікер-лінк (або просто додай в текст).</li>
        </ol>
      </div>

      {/* Текст для копіювання */}
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
