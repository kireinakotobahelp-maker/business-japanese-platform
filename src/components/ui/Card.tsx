'use client';
import React, { ReactNode, forwardRef } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type CardProps<T extends keyof JSX.IntrinsicElements = "div"> = {
  /** 子要素 */
  children: ReactNode;
  /** 追記スタイル */
  className?: string;
  /** セマンティック要素（section/articleなど） */
  as?: T;
  /** 画面内見出しに対応させるときに使う。SectionTitle の id と合わせると良い */
  "aria-labelledby"?: string;
} & Omit<JSX.IntrinsicElements[T], "children" | "className">;

export const Card = forwardRef<HTMLElement, CardProps<any>>(function Card(
  { children, className, as: Comp = "div", ...rest },
  ref
) {
  return (
    <Comp
      ref={ref as any}
      className={cn(
        "rounded-2xl bg-white/90",
        "shadow-[inset_0_1px_0_#fff,0_6px_24px_rgba(15,23,42,.06)]",
        "ring-1 ring-slate-200 backdrop-blur-sm",
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
});

type SectionTitleProps = {
  children: ReactNode;
  right?: ReactNode;
  /** 見出し要素のレベル（h2〜h4 あたり）。デフォルト h2 */
  as?: "h2" | "h3" | "h4";
  /** 自動で aria-labelledby に使える id を発行したいとき */
  id?: string;
  className?: string;
};

export function SectionTitle({
  children,
  right,
  as: Heading = "h2",
  id,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn("flex items-center justify-between px-4 pt-4 pb-2", className)}>
      <Heading id={id} className="text-[15px] font-semibold tracking-wide text-slate-800">
        {children}
      </Heading>
      {right}
    </div>
  );
}
