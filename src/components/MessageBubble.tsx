
import React from 'react';
import { Message } from '../types/chat';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

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
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
};
