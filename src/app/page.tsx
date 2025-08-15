'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ScenePlayerUI } from "@/components/ScenePlayerUI"; // ← 修正
import QuizBlock from "@/components/QuizBlock";
import { sampleScene } from "@/lib/sampleScene";
import { Card, SectionTitle } from "@/components/ui/Card";

/* ========= ユーティリティ ========= */

// 「ナレーター/解説者/narrator」表記ゆれ
const NARRATOR_RE = /(ナレーター|ナレータ|解説者|narrator)/i;

// 話者 → TTSボイス
const voiceOf = (speaker: string): "alloy" | "verse" | "sage" => {
  if (/^(部長|上司)/.test(speaker)) return "alloy";         // 部長
  if (/^(芝田|芝田さん|営業)/.test(speaker)) return "verse"; // 芝田
  if (NARRATOR_RE.test(speaker)) return "sage";               // ナレーター
  return "sage";
};

// AudioBuffer → WAV Blob（16bit PCM, mono）
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numCh = 1, sr = buffer.sampleRate;
  const length = buffer.length * numCh * 2 + 44;
  const ab = new ArrayBuffer(length); const view = new DataView(ab);
  let off = 0;
  const ws=(s:string)=>{for(let i=0;i<s.length;i++)view.setUint8(off+i,s.charCodeAt(i)); off+=s.length;};
  const u32=(d:number)=>{view.setUint32(off,d,true); off+=4;};
  const u16=(d:number)=>{view.setUint16(off,d,true); off+=2;};
  ws("RIFF"); u32(length-8); ws("WAVE"); ws("fmt "); u32(16); u16(1); u16(numCh);
  u32(sr); u32(sr*numCh*2); u16(numCh*2); u16(16); ws("data"); u32(buffer.length*numCh*2);
  const ch = buffer.getChannelData(0);
  for (let i=0;i<ch.length;i++){ const s=Math.max(-1,Math.min(1,ch[i])); view.setInt16(off, s<0?s*0x8000:s*0x7FFF, true); off+=2; }
  return new Blob([view], { type: "audio/wav" });
}

// 連続する同一話者を結合（API回数を減らす）
function coalesceSegments<T extends { speaker: string; text: string; lineIndex: number }>(segs: T[]) {
  const out: T[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && last.speaker === s.speaker) {
      last.text = `${last.text} ${s.text}`;
    } else {
      out.push({ ...s });
    }
  }
  return out;
}

// 同時 limit 本で並列処理
async function asyncPool<T, R>(limit: number, items: T[], worker: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const ret: R[] = new Array(items.length);
  let i = 0, active = 0;
  return await new Promise((resolve, reject) => {
    const kick = () => {
      if (i >= items.length) { if (active === 0) resolve(ret); return; }
      const cur = i++; active++;
      worker(items[cur], cur).then(r => { ret[cur] = r; active--; kick(); }).catch(reject);
    };
    for (let k = 0; k < Math.min(limit, items.length); k++) kick();
  });
}

// /api/tts → decode（mp3 推奨）
async function fetchDecodeSegment(ctx: AudioContext, text: string, voice: string, format: "mp3" | "wav" = "mp3") {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, format }),
  });
  if (!res.ok) throw new Error(await res.text());
  const ab = await res.arrayBuffer();
  // Safari 対策で ab を複製して渡す
  return await ctx.decodeAudioData(ab.slice(0));
}

/* ========= ページ本体 ========= */

type Seg = { speaker: string; text: string; lineIndex: number };
const GAP_SEC = 0.35;

export default function Page() {
  const scene = sampleScene;

  // クイズへ自動スクロール用
  const quizRef = useRef<HTMLDivElement | null>(null);
  const [hasFinished, setHasFinished] = useState(false);

  // 再生状態
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);

  // 結合後の各セグメント開始秒（ハイライト同期用）と、UI行インデックス
  const [segmentStartsSec, setSegmentStartsSec] = useState<number[]>([]);
  const [mergedUiIndexes, setMergedUiIndexes] = useState<number[]>([]);

  // 実体の <audio>
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // 台本 → TTS セグメント（ナレーターはTTSしない）
  const ttsSegments = useMemo<Seg[]>(() => {
    return scene.script
      .split(/\r?\n/)
      .map((l, i) => ({ raw: l.trim(), lineIndex: i }))
      .filter(x => x.raw.length > 0)
      .map(({ raw, lineIndex }) => {
        const m = raw.match(/^(.+?)\s*[:：]\s*(.+)$/);
        if (!m) return null;
        const speakerRaw = m[1].trim();
        const text = m[2].trim();
        // ナレーターも音声生成に含める（修正済み）
        return { speaker: speakerRaw, text, lineIndex };
      })
      .filter((x): x is Seg => !!x);
  }, [scene.script]);

  // 最初のダイアログ行（ナレーターで始まる場合の戻り先）
  const firstDialogIndex = useMemo(() => {
    const lines = scene.script.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw) continue;
      const m = raw.match(/^(.+?)\s*[:：]\s*(.+)$/);
      if (!m) continue;
      const speaker = m[1].trim();
      if (!NARRATOR_RE.test(speaker)) return i;
    }
    return 0;
  }, [scene.script]);

  // TTS→decode（mp3, 24kHz, 並列3本）→結合（秒ベースでスケジューリング）
  useEffect(() => {
    let aborted = false;
    let createdUrl: string | null = null;

    (async () => {
      try {
        setIsGeneratingAudio(true);
        if (!ttsSegments.length) {
          setAudioURL(null);
          setSegmentStartsSec([]);
          setMergedUiIndexes([]);
          setIsGeneratingAudio(false);
          return;
        }

        // 1) 同一話者を結合（API回数削減）
        const mergedSegs = coalesceSegments(ttsSegments);
        setMergedUiIndexes(mergedSegs.map(s => s.lineIndex)); // ハイライト用

        // 2) AudioContext（24kHz優先、失敗時は既定SRでフォールバック）
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        const targetSR = 24000;
        let ctx: AudioContext;
        try {
          ctx = new AC({ sampleRate: targetSR });
        } catch {
          ctx = new AC();
        }

        // 3) 並列でフェッチ＆デコード（並列数を5に増加で高速化）
        const decoded = await asyncPool(5, mergedSegs, async (seg) => {
          const voice = voiceOf(seg.speaker || "");
          try {
            return await fetchDecodeSegment(ctx, seg.text, voice, "mp3");
          } catch (error) {
            console.warn("segment decode failed, inserting silence:", error);
            // 1秒の無音を挿入して全体進行を維持
            const silent = ctx.createBuffer(1, Math.max(1, Math.floor(targetSR * 1.0)), ctx.sampleRate);
            return silent;
          }
        });
        if (aborted) return;

        // 4) 開始秒を計算（b.duration は秒）
        const starts: number[] = [];
        let tSec = 0;
        for (const b of decoded) {
          starts.push(tSec);
          tSec += b.duration + GAP_SEC;
        }
        setSegmentStartsSec(starts);

        // 5) オフライン結合（モノラル）— 総長は秒→フレームで算出
        const totalDurationSec = decoded.reduce((s, b) => s + b.duration, 0) + GAP_SEC * Math.max(0, decoded.length - 1);
        const totalFrames = Math.ceil(totalDurationSec * targetSR);
        const offline = new OfflineAudioContext(1, totalFrames, targetSR);

        let cursorSec = 0;
        for (const b of decoded) {
          // サンプルレート差は BufferSource が吸収（再生時にリサンプル）
          const mono = offline.createBuffer(1, b.length, b.sampleRate);
          mono.getChannelData(0).set(b.getChannelData(0));
          const src = offline.createBufferSource();
          src.buffer = mono;
          src.connect(offline.destination);
          src.start(cursorSec);                 // ← 秒でスケジューリング
          cursorSec += b.duration + GAP_SEC;    // ← 秒で加算（単位を統一）
        }

        const rendered = await offline.startRendering();
        if (aborted) return;

        // 6) 1 本の WAV にして <audio> へ
        const url = URL.createObjectURL(audioBufferToWavBlob(rendered));
        createdUrl = url;
        setAudioURL(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
        setDuration(rendered.duration);
        setCurrentTime(0);
        setCurrentIdx(firstDialogIndex); // 最初のダイアログ行をハイライト
        setIsGeneratingAudio(false);
      } catch (e) {
        console.error("build merged audio failed:", e);
        setAudioURL(null);
        setSegmentStartsSec([]);
        setMergedUiIndexes([]);
        setIsGeneratingAudio(false);
      }
    })();

    return () => { aborted = true; if (createdUrl) URL.revokeObjectURL(createdUrl); };
  }, [ttsSegments, firstDialogIndex]);

  // 再生/一時停止/速度/進捗 & 終了フラグ
  useEffect(() => {
    const el = audioRef.current; if (!el) return;
    (async () => {
      if (playing) {
        try { await el.play(); } catch { setPlaying(false); }
      } else {
        el.pause();
      }
    })();
  }, [playing, audioURL]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = rate; }, [rate]);

  useEffect(() => {
    const el = audioRef.current; if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onDur = () => setDuration(isFinite(el.duration) ? el.duration : 0);
    const onEnd = () => {
      setPlaying(false);
      setHasFinished(true); // ← クイズへスクロールのトリガ
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("durationchange", onDur);
    el.addEventListener("ended", onEnd);
    onDur();
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("durationchange", onDur);
      el.removeEventListener("ended", onEnd);
    };
  }, [audioURL]);

  // 現在時間 → ハイライト行（二分探索で決定）
  useEffect(() => {
    if (!segmentStartsSec.length) return;
    let lo = 0, hi = segmentStartsSec.length - 1, idx = 0;
    const t = currentTime + 1e-3;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (t >= segmentStartsSec[mid]) { idx = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    setCurrentIdx(mergedUiIndexes[idx] ?? firstDialogIndex);
  }, [currentTime, segmentStartsSec, mergedUiIndexes, firstDialogIndex]);

  // 終了時にクイズへ自動スクロール
  useEffect(() => {
    if (hasFinished && quizRef.current) {
      const y = quizRef.current.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [hasFinished]);

  // UI からのシーク
  const handleSeek = (sec: number) => {
    const el = audioRef.current; if (!el) return;
    el.currentTime = Math.max(0, Math.min(sec, el.duration || sec));
    setCurrentTime(el.currentTime);
  };

  const handlePlay = () => { setHasFinished(false); setPlaying(true); };
  const handlePause = () => setPlaying(false);
  const handleStop = () => {
    const el = audioRef.current;
    if (el) { el.pause(); el.currentTime = 0; }
    setPlaying(false);
    setHasFinished(false);
    setCurrentTime(0);
    setCurrentIdx(firstDialogIndex);
  };

  /* ========= JSX（本体の return） ========= */
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      {/* ✅ hidden audio は最上部に置く（常にマウントされた状態） */}
      <audio ref={audioRef} src={audioURL ?? undefined} preload="auto" hidden />

        {/* 🏢 ビジネス向けヘッダー */}
        <header className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                  {scene.title}
                </h1>
                <p className="text-slate-600 text-sm font-medium">ビジネス日本語学習プラットフォーム</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-md">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-sm font-medium text-slate-700">難易度: {scene.difficulty}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-md">
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <span className="text-sm font-medium text-slate-700">カテゴリ: {scene.category}</span>
              </div>
            </div>
          </div>
        </header>

        {/* 会話セクション */}
        <div className="business-card p-0">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded text-white text-sm flex items-center justify-center font-medium">1</span>
              会話練習
            </h2>
          </div>
          <div className="p-6">
          <ScenePlayerUI
            scene={scene}
            playing={playing}
            rate={rate}
            onRateChange={setRate}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onSeek={handleSeek}
            progressSec={currentTime}
            durationSec={duration}
            currentIdx={currentIdx}
            isGeneratingAudio={isGeneratingAudio}
          />
          </div>
        </div>

        {/* クイズセクション（終了後ここへ自動スクロール） */}
        <div className="business-card p-0">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded text-white text-sm flex items-center justify-center font-medium">2</span>
              理解度チェック
            </h2>
          </div>
          <div ref={quizRef} className="p-6">
          <QuizBlock
            quizzes={scene.quizzes}
            storageKey={`kireina:score:${scene.id}`}
            onFinish={(r) => console.log("saved", r)}
          />
            <div className="pt-6 border-t border-slate-200 mt-6">
              <Link
                href="/model"
                className="business-button inline-flex items-center gap-2"
              >
                <span>📚</span>
                <span>会話のお手本を確認する</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
