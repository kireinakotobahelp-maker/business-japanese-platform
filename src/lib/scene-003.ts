import { type Scene } from "./types";

export const scene003: Scene = {
  id: "scene-003",
  title: "納期遅延の連絡（取引先へ）",
  category: "business",
  difficulty: "hard",
  relation: "ベンダー×顧客（謝罪・再提案）",
  script: [
    { speaker: "self", text: "すみません、ちょっと遅れます。社内調整でバタついてて…" },
    { speaker: "customer", text: "“ちょっと”って、いつですか？" },
    { speaker: "self", text: "来週中には…多分いけます。詳しくはまた。" },
    { speaker: "customer", text: "予定があるので、はっきりして下さい。" },
  ],
  modelScript: [
    { speaker: "self", text: "◯◯株式会社の柴田です。まずお詫び申し上げます。品質確認で不具合が見つかり、当初の12日納品を19日（火）へ変更させてください。" },
    { speaker: "customer", text: "理由の詳細は？" },
    { speaker: "self", text: "APIのスループットが仕様条件下で基準を満たさず、追加試験と最適化を実施中です。本日中に新スケジュールを共有し、段階納品として“画面/文言確定版”を今週金曜に先出しします。" },
    { speaker: "customer", text: "社内説明資料は？" },
    { speaker: "self", text: "原因・対策・再発防止を1ページでまとめた資料を今夕までにお送りします。責任者承認も付記します。" },
  ],
  highlights: [
    { startIdx: 0, endIdx: 0, note: "謝罪→遅延の確度→新日程を“日付で”提示。ぼかさない。" },
    { startIdx: 2, endIdx: 2, note: "“多分”や“来週中”はNG。代替案（段階納品）で影響最小化。" },
    { startIdx: 4, endIdx: 4, note: "相手の社内説明材料を先回り準備（原因/対策/再発防止）。" },
  ],
  quizzes: [
    {
      id: "q1",
      question: "最初の一声として最適なのは？",
      choices: [
        { id: "a1", text: "すみません、ちょっと遅れます。", correct: false, explain: "“ちょっと”は不明瞭。" },
        { id: "a2", text: "まずお詫び。12日→19日へ延期をお願いします。", correct: true, explain: "謝罪＋具体日付で確度を示す。" },
        { id: "a3", text: "多分来週。", correct: false, explain: "確度がない。" }
      ]
    },
    {
      id: "q2",
      question: "“社内にどう説明すれば？”への良い返答は？",
      choices: [
        { id: "b1", text: "詳しくはまた。", correct: false, explain: "相手の困りに寄り添えていない。" },
        { id: "b2", text: "原因・対策・再発防止を1枚にまとめ、責任者承認付きで本日送付します。", correct: true, explain: "相手の説明負担を減らす提案。" },
        { id: "b3", text: "先方にも事情があるので、そちらで調整お願いします。", correct: false, explain: "丸投げ。" }
      ]
    }
  ]
};
