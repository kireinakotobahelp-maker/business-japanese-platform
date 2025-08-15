import type { Scene } from "./types";
import { sampleScene } from "./sampleScene";   // scene-001
import { scene002 } from "./scene-002";        // 会議の時間変更を上司にお願いする
import { scene003 } from "./scene-003";        // 納期遅延の連絡（取引先へ）

export const scenes: Scene[] = [sampleScene, scene002, scene003];

export function getSceneById(id: string): Scene | undefined {
  return scenes.find(s => s.id === id);
}
