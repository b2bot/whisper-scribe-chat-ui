import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Send, Paperclip } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { toast } from '@/components/ui/sonner';
import { useUser } from '../contexts/UserContext';
import { UserSelector } from './UserSelector';
import { ChatControls } from './ChatControls';
import { Message } from '../types/chat';
import { FileUploader } from './FileUploader';

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const ChatInterface: React.FC = () => {
  const { messages, setMessages } = useUser();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSendMessage = async () => {
    const userMessageContent = input.trim();
    if (!userMessageContent && selectedFiles.length === 0) {
      toast.error("Please enter a message or select a file to send.");
      return;
    }

    setIsProcessing(true);
    const userMessage: Message = {
      role: 'user' as const,
      content: userMessageContent,
      id: generateId(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const filesData = await Promise.all(
        selectedFiles.map(async (file) => {
          const fileInfo: { name: string; type: string; content?: string } = {
            name: file.name,
            type: file.type,
          };
          if (file.type === 'text/plain' || file.type === 'text/csv' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
            try {
              fileInfo.content = await readFileAsText(file);
            } catch (e) {
              console.error(`Error reading file content for ${file.name}:`, e);
              toast.error(`Could not read file: ${file.name}`);
            }
          }
          return fileInfo;
        })
      );

      const currentMessagesForApi = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessagesForApi,
          files: filesData,
        }),
      });

      if (!response.ok) {
        let errorPayload = { error: `API Error: ${response.status} ${response.statusText}`, details: '' };
        // Try to parse as JSON first, as our API should return JSON errors
        try {
          const errorJson = await response.json(); 
          errorPayload.error = errorJson.error || errorPayload.error;
          errorPayload.details = errorJson.details || '';
        } catch (jsonParseError) {
          // If JSON parsing fails, then try to read as text (this is where the original error likely occurred)
          // This ensures response.text() is only called if response.json() fails.
          try {
            const errorText = await response.text();
            errorPayload.details = errorText || 'Could not parse error response as JSON or text.';
            console.error('Error response from API (not JSON, fallback to text):', errorText);
          } catch (textParseError) {
            console.error('Failed to parse error response as JSON or text:', textParseError);
            errorPayload.details = 'Failed to parse error response body.';
          }
        }
        console.error('Full error payload from API:', errorPayload);
        throw new Error(`${errorPayload.error}${errorPayload.details ? ": " + errorPayload.details : ''}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: data.response || "I'm sorry, I couldn't process that request.",
        id: generateId()
      }]);
      setSelectedFiles([]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.message || 'Failed to send message. Please try again.';
      toast.error(errorMessage);
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: `I'm sorry, there was an error: ${errorMessage}`,
        id: generateId()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <UserSelector />
        <h1 className="text-xl font-semibold text-center">Max Leadclinic</h1>
        <ChatControls />
      </div>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg font-medium">Olá, tudo bem?</p>
            <p className="text-sm">Estou aqui para te ajudar com insights, tarefas e estratégias de marketing para a Leadclinic. Fale comigo como um colega de equipe.</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        {isProcessing && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg p-3 bg-muted text-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-loader" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-loader" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-loader" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border">
        {showUploader && (
          <div className="mb-4 p-4 border rounded-lg bg-card">
            <FileUploader
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              showUploader={showUploader}
              setShowUploader={setShowUploader}
            />
          </div>
        )}
        <div className="flex items-end space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 min-h-[60px] resize-none"
            disabled={isProcessing}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUploader(prev => !prev)}
            className="p-2 self-center"
            aria-label="Attach files"
            title="Attach files"
            disabled={isProcessing}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={isProcessing || (input.trim() === '' && selectedFiles.length === 0)}
            className="self-center"
            title="Send message"
          >
            {isProcessing ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;