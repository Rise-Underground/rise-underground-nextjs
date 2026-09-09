"use client";

import { useEffect, useRef } from "react";
import { GatewayImage } from "./GatewayImage";
import type { RecentMint } from "@/types/poaTracker";

const AUTO_SCROLL_PX_PER_SEC = 90;

/**
 * Auto-scrolling marquee of the most recent mints -- draggable, so a visitor can grab it and pull
 * it back to re-read something that scrolled past, rather than only being able to pause on hover.
 * Two copies of the track sit back to back; auto-scroll and dragging both just move a translateX
 * offset that wraps at one copy's width, so the loop never shows a seam either direction.
 */
export function RecentMintsTicker({ mints }: { mints: RecentMint[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const distanceRef = useRef(0); // px scrolled so far (wraps at one copy's width)
  const draggingRef = useRef(false);
  const hoveringRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, distance: 0 });

  useEffect(() => {
    if (mints.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    let frame: number;
    let lastTs: number | null = null;

    function apply() {
      const copyWidth = (track!.scrollWidth || 0) / 2;
      if (copyWidth > 0) {
        distanceRef.current = ((distanceRef.current % copyWidth) + copyWidth) % copyWidth;
      }
      track!.style.transform = `translateX(${-distanceRef.current}px)`;
    }

    function tick(ts: number) {
      if (lastTs === null) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!draggingRef.current && !hoveringRef.current) {
        distanceRef.current += AUTO_SCROLL_PX_PER_SEC * dt;
      }
      apply();
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mints.length]);

  if (mints.length === 0) return null;

  const track = (copy: "a" | "b") => (
    <>
      {mints.map((m, i) => (
        <div key={`${copy}-${i}`} className="flex flex-shrink-0 items-center gap-2 px-4.5 font-ibm-plex-mono text-xs whitespace-nowrap text-ink">
          <span className="text-[11px] text-dimmer">{i + 1}.</span>
          <GatewayImage
            src={m.image}
            alt=""
            className="h-7 w-7 flex-shrink-0 rounded-[5px] border border-line bg-panel-2 object-cover"
            emptyLabel=""
          />
          <span className="max-w-[220px] overflow-hidden text-ellipsis">{m.name}</span>
          <span className={"text-[10px] tracking-[0.5px] uppercase " + (m.chain === "base" ? "text-base-chain" : "text-crimson")}>
            {m.chain === "base" ? "BASE" : "ADA"}
          </span>
        </div>
      ))}
    </>
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    pointerStartRef.current = { x: e.clientX, distance: distanceRef.current };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const delta = e.clientX - pointerStartRef.current.x;
    distanceRef.current = pointerStartRef.current.distance - delta;
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div
      className="relative left-1/2 right-1/2 -mx-[50vw] mb-7 w-screen touch-pan-y overflow-hidden border-y border-line bg-panel py-3.5 select-none"
      onPointerEnter={() => (hoveringRef.current = true)}
      onPointerLeave={() => (hoveringRef.current = false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div ref={trackRef} className="flex w-max cursor-grab gap-5.5 active:cursor-grabbing">
        {track("a")}
        {track("b")}
      </div>
    </div>
  );
}
