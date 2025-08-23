import { Scene } from './types'
import { sampleScene } from './sampleScene'
import { onlineMeetingScene } from './onlineMeetingScene'

export interface ContentSet {
  id: string
  title: string
  description: string
  category: 'business' | 'daily' | 'formal'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  scenes: Scene[]
  estimatedTime: string
  keySkills: string[]
}

export const contentSets: ContentSet[] = [
  {
    id: 'sales-department-keigo',
    title: '営業部での敬語の使い方',
    description: '営業の現場でよく使われる敬語表現を実践的なシチュエーションで学びます。お客様との会話や社内でのやり取りで必要な表現を身に付けましょう。',
    category: 'business',
    difficulty: 'intermediate',
    scenes: [sampleScene],
    estimatedTime: '15-20分',
    keySkills: ['営業敬語', '顧客対応', '社内コミュニケーション', '丁寧語・尊敬語・謙譲語']
  },
  {
    id: 'online-meeting-keigo',
    title: 'オンライン会議での効果的なコミュニケーション',
    description: 'オンライン会議で自然かつ効果的にコミュニケーションするためのスキルを学びます。相手との距離感を縮め、建設的な議論ができる実践的な表現力を身に付けましょう。',
    category: 'business',
    difficulty: 'intermediate',
    scenes: [onlineMeetingScene],
    estimatedTime: '15-20分',
    keySkills: ['自然な会話術', '協調的コミュニケーション', '技術的配慮', '建設的議論スキル']
  }
]

export const getContentSetById = (id: string): ContentSet | undefined => {
  return contentSets.find(set => set.id === id)
}

export const getSceneById = (contentSetId: string, sceneId: string): Scene | undefined => {
  const contentSet = getContentSetById(contentSetId)
  if (!contentSet) return undefined
  
  return contentSet.scenes.find(scene => scene.id === sceneId)
}

export const getAllScenes = (): Scene[] => {
  return contentSets.flatMap(set => set.scenes)
}