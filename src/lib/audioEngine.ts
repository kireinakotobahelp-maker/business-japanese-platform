// src/lib/audioEngine.ts
/**
 * 音声処理の共通ロジックを提供するAudioEngine
 * page.tsxとmodel/page.tsxの重複コードを統合
 */

import { Scene, ScriptLine, TTSSegment, TTSOptions, AudioResult, Voice } from './types';

// ナレーター表記ゆれ吸収
const NARRATOR_RE = /(ナレーター|ナレータ|解説者|narrator)/i;

// デフォルトの話者→ボイスマッピング
const DEFAULT_VOICE_MAPPING: Record<string, Voice> = {
  '部長': 'alloy',
  '上司': 'alloy', 
  '司会': 'alloy',
  '山田': 'alloy',
  '芝田': 'nova',
  '芝田さん': 'nova',
  '営業': 'nova',
  '田中': 'nova',
  '佐藤': 'nova',
  'ナレーター': 'sage',
  '解説者': 'sage',
  'narrator': 'sage'
};

// 話者→ボイス決定ロジック
function voiceOf(speaker: string, customMapping?: Record<string, Voice>): Voice {
  const mapping = { ...DEFAULT_VOICE_MAPPING, ...customMapping };
  
  // 完全一致を最初に試す
  if (mapping[speaker]) {
    return mapping[speaker];
  }
  
  // パターンマッチング（後方互換性）
  if (NARRATOR_RE.test(speaker)) return 'sage';
  if (/^(部長|上司|司会|山田)/.test(speaker)) return 'alloy';
  if (/^(芝田|芝田さん|営業|田中|佐藤)/.test(speaker)) return 'nova';
  
  return 'sage'; // デフォルト
}

// AudioBuffer → WAV Blob（16bit PCM, mono）
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numCh = 1, sr = buffer.sampleRate;
  const length = buffer.length * numCh * 2 + 44;
  const ab = new ArrayBuffer(length); 
  const view = new DataView(ab);
  let off = 0;
  
  const ws = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); 
    off += s.length;
  };
  const u32 = (d: number) => { view.setUint32(off, d, true); off += 4; };
  const u16 = (d: number) => { view.setUint16(off, d, true); off += 2; };
  
  ws("RIFF"); u32(length - 8); ws("WAVE"); ws("fmt "); u32(16); u16(1); u16(numCh);
  u32(sr); u32(sr * numCh * 2); u16(numCh * 2); u16(16); ws("data"); u32(buffer.length * numCh * 2);
  
  const ch = buffer.getChannelData(0);
  for (let i = 0; i < ch.length; i++) { 
    const s = Math.max(-1, Math.min(1, ch[i])); 
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); 
    off += 2; 
  }
  
  return new Blob([view], { type: "audio/wav" });
}

// 連続する同一話者を結合（API回数を減らす）
function coalesceSegments<T extends { speaker: string; text: string; lineIndex: number }>(segs: T[]): T[] {
  const out: T[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && last.speaker === s.speaker) {
      last.text = `${last.text} ${s.text}`;
    } else {
      out.push({ ...s });
    }
  }
  return out;
}

// 並列処理制御
async function asyncPool<T, R>(
  limit: number, 
  items: T[], 
  worker: (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const ret: R[] = new Array(items.length);
  let i = 0, active = 0;
  
  return await new Promise((resolve, reject) => {
    const kick = () => {
      if (i >= items.length) { 
        if (active === 0) resolve(ret); 
        return; 
      }
      const cur = i++; 
      active++;
      worker(items[cur], cur)
        .then(r => { ret[cur] = r; active--; kick(); })
        .catch(reject);
    };
    for (let k = 0; k < Math.min(limit, items.length); k++) kick();
  });
}

// /api/tts → decode（mp3推奨）
async function fetchDecodeSegment(
  ctx: AudioContext, 
  text: string, 
  voice: string, 
  format: "mp3" | "wav" = "mp3"
): Promise<AudioBuffer> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice, format }),
    });
    if (!res.ok) throw new Error(await res.text());
    const ab = await res.arrayBuffer();
    // Safari 対策で ab を複製して渡す
    return await ctx.decodeAudioData(ab.slice(0));
  } catch (error) {
    console.warn("segment decode failed, inserting silence:", error);
    // 1秒の無音を挿入して全体進行を維持
    const sr = Math.max(1, ctx.sampleRate || 24000);
    return ctx.createBuffer(1, Math.floor(sr * 1.0), sr);
  }
}

/**
 * AudioEngineメインクラス
 */
export class AudioEngine {
  /**
   * シーンから音声を生成
   */
  static async generateSceneAudio(
    scene: Scene, 
    options: TTSOptions = { mode: 'practice' }
  ): Promise<AudioResult> {
    const { mode, gapSeconds = 0.35, voiceMapping } = options;
    
    // TTSセグメントを構築
    const segments = this.buildTTSSegments(scene, mode);
    
    if (!segments.length) {
      throw new Error('No TTS segments to process');
    }

    // 同一話者を結合（API回数削減）
    const mergedSegs = coalesceSegments(segments);
    const mergedUiIndexes = mergedSegs.map(s => s.uiIndex);

    // AudioContext（24kHz優先）
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    const targetSR = 24000;
    let ctx: AudioContext;
    try {
      ctx = new AC({ sampleRate: targetSR });
    } catch {
      ctx = new AC();
    }

    // 並列でフェッチ＆デコード
    const decoded = await asyncPool(5, mergedSegs, async (seg) => {
      const voice = voiceOf(seg.speaker || "", voiceMapping || scene.metadata?.voiceMapping);
      return await fetchDecodeSegment(ctx, seg.text, voice, "mp3");
    });

    // 開始秒を計算
    const segmentStartsSec: number[] = [];
    let tSec = 0;
    for (const b of decoded) {
      segmentStartsSec.push(tSec);
      tSec += b.duration + gapSeconds;
    }

    // オフライン結合
    const totalDurationSec = decoded.reduce((s, b) => s + b.duration, 0) + 
                             gapSeconds * Math.max(0, decoded.length - 1);
    const totalFrames = Math.ceil(totalDurationSec * targetSR);
    const offline = new OfflineAudioContext(1, totalFrames, targetSR);

    let cursorSec = 0;
    for (const b of decoded) {
      const mono = offline.createBuffer(1, b.length, b.sampleRate);
      mono.getChannelData(0).set(b.getChannelData(0));
      const src = offline.createBufferSource();
      src.buffer = mono;
      src.connect(offline.destination);
      src.start(cursorSec);
      cursorSec += b.duration + gapSeconds;
    }

    const rendered = await offline.startRendering();
    
    // WAV Blobを作成してURLを生成
    const url = URL.createObjectURL(audioBufferToWavBlob(rendered));

    return {
      audioURL: url,
      duration: rendered.duration,
      segmentStartsSec,
      mergedUiIndexes
    };
  }

  /**
   * シーンからTTSセグメントを構築
   */
  static buildTTSSegments(scene: Scene, mode: 'practice' | 'model'): TTSSegment[] {
    const segments: TTSSegment[] = [];
    
    if (mode === 'practice') {
      // 練習モード: 元のlines配列を使用
      scene.lines.forEach((line, index) => {
        segments.push({
          speaker: line.speaker,
          text: line.text,
          lineIndex: index,
          uiIndex: index
        });
      });
    } else if (mode === 'model' && scene.modelVersion) {
      // お手本モード: modelVersionのlines配列を使用
      scene.modelVersion.lines.forEach((line, index) => {
        segments.push({
          speaker: line.speaker,
          text: line.text,
          lineIndex: index,
          uiIndex: index
        });
      });
      
      // 学習ポイントの要約を追加
      if (scene.modelVersion.learningPoints.length > 0) {
        const summary = this.buildNarratorSummary(scene.modelVersion.learningPoints);
        segments.push({
          speaker: 'ナレーター',
          text: summary,
          lineIndex: segments.length,
          uiIndex: Math.max(0, segments.length - 1)
        });
      }
    }
    
    return segments;
  }

  /**
   * 学習ポイントから要約ナレーションを生成
   */
  static buildNarratorSummary(points: string[]): string {
    const safe = (i: number) => (points[i] ?? "").replace(/^[\d\.\s•]+/, "");
    
    return `本日のポイントは三つです。` +
           `第一に、${safe(0)} ` +
           `第二に、${safe(1)} ` +
           `第三に、${safe(2)} ` +
           `どれも明日からすぐ実践できる表現です。` +
           `全部を完璧にではなく、まずはどれか一つだけ試してみましょう。` +
           `うまくいかない瞬間も糧になります。小さな修正の積み重ねが、言葉の印象を確実に変えていきます。` +
           `お疲れ様でした。また次回、一緒に練習しましょう。`;
  }

  /**
   * 最初のダイアログ行のインデックスを取得（ナレーター以外）
   */
  static getFirstDialogIndex(lines: ScriptLine[]): number {
    for (let i = 0; i < lines.length; i++) {
      if (!NARRATOR_RE.test(lines[i].speaker)) return i;
    }
    return 0;
  }
}