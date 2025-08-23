'use client';

import React from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, ArrowRight, Home, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { getContentSetById } from "@/lib/contentSets";
import { notFound } from 'next/navigation';

export default function SummaryPage({ params }: { params: Promise<{ contentSetId: string }> }) {
  const { contentSetId } = React.use(params);
  const contentSet = getContentSetById(contentSetId);
  
  if (!contentSet) {
    notFound();
  }

  // 現在は各コンテンツセットに1つのシーンのみ
  const scene = contentSet.scenes[0];

  // クイズから語彙情報を抽出
  const vocabularyFromQuizzes = scene.quizzes
    .filter(quiz => quiz.vocabulary)
    .map(quiz => quiz.vocabulary!);

  // 語彙スポットから語彙情報を抽出
  const vocabularyFromSpots = scene.vocabularySpots || [];

  // 重複を除去して統合
  const allVocabulary = [
    ...vocabularyFromQuizzes,
    ...vocabularyFromSpots.filter(spot => 
      !vocabularyFromQuizzes.some(vocab => vocab.word === spot.word)
    )
  ];

  // コンテンツ別の表現ポイント
  const getExpressionPoints = () => {
    if (contentSetId === 'online-meeting-keigo') {
      return [
        "会議の開始・終了時は「開始・終了させていただきます」が基本。相手への配慮を示す丁寧な表現です。",
        "画面共有前の告知「画面共有させていただきます」と確認「見えていらっしゃいますか」はセットで覚えましょう。",
        "質問前の前置き「確認させていただきたいのですが」で相手への配慮を示し、円滑なコミュニケーションができます。"
      ];
    }
    // デフォルト（営業部）のポイント
    return [
      "自分の行為には「いたします」、相手の許可が前提の場面では「させていただく」を適切に使い分けることが重要です。",
      "相手の話題に具体的な質問で返すことで、自然で好印象な会話が展開できます。",
      "資料の手渡しは「こちらが〜でございます」で始めると、丁寧で自然な印象を与えられます。"
    ];
  };

  const expressionPoints = getExpressionPoints();

  // コンテンツ別の実践アドバイス
  const getPracticalAdvice = () => {
    if (contentSetId === 'online-meeting-keigo') {
      return {
        goal: "学習した会議表現のうち、まずは「画面共有させていただきます」から実際の会議で使ってみましょう。",
        application: "今日学んだ表現は、オンライン会議以外でも応用できます。「確認させていただきたいのですが」は電話やメールでも使えます。"
      };
    }
    return {
      goal: "学習した表現のうち、まずはどれか一つだけを実際の場面で使ってみましょう。",
      application: "今日学んだ表現を、別のシチュエーションでも使えないか考えてみましょう。「差し支えなければ」は様々な場面で応用が可能です。"
    };
  };

  const practicalAdvice = getPracticalAdvice();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* ヘッダー */}
        <header className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href={`/content/${contentSetId}/model`} 
              className="business-button-secondary text-sm"
            >
              ← お手本に戻る
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded text-white text-sm flex items-center justify-center font-semibold">
                S
              </div>
              <span className="text-sm font-medium text-slate-600">学習まとめ</span>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              {contentSet.title} - 学びの要点
            </h1>
            <p className="text-slate-600">今日学習したポイントを整理しましょう</p>
          </div>
        </header>

        {/* 学習完了メッセージ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-green-800">学習完了お疲れさまでした！</h2>
          </div>
          <p className="text-green-700">
            会話練習、クイズ、お手本会話のすべてが完了しました。
            以下のポイントを確認して、明日からの実践に活かしましょう。
          </p>
        </motion.div>

        {/* 今回のポイント */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-0">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded text-white text-sm flex items-center justify-center font-medium">1</span>
              表現のポイント
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {expressionPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center">
                    {index + 1}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 今日の語彙 */}
        {allVocabulary.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-0">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-600 rounded text-white text-sm flex items-center justify-center font-medium">2</span>
                今日の語彙
              </h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {allVocabulary.map((vocab, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-green-800">{vocab.word}</span>
                        <span className="text-green-600 text-sm">（{vocab.reading}）</span>
                      </div>
                    </div>
                    <p className="text-green-700 text-sm mb-2">{vocab.meaning}</p>
                    {vocab.usage && (
                      <p className="text-green-600 text-xs">💡 {vocab.usage}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 実践アドバイス */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-0">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-yellow-600 rounded text-white text-sm flex items-center justify-center font-medium">3</span>
              明日からの実践
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">🎯 今週の目標</h3>
                <p className="text-yellow-700 text-sm">
                  {practicalAdvice.goal}
                  完璧を目指さず、小さな一歩から始めることが重要です。
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🔄 復習のタイミング</h3>
                <p className="text-blue-700 text-sm">
                  <strong>明日、3日後、1週間後</strong>にもう一度この内容を確認すると、
                  記憶の定着率が格段に向上します。
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">📝 応用のヒント</h3>
                <p className="text-purple-700 text-sm">
                  {practicalAdvice.application}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/content/${contentSetId}`}
            className="business-button inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>もう一度練習する</span>
          </Link>
          
          <Link
            href={`/content/${contentSetId}/model`}
            className="business-button-secondary inline-flex items-center justify-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>お手本を見直す</span>
          </Link>
          
          <Link
            href="/"
            className="business-button-secondary inline-flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            <span>トップに戻る</span>
          </Link>
        </div>

        {/* 励ましメッセージ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 border border-slate-200 rounded-lg"
        >
          <p className="text-slate-700 font-medium mb-2">
            継続は力なり
          </p>
          <p className="text-slate-600 text-sm">
            小さな修正の積み重ねが、言葉の印象を確実に変えていきます。
            お疲れさまでした。また次回、一緒に練習しましょう。
          </p>
        </motion.div>
      </div>
    </main>
  );
}