import clsx from "clsx";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Input } from "../ui/input";

type SeedSearchProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableCategories: string[];
  availableTags: string[];
  className?: string;
};

export function SeedSearch({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTags,
  onTagToggle,
  availableCategories,
  availableTags,
  className,
}: SeedSearchProps) {
  return (
    <div className={clsx("flex flex-col gap-4", className)}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dojo-text-tertiary pointer-events-none z-10">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </div>
        <Input
          type="search"
          placeholder="Search seeds..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {availableCategories.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-dojo-text-secondary">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCategoryChange(null)}
              className={clsx(
                "px-3 py-1.5 rounded-md text-sm transition-all duration-200",
                "border border-white/10",
                selectedCategory === null
                  ? "bg-dojo-accent-primary/20 text-dojo-accent-primary border-dojo-accent-primary/50"
                  : "bg-[rgba(15,42,61,0.7)] text-dojo-text-secondary hover:border-white/20",
              )}
            >
              All
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm transition-all duration-200 capitalize",
                  "border border-white/10",
                  selectedCategory === category
                    ? "bg-dojo-accent-primary/20 text-dojo-accent-primary border-dojo-accent-primary/50"
                    : "bg-[rgba(15,42,61,0.7)] text-dojo-text-secondary hover:border-white/20",
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableTags.length > 0 && selectedTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-dojo-text-secondary">
            Active Filters
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className={clsx(
                  "inline-flex items-center gap-1.5",
                  "px-3 py-1.5 rounded-md text-sm",
                  "bg-dojo-accent-primary/20 text-dojo-accent-primary",
                  "border border-dojo-accent-primary/50",
                  "hover:bg-dojo-accent-primary/30",
                  "transition-all duration-200",
                )}
              >
                {tag}
                <XMarkIcon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      )}

      {availableTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-dojo-text-secondary">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
                  className={clsx(
                    "px-3 py-1.5 rounded-md text-sm transition-all duration-200",
                    "border border-white/10",
                    isSelected
                      ? "bg-dojo-accent-primary/20 text-dojo-accent-primary border-dojo-accent-primary/50"
                      : "bg-[rgba(15,42,61,0.7)] text-dojo-text-secondary hover:border-white/20",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
