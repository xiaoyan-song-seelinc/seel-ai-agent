import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInputBar({
  onSend,
  disabled = false,
  placeholder = "Message Team Lead...",
}: MessageInputBarProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    const lineHeight = 20;
    const maxHeight = lineHeight * 4 + 16; // 4 lines + padding
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  };

  const isEmpty = !text.trim();

  return (
    <div className="bg-white border-t border-border px-4 py-3 shrink-0">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-lg border border-border bg-white px-3 py-2 text-[13px] leading-5",
            "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-indigo-400/50 focus:border-indigo-300",
            "min-h-[36px] max-h-[96px] overflow-y-auto",
            "transition-colors",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          style={{ height: "36px" }}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={isEmpty || disabled}
          className={cn(
            "h-9 w-9 p-0 shrink-0 rounded-lg",
            isEmpty || disabled
              ? "bg-muted text-muted-foreground"
              : "bg-indigo-600 hover:bg-indigo-700 text-white",
          )}
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
