// src/app/api/tts-elevenlabs/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// ElevenLabs日本語対応音声ID（実際のIDは取得後に更新必要）
const ELEVENLABS_VOICES = {
  // 男性音声
  "male1": "pNInz6obpgDQGcFmaJgB", // Adam (英語ベース、多言語対応)
  "male2": "VR6AewLTigWG4xSOukaG", // Arnold (英語ベース、多言語対応)
  "male3": "ErXwobaYiN019PkySvjV", // Antoni (英語ベース、多言語対応)
  
  // 女性音声  
  "female1": "EXAVITQu4vr4xnSDxMaL", // Bella (英語ベース、多言語対応)
  "female2": "AZnzlk1XvdvUeBnXmlld", // Elli (英語ベース、多言語対応)
  "female3": "MF3mGyEYCl7XYWbV9V6O", // Elli (英語ベース、多言語対応)
  
  // ナレーター用
  "narrator": "pNInz6obpgDQGcFmaJgB", // Adam (落ち着いた男性声)
} as const;

const RequestSchema = z.object({
  text: z.string().min(1).max(5000), // ElevenLabsの制限に合わせる
  voice: z.string().default("female1"),
  format: z.enum(["mp3", "wav"]).default("mp3"),
  model: z.enum(["eleven_multilingual_v2", "eleven_turbo_v2"]).default("eleven_multilingual_v2"),
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
};

async function etagFor(input: unknown) {
  const data = new TextEncoder().encode(JSON.stringify(input));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `"${hex}"`;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing ELEVENLABS_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // 入力検証
    const json = await req.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", issues: parsed.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const { text, voice, format, model } = parsed.data;
    
    // 音声IDマッピング
    const voiceId = ELEVENLABS_VOICES[voice as keyof typeof ELEVENLABS_VOICES] || ELEVENLABS_VOICES.female1;

    // ETag計算
    const inputSignature = { text, voice, format, model };
    const etag = await etagFor(inputSignature);
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          ...CORS_HEADERS,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // ElevenLabs API呼び出し
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          },
          output_format: format === "mp3" ? "mp3_44100_128" : "pcm_44100"
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ElevenLabs TTS Error]", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API Error: ${response.status}` }),
        { status: response.status, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    const contentType = format === "mp3" ? "audio/mpeg" : "audio/wav";
    const filename = `elevenlabs-${voice}.${format}`;

    return new Response(buffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        ETag: etag,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });

  } catch (err: unknown) {
    if ((err as any)?.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "ElevenLabs TTS timeout" }),
        { status: 504, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const message = (err as any)?.message ?? "ElevenLabs TTS Error";
    console.error("[/api/tts-elevenlabs] error", message);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}