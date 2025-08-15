'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ScenePlayerUI } from "@/components/ScenePlayerUI"; // ← 修正
import QuizBlock from "@/components/QuizBlock";
import { sampleScene } from "@/lib/sampleScene";
import { Card, SectionTitle } from "@/components/ui/Card";

/* ========= ユーティリティ ========= */

// 表記ゆれ吸収（ナレーター/解説者/narrator）
const NARRATOR_RE = /(ナレーター|ナレータ|解説者|narrator)/i;

// 話者→ボイス
const voiceOf = (speaker: string): "alloy" | "verse" | "sage" => {
  if (NARRATOR_RE.test(speaker)) return "sage";
  if (/^(部長|上司)/.test(speaker)) return "alloy";
  if (/^(芝田|芝田さん|営業)/.test(speaker)) return "verse";
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

// 同一話者の連続セリフを結合（uiIndex も維持）
function coalesceSegments<T extends { speaker: string; text: string; lineIndex: number; uiIndex: number }>(segs: T[]) {
  const out: T[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && last.speaker === s.speaker) {
      last.text = `${last.text} ${s.text}`;
      // uiIndex は最初のセグメントのものを残す
    } else {
      out.push({ ...s });
    }
  }
  return out;
}

// 簡易コンカレンシー（同時 limit 本の Promise を回す）
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

// /api/tts → decode（mp3推奨, 失敗時は1秒無音）
async function fetchDecodeSegment(ctx: AudioContext, text: string, voice: string, format: "mp3" | "wav" = "mp3") {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice, format }),
    });
    if (!res.ok) throw new Error(await res.text());
    const ab = await res.arrayBuffer();
    return await ctx.decodeAudioData(ab.slice(0)); // Safari 対策で複製
  } catch (e) {
    // 無音差し込みで全体進行を維持
    const sr = Math.max(1, ctx.sampleRate || 24000);
    return ctx.createBuffer(1, Math.floor(sr * 1.0), sr);
  }
}

// まとめを丁寧＆励まし口調で生成（UIには出さない／音声のみ）
function buildNarratorSummary(points: string[]): string {
  const safe = (i: number) => (points[i] ?? "").replace(/^[\d\.\s•]+/, "");
  const body =
    `本日のポイントは三つです。` +
    `第一に、${safe(0)} ` +
    `第二に、${safe(1)} ` +
    `第三に、${safe(2)} ` +
    `どれも明日からすぐ実践できる表現です。` +
    `全部を完璧にではなく、まずはどれか一つだけ試してみましょう。` +
    `うまくいかない瞬間も糧になります。小さな修正の積み重ねが、言葉の印象を確実に変えていきます。` +
    `お疲れさまでした。また次回、一緒に練習しましょう。`;
  return `ナレーター: ${body}`;
}

/* ========= ページ本体 ========= */

type Seg = { speaker: string; text: string; lineIndex: number; uiIndex: number };
const GAP_SEC = 0.35;

export default function ModelPage() {
  const base = sampleScene;

  // UI表示用の学習ポイント（3つ）
  const modelPoints = useMemo<string[]>(() => [
    "自己の行為は「〜いたします」が基本。『させていただく』は相手の許可・依頼が前提の場面で用いる表現です。例：『確認いたします』『嗜む程度です』。",
    "相手の話題には具体的な質問で返すと会話が自然に広がります。例：『静岡のどちらのコースでしたか？』『最近はどのくらい回られていますか？』。",
    "手渡しは『こちらが資料でございます。どうぞご覧ください。』が丁寧で自然。「〜になります」は完成品の提示では避けると好印象。",
  ], []);

  // ① 表示＆再生に使う“お手本用の台本”を組み立て（UI用は要約抜き）
  const modelScene = useMemo(() => {
    const intro = `ナレーター: ではお手本の会話です。`;
    const core = (base.modelScript && base.modelScript.trim() !== "" ? base.modelScript : base.script).trim();
    const uiScript  = [intro, core].filter(Boolean).join("\n"); // 画面表示用
    return {
      ...base,
      id: base.id + "-model",
      title: base.title + "（お手本）",
      script: uiScript,
    } as const;
  }, [base]);

  // ② TTS用台本（要約あり）→ セグメント化（uiIndexでUI行と同期）
  const ttsSegments = useMemo(() => {
    const intro = `ナレーター: ではお手本の会話です。`;
    const core = (base.modelScript && base.modelScript.trim() !== "" ? base.modelScript : base.script).trim();
    const summary = buildNarratorSummary(modelPoints);

    const uiScript  = [intro, core].filter(Boolean).join("\n");         // UIは要約なし
    const ttsScript = [intro, core, summary].filter(Boolean).join("\n"); // 音声は要約あり

    const uiLines = uiScript.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const uiLineCount = uiLines.length;

    const ttsSegments: Seg[] = ttsScript
      .split(/\r?\n/)
      .map((l,i)=>({ raw:l.trim(), lineIndex:i }))
      .filter(x=>x.raw.length>0)
      .map(({raw,lineIndex})=>{
        const m = raw.match(/^(.+?)\s*[:：]\s*(.+)$/);
        if (!m) return null;
        const speakerRaw = m[1].trim();
        const text = m[2].trim();
        const speaker = NARRATOR_RE.test(speakerRaw) ? "ナレーター" : speakerRaw;
        // UIに存在する行なら同じ index、要約部分はUI末尾(最後の行)に固定
        const uiIndex = lineIndex < uiLineCount ? lineIndex : Math.max(0, uiLineCount - 1);
        return { speaker, text, lineIndex, uiIndex };
      })
      .filter((x): x is Seg => !!x);

    return ttsSegments;
  }, [base, modelPoints]);

  // ③ 再生の状態
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [segmentStartsSec, setSegmentStartsSec] = useState<number[]>([]);
  const [mergedUiIndexes, setMergedUiIndexes] = useState<number[]>([]);
  const [hasFinished, setHasFinished] = useState(false);
  const [isReadingSummary, setIsReadingSummary] = useState(false);
  const [hasScrolledToLearningPoints, setHasScrolledToLearningPoints] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  const learningPointsRef = useRef<HTMLDivElement>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // UIでの「最初のダイアログ行」（ナレーターで始まる場合の戻り先）
  const firstDialogIndex = useMemo(() => {
    const lines = modelScene.script.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw) continue;
      const m = raw.match(/^(.+?)\s*[:：]\s*(.+)$/);
      if (!m) continue;
      const speaker = m[1].trim();
      if (!NARRATOR_RE.test(speaker)) return i;
    }
    return 0;
  }, [modelScene.script]);

  // ④ TTS→decode（24kHz, 並列3本）→オフライン結合（秒ベース）
  useEffect(() => {
    let aborted = false; let createdUrl: string | null = null;
    (async () => {
      try {
        setIsGeneratingAudio(true);
        if (!ttsSegments.length) { setAudioURL(null); setSegmentStartsSec([]); setMergedUiIndexes([]); setIsGeneratingAudio(false); return; }

        // 1) 同一話者結合（API回数削減）— uiIndex を維持
        const mergedSegs = coalesceSegments(ttsSegments);
        setMergedUiIndexes(mergedSegs.map(s => s.uiIndex));

        // 2) AudioContext（24kHz優先、失敗時フォールバック）
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        const targetSR = 24000;
        let ctx: AudioContext;
        try { ctx = new AC({ sampleRate: targetSR }); } catch { ctx = new AC(); }

        // 3) 並列でフェッチ＆デコード（並列数を5に増加で高速化）
        const decoded = await asyncPool(5, mergedSegs, async (seg) => {
          const voice = voiceOf(seg.speaker || "");
          return await fetchDecodeSegment(ctx, seg.text, voice, "mp3");
        });
        if (aborted) return;

        // 4) 開始秒（b.duration は秒）
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
          const mono = offline.createBuffer(1, b.length, b.sampleRate);
          mono.getChannelData(0).set(b.getChannelData(0));
          const src = offline.createBufferSource();
          src.buffer = mono;
          src.connect(offline.destination);
          src.start(cursorSec);               // ← 秒でスケジューリング
          cursorSec += b.duration + GAP_SEC;  // ← 秒で加算（単位を統一）
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
        console.error("model build merged audio failed:", e);
        setAudioURL(null);
        setSegmentStartsSec([]);
        setMergedUiIndexes([]);
        setIsGeneratingAudio(false);
      }
    })();
    return () => { aborted = true; if (createdUrl) URL.revokeObjectURL(createdUrl); };
  }, [ttsSegments, firstDialogIndex]);

  // ⑤ 再生/一時停止/速度/進捗 & 終了フラグ
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
    const onEnd = () => { setPlaying(false); setHasFinished(true); };
    const onDur = () => setDuration(isFinite(el.duration) ? el.duration : 0);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("durationchange", onDur);
    onDur();
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("durationchange", onDur);
    };
  }, [audioURL]);

  // ⑥ 現在時間 → ハイライト行（二分探索 + uiIndex でUIに同期）
  useEffect(() => {
    if (!segmentStartsSec.length || !ttsSegments.length) return;
    let lo = 0, hi = segmentStartsSec.length - 1, idx = 0;
    const t = currentTime + 1e-3;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (t >= segmentStartsSec[mid]) { idx = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    setCurrentIdx(mergedUiIndexes[idx] ?? firstDialogIndex);
    
    // ナレーターの学習ポイントまとめ開始を検知してスクロール（一度だけ実行）
    const currentSegment = ttsSegments[idx];
    if (currentSegment && 
        currentSegment.speaker === "ナレーター" && 
        currentSegment.text.includes("本日のポイントは三つです") &&
        !hasScrolledToLearningPoints) {
      
      console.log('📚 Learning points summary started, scrolling to learning points section (one-time)');
      
      if (learningPointsRef.current) {
        const elementRect = learningPointsRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY;
        
        // 学習ポイントセクションが画面の上から20%の位置に来るようにスクロール
        const targetY = scrollY + elementRect.top - (viewportHeight * 0.2);
        
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
        
        // フラグを設定して、再度自動スクロールしないようにする
        setHasScrolledToLearningPoints(true);
      }
      
      setIsReadingSummary(true);
    } else if (currentSegment && currentSegment.speaker !== "ナレーター") {
      setIsReadingSummary(false);
    }
  }, [currentTime, segmentStartsSec, mergedUiIndexes, firstDialogIndex, ttsSegments, learningPointsRef, hasScrolledToLearningPoints]);

  // ⑦ 音声終了後の処理（スクロールは⑥で実行済みなので、ここでは状態管理のみ）
  useEffect(() => {
    if (hasFinished) {
      console.log('🎓 Model page: Audio completely finished');
      setIsReadingSummary(false); // 音声終了時にインジケーターを非表示
      setHasScrolledToLearningPoints(false); // 次回再生のためにフラグをリセット
    }
  }, [hasFinished]);

  // UI からのシーク
  const handleSeek = (sec: number) => {
    const el = audioRef.current; if (!el) return;
    el.currentTime = Math.max(0, Math.min(sec, el.duration || sec));
    setCurrentTime(el.currentTime);
  };

  const handleStop = () => {
    const el = audioRef.current;
    if (el) { el.pause(); el.currentTime = 0; }
    setPlaying(false);
    setCurrentTime(0);
    setCurrentIdx(firstDialogIndex);
    setHasFinished(false);
    setIsReadingSummary(false);
    setHasScrolledToLearningPoints(false); // 停止時にフラグをリセット
  };

  /* ========= JSX ========= */
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* 常時マウント */}
      <audio ref={audioRef} src={audioURL ?? undefined} preload="auto" hidden />

        {/* ビジネス向けヘッダー */}
        <header className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/" 
              className="business-button-secondary text-sm"
            >
              ← 戻る
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded text-white text-sm flex items-center justify-center font-semibold">
                M
              </div>
              <span className="text-sm font-medium text-slate-600">お手本モード</span>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              {sampleScene.title}
            </h1>
            <p className="text-slate-600">プロフェッショナルな会話の見本</p>
          </div>
        </header>

        {/* お手本の会話 */}
        <div className="business-card p-0">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded text-white text-sm flex items-center justify-center font-medium">1</span>
              お手本の会話
            </h2>
          </div>
          <div className="p-6">
          <ScenePlayerUI
            scene={modelScene}
            playing={playing}
            rate={rate}
            onRateChange={setRate}
            onPlay={() => { setHasFinished(false); setPlaying(true); }}
            onPause={() => setPlaying(false)}
            onStop={handleStop}
            onSeek={handleSeek}
            progressSec={currentTime}
            durationSec={duration}
            currentIdx={currentIdx}
            isGeneratingAudio={isGeneratingAudio}
            isReadingSummary={isReadingSummary}
          />
          </div>
        </div>

        {/* 今回のポイント */}
        <div className="business-card p-0" ref={learningPointsRef}>
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded text-white text-sm flex items-center justify-center font-medium">2</span>
              学習ポイント
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {modelPoints.map((h, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded bg-blue-600 text-white font-semibold text-sm flex items-center justify-center">
                    {i + 1}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* クイズ */}
        <div className="business-card p-0">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded text-white text-sm flex items-center justify-center font-medium">3</span>
              理解度チェック
            </h2>
          </div>
          <div className="p-6" ref={quizRef}>
          <QuizBlock
            quizzes={sampleScene.quizzes}
            storageKey={`kireina:score:${sampleScene.id}-model`}
            onFinish={(r) => console.log("saved", r)}
          />
          </div>
        </div>
      </div>
    </main>
  );
}
