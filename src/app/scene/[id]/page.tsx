'use client';

import { use, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { getSceneById } from '../../../lib/scenes';
import { ScenePlayerUI } from '../../../components/ScenePlayerUI';
import QuizBlock from '../../../components/QuizBlock';

/**
 * Next.js 15: params は Promise。React.use() でアンラップする。
 * さらに、ScenePlayerUI が script を「文字列」で期待しているため、
 * 配列シーン（scene-002/003）を「話者: 文」の改行テキストに変換して渡す。
 */
export default function ScenePage(props: { params: Promise<{ id: string }> }) {
  // ✅ ここで params を取り出す（警告解消）
  const { id } = use(props.params);

  const scene = useMemo(() => getSceneById(id), [id]);
  if (!scene) return notFound();

  // ✅ UI が文字列を期待している想定に合わせてアダプタを挟む
  const sceneForUI = useMemo(() => {
    // scene.script が配列なら "話者: 文" のテキストに連結
    const toLines = (segArr: any) =>
      Array.isArray(segArr)
        ? segArr.map((s: any) => `${s.speaker}: ${s.text}`).join('\n')
        : segArr; // すでに文字列ならそのまま

    // 必要最低限のフィールドだけ上書き（型は any でUIに渡す）
    return {
      ...scene,
      script: toLines((scene as any).script),
      modelScript: toLines((scene as any).modelScript),
    } as any;
  }, [scene]);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <ScenePlayerUI scene={sceneForUI} />
      <QuizBlock quizzes={scene.quizzes} storageKey={`quiz-${scene.id}`} />
    </main>
  );
}
