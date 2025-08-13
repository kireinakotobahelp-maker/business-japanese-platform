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
  const [selected, setSelected] = useState<string | null>(null);
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
    setSelected(null);
    setShowResult(false);
    setScore(0);
  }, [quizzes]);

  const q = quizzes[idx];

  // 回答 → 判定表示（スコアはここでは更新しない）
  const submit = useCallback(() => {
    if (!q || !selected) return;
    setShowResult(true);
  }, [q, selected]);

  // 次へ（このタイミングでスコアを確定させる）
  const next = useCallback(() => {
    if (!q) return;
    const earned = selected === q.correctId ? 1 : 0;
    const newScore = score + earned;

    setSelected(null);
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
  }, [q, selected, score, idx, total, storageKey, onFinish]);

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
      <Card className="p-4 space-y-3">
        <SectionTitle>結果</SectionTitle>
        <div className="px-4">
          <p className="text-2xl font-bold">{score} / {total}</p>
          <div className="mt-3 flex items-center gap-2 text-slate-600 text-sm">
            {last && <>保存済み: {last.score}/{last.total}（{new Date(last.at).toLocaleString("ja-JP")}）</>}
          </div>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-white"
            onClick={() => { setIdx(0); setScore(0); setSelected(null); setShowResult(false); }}
          >
            <RotateCcw className="h-4 w-4" /> もう一度
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <SectionTitle
        right={<span className="text-xs text-slate-500">問題 {idx + 1} / {total}</span>}
      >
        クイズ
      </SectionTitle>

      {last && (
        <div className="mx-4 mb-2 text-xs text-slate-500">
          前回: {last.score}/{last.total}（{new Date(last.at).toLocaleString("ja-JP")}）
        </div>
      )}

      <div className="px-4">
        <p className="mb-3 font-medium leading-7">{q.prompt}</p>

        {/* ラジオグループ（ARIA） */}
        <div
          role="radiogroup"
          aria-label="選択肢"
          className="space-y-2"
        >
          {q.choices.map((c) => {
            const isSelected = selected === c.id;
            const isCorrect = showResult && c.id === q.correctId;
            const isWrong = showResult && isSelected && !isCorrect;

            return (
              <button
                key={c.id}
                role="radio"
                aria-checked={isSelected}
                disabled={showResult}
                onClick={() => setSelected(c.id)}
                className={[
                  "w-full rounded-xl px-3 py-2 text-left ring-1 transition flex items-start gap-2 focus:outline-none focus:ring-2",
                  isCorrect
                    ? "bg-emerald-50 ring-emerald-300 focus:ring-emerald-400"
                    : isWrong
                    ? "bg-rose-50 ring-rose-300 focus:ring-rose-400"
                    : isSelected
                    ? "bg-indigo-50 ring-indigo-300 focus:ring-indigo-400"
                    : "bg-white hover:bg-slate-50 ring-slate-200 focus:ring-slate-300",
                ].join(" ")}
              >
                {/* ラジオ丸 */}
                <span className="mt-1 inline-block h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-slate-300 bg-white">
                  <span
                    className={[
                      "block h-3 w-3 rounded-full translate-x-[1px] translate-y-[1px]",
                      isCorrect ? "bg-emerald-500" :
                      isWrong ? "bg-rose-500" :
                      isSelected ? "bg-indigo-500" : "bg-transparent",
                    ].join(" ")}
                  />
                </span>
                <span>{c.text}</span>
              </button>
            );
          })}
        </div>

        {/* ボトム：回答ボタン or 解説 + 次へ */}
        {!showResult ? (
          <button
            onClick={submit}
            disabled={!selected}
            className="mt-3 rounded-md bg-indigo-600 px-3 py-2 text-white disabled:opacity-50"
          >
            回答する（Enter）
          </button>
        ) : (
          <div
            className="mt-3 space-y-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200"
            aria-live="polite"
          >
            <p className="flex items-center gap-2 text-sm">
              {selected === q.correctId ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> 正解！</>
              ) : (
                <><XCircle className="h-4 w-4 text-rose-600" /> 不正解</>
              )}
            </p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{q.explanation}</p>
            <button
              onClick={next}
              className="mt-1 inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-white"
            >
              {idx < total - 1 ? <>次の問題へ（Enter）</> : <>結果を見る（Enter）</>}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
