
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Send } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { toast } from '@/components/ui/sonner';
import { useUser } from '../contexts/UserContext';
import { UserSelector } from './UserSelector';
import { ChatControls } from './ChatControls';
import { Message } from '../types/chat';

const ChatInterface: React.FC = () => {
  const { messages, setMessages } = useUser();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Generate a unique ID for messages
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    const hasMessage = input.trim() !== '';
    
    // Don't do anything if we don't have a message
    if (!hasMessage) return;
    
    setIsProcessing(true);
    
    try {
      // Create the user message
      const newMessage = {
        role: 'user' as const,
        content: input,
        id: generateId()
      };
      
      // Add user message to chat
      setMessages(prev => [...prev, newMessage]);
      setInput('');
      
      // Send message to API for processing
      const response = await fetch('https://max-zeta-eight.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input.trim(),
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from API:', errorText);
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add assistant's response - preserving markdown formatting
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: data.reply || "I'm sorry, I couldn't process that request.",
        id: generateId()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Add error response
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: "I'm sorry, there was an error processing your message. Please try again.",
        id: generateId()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle key press for sending message
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
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg font-medium">Olá, tudo bem?</p>
            <p className="text-sm">Estou aqui para te ajudar com insights, tarefas e estratégias de marketing para a Leadclinic. Fale comigo como um colega de equipe.</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble 
              key={message.id} 
              message={message} 
            />
          ))
        )}
        
        {isProcessing && (
          <div className="chat-assistant">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce-loader" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce-loader" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce-loader" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="min-h-[60px] resize-none"
              disabled={isProcessing}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || input.trim() === ''}
            >
              {isProcessing ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
