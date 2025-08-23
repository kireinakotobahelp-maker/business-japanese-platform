"use client";
import { useEffect, useState, useCallback } from "react";
import type { Quiz } from "@/lib/types";
import { Card, SectionTitle } from "@/components/ui/Card";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

type Result = { score: number; total: number; at: string };

export default function QuizBlock({
  quizzes,
  storageKey = "kireina:quiz:last",
  onFinish,
}: {
  quizzes: Quiz[];
  storageKey?: string;
  onFinish?: (r: Result) => void;
}) {
  const total = quizzes.length;
  const [idx, setIdx] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [last, setLast] = useState<Result | null>(null);

  // 前回結果の読み込み
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLast(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  // クイズセットが変わったら初期化
  useEffect(() => {
    setIdx(0);
    setSelectedIndex(null);
    setShowResult(false);
    setScore(0);
  }, [quizzes]);

  const q = quizzes[idx];

  // 回答 → 判定表示（スコアはここでは更新しない）
  const submit = useCallback(() => {
    if (!q || selectedIndex === null) return;
    setShowResult(true);
  }, [q, selectedIndex]);

  // 次へ（このタイミングでスコアを確定させる）
  const next = useCallback(() => {
    if (!q || selectedIndex === null) return;
    const earned = selectedIndex === q.correctAnswer ? 1 : 0;
    const newScore = score + earned;

    setSelectedIndex(null);
    setShowResult(false);

    if (idx < total - 1) {
      setScore(newScore);
      setIdx(idx + 1);
    } else {
      // 最終問題：保存も newScore で行う
      const result: Result = { score: newScore, total, at: new Date().toISOString() };
      try {
        localStorage.setItem(storageKey, JSON.stringify(result));
        setLast(result);
      } catch {}
      setScore(newScore);
      setIdx(idx + 1); // 終了画面へ
      onFinish?.(result);
    }
  }, [q, selectedIndex, score, idx, total, storageKey, onFinish]);

  // キーボード操作: Enterで回答/次へ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!showResult) submit();
        else next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResult, submit, next]);

  // 終了画面
  if (idx >= total) {
    return (
      <Card className="p-6 space-y-6 max-w-2xl mx-auto">
        <SectionTitle>結果</SectionTitle>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{score} / {total}</div>
          <div className="text-lg font-medium text-slate-700 mb-4">
            {score === total ? "完璧です！" : score >= total * 0.7 ? "よくできました！" : "もう一度チャレンジしてみましょう"}
          </div>
          
          {/* 語彙カード */}
          {quizzes.some(quiz => quiz.vocabulary) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">📚 今回の重要語彙</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {quizzes.filter(quiz => quiz.vocabulary).map((quiz, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-blue-800">{quiz.vocabulary!.word}</span>
                      <span className="text-blue-600 text-sm">（{quiz.vocabulary!.reading}）</span>
                    </div>
                    <p className="text-blue-700 text-sm mb-2">{quiz.vocabulary!.meaning}</p>
                    {quiz.vocabulary!.usage && (
                      <p className="text-blue-600 text-xs">💡 {quiz.vocabulary!.usage}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-600 text-sm">
            {last && <span>前回: {last.score}/{last.total} ({new Date(last.at).toLocaleDateString()})</span>}
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => { setIdx(0); setScore(0); setSelectedIndex(null); setShowResult(false); }}
              className="business-button inline-flex items-center gap-2"
            >
              <RotateCcw size={16} />
              もう一度チャレンジ
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // 問題画面
  return (
    <Card className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">問題 {idx + 1} / {total}</h2>
        <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">得点: {score} / {idx}</div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium leading-relaxed">{q.question}</h3>

        <div className="space-y-3">
          {q.options.map((option, optionIndex) => {
            const isSelected = selectedIndex === optionIndex;
            const isCorrect = optionIndex === q.correctAnswer;
            const showAnswer = showResult;

            let bgClass = "bg-slate-50 border-slate-200 hover:bg-slate-100";
            let textClass = "text-slate-800";

            if (showAnswer) {
              if (isCorrect) {
                bgClass = "bg-green-50 border-green-300";
                textClass = "text-green-800";
              } else if (isSelected && !isCorrect) {
                bgClass = "bg-red-50 border-red-300";
                textClass = "text-red-800";
              }
            } else if (isSelected) {
              bgClass = "bg-blue-50 border-blue-300";
              textClass = "text-blue-800";
            }

            return (
              <button
                key={optionIndex}
                onClick={() => !showAnswer && setSelectedIndex(optionIndex)}
                disabled={showAnswer}
                className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${
                  showAnswer ? "cursor-default" : "hover:shadow-sm"
                } ${bgClass}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'border-current' : 'border-slate-300'
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                  </div>
                  <span className={`${textClass} leading-relaxed`}>{option}</span>
                  <div className="ml-auto">
                    {showAnswer && isCorrect && <CheckCircle2 size={20} className="text-green-600" />}
                    {showAnswer && isSelected && !isCorrect && <XCircle size={20} className="text-red-600" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="bg-slate-50 rounded-lg p-6 space-y-4">
            <div className={`text-lg font-semibold ${
              selectedIndex === q.correctAnswer ? "text-green-700" : "text-red-700"
            }`}>
              {selectedIndex === q.correctAnswer ? "✅ 正解！" : "❌ 不正解"}
            </div>
            <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
            
            {/* 語彙カード表示 */}
            {q.vocabulary && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-blue-800">{q.vocabulary.word}</span>
                  <span className="text-blue-600 text-sm">（{q.vocabulary.reading}）</span>
                </div>
                <p className="text-blue-700 text-sm mb-2">{q.vocabulary.meaning}</p>
                {q.vocabulary.usage && (
                  <p className="text-blue-600 text-xs">💡 {q.vocabulary.usage}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          {!showResult ? (
            <button
              onClick={submit}
              disabled={selectedIndex === null}
              className="business-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              回答する
            </button>
          ) : (
            <button onClick={next} className="business-button">
              {idx < total - 1 ? "次の問題へ" : "結果を見る"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}