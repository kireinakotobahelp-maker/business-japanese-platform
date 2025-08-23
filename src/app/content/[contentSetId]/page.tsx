'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ScenePlayerUI } from "@/components/ScenePlayerUI";
import QuizBlock from "@/components/QuizBlock";
import { getContentSetById } from "@/lib/contentSets";
import { Card } from "@/components/ui/Card";
import { AudioEngine } from "@/lib/audioEngine";
import { notFound } from 'next/navigation';

/* ========= ページ本体 ========= */

export default function ContentSetPage({ params }: { params: Promise<{ contentSetId: string }> }) {
  const { contentSetId } = React.use(params);
  const contentSet = getContentSetById(contentSetId);
  
  if (!contentSet) {
    notFound();
  }

  // 現在は各コンテンツセットに1つのシーンのみ
  const scene = contentSet.scenes[0];

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

  // 最初のダイアログ行（ナレーターで始まる場合の戻り先）
  const firstDialogIndex = useMemo(() => {
    return AudioEngine.getFirstDialogIndex(scene.lines);
  }, [scene.lines]);

  // AudioEngineを使用した音声生成
  useEffect(() => {
    let aborted = false;
    let createdUrl: string | null = null;

    (async () => {
      try {
        setIsGeneratingAudio(true);
        
        // AudioEngineを使用して音声を生成
        const result = await AudioEngine.generateSceneAudio(scene, { 
          mode: 'practice',
          gapSeconds: 0.35 
        });
        
        if (aborted) return;

        createdUrl = result.audioURL;
        setAudioURL(prev => { 
          if (prev) URL.revokeObjectURL(prev); 
          return result.audioURL; 
        });
        setDuration(result.duration);
        setSegmentStartsSec(result.segmentStartsSec);
        setMergedUiIndexes(result.mergedUiIndexes);
        setCurrentTime(0);
        setCurrentIdx(firstDialogIndex);
        setIsGeneratingAudio(false);
      } catch (e) {
        console.error("AudioEngine failed:", e);
        setAudioURL(null);
        setSegmentStartsSec([]);
        setMergedUiIndexes([]);
        setIsGeneratingAudio(false);
      }
    })();

    return () => { 
      aborted = true; 
      if (createdUrl) URL.revokeObjectURL(createdUrl); 
    };
  }, [scene, firstDialogIndex]);

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

        {/* 🔙 戻るボタン */}
        <div className="flex items-center gap-4 mb-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <span className="text-lg">←</span>
            <span>コンテンツ一覧に戻る</span>
          </Link>
        </div>

        {/* 🏢 ビジネス向けヘッダー */}
        <header className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                  {contentSet.title}
                </h1>
                <p className="text-slate-600 text-sm font-medium">ビジネス日本語学習プラットフォーム</p>
              </div>
            </div>
            
            <p className="text-slate-700 max-w-2xl mx-auto leading-relaxed mb-6">
              {contentSet.description}
            </p>
            
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-md">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-sm font-medium text-slate-700">難易度: {contentSet.difficulty}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-md">
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <span className="text-sm font-medium text-slate-700">カテゴリ: {contentSet.category}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-md">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span className="text-sm font-medium text-slate-700">所要時間: {contentSet.estimatedTime}</span>
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
            mode="practice"
            hasFinished={hasFinished}
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
                href={`/content/${contentSetId}/model`}
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