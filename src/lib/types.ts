// src/lib/types.ts

// ====== Shared literal types ======
export type Category = "business" | "daily" | "formal";
export type Difficulty = "beginner" | "intermediate" | "advanced";

// TTS voices used across the app (keep in sync with voiceOf)
// ElevenLabsボイス + OpenAI互換性
export type Voice = 
  // ElevenLabsボイス
  | "male1" | "male2" | "male3" 
  | "female1" | "female2" | "female3" 
  | "narrator"
  // OpenAI互換性（自動変換される）
  | "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | "sage";

// ====== Quiz ======
export type QuizChoice = { id: string; text: string };

export type Quiz = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  // 語彙学習機能
  vocabulary?: {
    word: string;      // 語彙（例：「嗜む」）
    reading: string;   // 読み方（例：「たしなむ」）
    meaning: string;   // 意味（例：「専門的ではないが、日常的に楽しむ」）
    usage?: string;    // 使用例（例：「『下手くそです』よりスマート」）
  };
};

// ====== Scene ======
export type ScriptLine = {
  speaker: string;
  text: string;
  timestamp: number;
  vocabularySpotId?: string;      // 語彙スポットのID（任意）
  improvementPointId?: string;    // 改善ポイントのID（任意）
};

// 語彙学習用スポット（新しい語彙・表現を覚える）
export type VocabularySpot = {
  id: string;
  word: string;        // 語彙（例：「嗜む」）
  reading: string;     // 読み方（例：「たしなむ」）
  meaning: string;     // 意味（例：「趣味をほどよく楽しむ」）
  explanation: string; // 詳細説明
  usage?: string;      // 使用例（例：「『下手くそです』よりスマート」）
  lineIndex: number;   // 対応する台詞のインデックス
};

// 改善ポイント用スポット（会話の問題点と改善方法を学ぶ）
export type ImprovementPoint = {
  id: string;
  issue: string;           // 問題のある表現（例：「長すぎる返答」）
  problemDescription: string; // 何が問題なのか（例：「一方的に話しすぎて会話のキャッチボールができていない」）
  improvement: string;     // 改善方法（例：「相手の話題に具体的な質問で返す」）
  betterExpression?: string; // より良い表現例（例：「差し支えなければ、どちらのコースでしたか？」）
  explanation: string;     // 詳細説明
  lineIndex: number;       // 対応する台詞のインデックス
};

export type Scene = {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  
  // 新しい構造化された台詞データ
  lines: ScriptLine[];
  
  // 語彙学習スポット（新しい語彙・表現を学ぶ）
  vocabularySpots?: VocabularySpot[];
  
  // 改善ポイント（会話の問題点と改善方法を学ぶ）
  improvementPoints?: ImprovementPoint[];
  
  // クイズ
  quizzes: Quiz[];
  
  // 改善版会話データ（お手本用）
  modelVersion?: {
    lines: ScriptLine[];
    learningPoints: string[];
    summaryNarration?: string;
  };
  
  // メタデータ
  metadata?: {
    businessContext: string;
    difficultyLevel: number;
    tags: string[];
    voiceMapping?: Record<string, Voice>;
  };
};

// TTS処理用の共通型
export type TTSSegment = {
  speaker: string;
  text: string;
  lineIndex: number;
  uiIndex: number;
};

export type TTSOptions = {
  mode: 'practice' | 'model';
  gapSeconds?: number;
  voiceMapping?: Record<string, Voice>;
  ttsProvider?: 'openai' | 'elevenlabs';
};

export type AudioResult = {
  audioURL: string;
  duration: number;
  segmentStartsSec: number[];
  mergedUiIndexes: number[];
};
