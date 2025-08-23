'use client';

import Link from "next/link";
import { contentSets } from "@/lib/contentSets";
import { Card } from "@/components/ui/Card";

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
    case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'business': return '💼'
    case 'daily': return '🏠'
    case 'formal': return '🎩'
    default: return '📚'
  }
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* ヘッダー */}
        <header className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                  敬語マスター
                </h1>
                <p className="text-slate-600 text-sm font-medium">ビジネス日本語学習プラットフォーム</p>
              </div>
            </div>
            
            <p className="text-slate-700 max-w-2xl mx-auto leading-relaxed">
              実践的なシチュエーションを通じて、ビジネスで使える敬語表現を身に付けましょう。<br />
              音声付きの会話練習、クイズ、語彙学習で効率的にスキルアップできます。
            </p>
          </div>
        </header>

        {/* コンテンツセット一覧 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">学習コンテンツ</h2>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {contentSets.map((contentSet) => (
              <Card key={contentSet.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                <Link href={`/content/${contentSet.id}`} className="block p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getCategoryIcon(contentSet.category)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {contentSet.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(contentSet.difficulty)}`}>
                          {contentSet.difficulty}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">
                        {contentSet.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                        <div className="flex items-center gap-1">
                          <span>⏱️</span>
                          <span>{contentSet.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>📖</span>
                          <span>{contentSet.scenes.length}シーン</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {contentSet.keySkills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {contentSet.keySkills.length > 3 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                            +{contentSet.keySkills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
        
        {/* 下部のCTA */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            効果的な敬語学習のために
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            各コンテンツは段階的に構成されています。会話練習→クイズ→お手本確認→学習要点の順で進めることをお勧めします。
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-medium">1</span>
              <span>会話練習</span>
            </div>
            <div className="text-slate-300">→</div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-medium">2</span>
              <span>クイズ</span>
            </div>
            <div className="text-slate-300">→</div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-medium">3</span>
              <span>お手本確認</span>
            </div>
            <div className="text-slate-300">→</div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-medium">4</span>
              <span>学習要点</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
