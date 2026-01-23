import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

type MessageInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  className,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = value.length;
  const maxChars = 4000;
  const isOverLimit = charCount > maxChars;

  const handleSend = () => {
    if (!value.trim() || disabled || isOverLimit) return;

    onSend(value.trim());
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <motion.div
      animate={{
        scale: isFocused ? 1.02 : 1,
        paddingTop: isFocused ? "0.875rem" : "0.75rem",
        paddingBottom: isFocused ? "0.875rem" : "0.75rem",
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className={clsx(
        "relative",
        "bg-[rgba(15,42,61,0.7)] backdrop-blur-dojo",
        "border border-white/10 rounded-dojo-lg",
        "shadow-dojo-md",
        "transition-all duration-300 ease-natural",
        isFocused && [
          "border-dojo-accent-primary/50",
          "shadow-dojo-lg",
          "ring-2 ring-dojo-accent-primary/20",
        ],
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={clsx(
          "w-full px-4 py-3 pr-24",
          "bg-transparent border-none outline-none resize-none",
          "text-dojo-text-primary placeholder:text-dojo-text-tertiary",
          "min-h-[52px] max-h-[200px]",
          "font-sans text-base",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      />

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {charCount > 0 && (
          <span
            className={clsx(
              "text-xs",
              isOverLimit ? "text-dojo-error" : "text-dojo-text-tertiary",
            )}
          >
            {charCount}/{maxChars}
          </span>
        )}
        <motion.div
          whileHover={
            !disabled && value.trim() && !isOverLimit
              ? {
                  scale: [1, 1.1, 1.05],
                  transition: {
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse",
                  },
                }
              : undefined
          }
        >
          <Button
            type="button"
            primary
            onClick={handleSend}
            disabled={disabled || !value.trim() || isOverLimit}
            className="!px-3 !py-2"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
