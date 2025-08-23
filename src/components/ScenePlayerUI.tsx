'use client';

/**
 * ScenePlayerUI - 会話再生用UIコンポーネント（新しいlines形式対応）
 */

import { Play, Pause, Square, SkipBack, SkipForward, Crown, User, BookOpen, AlertCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import React, { useMemo, useEffect, useRef } from "react";
import { Scene } from "@/lib/types";

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
  mode?: 'practice' | 'model'; // 会話練習 or お手本モード
  hasFinished?: boolean; // 音声再生が完了したかどうか
}) {
  const {
    scene, playing, rate, onRateChange,
    onPlay, onPause, onStop, onSeek,
    progressSec, durationSec, currentIdx, isGeneratingAudio, isReadingSummary,
    mode = 'practice', hasFinished = false
  } = props;

  const reduceMotion = useReducedMotion();
  
  // 自動スクロール用のref
  const dialogRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  
  // 自動スクロールのON/OFF状態（デフォルトは手動=false）
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(false);
  
  // 学習スポット表示状態（デフォルトで非表示）
  const [showVocabularySpots, setShowVocabularySpots] = React.useState(false);
  const [showImprovementPoints, setShowImprovementPoints] = React.useState(false);

  // 新しいlines形式のシーンをパース（memo）
  const { dialog, narrations } = useMemo(() => {
    if (!scene?.lines) return { dialog: [], narrations: [] };
    
    const narr = scene.lines.filter(line => /^(ナレーター|narrator|解説者)$/i.test(line.speaker));
    const dia = scene.lines.filter(line => !/^(ナレーター|narrator|解説者)$/i.test(line.speaker));
    
    return { dialog: dia, narrations: narr };
  }, [scene?.lines]);

  // 語彙スポット検索関数（お手本モードのみ）
  const findVocabularySpot = React.useCallback((lineIndex: number) => {
    if (mode !== 'model' || !scene?.vocabularySpots || !showVocabularySpots) return null;
    
    return scene.vocabularySpots.find(spot => spot.lineIndex === lineIndex);
  }, [mode, scene?.vocabularySpots, showVocabularySpots]);

  // 改善ポイント検索関数（会話練習モードのみ）
  const findImprovementPoint = React.useCallback((lineIndex: number) => {
    if (mode !== 'practice' || !scene?.improvementPoints || !showImprovementPoints) return null;
    
    return scene.improvementPoints.find(point => point.lineIndex === lineIndex);
  }, [mode, scene?.improvementPoints, showImprovementPoints]);

  // role config（アイコン付き）
  const roleConfig: Record<string, any> = {
    "部長": { 
      label: "部長", 
      dot: "bg-slate-800", 
      text: "text-slate-900", 
      ring: "ring-slate-200",
      icon: Crown,
      iconColor: "text-white"
    },
    "司会": { 
      label: "司会", 
      dot: "bg-blue-600", 
      text: "text-blue-900", 
      ring: "ring-blue-200",
      icon: Crown,
      iconColor: "text-white"
    },
    "山田": { 
      label: "司会", 
      dot: "bg-blue-600", 
      text: "text-blue-900", 
      ring: "ring-blue-200",
      icon: Crown,
      iconColor: "text-white"
    },
    "芝田さん": { 
      label: "営業", 
      dot: "bg-green-600", 
      text: "text-green-900", 
      ring: "ring-green-200",
      icon: User,
      iconColor: "text-white"
    },
    "田中": { 
      label: "参加者", 
      dot: "bg-purple-600", 
      text: "text-purple-900", 
      ring: "ring-purple-200",
      icon: User,
      iconColor: "text-white"
    },
    "佐藤": { 
      label: "参加者", 
      dot: "bg-indigo-600", 
      text: "text-indigo-900", 
      ring: "ring-indigo-200",
      icon: User,
      iconColor: "text-white"
    },
    "参加者一同": { 
      label: "参加者", 
      dot: "bg-gray-600", 
      text: "text-gray-900", 
      ring: "ring-gray-200",
      icon: User,
      iconColor: "text-white"
    }
  };

  // デフォルト設定
  const defaultConfig = { 
    label: "話者", 
    dot: "bg-slate-600", 
    text: "text-slate-900",
    ring: "ring-slate-200", 
    icon: User,
    iconColor: "text-white"
  };

  // 自動スクロール
  useEffect(() => {
    if (!autoScrollEnabled) return;
    const ref = dialogRefs.current[currentIdx];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIdx, autoScrollEnabled]);

  // 進捗バー
  const progressPercent = durationSec > 0 ? Math.min(100, (progressSec / durationSec) * 100) : 0;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const seekToPercent = (percent: number) => {
    if (durationSec > 0) {
      onSeek((percent / 100) * durationSec);
    }
  };

  // 音声が終了していない間はスティッキー表示
  const isSticky = !hasFinished;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* コントロールパネル（スティッキー表示） */}
      <div className={`${isSticky ? 'sticky top-2 md:top-4 z-10 shadow-lg' : ''} bg-white border border-slate-200 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">音声コントロール</h3>
          <div className="flex items-center gap-2">
            {isReadingSummary && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                学習ポイント読み上げ中
              </div>
            )}
            
            {/* お手本モードでは語彙学習ボタンを表示 */}
            {mode === 'model' && scene?.vocabularySpots && scene.vocabularySpots.length > 0 && (
              <button
                onClick={() => setShowVocabularySpots(!showVocabularySpots)}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                  showVocabularySpots 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <BookOpen size={14} />
                語彙学習
                {showVocabularySpots ? (
                  <span className="text-xs">（非表示）</span>
                ) : (
                  <span className="text-xs">（表示）</span>
                )}
              </button>
            )}
            
            {/* 会話練習モードでは改善ポイントボタンを表示 */}
            {mode === 'practice' && scene?.improvementPoints && scene.improvementPoints.length > 0 && (
              <button
                onClick={() => setShowImprovementPoints(!showImprovementPoints)}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                  showImprovementPoints 
                    ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <AlertCircle size={14} />
                改善ポイント
                {showImprovementPoints ? (
                  <span className="text-xs">（非表示）</span>
                ) : (
                  <span className="text-xs">（表示）</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 再生コントロール */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSeek(Math.max(0, progressSec - 10))}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              disabled={isGeneratingAudio}
            >
              <SkipBack size={20} />
            </button>
            
            <button
              onClick={playing ? onPause : onPlay}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50"
              disabled={isGeneratingAudio}
            >
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <button
              onClick={onStop}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              disabled={isGeneratingAudio}
            >
              <Square size={20} />
            </button>
            
            <button
              onClick={() => onSeek(Math.min(durationSec, progressSec + 10))}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              disabled={isGeneratingAudio}
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* 速度調整 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">速度:</span>
            <select
              value={rate}
              onChange={(e) => onRateChange(Number(e.target.value))}
              className="text-sm border border-slate-300 rounded px-2 py-1"
              disabled={isGeneratingAudio}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1.0}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>
          </div>

          {/* 自動スクロール切り替え */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoScrollEnabled}
              onChange={(e) => setAutoScrollEnabled(e.target.checked)}
              className="rounded"
            />
            自動スクロール
          </label>
        </div>

        {/* 進捗バー */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>{formatTime(progressSec)}</span>
            <span>{formatTime(durationSec)}</span>
          </div>
          <div 
            className="w-full h-2 bg-slate-200 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = ((e.clientX - rect.left) / rect.width) * 100;
              seekToPercent(percent);
            }}
          >
            <div 
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {isGeneratingAudio && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            音声を生成中...
          </div>
        )}
      </div>

      {/* ダイアログ表示 */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4">会話</h3>
        <div className="space-y-4">
          {dialog.map((line, index) => {
            const isActive = currentIdx === scene?.lines?.findIndex(l => l === line);
            const config = roleConfig[line.speaker] || defaultConfig;
            const IconComponent = config.icon;
            
            // 語彙スポットと改善ポイントを検索
            const lineIndex = scene?.lines?.findIndex(l => l === line) ?? -1;
            const vocabularySpot = findVocabularySpot(lineIndex);
            const improvementPoint = findImprovementPoint(lineIndex);

            return (
              <div key={index} className="space-y-3">
                <motion.div
                  ref={(el) => { dialogRefs.current[lineIndex] = el; }}
                  className={`flex gap-4 p-4 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
                      : 'hover:bg-slate-50'
                  }`}
                  animate={!reduceMotion && isActive ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`w-10 h-10 ${config.dot} rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? `ring-2 ${config.ring}` : ''
                  }`}>
                    <IconComponent size={16} className={config.iconColor} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-600">{config.label}</span>
                      <span className="text-xs text-slate-500">({line.speaker})</span>
                    </div>
                    <p className={`leading-relaxed ${config.text} ${
                      isActive ? 'font-medium' : ''
                    }`}>
                      {line.text}
                    </p>
                  </div>
                </motion.div>

                {/* 語彙スポット表示（緑色） */}
                {vocabularySpot && showVocabularySpots && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ml-14 bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={16} className="text-green-600" />
                      <span className="font-semibold text-green-800">{vocabularySpot.word}</span>
                      <span className="text-green-600 text-sm">（{vocabularySpot.reading}）</span>
                    </div>
                    <p className="text-green-700 text-sm mb-2">{vocabularySpot.meaning}</p>
                    <p className="text-green-600 text-xs">{vocabularySpot.explanation}</p>
                    {vocabularySpot.usage && (
                      <p className="text-green-600 text-xs mt-1">💡 {vocabularySpot.usage}</p>
                    )}
                  </motion.div>
                )}

                {/* 改善ポイント表示（オレンジ色） */}
                {improvementPoint && showImprovementPoints && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ml-14 bg-orange-50 border border-orange-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-orange-600" />
                      <span className="font-semibold text-orange-800">改善ポイント</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-orange-700 text-sm font-medium">問題: </span>
                        <span className="text-orange-700 text-sm">{improvementPoint.issue}</span>
                      </div>
                      <p className="text-orange-600 text-xs">{improvementPoint.problemDescription}</p>
                      <div>
                        <span className="text-orange-700 text-sm font-medium">改善方法: </span>
                        <span className="text-orange-700 text-sm">{improvementPoint.improvement}</span>
                      </div>
                      {improvementPoint.betterExpression && (
                        <div className="bg-orange-100 p-2 rounded text-xs">
                          <span className="text-orange-700 font-medium">より良い表現: </span>
                          <span className="text-orange-800">「{improvementPoint.betterExpression}」</span>
                        </div>
                      )}
                      <p className="text-orange-600 text-xs">{improvementPoint.explanation}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}