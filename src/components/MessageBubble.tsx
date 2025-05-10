import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isAssistant = role === "assistant";
  const bubbleClass = isAssistant
    ? "chat-assistant markdown-content"
    : "chat-user";

  const sanitizedHTML = useMemo(() => {
    const rawHTML = marked.parse(content);
    return DOMPurify.sanitize(rawHTML);
  }, [content]);

  return (
    <div
      className={bubbleClass}
      dangerouslySetInnerHTML={
        isAssistant ? { __html: sanitizedHTML } : undefined
      }
    >
      {!isAssistant && content}
    </div>
  );
}
