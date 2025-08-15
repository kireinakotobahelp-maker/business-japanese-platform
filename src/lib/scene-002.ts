import { type Scene } from "./types";

export const scene002: Scene = {
  id: "scene-002",
  title: "会議の時間変更を上司にお願いする",
  category: "business",
  difficulty: "easy",
  relation: "上司×部下（依頼）",
  script: [
    { speaker: "self", text: "部長、今日の会議なんですけど、僕予定が入っちゃって、15時にずらしていいですか？" },
    { speaker: "boss", text: "急だね。理由は？" },
    { speaker: "self", text: "ちょっと別件が…すみません。無理ならいいです。" },
    { speaker: "boss", text: "分かったけど、参加者に連絡は？" },
    { speaker: "self", text: "誰かにやってもらえれば…お願いします。" },
  ],
  modelScript: [
    { speaker: "self", text: "部長、少しご相談させてください。本日の定例（14:30）ですが、先方対応が重なり、可能でしたら15:00開始に変更させていただけないでしょうか。" },
    { speaker: "boss", text: "理由は？" },
    { speaker: "self", text: "顧客側の緊急確認が14:00〜14:30に入りました。会議の目的・アジェンダは維持し、私から関係者へ一括連絡します。" },
    { speaker: "boss", text: "参加者連絡は任せるよ。" },
    { speaker: "self", text: "ありがとうございます。私の方で日程変更の案内と議事メモのフォーマットを共有します。" },
  ],
  highlights: [
    { startIdx: 0, endIdx: 0, note: "依頼は『結論→理由→代替案/影響最小化』の順。" },
    { startIdx: 2, endIdx: 2, note: "『無理ならいいです』は丸投げの印象。対応案（自分が連絡する等）を添える。" },
    { startIdx: 4, endIdx: 4, note: "“誰かに”ではなく“自分がやる”主体性を示す。" },
  ],
  quizzes: [
    {
      id: "q1",
      question: "上司への時間変更依頼の切り出しとして最適なのは？",
      choices: [
        { id: "a1", text: "今日ムリっぽいので15時でいいですか？", correct: false, explain: "理由・影響・代替が無く、口語が砕けすぎ。" },
        { id: "a2", text: "ご相談です。本日の14:30会議を、先方対応のため15:00開始へ変更させていただけないでしょうか。連絡は私から行います。", correct: true, explain: "結論→理由→代替案の順で丁寧。" },
        { id: "a3", text: "無理ならいいです。どっちでも。", correct: false, explain: "主体性の欠如。" }
      ]
    },
    {
      id: "q2",
      question: "“参加者連絡は？”への最も良い返答は？",
      choices: [
        { id: "b1", text: "誰かにお願いしたいです。", correct: false, explain: "丸投げ印象。" },
        { id: "b2", text: "私から一括で連絡し、議事メモも共有します。", correct: true, explain: "主体性＋影響最小化の提示。" },
        { id: "b3", text: "各自でお願いします。", correct: false, explain: "配慮不足。" }
      ]
    }
  ]
};
