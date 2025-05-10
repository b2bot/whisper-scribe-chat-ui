import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isAssistant = role === "assistant";
  const bubbleClass = isAssistant
    ? "chat-assistant markdown-content"
    : "chat-user";

  return (
    <div className={bubbleClass}>
      {isAssistant ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      ) : (
        content
      )}
    </div>
  );
}
