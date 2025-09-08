// src/lib/config.ts
/**
 * アプリケーション設定
 */

export type TTSProvider = "openai" | "elevenlabs";

export const AppConfig = {
  // TTS設定
  tts: {
    // デフォルトプロバイダー（ElevenLabs推奨）
    defaultProvider: "elevenlabs" as TTSProvider,
    
    // プロバイダー別設定
    providers: {
      openai: {
        model: "tts-1",
        format: "mp3",
        timeout: 25000,
      },
      elevenlabs: {
        model: "eleven_multilingual_v2",
        format: "mp3",
        timeout: 30000,
        voiceSettings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
      },
    },
  },

  // 音声処理設定
  audio: {
    sampleRate: 24000,
    gapSeconds: 0.35,
    concurrency: 5, // 並列処理数
  },

  // UI設定
  ui: {
    defaultCollapsed: true, // 学習要素のデフォルト状態
    stickyControls: true,   // スティッキー音声コントロール
  },
} as const;

// 環境変数チェック
export function validateApiKeys(): {
  openai: boolean;
  elevenlabs: boolean;
  recommendations: string[];
} {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY;
  
  const recommendations: string[] = [];
  
  if (!hasElevenLabs && !hasOpenAI) {
    recommendations.push("TTSを利用するにはOpenAIまたはElevenLabsのAPIキーが必要です");
  } else if (!hasElevenLabs) {
    recommendations.push("より自然な日本語音声のためにElevenLabsのAPIキーの設定を推奨します");
  }
  
  return {
    openai: hasOpenAI,
    elevenlabs: hasElevenLabs,
    recommendations,
  };
}