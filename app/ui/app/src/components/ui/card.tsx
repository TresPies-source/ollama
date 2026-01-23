import clsx from "clsx";
import React from "react";

export type CardProps = {
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<"div">;

export function Card({
  hover = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        "rounded-dojo-lg border border-white/10",
        "bg-[rgba(15,42,61,0.7)] backdrop-blur-dojo",
        "shadow-dojo-md",
        "transition-all duration-300 ease-natural",
        hover && [
          "hover:shadow-dojo-xl hover:-translate-y-1",
          "hover:border-white/20",
        ],
      )}
    >
      {children}
    </div>
  );
}
