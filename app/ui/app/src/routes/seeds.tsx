import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { useSeeds } from "@/hooks/useSeeds";
import { SeedSearch } from "@/components/seeds/SeedSearch";
import { SeedGrid } from "@/components/seeds/SeedGrid";
import { SeedDetailModal } from "@/components/seeds/SeedDetailModal";
import { Button } from "@/components/ui/button";
import type { Seed } from "@/types/dgd";

export const Route = createFileRoute("/seeds")({
  component: SeedsPage,
});

function SeedsPage() {
  const navigate = useNavigate();
  const {
    filteredSeeds,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTag,
    clearFilters,
    availableCategories,
    availableTags,
  } = useSeeds({ testMode: true });

  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSeedClick = (seed: Seed) => {
    setSelectedSeed(seed);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedSeed(null), 300);
  };

  const handleApplyToChat = async (seed: Seed) => {
    console.log("Applying seed to chat:", seed.metadata.name);

    // TODO: Create a new session with seed context
    // For now, navigate to sessions page
    navigate({ to: "/sessions" });
  };

  const hasActiveFilters =
    searchQuery || selectedCategory || selectedTags.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b border-white/10 bg-gradient-to-b from-dojo-bg-primary to-dojo-bg-secondary">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dojo-text-primary mb-2 flex items-center gap-3">
                <SparklesIcon className="w-8 h-8 text-dojo-accent-primary" />
                Seed Browser
              </h1>
              <p className="text-dojo-text-secondary">
                Browse and apply knowledge seeds to your conversations
              </p>
            </div>
            {hasActiveFilters && (
              <Button ghost onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          <SeedSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedTags={selectedTags}
            onTagToggle={toggleTag}
            availableCategories={availableCategories}
            availableTags={availableTags}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-dojo-accent-primary/30 border-t-dojo-accent-primary rounded-full animate-spin" />
                <p className="text-dojo-text-tertiary">Loading seeds...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-400 mb-2">Failed to load seeds</p>
                <p className="text-dojo-text-tertiary text-sm">
                  {error.message}
                </p>
              </div>
            </div>
          ) : (
            <>
              {filteredSeeds.length > 0 ? (
                <>
                  <div className="mb-4 text-sm text-dojo-text-tertiary">
                    {filteredSeeds.length} seed
                    {filteredSeeds.length !== 1 ? "s" : ""} found
                  </div>
                  <SeedGrid
                    seeds={filteredSeeds}
                    onSeedClick={handleSeedClick}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <SparklesIcon className="w-16 h-16 text-dojo-text-tertiary mx-auto mb-4 opacity-50" />
                    <p className="text-dojo-text-secondary text-lg mb-2">
                      No seeds found
                    </p>
                    <p className="text-dojo-text-tertiary text-sm">
                      {hasActiveFilters
                        ? "Try adjusting your filters"
                        : "No seeds available"}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SeedDetailModal
        seed={selectedSeed}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApplyToChat={handleApplyToChat}
      />
    </div>
  );
}
