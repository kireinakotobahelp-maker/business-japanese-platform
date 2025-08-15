import { type Scene } from "./types";

export const sceneTemplate: Scene = {
  id: "scene-XYZ",
  title: "（タイトル）",
  category: "business", // "friend" | "dating" | "family" | "other"
  difficulty: "normal", // "easy" | "normal" | "hard"
  relation: "（相手との関係例：上司×部下）",
  // ✕：まずは“少し残念な会話”を書きます（8〜12行 目安）
  script: [
    { speaker: "self",  text: "（こちらからの第一声）" },
    { speaker: "boss",  text: "（返答）" },
  ],
  // ○：言い換えた“お手本”を書きます（scriptと同じ尺）
  modelScript: [
    { speaker: "self",  text: "（お手本の第一声）" },
    { speaker: "boss",  text: "（返答）" },
  ],
  // 学びの要点（3〜5個）
  highlights: [
    { startIdx: 0, endIdx: 0, note: "（改善の観点）" },
  ],
  // 三択クイズ 2〜3問
  quizzes: [
    {
      id: "q1",
      question: "（設問）",
      choices: [
        { id: "a1", text: "選択肢1", correct: false, explain: "（解説）" },
        { id: "a2", text: "選択肢2", correct: true,  explain: "（解説）"  },
        { id: "a3", text: "選択肢3", correct: false, explain: "（解説）" },
      ]
    }
  ]
};
