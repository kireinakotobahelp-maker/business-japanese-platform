'use client';

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SkeletonProps = {
  className?: string;
  /** 形状のバリエーション */
  variant?: "rect" | "text" | "circle";
  /** ARIA: 読み上げ用の説明（省略可） */
  "aria-label"?: string;
};

export function Skeleton({ className = "", variant = "rect", ...rest }: SkeletonProps) {
  const shape =
    variant === "circle"
      ? "rounded-full"
      : variant === "text"
      ? "rounded-md h-[1em]"
      : "rounded-xl";

  // ユーザーが「簡易な動き」を好む設定なら自動でアニメ停止（CSS でも可）
  const motionClass =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "animate-none"
      : "animate-pulse";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        motionClass,
        shape,
        "bg-slate-200/70 shadow-[inset_0_1px_0_#fff]",
        className
      )}
      {...rest}
    />
  );
}
