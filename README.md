# Business Japanese Learning Platform

## プロジェクト概要
- **名前**: Business Japanese Learning Platform
- **目標**: AI音声技術を活用したビジネス日本語学習プラットフォーム
- **特徴**: 
  - 語彙学習（語彙スポット）と会話改善（改善ポイント）の分離
  - デュアルTTSプロバイダー：OpenAI TTS & ElevenLabs（高品質日本語音声）
  - 練習モードとお手本モード
  - スティッキー音声コントロールとリアルタイム進捗追跡

## 本番URL
- **開発環境**: https://3000-i62mlxdyjpkxkkzheguky-6532622b.e2b.dev
- **GitHub**: https://github.com/kireinakotobahelp-maker/business-japanese-platform

## 主な機能

### 🎙️ 高品質音声生成
- **ElevenLabs TTS**: 自然な多言語音声（日本語推奨、デフォルト）
- **OpenAI TTS**: 高速フォールバック対応
- 話者別音声マッピング（男性・女性・ナレーター）
- リアルタイム音声生成とキャッシュ機能

### 📚 分離された学習システム
- **語彙スポット** (`vocabularySpots`): 新しい語彙・表現の学習
- **改善ポイント** (`improvementPoints`): 会話問題の特定と解決策
- **お手本バージョン** (`modelVersion`): 改善された対話例

### 📱 現代的UI/UX
- スティッキー音声コントロール（スクロール中も操作可能）
- デフォルト折りたたみ状態（学習要素）
- レスポンシブデザイン（デスクトップ・モバイル）
- リアルタイム会話ハイライト

## データアーキテクチャ

### メインデータモデル
```typescript
Scene {
  lines: ScriptLine[]                    // メイン会話データ
  vocabularySpots?: VocabularySpot[]     // 語彙学習スポット
  improvementPoints?: ImprovementPoint[] // 会話改善ポイント
  modelVersion?: {                       // お手本バージョン
    lines: ScriptLine[]
    learningPoints: string[]
  }
}
```

### TTS統合アーキテクチャ
- **AudioEngine**: 統一された音声処理クラス（400+行の重複コード削減）
- **プロバイダー**: ElevenLabs（デフォルト）+ OpenAI（フォールバック）
- **音声マッピング**: 話者名 → 音声ID の自動変換

### APIエンドポイント
- `/api/tts-elevenlabs` - ElevenLabs高品質TTS（日本語対応）
- `/api/tts` - OpenAI TTS（レガシー・フォールバック）

## 環境変数設定

```bash
# ElevenLabs API（日本語音声推奨）
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# OpenAI API（フォールバック）
OPENAI_API_KEY=your_openai_api_key

# Next.js環境設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 開発ガイド

### セットアップ
```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local

# ビルド & 開発サーバー起動
npm run build
pm2 start ecosystem.config.cjs
```

### プロジェクト構造
```
webapp/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── tts/              # OpenAI TTS API
│   │   │   └── tts-elevenlabs/   # ElevenLabs TTS API
│   │   ├── content/[contentSetId]/
│   │   │   ├── page.tsx          # 練習モード
│   │   │   ├── model/page.tsx    # お手本モード
│   │   │   └── summary/page.tsx  # 要約ページ
│   ├── components/
│   │   └── ScenePlayerUI.tsx     # メイン音声プレイヤー
│   ├── lib/
│   │   ├── audioEngine.ts        # 統合音声処理エンジン
│   │   ├── config.ts             # アプリ設定管理
│   │   ├── types.ts              # TypeScript型定義
│   │   └── *.ts                  # シーンデータファイル
└── ecosystem.config.cjs          # PM2設定
```

## ユーザーガイド

### 学習モード
1. **練習モード** (`/content/[id]`): 
   - 会話の改善ポイントを特定
   - 問題のある表現と改善方法を学習

2. **お手本モード** (`/content/[id]/model`):
   - 語彙スポットで新しい表現を学習
   - 改善された対話例を音声で確認

### 音声コントロール
- **スティッキーコントロール**: スクロール中も操作可能
- **リアルタイム進捗**: 会話進行状況の視覚的表示
- **速度調整**: 学習レベルに応じた再生速度

## 技術スタック
- **フレームワーク**: Next.js 15 + TypeScript
- **スタイリング**: TailwindCSS
- **音声生成**: ElevenLabs TTS + OpenAI TTS
- **音声処理**: Web Audio API + OfflineAudioContext
- **プロセス管理**: PM2
- **バージョン管理**: Git + GitHub

## デプロイメント
- **プラットフォーム**: Next.js 15 with App Router
- **状態**: ✅ アクティブ（開発環境）
- **最終更新**: 2025-01-08

## 完了済み機能
✅ ElevenLabs TTS統合  
✅ 語彙学習と改善ポイントの分離  
✅ スティッキー音声コントロール  
✅ AudioEngine統合クラス  
✅ デュアルTTSプロバイダー対応  
✅ お手本モード実装  

## 今後の拡張予定
- [ ] ユーザー進捗管理
- [ ] カスタムシナリオ作成
- [ ] リアルタイム発音評価
- [ ] 学習履歴ダッシュボード

---
**開発者**: AI Assistant  
**プロジェクトマネージャー**: 芝田信晃さん  
**最終更新日**: 2025年1月8日