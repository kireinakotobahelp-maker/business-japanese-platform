'use client';
// src/components/ScenePlayerUI.tsx
import { Play, Pause, Square, SkipBack, SkipForward } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import React, { useMemo } from "react";
import { Scene } from "@/lib/types";

type Line = { role: string; text: string; _srcIdx?: number };

export function ScenePlayerUI(props: {
  scene: Scene;
  playing: boolean;
  rate: number;
  onRateChange: (r: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (sec: number) => void;
  progressSec: number;
  durationSec: number;
  currentIdx: number; // 再生制御側の"元配列"index
}) {
  const {
    scene, playing, rate, onRateChange,
    onPlay, onPause, onStop, onSeek,
    progressSec, durationSec, currentIdx
  } = props;

  const reduceMotion = useReducedMotion();

  // ---- parser（memo）----
  const { dialog, narrations } = useMemo(() => {
    const lines: Line[] = (scene?.script ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(.+?)\s*[:：]\s*(.+)$/);
        if (m) {
          const speaker = m[1].replace(/^[\d\s\.\)]+/, "").trim();
          const role = speaker.toLowerCase();
          const content = m[2];
          if (/^(ナレーター|narrator|解説者)$/i.test(speaker)) {
            return { role: "narrator", text: content };
          }
          return { role, text: content };
        }
        return { role: "narrator", text: line };
      });

    const segments = lines.map((s, i) => ({ ...s, _srcIdx: i }));
    const narr = segments.filter(s => s.role === "narrator");
    const dia = segments.filter(s => s.role !== "narrator");
    return { dialog: dia, narrations: narr };
  }, [scene?.script]);

  // ---- role config（1表に集約）----
  const roleConfig = {
    boss: { label: "部長", dot: "bg-slate-800", text: "text-slate-900", ring: "ring-slate-200" },
    "部長": { label: "部長", dot: "bg-slate-800", text: "text-slate-900", ring: "ring-slate-200" },
    shibata: { label: "芝田さん", dot: "bg-blue-500", text: "text-blue-600", ring: "ring-blue-200" },
    "芝田": { label: "芝田さん", dot: "bg-blue-500", text: "text-blue-600", ring: "ring-blue-200" },
    "芝田さん": { label: "芝田さん", dot: "bg-blue-500", text: "text-blue-600", ring: "ring-blue-200" },
  } as const;

  const fmt = (t: number) => {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2,"0")}`;
  };

  const clampedProgress = Number.isFinite(progressSec)
    ? Math.min(Math.max(0, progressSec), Math.max(0, durationSec))
    : 0;

  const rateOptions = [0.9, 1.0, 1.1];

  return (
    <div className="mx-auto max-w-[420px] pb-6">
      {/* 再生カード */}
      <section className="px-3 pt-1">
        <div className="rounded-2xl bg-slate-100 shadow-[inset_0_1px_0_#fff,0_2px_8px_rgba(0,0,0,.08)] ring-1 ring-slate-200 p-3">
          {/* タイム & スライダー */}
          <div className="flex items-center gap-3">
            <span className="w-[46px] text-[12px] tabular-nums text-orange-600">{fmt(clampedProgress)}</span>
            <input
              type="range"
              min={0}
              max={Math.max(1, durationSec || 0)}
              step={0.01}
              value={clampedProgress}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              aria-label="再生位置"
              aria-valuetext={fmt(clampedProgress)}
              disabled={!durationSec || !isFinite(durationSec)}
              className="relative w-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none
                         h-2 rounded-full bg-gradient-to-r from-orange-300 via-orange-200 to-slate-200
                         outline-none disabled:opacity-50"
            />
            <span className="w-[46px] text-right text-[12px] tabular-nums text-slate-500">{fmt(durationSec)}</span>
          </div>

          {/* トランスポート */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button type="button"
              className="rounded-xl bg-white px-4 py-3 text-slate-700 shadow ring-1 ring-slate-200 active:translate-y-[1px]"
              onClick={() => onSeek(Math.max(0, clampedProgress - 5))}
              aria-label="5秒戻す">
              <div className="mx-auto flex items-center justify-center gap-1">
                <SkipBack className="h-5 w-5" /><span className="text-[12px]">5s</span>
              </div>
            </button>

            <button type="button"
              className="rounded-xl bg-gradient-to-b from-amber-300 to-orange-400 px-4 py-3 text-white shadow-md ring-1 ring-amber-300 active:translate-y-[1px]"
              onClick={playing ? onPause : onPlay}
              aria-label={playing ? "一時停止" : "再生"}>
              <div className="mx-auto flex items-center justify-center">{playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}</div>
            </button>

            <button type="button"
              className="rounded-xl bg-white px-4 py-3 text-slate-700 shadow ring-1 ring-slate-200 active:translate-y-[1px]"
              onClick={() => onSeek(Math.min(durationSec, clampedProgress + 5))}
              aria-label="5秒進める">
              <div className="mx-auto flex items-center justify-center gap-1">
                <SkipForward className="h-5 w-5" /><span className="text-[12px]">5s</span>
              </div>
            </button>

            <div className="col-span-3 mt-2">
              <button type="button"
                className="mx-auto block rounded-lg bg-slate-200/80 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-200 active:translate-y-[1px]"
                onClick={onStop}>
                <div className="inline-flex items-center gap-1"><Square className="h-4 w-4" /> 停止</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 速度チップ */}
      <section className="px-3 pt-3">
        <div className="grid grid-cols-3 gap-2">
          {rateOptions.map((r) => {
            const active = r === rate;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onRateChange(r)}
                aria-pressed={active}
                className={[
                  "rounded-xl px-4 py-3 text-center text-[14px] font-medium shadow ring-1 transition",
                  active ? "bg-indigo-600 text-white ring-indigo-500"
                         : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                ].join(" ")}
              >
                ×{r.toFixed(1)}
              </button>
            );
          })}
        </div>
      </section>

      {/* 解説（会話と区切って1行空け） */}
      {!!narrations.length && (
        <section className="px-3 pt-4">
          <div className="rounded-xl border border-pink-200 bg-pink-50/70 p-3 text-[15px] leading-7 shadow-sm">
            {narrations.map((n, i) => (
              <p key={i} className="mb-2 last:mb-0 whitespace-pre-wrap">{n.text}</p>
            ))}
          </div>
        </section>
      )}

      {/* 台本（色分け & ふわっと黄色ハイライト） */}
      <section className="px-3 pt-4">
        <ul className="space-y-2">
          {dialog.map((seg) => {
            const isActive = seg._srcIdx === currentIdx;
            const conf = (roleConfig as any)[seg.role] ?? {
              label: seg.role, dot: "bg-pink-400", text: "text-pink-600", ring: "ring-pink-200"
            };

            return (
              <li key={seg._srcIdx} className="grid grid-cols-[5.5rem,1fr] items-start gap-2">
                {/* 役チップ */}
                <div className={`px-2 py-1 text-right text-[14px] font-medium ${conf.text}`}>
                  <span className="inline-flex items-center gap-1">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${conf.dot}`} />
                    {conf.label}：
                  </span>
                </div>

                {/* バブル */}
                <motion.div
                  layout
                  aria-current={isActive ? "true" : undefined}
                  animate={reduceMotion ? undefined : { backgroundColor: isActive ? "rgba(254,243,199,1)" : "rgba(255,255,255,0)" }}
                  transition={reduceMotion ? undefined : { duration: 0.25 }}
                  className={[
                    "rounded-2xl px-3 py-2 leading-8 whitespace-pre-wrap ring-1",
                    conf.ring, isActive ? "shadow-sm" : "hover:bg-slate-50"
                  ].join(" ")}
                >
                  {seg.text}
                </motion.div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
