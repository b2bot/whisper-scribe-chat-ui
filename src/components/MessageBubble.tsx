import React from 'react';
import { Message } from '../types/chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // VERY VISIBLE LOG - VERSION 6
  console.log(`%c[[[ VERSION 6 ]]] - MessageBubble rendering. Role: ${message.role}. Content: "${message.content.substring(0, 50)}..."`, "background: lightblue; color: black; font-size: 14px; font-weight: bold;");

  return (
    <div className={cn(
      "flex",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] rounded-lg p-3",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-foreground"
      )}>
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          // Apply prose classes to a wrapper div for overall markdown styling
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              // The 'components' prop can still be used for fine-grained control
              // if specific elements need different styling than what 'prose' provides by default.
              // For now, relying on the wrapper div's prose classes for general styling.
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
