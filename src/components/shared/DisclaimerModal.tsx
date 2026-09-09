"use client";

import { useEffect, useState } from "react";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Gated on localStorage, dismiss-for-7-days. Shared between RISE tracker and POA tracker -- each
 * passes its own `storageKey` so dismissing one doesn't dismiss the other.
 */
export function DisclaimerModal({
  storageKey,
  title,
  children,
}: {
  storageKey: string;
  title: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // localStorage doesn't exist during SSR, so this can't be a lazy useState initializer --
    // it has to run post-mount, client-only. Deliberately not "subscribing" to anything; there's
    // nothing to subscribe to for a one-time read of static browser storage.
    try {
      const last = localStorage.getItem(storageKey);
      const elapsed = last ? Date.now() - parseInt(last, 10) : Infinity;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(!last || Number.isNaN(elapsed) || elapsed >= WEEK_MS);
    } catch {
      // localStorage unavailable (private mode, etc.) -- show the disclaimer every time rather than crash.
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(storageKey, Date.now().toString());
    } catch {
      // ignore -- worst case it shows again next visit
    }
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-void/[0.82] p-5 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-xl border border-line bg-panel p-[26px] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <h2 className="mb-3.5 font-oswald text-lg font-bold tracking-[0.04em] text-gold-bright uppercase">{title}</h2>
        <p className="mb-5 text-sm leading-relaxed text-ink">{children}</p>
        <button
          onClick={dismiss}
          className="rounded-md bg-gold px-[22px] py-2.5 font-semibold text-void transition-colors hover:bg-gold-bright"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
