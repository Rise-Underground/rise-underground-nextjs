"use client";

import { useRef } from "react";

const PAUSE_BEFORE_END_SECONDS = 2;

/** Plays once, then pauses a few seconds before the end rather than running all the way to the last frame. */
export function LogoVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className="block h-full w-full object-contain mix-blend-screen"
      onTimeUpdate={(e) => {
        const video = e.currentTarget;
        if (!Number.isFinite(video.duration)) return;
        if (video.currentTime >= video.duration - PAUSE_BEFORE_END_SECONDS) {
          video.pause();
        }
      }}
      onEnded={() => {
        // fallback, in case the clip is shorter than PAUSE_BEFORE_END_SECONDS and timeupdate never caught it
        const video = ref.current;
        if (!video) return;
        video.pause();
      }}
    >
      <source src="/assets/riseug_logo.mp4" type="video/mp4" />
    </video>
  );
}
