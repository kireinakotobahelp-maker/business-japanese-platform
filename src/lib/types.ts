// src/lib/types.ts

// ====== Shared literal types ======
export type Category = "business" | "daily" | "romance";
export type Relation = "boss" | "client" | "friend" | "partner";

// TTS voices used across the app (keep in sync with voiceOf)
export type Voice = "alloy" | "verse" | "sage";

// ====== Quiz ======
export type QuizChoice = { id: string; text: string };

export type Quiz = {
  id: string;
  qtype: "keigo" | "consideration" | "fix";
  prompt: string;
  choices: QuizChoice[];
  correctId: string;
  explanation: string;
};

// ====== Scene ======
export type Scene = {
  id: string;
  title: string;

  // scene metadata
  category: Category;
  relation: Relation;
  difficulty: 1 | 2 | 3;

  // scripts
  /** 字幕用テキスト（「話者: 本文」形式の行で構成） */
  script: string;
  /** お手本の会話（正しい言い回し）。ナレーター行は入れない想定（UI側で付与） */
  modelScript?: string;

  // learning aides
  highlights: readonly string[];
  quizzes: readonly Quiz[];

  /** ISO8601 string (new Date().toISOString()) */
  updatedAt: string;
};
