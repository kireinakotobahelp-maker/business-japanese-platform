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

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { children, className, as: Comp = "div", ...rest },
  ref
) {
  return (
    <Comp
      ref={ref as React.Ref<HTMLElement>}
      className={cn(
        // Business card design
        "bg-white border border-slate-200 rounded-lg shadow-sm",
        "hover:shadow-md transition-all duration-200",
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
    <div className={cn("flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 bg-slate-50", className)}>
      <Heading id={id} className="text-xl font-semibold text-slate-900">
        {children}
      </Heading>
      {right}
    </div>
  );
}
