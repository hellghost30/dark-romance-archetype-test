"use client";

import React, { useMemo, useState } from "react";

function toAbsoluteUrl(relativeOrAbsolute) {
  if (!relativeOrAbsolute) return "";
  if (relativeOrAbsolute.startsWith("http://") || relativeOrAbsolute.startsWith("https://")) {
    return relativeOrAbsolute;
  }
  // працює і локально, і на проді
  return `${window.location.origin}${relativeOrAbsolute.startsWith("/") ? "" : "/"}${relativeOrAbsolute}`;
}

export default function ShareButtons({ title, shareUrl, imageUrl }) {
  const [msg, setMsg] = useState("");

  const absShareUrl = useMemo(() => {
    if (typeof window === "undefined") return shareUrl;
    return toAbsoluteUrl(shareUrl);
  }, [shareUrl]);

  const absImageUrl = useMemo(() => {
    if (typeof window === "undefined") return imageUrl;
    return toAbsoluteUrl(imageUrl);
  }, [imageUrl]);

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
      const res = await fetch(absImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "dark-romance-result.png";
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
      // користувач міг натиснути cancel — це ок
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={nativeShare}
          className="w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-lg"
        >
          Поділитися (телефон/браузер)
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
          Завантажити картинку (для сторіс/посту)
        </button>
      </div>

      {msg ? (
        <p className="mt-3 text-sm text-gray-300">{msg}</p>
      ) : (
        <p className="mt-3 text-sm text-gray-500">
          Instagram напряму з вебу “поширити” часто не дає — найнадійніше: завантаж картинку і залий вручну.
        </p>
      )}
    </div>
  );
}
