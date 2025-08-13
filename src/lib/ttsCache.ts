// src/lib/ttsCache.ts
import { get, set } from "idb-keyval";

// 文字列 → 安全なキー（SHA-256）。secure context でなければ軽量ハッシュにフォールバック
export async function ttsKey(text: string, voice: string, format: string) {
  const input = `${voice}|${format}|${text.normalize()}`;

  // secure context（localhost/https）なら WebCrypto を使う
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest("SHA-256", data);
    const hex = [...new Uint8Array(buf)]
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return `tts:${hex}`;
  }

  // ← ここが追加：非セキュア環境（192.168... の http など）は軽量ハッシュ（djb2）
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  // 正規化：符号なし16進
  return `tts:${(h >>> 0).toString(16)}`;
}

export async function getTTSFromCache(key: string): Promise<ArrayBuffer | null> {
  const buf = await get<ArrayBuffer>(key);
  return buf ?? null;
}

export async function putTTSIntoCache(key: string, buf: ArrayBuffer) {
  await set(key, buf);
}
