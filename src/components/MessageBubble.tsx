import React from 'react';
import { FileAudio, FileImage, FileVideo, File } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Attachment {
  type: string;
  name: string;
  content?: string;
  url?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  attachments?: Attachment[];
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { role, content, attachments } = message;
  const messageClass = role === 'user' ? 'chat-user' : 'chat-assistant';

  const renderAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (type.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const renderAttachmentPreview = (attachment: Attachment) => {
    const { type, name, content, url } = attachment;

    if (type.startsWith('image/') && url) {
      return (
        <div className="mt-2">
          <img src={url} alt={name} className="max-h-48 rounded-md object-cover" />
          <p className="text-xs mt-1 opacity-70">{name}</p>
        </div>
      );
    }

    if (type.startsWith('audio/')) {
      return (
        <div className="mt-2">
          {url && (
            <audio controls className="w-full max-w-[300px]">
              <source src={url} type={type} />
              Your browser does not support the audio element.
            </audio>
          )}
          <p className="text-xs mt-1 opacity-70">{name}</p>
          {content && (
            <div className="mt-2 p-2 bg-black/20 rounded-md">
              <p className="text-xs font-medium">Transcrição:</p>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (
      type === 'application/pdf' ||
      type === 'text/plain' ||
      type === 'text/csv' ||
      name.endsWith('.pdf') ||
      name.endsWith('.txt') ||
      name.endsWith('.csv')
    ) {
      return (
        <div className="mt-2">
          <div className="flex items-center space-x-2 p-2 bg-black/20 rounded-md">
            <File className="h-5 w-5" />
            <span className="text-sm">{name}</span>
          </div>
          {content && (
            <div className="mt-2 p-2 bg-black/20 rounded-md">
              <p className="text-xs font-medium">Resumo do conteúdo:</p>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content.length > 1000 ? `${content.substring(0, 1000)}...` : content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="mt-2 flex items-center space-x-2 p-2 bg-black/20 rounded-md">
        {renderAttachmentIcon(type)}
        <span className="text-sm">{name}</span>
      </div>
    );
  };

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`${messageClass} animate-fade-in`}>
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {attachments && attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {attachments.map((attachment, index) => (
              <div key={index}>{renderAttachmentPreview(attachment)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
