import clsx from "clsx";
import { motion } from "framer-motion";
import { SeedCard } from "./SeedCard";
import type { Seed } from "../../types/dgd";

type SeedGridProps = {
  seeds: Seed[];
  onSeedClick?: (seed: Seed) => void;
  className?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
};

export function SeedGrid({ seeds, onSeedClick, className }: SeedGridProps) {
  if (seeds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-dojo-text-tertiary text-lg">No seeds found</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "grid gap-6",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {seeds.map((seed, index) => (
        <motion.div key={seed.path || index} variants={itemVariants}>
          <SeedCard seed={seed} onClick={() => onSeedClick?.(seed)} />
        </motion.div>
      ))}
    </motion.div>
  );
}
