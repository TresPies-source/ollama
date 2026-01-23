import clsx from "clsx";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { Seed } from "../../types/dgd";

type SeedCardProps = {
  seed: Seed;
  onClick?: () => void;
  className?: string;
};

export function SeedCard({ seed, onClick, className }: SeedCardProps) {
  const { metadata } = seed;
  const displayTags = metadata.tags.slice(0, 3);
  const remainingTags = metadata.tags.length - 3;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
      className={clsx("cursor-pointer", className)}
      onClick={onClick}
    >
      <Card
        hover
        className={clsx(
          "p-5 h-full",
          "border-white/10 hover:border-dojo-accent-primary/50",
          "transition-all duration-300 ease-natural",
          "relative overflow-hidden",
          "before:absolute before:inset-0 before:rounded-dojo-lg",
          "before:border-2 before:border-transparent",
          "before:bg-gradient-sunset before:opacity-0",
          "before:transition-opacity before:duration-300",
          "hover:before:opacity-20",
          "before:-z-10",
        )}
      >
        <div className="flex flex-col gap-3 h-full">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-dojo-text-primary line-clamp-1 flex-1">
              {metadata.name}
            </h3>
            <Badge color="accent" className="shrink-0 capitalize">
              {metadata.category}
            </Badge>
          </div>

          <p className="text-sm text-dojo-text-secondary line-clamp-2 flex-1">
            {metadata.description}
          </p>

          {metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-white/5">
              {displayTags.map((tag, index) => (
                <Badge key={index} color="zinc" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {remainingTags > 0 && (
                <Badge color="zinc" className="text-xs">
                  +{remainingTags} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
