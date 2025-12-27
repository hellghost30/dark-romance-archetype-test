"use client";

import React, { useMemo, useState } from "react";

function toAbsoluteUrl(relativeOrAbsolute) {
  if (!relativeOrAbsolute) return "";
  if (
    relativeOrAbsolute.startsWith("http://") ||
    relativeOrAbsolute.startsWith("https://")
  ) {
    return relativeOrAbsolute;
  }
  return `${window.location.origin}${
    relativeOrAbsolute.startsWith("/") ? "" : "/"
  }${relativeOrAbsolute}`;
}

export default function ShareButtons({ title, shareUrl, archetypeId }) {
  const [msg, setMsg] = useState("");
  const [variant, setVariant] = useState(1);

  const absShareUrl = useMemo(() => {
    if (typeof window === "undefined") return shareUrl;
    return toAbsoluteUrl(shareUrl);
  }, [shareUrl]);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2000);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(absShareUrl);
      flash("Посилання скопійовано ✅");
    } catch {
      flash("Не вдалося скопіювати 😕");
    }
  };

  const downloadImage = async () => {
    try {
      const imagePath = `/images/archetypes/archetype_${archetypeId}(${variant}).png`;
      const absImageUrl = toAbsoluteUrl(imagePath);

      const res = await fetch(absImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `dark-romance-archetype-${archetypeId}-${variant}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      flash("Картинку завантажено ✅");
    } catch {
      flash("Не вдалося завантажити 😕");
    }
  };

  const nativeShare = async () => {
    try {
      if (!navigator.share) {
        flash("На цьому пристрої немає системного Share 😕");
        return;
      }
      await navigator.share({
        title,
        text: title,
        url: absShareUrl,
      });
    } catch {
      // cancel — ок
    }
  };

  return (
    <div>
      {/* ВИБІР КАРТИНКИ */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[1, 2, 3, 4].map((v) => {
          const previewPath = `/images/archetypes/archetype_${archetypeId}(${v}).png`;
          return (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`rounded-lg overflow-hidden border-2 transition ${
                variant === v
                  ? "border-red-800"
                  : "border-transparent hover:border-gray-500"
              }`}
            >
              <img
                src={previewPath}
                alt={`Variant ${v}`}
                className="w-full h-auto object-cover"
              />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={nativeShare}
          className="w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-lg"
        >
          Поділитися (телефон / браузер)
        </button>

        <button
          onClick={copyLink}
          className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-lg"
        >
          Скопіювати посилання
        </button>

        <button
          onClick={downloadImage}
          className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-lg"
        >
          Завантажити картинку (варіант {variant})
        </button>
      </div>

      {msg ? (
        <p className="mt-3 text-sm text-gray-300">{msg}</p>
      ) : (
        <p className="mt-3 text-sm text-gray-500">
          Обери картинку архетипу для сторіс або посту.
        </p>
      )}
    </div>
  );
}
