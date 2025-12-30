// src/app/share/[id]/page.js
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import rawArchetypes from '@/data/archetypes.json';

function getArchetypesArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw?.archetypes && Array.isArray(raw.archetypes)) return raw.archetypes;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  const firstKey = raw && typeof raw === 'object' ? Object.keys(raw)[0] : null;
  if (firstKey && Array.isArray(raw[firstKey])) return raw[firstKey];
  return [];
}

function buildShareUrl(path) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${path}`;
}

export default function SharePage() {
  const params = useParams();
  const idRaw = params?.id;

  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(1);

  useEffect(() => {
    setMounted(true);
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const archetypes = useMemo(() => getArchetypesArray(rawArchetypes), []);
  const archetype = useMemo(() => {
    if (!idRaw) return null;

    const idNum = Number(idRaw);
    return archetypes.find((a) => {
      const aIdNum = Number(a?.id);
      if (!Number.isNaN(idNum) && !Number.isNaN(aIdNum)) return aIdNum === idNum;
      return String(a?.id) === String(idRaw);
    });
  }, [archetypes, idRaw]);

  const shareLink = useMemo(() => {
    if (!mounted) return '';
    return buildShareUrl(`/share/${idRaw || ''}`);
  }, [idRaw, mounted]);

  if (!idRaw) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
        <div className="w-full max-w-md bg-gray-900 text-white rounded-lg shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-serif">Невірне посилання</h1>
          <p className="text-gray-400 mt-2">Схоже, не вистачає ID архетипу.</p>
          <Link href="/test">
            <button className="mt-6 px-6 py-3 bg-red-800 hover:bg-red-700 rounded-lg font-bold">
              Пройти тест
            </button>
          </Link>
        </div>
      </main>
    );
  }

  if (!archetype) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
        <div className="w-full max-w-md bg-gray-900 text-white rounded-lg shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-serif">Результат не знайдено</h1>
          <p className="text-gray-400 mt-2">
            Схоже, цього архетипу не існує або посилання некоректне.
          </p>
          <Link href="/test">
            <button className="mt-6 px-6 py-3 bg-red-800 hover:bg-red-700 rounded-lg font-bold">
              Пройти тест
            </button>
          </Link>
        </div>
      </main>
    );
  }

  // Вибираємо картинку залежно від обраного індексу (1–4)
  const imageUrl = `/images/archetypes/archetype_${archetype.id}(${selectedImageIndex}).png`;

  const title = archetype.name || 'Мій архетип';
  const subtitle = archetype.archetype_type || 'Dark Romance Archetype';

  const onCopy = async () => {
    try {
      const linkToCopy = shareLink || buildShareUrl(`/share/${idRaw || ''}`);
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      prompt('Скопіюй посилання:', shareLink || buildShareUrl(`/share/${idRaw || ''}`));
    }
  };

  const onNativeShare = async () => {
    try {
      if (!navigator.share) return;
      const url = shareLink || buildShareUrl(`/share/${idRaw || ''}`);

      await navigator.share({
        title: `Мій результат: ${title}`,
        text: `Я отримав архетип: ${title}. Пройди тест і дізнайся свій!`,
        url,
      });
    } catch (e) {}
  };

  const onDownloadImage = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dark-romance-${archetype.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Не вдалося завантажити зображення. Перевір, чи файл існує.');
    }
  };

  const shareText = encodeURIComponent(
    `Я отримав архетип: ${title}. Пройди тест і дізнайся свій!`,
  );
  const shareUrlEnc = encodeURIComponent(shareLink || '');

  const telegramUrl = `https://t.me/share/url?url=${shareUrlEnc}&text=${shareText}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEnc}`;
  const xUrl = `https://twitter.com/intent/tweet?url=${shareUrlEnc}&text=${shareText}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
      <div className="w-full max-w-md mx-auto bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden">
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-96 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="p-6 bg-gradient-to-t from-black via-black/70 to-transparent absolute bottom-0 left-0 right-0">
            <h1 className="text-4xl font-serif font-bold">{title}</h1>
            <p className="text-xl text-red-300 uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-300">
            Поділись своїм результатом з друзями. Для Instagram найзручніше:{' '}
            <b>завантажити картинку</b> і залити в сторіс/пост.
          </p>

          <div className="mt-5 space-y-3">
            {/* Кнопки для вибору варіанту картинки */}
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedImageIndex(num)}
                  className={`px-3 py-1 rounded-full font-bold ${
                    selectedImageIndex === num
                      ? 'bg-red-700 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {canNativeShare && (
              <button
                onClick={onNativeShare}
                className="w-full px-6 py-3 bg-red-800 hover:bg-red-700 rounded-lg font-bold"
              >
                Поділитися (меню телефону/браузера)
              </button>
            )}

            <button
              onClick={onCopy}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
            >
              {copied ? 'Скопійовано ✅' : 'Скопіювати посилання'}
            </button>

            <button
              onClick={onDownloadImage}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
            >
              Завантажити картинку (для Instagram)
            </button>

            <div className="grid grid-cols-3 gap-3">
              <a
                className="text-center px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold"
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
              >
                Telegram
              </a>
              <a
                className="text-center px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold"
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
              <a
                className="text-center px-4 py-3 bg-gray-800 hover.bg-gray-700 rounded-lg font-bold"
                href={xUrl}
                target="_blank"
                rel="noreferrer"
              >
                X
              </a>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-800 pt-6 space-y-3">
            <Link href="/test">
              <button className="w-full px-6 py-3 bg-red-800 hover:bg-red-700 rounded-lg font-bold">
                Пройти тест
              </button>
            </Link>
            {/* Кнопку «Перейти на результати (демо)» прибрано на прохання користувача */}
          </div>
        </div>
      </div>
    </main>
  );
}
