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

export default function ModelPage({ params }: { params: Promise<{ contentSetId: string }> }) {
  const { contentSetId } = React.use(params);
  const contentSet = getContentSetById(contentSetId);
  
  if (!contentSet) {
    notFound();
  }

  // 現在は各コンテンツセットに1つのシーンのみ
  const scene = contentSet.scenes[0];

  // modelVersionが存在することを確認し、なければお手本ページを無効化
  if (!scene.modelVersion) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">お手本データが未設定です</h1>
          <p className="text-slate-600 mb-6">このシーンにはお手本データが設定されていません。</p>
          <Link 
            href={`/content/${contentSetId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← 会話練習に戻る
          </Link>
        </div>
      </main>
    );
  }

  // modelVersionから学習ポイントを取得
  const modelPoints = scene.modelVersion.learningPoints;

  // お手本用のシーン（modelVersionのデータを使用）
  const modelScene = useMemo(() => {
    return {
      ...scene,
      id: scene.id + "-model",
      title: scene.title + "（お手本）",
      lines: scene.modelVersion!.lines,
    } as const;
  }, [scene]);

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
    return AudioEngine.getFirstDialogIndex(modelScene.lines);
  }, [modelScene.lines]);

  // AudioEngineを使用した音声生成（お手本モード）
  useEffect(() => {
    let aborted = false;
    let createdUrl: string | null = null;

    (async () => {
      try {
        setIsGeneratingAudio(true);
        
        // AudioEngineを使用してお手本音声を生成
        const result = await AudioEngine.generateSceneAudio(scene, { 
          mode: 'model',
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
        console.error("AudioEngine (model mode) failed:", e);
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

  // 現在時間 → ハイライト行（二分探索）+ 学習ポイント自動スクロール
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
    
    // 学習ポイント要約の開始検知（AudioEngineで生成される要約テキスト）
    const currentSegmentIndex = idx;
    const totalModelLines = scene.modelVersion?.lines.length || 0;
    
    // 要約セグメントは最後のセグメントとして追加されるため、
    // 最後のセグメントで学習ポイント読み上げ中かを判定
    if (currentSegmentIndex >= totalModelLines - 1 && !hasScrolledToLearningPoints) {
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
        
        setHasScrolledToLearningPoints(true);
      }
      
      setIsReadingSummary(true);
    } else if (currentSegmentIndex < totalModelLines - 1) {
      setIsReadingSummary(false);
    }
  }, [currentTime, segmentStartsSec, mergedUiIndexes, firstDialogIndex, scene.modelVersion?.lines.length, hasScrolledToLearningPoints]);

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
              href={`/content/${contentSetId}`} 
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
              {contentSet.title}
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
            mode="model"
            hasFinished={hasFinished}
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
            quizzes={scene.quizzes}
            storageKey={`kireina:score:${scene.id}-model`}
            onFinish={(r) => console.log("saved", r)}
          />
            <div className="pt-6 border-t border-slate-200 mt-6">
              <Link
                href={`/content/${contentSetId}/summary`}
                className="business-button inline-flex items-center gap-2"
              >
                <span>🎓</span>
                <span>学びの要点を確認</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}