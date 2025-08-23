// src/lib/sampleScene.ts
import { Scene } from "./types";

export const sampleScene: Scene = {
  id: "scene-001",
  title: "営業部での敬語の使い方",
  description: "営業の現場でよく使われる敬語表現を実践的なシチュエーションで学びます。お客様との会話や社内でのやり取りで必要な表現を身に付けましょう。",
  audioUrl: '/api/tts?text=' + encodeURIComponent(`
    ビジネスシーンで本格的な営業に入る前のワンシーンです。営業マンの芝田さんが取引先の部長と話をしています。芝田さんの受け答えが少しおかしいようですよ。
    え、芝田さんはゴルフはやるんですか?
    はい、やらせていただいてます。
    私もやるんですよ。先週、静岡のゴルフ場に行きましてね。
    そうなんですか。私は最近行けてなくて、大体100前後で回るんですが、コースによっては90くらい行く時もありまして、でも結局私はゴルフってコースとかスコア云々よりも誰と一緒にやるかで楽しいかどうかが決まると思うんですよね。
    お上手なんですね。
    いえ、そんなにうまくないんですよ。
    では仕事に移りましょう。資料などはありますか?
    はい、こちらが資料になります。
    ありがとうございます。
  `),
  lines: [
    {
      speaker: 'ナレーター',
      text: 'ビジネスシーンで本格的な営業に入る前のワンシーンです。営業マンの芝田さんが取引先の部長と話をしています。芝田さんの受け答えが少しおかしいようですよ。',
      timestamp: 0,
      vocabularySpotId: 'intro'
    },
    {
      speaker: '部長',
      text: 'え、芝田さんはゴルフはやるんですか?',
      timestamp: 12,
      vocabularySpotId: 'golf-question'
    },
    {
      speaker: '芝田さん',
      text: 'はい、やらせていただいてます。',
      timestamp: 16,
      vocabularySpotId: 'tashinamu',
      improvementPointId: 'incorrect-keigo-usage'
    },
    {
      speaker: '部長',
      text: '私もやるんですよ。先週、静岡のゴルフ場に行きましてね。',
      timestamp: 20,
      vocabularySpotId: 'golf-story'
    },
    {
      speaker: '芝田さん',
      text: 'そうなんですか。私は最近行けてなくて、大体100前後で回るんですが、コースによっては90くらい行く時もありまして、でも結局私はゴルフってコースとかスコア云々よりも誰と一緒にやるかで楽しいかどうかが決まると思うんですよね。',
      timestamp: 26,
      vocabularySpotId: 'sashitsukae-nakereba',
      improvementPointId: 'long-monologue'
    },
    {
      speaker: '部長',
      text: 'お上手なんですね。',
      timestamp: 40,
      vocabularySpotId: 'compliment'
    },
    {
      speaker: '芝田さん',
      text: 'いえ、そんなにうまくないんですよ。',
      timestamp: 43,
      vocabularySpotId: 'tondemogozaimasen',
      improvementPointId: 'casual-modesty'
    },
    {
      speaker: '部長',
      text: 'では仕事に移りましょう。資料などはありますか?',
      timestamp: 47,
      vocabularySpotId: 'business-transition'
    },
    {
      speaker: '芝田さん',
      text: 'はい、こちらが資料になります。',
      timestamp: 52,
      vocabularySpotId: 'degozaimasu',
      improvementPointId: 'incorrect-becomes'
    },
    {
      speaker: '部長',
      text: 'ありがとうございます。',
      timestamp: 55,
      vocabularySpotId: 'thanks'
    }
  ],



  // 語彙学習スポット（新しい語彙・表現を覚える）
  vocabularySpots: [
    {
      id: 'tashinamu',
      word: '嗜む',
      reading: 'たしなむ',
      meaning: '趣味や習い事をほどよく楽しむ',
      explanation: '自分の趣味について謙虚に表現する際に使用する上品な表現です。「やっています」よりも洗練された印象を与えます。',
      usage: '「ゴルフを少し嗜んでおります」のように使用',
      lineIndex: 2
    },
    {
      id: 'sashitsukae-nakereba',
      word: '差し支えなければ',
      reading: 'さしつかえなければ',
      meaning: '相手に無理がなければ、という配慮の言葉',
      explanation: '質問をする前の丁寧な前置きとして使用し、相手への配慮を示す表現です。',
      usage: '「差し支えなければ、どちらのコースでしたか？」のように使用',
      lineIndex: 4
    },
    {
      id: 'tondemogozaimasen',
      word: 'とんでもございません',
      reading: 'とんでもございません',
      meaning: '褒められた時の謙遜表現',
      explanation: '相手からの褒め言葉に対して謙虚に応える際の丁寧な表現です。',
      usage: '「お上手なんですね」→「とんでもございません。まだまだでして。」',
      lineIndex: 6
    },
    {
      id: 'degozaimasu',
      word: 'でございます',
      reading: 'でございます',
      meaning: '物や状態を丁寧に紹介する表現',
      explanation: '完成している物を紹介する際の正しい丁寧語です。「になります」は変化を表すため不適切。',
      usage: '「こちらが資料でございます」のように使用',
      lineIndex: 8
    }
  ],

  // 改善ポイント（会話の問題点と改善方法を学ぶ）
  improvementPoints: [
    {
      id: 'incorrect-keigo-usage',
      issue: '不適切な「させていただく」の使用',
      problemDescription: '相手の許可や依頼がない自己の行為に「させていただく」を使用している',
      improvement: '自己の行為には「いたします」系統、趣味については「嗜む」を使用',
      betterExpression: 'はい、少し嗜んでおります',
      explanation: 'ゴルフを趣味で行うのは自分の意志による行為で、相手の許可を前提としません。「させていただく」は相手の許可・依頼が前提の場面でのみ使用します。',
      lineIndex: 2
    },
    {
      id: 'long-monologue',
      issue: '長すぎる一方的な返答',
      problemDescription: '相手の話題に対して一方的に長く話し続け、会話のキャッチボールができていない',
      improvement: '相手の話題には具体的な質問で返して会話を広げる',
      betterExpression: '差し支えなければ、静岡のどちらのコースでしたか？',
      explanation: 'ビジネス会話では相手の話題に対して簡潔に返し、質問で相手に話を振ると自然な会話になります。',
      lineIndex: 4
    },
    {
      id: 'casual-modesty',
      issue: 'カジュアルすぎる謙遜表現',
      problemDescription: 'ビジネスシーンで「そんなにうまくないんですよ」は砕けすぎている',
      improvement: '丁寧語・謙譲語を使った謙遜表現を使用',
      betterExpression: 'とんでもございません。まだまだでして',
      explanation: 'ビジネスシーンでは相手からの褒め言葉に対して丁寧な謙遜表現で応えることが適切です。',
      lineIndex: 6
    },
    {
      id: 'incorrect-becomes',
      issue: '物の紹介での「になります」誤用',
      problemDescription: '完成している物の紹介に変化を表す「になります」を使用している',
      improvement: '物の紹介は「でございます」を使用',
      betterExpression: 'こちらが資料でございます',
      explanation: '「になります」は変化を表す表現のため、既に完成している資料の紹介には不適切です。物の紹介は「でございます」が正しい表現です。',
      lineIndex: 8
    }
  ],

  
  quizzes: [
    {
      id: "q1",
      question: "「ゴルフはやるんですか？」と聞かれたときの適切な返しは？",
      options: [
        "はい、やらせていただいてます。",
        "はい、少したしなんでおります。",
        "はい、やってます。"
      ],
      correctAnswer: 1,
      explanation: "相手の許可を前提としない自己の行為には謙譲の「させていただく」は不自然。ここは「たしなんでおります」が適切です。",
      vocabulary: {
        word: "嗜む",
        reading: "たしなむ",
        meaning: "趣味や習い事をほどよく楽しむ",
        usage: "「下手くそです」よりもスマートな表現"
      }
    },
    {
      id: "q2",
      question: "部長が「先週コースに行った」と言った直後の良い返しは？",
      options: [
        "私は最近100前後で回ります。",
        "差し支えなければ、どちらのコースでしたか？",
        "へぇ、すごいですね！"
      ],
      correctAnswer: 1,
      explanation: "相手の話題を深掘りする質問で返すと、会話が自然に広がります。「差し支えなければ」で相手への配慮も示せます。",
      vocabulary: {
        word: "差し支えなければ",
        reading: "さしつかえなければ",
        meaning: "相手に無理がなければ、という配慮の言葉",
        usage: "質問する前の丁寧な前置きとして使用"
      }
    },
    {
      id: "q3",
      question: "部長に「お上手なんですね」と褒められた時の適切な返しは？",
      options: [
        "いえ、そんなにうまくないんですよ。",
        "ありがとうございます。",
        "いえ、とんでもございません。まだまだでして。"
      ],
      correctAnswer: 2,
      explanation: "褒められた時は謙遜しつつも丁寧に対応します。「とんでもございません」は謙遜表現として最適です。",
      vocabulary: {
        word: "とんでもございません",
        reading: "とんでもございません",
        meaning: "褒められた時の謙遜表現",
        usage: "「とんでもないです」よりも丁寧で、ビジネスに適している"
      }
    }
  ],

  // 改善版会話データ（お手本用）
  modelVersion: {
    lines: [
      {
        speaker: 'ナレーター',
        text: 'ではお手本の会話です。クイズで学んだポイントを活かした改善版をご覧ください。',
        timestamp: 0
      },
      {
        speaker: '部長',
        text: 'え、芝田さんはゴルフはやるんですか?',
        timestamp: 6
      },
      {
        speaker: '芝田さん',
        text: 'はい、少したしなんでおります。',
        timestamp: 10
      },
      {
        speaker: '部長',
        text: '私もやるんですよ。先週、静岡のゴルフ場に行きましてね。',
        timestamp: 14
      },
      {
        speaker: '芝田さん',
        text: 'そうでいらっしゃいますか。差し支えなければ、静岡のどちらのコースでしたか？',
        timestamp: 20
      },
      {
        speaker: '部長',
        text: '富士平原ゴルフクラブですよ。景色が最高でした。',
        timestamp: 28
      },
      {
        speaker: '芝田さん',
        text: '素晴らしいコースですね。最近はどのくらいの頻度で回られていますか？',
        timestamp: 34
      },
      {
        speaker: '部長',
        text: '月に2回くらいですかね。芝田さんはお上手なんですね。',
        timestamp: 42
      },
      {
        speaker: '芝田さん',
        text: 'いえ、とんでもございません。まだまだでして。',
        timestamp: 48
      },
      {
        speaker: '部長',
        text: 'では仕事に移りましょう。資料などはありますか?',
        timestamp: 53
      },
      {
        speaker: '芝田さん',
        text: 'はい、こちらが資料でございます。どうぞご覧ください。',
        timestamp: 58
      },
      {
        speaker: '部長',
        text: 'ありがとうございます。',
        timestamp: 63
      }
    ],
    learningPoints: [
      "自己の行為は「〜いたします」が基本。『させていただく』は相手の許可・依頼が前提の場面で用いる表現です。例：『確認いたします』『嗜む程度です』。",
      "相手の話題には具体的な質問で返すと会話が自然に広がります。例：『静岡のどちらのコースでしたか？』『最近はどのくらい回られていますか？』。",
      "手渡しは『こちらが資料でございます。どうぞご覧ください。』が丁寧で自然。「〜になります」は完成品の提示では避けると好印象。"
    ]
  },

  // メタデータ
  metadata: {
    businessContext: "営業・顧客対応",
    difficultyLevel: 2,
    tags: ["敬語", "営業", "ゴルフ", "雑談", "資料提示"],
    voiceMapping: {
      '部長': 'alloy',
      '芝田さん': 'nova',
      'ナレーター': 'sage'
    }
  }
};