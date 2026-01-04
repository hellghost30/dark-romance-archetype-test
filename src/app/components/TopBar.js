'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function TopBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition " +
              (isHome ? "text-gray-400 cursor-default" : "text-white hover:bg-white/10 active:scale-[0.99]")
            }
            aria-disabled={isHome}
            onClick={(e) => {
              if (isHome) e.preventDefault();
            }}
          >
            ← На головну
          </Link>

          <span className="hidden sm:inline text-xs text-gray-400">
            Dark Romance Partner Finder
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === 'authenticated' && session?.user?.email ? (
            <>
              <span className="hidden md:inline text-xs text-gray-400 max-w-[220px] truncate">
                {session.user.email}
              </span>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold bg-gray-800 hover:bg-gray-700 transition active:scale-[0.99]"
              >
                Вийти
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-500">Гість</span>
          )}
        </div>
      </div>
    </header>
  );
}
