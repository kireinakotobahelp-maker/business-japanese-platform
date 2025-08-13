// src/app/api/tts/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs"; // EdgeではなくNodeで

// ---- 設定（必要に応じてUI側と同期） ----
const MODEL = "gpt-4o-mini-tts" as const;
const ALLOWED_VOICES = [
  "alloy", "verse", "aria", "sage", "nova", "ash", "coral",
] as const;

const FORMAT_CONTENT_TYPE: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  opus: "audio/ogg",         // OpenAIはopusをogg包で返す
  pcm: "audio/wave;codec=1", // 16-bit PCM (必要に応じて変更)
};

const RequestSchema = z.object({
  text: z.string().min(1).max(10_000), // 長文は分割推奨
  voice: z.enum(ALLOWED_VOICES).default("alloy"),
  format: z.enum(["mp3", "wav", "opus", "pcm"]).default("mp3"),
  // 余地: speakingRate, pitch など将来拡張
});

// ---- 共通: CORS ----
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // 必要に応じて限定
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
};

// ---- ユーティリティ: ETag（入力ハッシュ） ----
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
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // 入力取得 & 検証
    const json = await req.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", issues: parsed.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const { text, voice, format } = parsed.data;

    // ETag: 同一入力は304で省エネ
    const inputSignature = { MODEL, text, voice, format };
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

    // タイムアウト（例: 25秒）
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25_000);

    // OpenAIクライアント
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // TTS リクエスト
    const tts = await client.audio.speech.create(
      {
        model: MODEL,
        voice,
        input: text,
        format, // "mp3" | "wav" | "opus" | "pcm"
      },
      { signal: controller.signal }
    );

    clearTimeout(t);

    const arrayBuffer = await tts.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = FORMAT_CONTENT_TYPE[format] ?? "application/octet-stream";
    const filenameSafeVoice = voice.replace(/[^a-z0-9_-]/gi, "");
    const filename = `tts-${filenameSafeVoice}.${format}`;

    return new Response(buffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        ETag: etag,
        // 音声は基本キャッシュOK（ETagで同一判定）
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    // タイムアウト or Abort
    if (err?.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Upstream timeout from TTS" }),
        { status: 504, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // OpenAI APIエラーかもしれないので簡易整形
    const message =
      err?.response?.data?.error?.message ??
      err?.message ??
      "TTS Error";
    console.error("[/api/tts] error", message);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}
