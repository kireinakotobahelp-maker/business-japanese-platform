'use client';

/**
 * ScenePlayerUI - 会話再生用UIコンポーネント
 * 
 * Features:
 * - レスポンシブな音声コントロール（再生・一時停止・シーク・速度調整）
 * - 自動/手動スクロール切り替え
 * - 視覚的な話者アイコン（上司・部下）表示
 * - 現在再生中のセリフのハイライト
 * - スマートフォン対応レイアウト
 */

import { Play, Pause, Square, SkipBack, SkipForward, Crown, User } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import React, { useMemo, useEffect, useRef } from "react";
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
  isGeneratingAudio?: boolean; // 音声生成中フラグ
  isReadingSummary?: boolean; // 学習ポイント読み上げ中フラグ
}) {
  const {
    scene, playing, rate, onRateChange,
    onPlay, onPause, onStop, onSeek,
    progressSec, durationSec, currentIdx, isGeneratingAudio, isReadingSummary
  } = props;

  const reduceMotion = useReducedMotion();
  
  // 自動スクロール用のref
  const dialogRefs = useRef<{ [key: number]: HTMLLIElement | null }>({});
  
  // 自動スクロールのON/OFF状態（デフォルトは手動=false）
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(false);

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

  // ---- role config（アイコン付き）----
  const roleConfig = {
    boss: { 
      label: "部長", 
      dot: "bg-slate-800", 
      text: "text-slate-900", 
      ring: "ring-slate-200",
      icon: Crown,
      iconColor: "text-white"
    },
    "部長": { 
      label: "部長", 
      dot: "bg-slate-800", 
      text: "text-slate-900", 
      ring: "ring-slate-200",
      icon: Crown,
      iconColor: "text-white"
    },
    "部": { 
      label: "部長", 
      dot: "bg-slate-800", 
      text: "text-slate-900", 
      ring: "ring-slate-200",
      icon: Crown,
      iconColor: "text-white"
    },
    shibata: { 
      label: "芝田さん", 
      dot: "bg-blue-500", 
      text: "text-blue-600", 
      ring: "ring-blue-200",
      icon: User,
      iconColor: "text-white"
    },
    "芝田": { 
      label: "芝田さん", 
      dot: "bg-blue-500", 
      text: "text-blue-600", 
      ring: "ring-blue-200",
      icon: User,
      iconColor: "text-white"
    },
    "芝田さん": { 
      label: "芝田さん", 
      dot: "bg-blue-500", 
      text: "text-blue-600", 
      ring: "ring-blue-200",
      icon: User,
      iconColor: "text-white"
    },
    "芝": { 
      label: "芝田さん", 
      dot: "bg-blue-500", 
      text: "text-blue-600", 
      ring: "ring-blue-200",
      icon: User,
      iconColor: "text-white"
    },
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

  // 自動スクロール機能（会話エリア内でのスクロール用に調整）
  useEffect(() => {
    // 自動スクロールが無効、または再生中でない場合はスキップ
    if (!autoScrollEnabled || !playing) {
      if (!autoScrollEnabled) {
        console.log('🎵 Auto-scroll: Disabled by user, skipping scroll');
      } else {
        console.log('🎵 Auto-scroll: Not playing, skipping scroll');
      }
      return;
    }
    
    const currentElement = dialogRefs.current[currentIdx];
    if (currentElement) {
      console.log('🎯 Auto-scroll: Scrolling to dialog index', currentIdx);
      
      // 会話エリア内でスクロール（固定コントロールを考慮）
      const elementRect = currentElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      
      // 固定ヘッダーの高さを考慮して、要素が適切に見える位置にスクロール
      const fixedHeaderHeight = 120; // 固定ヘッダーの概算高さ
      const targetY = scrollY + elementRect.top - fixedHeaderHeight - 50;
      
      console.log('📍 Auto-scroll: Target Y position', targetY);
      
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    } else {
      console.log('❌ Auto-scroll: Element not found for index', currentIdx);
    }
  }, [currentIdx, playing, autoScrollEnabled]);

  return (
    <div className="mx-auto max-w-full">
      {/* 🎵 固定ヘッダー: 常に表示される再生コントロール */}
      <div className="sticky top-0 z-10 bg-white border border-slate-200 rounded-lg shadow-lg mb-6 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 状態インジケーター */}
          {isGeneratingAudio && (
            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-center gap-3 text-sm font-medium text-blue-700">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>音声を生成中です...</span>
              </div>
            </div>
          )}

          {isReadingSummary && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3">
              <div className="flex items-center gap-3 text-sm font-medium text-green-700">
                <div className="h-4 w-4">
                  <svg className="animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span>📚 学習ポイントを読み上げ中です...</span>
              </div>
            </div>
          )}

          {/* コンパクトなタイム & シークバー */}
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 text-xs font-mono font-medium text-slate-600">{fmt(clampedProgress)}</span>
            <div className="relative flex-1">
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
                className="relative w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer disabled:opacity-50
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600
                          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                          [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
                          [&::-webkit-slider-thumb]:hover:bg-blue-700"
              />
              <div 
                className="absolute top-0 left-0 h-2 bg-blue-600 rounded pointer-events-none transition-all duration-200"
                style={{ width: `${Math.max(0, Math.min(100, (clampedProgress / Math.max(1, durationSec || 0)) * 100))}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs font-mono font-medium text-slate-600">{fmt(durationSec)}</span>
          </div>

          {/* レスポンシブなコントロール */}
          <div className="space-y-3 sm:space-y-0">
            {/* メインコントロール（再生・シーク・停止） */}
            <div className="flex items-center justify-center gap-2">
              <button type="button"
                className="business-button-secondary px-2 py-1 text-xs"
                onClick={() => onSeek(Math.max(0, clampedProgress - 5))}
                aria-label="5秒戻す">
                <div className="flex items-center gap-1">
                  <SkipBack className="h-3 w-3" />
                  <span className="hidden sm:inline">5s</span>
                </div>
              </button>

              <button type="button"
                className="business-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={playing ? onPause : onPlay}
                disabled={isGeneratingAudio}
                aria-label={isGeneratingAudio ? "音声生成中..." : (playing ? "一時停止" : "再生")}>
                <div className="flex items-center justify-center">
                  {isGeneratingAudio ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />
                  )}
                </div>
              </button>

              <button type="button"
                className="business-button-secondary px-2 py-1 text-xs"
                onClick={() => onSeek(Math.min(durationSec, clampedProgress + 5))}
                aria-label="5秒進める">
                <div className="flex items-center gap-1">
                  <SkipForward className="h-3 w-3" />
                  <span className="hidden sm:inline">5s</span>
                </div>
              </button>

              <button type="button"
                className="business-button-secondary px-3 py-1 text-xs"
                onClick={onStop}>
                <div className="inline-flex items-center gap-1">
                  <Square className="h-3 w-3" /> 
                  <span className="hidden sm:inline">停止</span>
                </div>
              </button>
            </div>

            {/* 速度 & スクロールコントロール（スマホでは2段目） */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {/* 速度コントロール */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600">速度:</span>
                {rateOptions.map((r) => {
                  const active = r === rate;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onRateChange(r)}
                      aria-pressed={active}
                      className={[
                        "px-2 py-1 text-xs font-medium rounded transition-colors duration-200",
                        active 
                          ? "bg-blue-600 text-white" 
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      ].join(" ")}
                    >
                      ×{r.toFixed(1)}
                    </button>
                  );
                })}
              </div>

              {/* 自動スクロール切り替えトグル */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">スクロール:</span>
                <button
                  type="button"
                  onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                  aria-pressed={autoScrollEnabled}
                  className={[
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    autoScrollEnabled ? "bg-blue-600" : "bg-slate-300"
                  ].join(" ")}
                  title={autoScrollEnabled ? "自動スクロール ON" : "手動スクロール"}
                >
                  <span className="sr-only">自動スクロールの切り替え</span>
                  <span
                    className={[
                      "inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200",
                      autoScrollEnabled ? "translate-x-5" : "translate-x-1"
                    ].join(" ")}
                  />
                </button>
                <span className="text-xs text-slate-600">
                  {autoScrollEnabled ? "自動" : "手動"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📚 コンパクトな解説カード */}
      {!!narrations.length && (
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-sm font-semibold text-slate-700">解説</span>
          </div>
          {narrations.map((n, i) => (
            <p key={i} className="mb-2 last:mb-0 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{n.text}</p>
          ))}
        </div>
      )}

      {/* 🎭 コンパクトな会話表示 */}
      <div className="space-y-3">
        {dialog.map((seg) => {
          const isActive = seg._srcIdx === currentIdx;
          const conf = roleConfig[seg.role as keyof typeof roleConfig] ?? {
            label: seg.role, 
            dot: "bg-slate-400", 
            text: "text-slate-600", 
            ring: "ring-slate-200",
            icon: User,
            iconColor: "text-white"
          };

          return (
            <div 
              key={seg._srcIdx} 
              className="group"
              ref={(el) => {
                if (seg._srcIdx !== undefined) {
                  dialogRefs.current[seg._srcIdx] = el;
                }
              }}
            >
              <div className="flex items-start gap-3">
                {/* コンパクトなアバター */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded ${conf.dot} flex items-center justify-center`}>
                      <conf.icon className={`h-4 w-4 ${conf.iconColor}`} />
                    </div>
                    {isActive && (
                      <div className="absolute -inset-0.5 rounded bg-blue-600 opacity-50" />
                    )}
                  </div>
                </div>

                <div className="flex-grow min-w-0">
                  {/* コンパクトな名前ラベル */}
                  <div className="mb-1">
                    <span className={`inline-block text-xs font-semibold ${conf.text}`}>
                      {conf.label}
                    </span>
                  </div>

                  {/* コンパクトなメッセージ */}
                  <motion.div
                    layout
                    aria-current={isActive ? "true" : undefined}
                    animate={reduceMotion ? undefined : { 
                      backgroundColor: isActive ? "rgba(59, 130, 246, 0.05)" : "rgba(255,255,255,1)",
                      borderColor: isActive ? "rgba(59, 130, 246, 0.3)" : "rgba(226, 232, 240, 1)"
                    }}
                    transition={reduceMotion ? undefined : { duration: 0.2 }}
                    className="bg-white border border-slate-200 rounded px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-200"
                  >
                    {seg.text}
                  </motion.div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}