import { Scene } from './types'

export const onlineMeetingScene: Scene = {
  id: 'online-meeting-1',
  title: 'オンライン会議での効果的なコミュニケーション',
  description: 'オンライン会議で自然かつ効果的にコミュニケーションするための実践的なスキルを学びます。相手との距離感を縮め、建設的な議論ができる表現力を身に付けましょう。',
  audioUrl: '',
  lines: [
    {
      speaker: 'ナレーター',
      text: 'オンライン会議でのコミュニケーションを学びます。芝田さんのやり取りに注目してください。',
      timestamp: 0
    },
    {
      speaker: '山田（司会）',
      text: 'それでは時間になりましたので始めます。田中さん、プロジェクトの件、どうなってますか？',
      timestamp: 5,
      vocabularySpotId: 'kichou-na-ojikan',
      improvementPointId: 'abrupt-meeting-start'
    },
    {
      speaker: '田中',
      text: 'ちょっと待ってください。画面共有します。見えてますか？',
      timestamp: 12,
      vocabularySpotId: 'shousu-omachi-kudasai',
      improvementPointId: 'casual-waiting-request'
    },
    {
      speaker: '佐藤',
      text: '見えてます。で、これはどういうことですか？',
      timestamp: 18
    },
    {
      speaker: '田中',
      text: 'ええと、実は問題があって...皆さんのお知恵をお借りできればと思います。',
      timestamp: 24
    },
    {
      speaker: '芝田',
      text: 'うーん、そういうのは前にもあったよね。とりあえず何かやってみればいいんじゃない？',
      timestamp: 32,
      vocabularySpotId: 'watashi-no-keiken-dewa',
      improvementPointId: 'vague-irresponsible-advice'
    },
    {
      speaker: '佐藤',
      text: 'そうですね。まずは試してみましょう。',
      timestamp: 39
    },
    {
      speaker: '芝田',
      text: '何か音が小さくないですか？聞こえません。',
      timestamp: 43,
      vocabularySpotId: 'onsei-ga-kikoeniku',
      improvementPointId: 'direct-technical-complaint'
    },
    {
      speaker: '田中',
      text: 'すみません、マイクを調整します。それでは、この件は来週までに検討してご報告いたします。',
      timestamp: 49
    },
    {
      speaker: '山田（司会）',
      text: 'ありがとうございます。それでは今日はここまでとしましょう。お疲れさまでした。',
      timestamp: 56
    }
  ],
  // 語彙学習スポット（新しい語彙・表現を覚える）
  vocabularySpots: [
    {
      id: 'kichou-na-ojikan',
      word: '貴重なお時間',
      reading: 'きちょうなおじかん',
      meaning: '相手の時間を大切なものとして敬う表現',
      explanation: '会議開始時に参加者への感謝を示す丁寧な表現です。相手への配慮と尊重を示します。',
      usage: '「貴重なお時間をありがとうございます」のように使用',
      lineIndex: 1
    },
    {
      id: 'shousu-omachi-kudasai',
      word: '少々お待ちください',
      reading: 'しょうしょうおまちください',
      meaning: '相手に待機をお願いする丁寧な表現',
      explanation: 'ビジネス場面で相手に少し待ってもらう際の適切な表現です。「ちょっと」よりも丁寧。',
      usage: '「画面共有いたしますので、少々お待ちください」のように使用',
      lineIndex: 2
    },
    {
      id: 'watashi-no-keiken-dewa',
      word: '私の経験では',
      reading: 'わたしのけいけんでは',
      meaning: '自分の体験を謙虚に共有する際の前置き',
      explanation: '意見を押し付けるのではなく、経験という形で貢献する姿勢を示す表現です。',
      usage: '「私の経験では、段階的なアプローチが効果的だと思います」のように使用',
      lineIndex: 5
    },
    {
      id: 'onsei-ga-kikoeniku',
      word: '音声が聞こえにくいようですが',
      reading: 'おんせいがきこえにくいようですが',
      meaning: '技術的問題を穏やかに指摘する配慮ある表現',
      explanation: '相手を責めることなく、技術的な問題を指摘する際の丁寧な表現です。',
      usage: '「音声が少し聞こえにくいようですが、大丈夫でしょうか？」のように使用',
      lineIndex: 7
    }
  ],

  // 改善ポイント（会話の問題点と改善方法を学ぶ）
  improvementPoints: [
    {
      id: 'abrupt-meeting-start',
      issue: '挨拶なしの直接的な質問',
      problemDescription: '会議開始時の挨拶もなく、いきなり「どうなってますか？」は相手に圧迫感を与える',
      improvement: '会議開始時は参加者への感謝を示してから丁寧に問いかける',
      betterExpression: '貴重なお時間をありがとうございます。進捗はいかがでしょう？',
      explanation: 'ビジネス会議では参加者への感謝と配慮ある問いかけが重要です。直接的すぎる質問は相手に圧迫感を与えます。',
      lineIndex: 1
    },
    {
      id: 'casual-waiting-request',
      issue: 'カジュアルすぎる待機依頼',
      problemDescription: '「ちょっと待ってください」はビジネス会議には砕けすぎている',
      improvement: '丁寧語を使用し、操作前には事前告知と確認を行う',
      betterExpression: '画面共有させていただきます。見えていますでしょうか？',
      explanation: 'ビジネス会議では「少々お待ちください」が適切。画面共有時は事前告知と確認が重要です。',
      lineIndex: 2
    },
    {
      id: 'vague-irresponsible-advice',
      issue: '曖昧で責任感のない提案',
      problemDescription: '「とりあえず何かやってみればいいんじゃない？」は具体性に欠け建設的でない',
      improvement: '経験に基づいた具体的で実現可能なアドバイスを提供',
      betterExpression: '私の経験では、段階的なアプローチが効果的だと思います',
      explanation: 'チームメンバーの課題に対しては、経験に基づいた具体的で建設的な提案が求められます。',
      lineIndex: 5
    },
    {
      id: 'direct-technical-complaint',
      issue: '技術的問題の直接的な指摘',
      problemDescription: '「音が小さくないですか？聞こえません」は相手を責めるような直接的な表現',
      improvement: '配慮ある表現で穏やかに技術的問題を指摘',
      betterExpression: '音声が少し聞こえにくいようですが、大丈夫でしょうか？',
      explanation: '技術的な問題の指摘は必要ですが、相手を責めるような表現は会議の雰囲気を悪化させます。',
      lineIndex: 7
    }
  ],
  quizzes: [
    {
      id: 'quiz-1',
      question: 'オンライン会議で相手の説明についてもっと詳しく知りたい時、最も自然で建設的な表現はどれですか？',
      options: [
        'よく分からないので、もう一度説明してください',
        'もう少し詳しく教えていただけませんか？',
        'その説明では不十分です',
        '詳細な説明をお願いします'
      ],
      correctAnswer: 1,
      explanation: '相手を尊重しながら追加情報を求める自然な表現です。「教えていただく」で謙譲の意を示し、「もう少し」で段階的なアプローチを表現しています。',
      vocabulary: {
        word: 'もう少し詳しく教えていただけませんか？',
        reading: 'もうすこしくわしくおしえていただけませんか',
        meaning: '建設的に追加情報を求める自然で丁寧な表現',
        usage: '相手の説明を深く理解したい際の協調的な質問'
      }
    },
    {
      id: 'quiz-2',
      question: 'チーム会議で自分の経験を共有する際、最も自然で受け入れられやすい前置きはどれですか？',
      options: [
        '私が正しいと思うのは',
        '私の経験では',
        '絶対にこうするべきです',
        '私の意見を言わせてもらいます'
      ],
      correctAnswer: 1,
      explanation: '自分の意見を押し付けるのではなく、経験という形で貢献する姿勢を示します。相手も受け入れやすく、建設的な議論につながります。',
      vocabulary: {
        word: '私の経験では',
        reading: 'わたしのけいけんでは',
        meaning: '自分の体験を自然に共有する際の謙虚な前置き',
        usage: '押し付けがましくなく、経験を共有して議論に貢献する表現'
      }
    },
    {
      id: 'quiz-3',
      question: 'オンライン会議で音声に問題がある時、最も配慮ある指摘の仕方はどれですか？',
      options: [
        '声が小さすぎます',
        '音声が少し聞こえにくいようですが',
        'マイクの調子が悪いですね',
        'もっと大きな声で話してください'
      ],
      correctAnswer: 1,
      explanation: '技術的な問題を相手を責めることなく、穏やかに指摘する配慮ある表現です。「ようですが」で推測の形にして、相手への配慮を示しています。',
      vocabulary: {
        word: '音声が少し聞こえにくいようですが',
        reading: 'おんせいがすこしきこえにくいようですが',
        meaning: 'オンライン会議の技術的問題を穏やかに指摘する配慮ある表現',
        usage: '相手を責めずに技術的な問題を指摘し、改善を促す際の表現'
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
        speaker: '山田（司会）',
        text: 'それでは始めさせていただきます。今日は貴重なお時間をありがとうございます。',
        timestamp: 6
      },
      {
        speaker: '山田（司会）',
        text: 'まず田中さん、新プロジェクトの進捗はいかがでしょう？',
        timestamp: 13
      },
      {
        speaker: '田中',
        text: 'ありがとうございます。画面共有させていただきますね。見えていますでしょうか？',
        timestamp: 19
      },
      {
        speaker: '佐藤',
        text: 'はい、拝見できています。',
        timestamp: 27
      },
      {
        speaker: '田中',
        text: '実は、ここで一つ課題がありまして...皆さんのお知恵をお借りできればと思います。',
        timestamp: 30
      },
      {
        speaker: '芝田',
        text: '私の経験では、段階的なアプローチが効果的だと思うのですが、いかがでしょうか？',
        timestamp: 38
      },
      {
        speaker: '佐藤',
        text: 'それは良いアイデアですね。具体的にはどのような手順をお考えですか？',
        timestamp: 47
      },
      {
        speaker: '芝田',
        text: 'まず小規模でテストしてから全体展開する、という流れはいかがでしょう？',
        timestamp: 55
      },
      {
        speaker: '田中',
        text: 'とても参考になります。そのアプローチで進めてみますね。',
        timestamp: 63
      },
      {
        speaker: '山田（司会）',
        text: '建設的なご議論をありがとうございました。他にお気づきの点はございますか？',
        timestamp: 69
      },
      {
        speaker: '参加者一同',
        text: '特にございません。ありがとうございました。',
        timestamp: 77
      }
    ],
    learningPoints: [
      "会議開始・終了時は「開始・終了させていただきます」が標準的。「させていただく」で相手への配慮を示す丁寧な表現です。",
      "画面共有などオンライン特有の操作前は必ず告知し、「見えていらっしゃいますか」で相手の状況を尊敬語で確認します。",
      "会議中の質問は「確認させていただきたいのですが」で前置きし、後日対応は「検討して後日ご連絡申し上げます」で約束します。"
    ]
  },

  // メタデータ
  metadata: {
    businessContext: "オンライン会議・チーム協業",
    difficultyLevel: 2,
    tags: ["会議運営", "オンライン", "チームワーク", "建設的議論", "技術配慮"],
    voiceMapping: {
      '山田（司会）': 'alloy',
      '山田': 'alloy',
      '司会': 'alloy',
      '田中': 'nova',
      '芝田': 'nova',
      '佐藤': 'nova',
      '参加者一同': 'nova',
      'ナレーター': 'sage'
    }
  }
}