

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Send, Mic, MicOff, FileImage, X } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { FileUploader } from './FileUploader';
import { processFileUpload, sendMessageWithFiles } from '../utils/uploadHandler';
import { toast } from '@/components/ui/sonner';
import { useUser } from '../contexts/UserContext';
import { UserSelector } from './UserSelector';
import { ChatControls } from './ChatControls';
import { Message } from '../types/chat';

const ChatInterface: React.FC = () => {
  const { messages, setMessages } = useUser();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
  
  // Handle sending a message with optional files
  const handleSendMessage = async () => {
    const hasMessage = input.trim() !== '';
    const hasFiles = selectedFiles.length > 0;
    
    // Don't do anything if we don't have a message or files
    if (!hasMessage && !hasFiles && recordedChunks.length === 0) return;
    
    // Process audio recording if we have one
    if (recordedChunks.length > 0) {
      await processAudioRecording();
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let fileContent = '';
      
      // If we have files, send the message with files
      if (hasFiles) {
        // Create the user message with attachments
        const attachments = selectedFiles.map(file => ({
          type: file.type,
          name: file.name,
        }));
        
        const userMessage: Message = {
          role: 'user',
          content: input,
          id: generateId(),
          attachments
        };
        
        // Add the user message to the chat
        setMessages(prev => [...prev, userMessage]);
        
        // Clear the input
        setInput('');
        setUploadProgress(0);
        
        // Process the message with files
        const result = await sendMessageWithFiles(
          input, 
          selectedFiles,
          'https://max-zeta-eight.vercel.app/api/upload'
        );
        
        if (!result.success) {
          toast.error(`Erro ao enviar arquivos: ${result.error}`);
          return;
        }
        
        // Store file content to send to assistant
        fileContent = result.fileContent || '';
        
        // Clear files after successful upload
        setSelectedFiles([]);
        setShowUploader(false);
        
        // Only if the user didn't provide a message, add the standard "processed files" response
        if (!hasMessage) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I've processed ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}. How can I help you with them?`,
            id: generateId()
          }]);
          setIsProcessing(false);
          return;
        }
      } else if (hasMessage) {
        // If we only have a message, process it normally
        const newMessage = {
          role: 'user' as const,
          content: input,
          id: generateId()
        };
        
        setMessages(prev => [...prev, newMessage]);
        setInput('');
      }
      
      // Send message to API for processing
      if (hasMessage || (hasFiles && hasMessage)) {
        const response = await fetch('https://max-zeta-eight.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: input.trim(),
            history: messages.map(m => ({ role: m.role, content: m.content })),
            fileContent: fileContent // Pass the extracted file content
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          let errorMessage;
          try {
            const parsedError = JSON.parse(errorData);
            errorMessage = parsedError.error || 'Failed to send message';
          } catch (e) {
            errorMessage = 'Failed to send message';
          }
          throw new Error(errorMessage);
        }
        
        // Parse the response once
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          console.error('Failed to parse API response:', error);
          throw new Error('Invalid response from server');
        }
        
        // Add assistant's response
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: data.reply || "I'm sorry, I couldn't process that request.",
          id: generateId()
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Falha ao enviar mensagem. Por favor, tente novamente.');
      
      // Add error response
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: "I'm sorry, there was an error processing your message. Please try again.",
        id: generateId()
      }]);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };
  
  // Handle audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      });
      
      recorder.addEventListener('stop', () => {
        setRecordedChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      });
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('Gravação iniciada');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success('Gravação finalizada');
    }
  };
  
  // Process audio recording
  const processAudioRecording = async () => {
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(recordedChunks, { type: 'audio/mp3' });
      const file = new File([audioBlob], 'recording.mp3', { type: 'audio/mp3' });
      
      // Get the current message text for the audio recording
      const messageText = input.trim();
      setInput('');
      
      // Create a FileList-like object
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      // Process the audio file with the message text
      const result = await processFileUpload(file, 'https://max-zeta-eight.vercel.app/api/upload', messageText);
      
      if (!result.success) {
        toast.error(`Erro ao processar áudio: ${result.error}`);
        setIsProcessing(false);
        return;
      }
      
      // Create a user message with the audio attachment
      const userMessage: Message = {
        role: 'user',
        content: messageText || 'Voice message',
        id: generateId(),
        attachments: [{
          type: 'audio/mp3',
          name: 'recording.mp3',
          content: result.content,
          url: result.url
        }]
      };
      
      // Add the message to the chat
      setMessages(prev => [...prev, userMessage]);
      
      // Only if we don't have a message text, add the assistant response
      if (!messageText) {
        // Add assistant response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I've processed your audio recording. How can I help with it?`,
          id: generateId()
        }]);
        setIsProcessing(false);
      } else {
        // If there was a message, process it with the API
        try {
          const response = await fetch('https://max-zeta-eight.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: messageText,
              history: messages.map(m => ({ role: m.role, content: m.content })),
              fileContent: result.content // Pass the extracted file content
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
              const parsedError = JSON.parse(errorText);
              errorMessage = parsedError.error || 'Failed to send message';
            } catch (e) {
              errorMessage = errorText || 'Failed to send message';
            }
            throw new Error(errorMessage);
          }
          
          // Parse the response text once
          const responseText = await response.text();
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (error) {
            console.error('Failed to parse API response:', error);
            throw new Error('Invalid response from server');
          }
          
          // Add assistant's response
          setMessages(prev => [...prev, {
            role: 'assistant' as const,
            content: data.reply || "I'm sorry, I couldn't process that request.",
            id: generateId()
          }]);
        } catch (error) {
          console.error('Error sending message:', error);
          toast.error('Falha ao processar mensagem com gravação. Por favor, tente novamente.');
          
          // Add error response to the chat
          setMessages(prev => [...prev, {
            role: 'assistant' as const,
            content: "I'm sorry, there was an error processing your audio message. Please try again.",
            id: generateId()
          }]);
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Falha ao processar áudio. Por favor, tente novamente.');
      setIsProcessing(false);
    } finally {
      setRecordedChunks([]);
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
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full max-w-md mx-auto">
            <div className="upload-progress">
              <div 
                className="upload-progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-center mt-1 text-muted-foreground">
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {showUploader && (
        <div className="p-4 border-t border-border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Upload</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploader(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <FileUploader 
            selectedFiles={selectedFiles} 
            setSelectedFiles={setSelectedFiles} 
            showUploader={showUploader} 
            setShowUploader={setShowUploader}
          />
        </div>
      )}
      
      <div className="p-4 border-t border-border">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={selectedFiles.length > 0 
                ? `Add a message to send with ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}...` 
                : "Digite sua mensagem..."
              }
              className="min-h-[60px] resize-none"
              disabled={isProcessing}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowUploader(!showUploader)}
              disabled={isProcessing}
              title="Enviar Arquivos"
              className={selectedFiles.length > 0 ? "bg-secondary" : ""}
            >
              <FileImage className="h-5 w-5" />
              {selectedFiles.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {selectedFiles.length}
                </span>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              title={isRecording ? "Parar gravação" : "Enviar áudio"}
              className={isRecording ? "bg-red-500 text-white hover:bg-red-600 hover:text-white" : ""}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || (input.trim() === '' && selectedFiles.length === 0 && recordedChunks.length === 0)}
            >
              {isProcessing ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {selectedFiles.length > 0 && !showUploader && (
          <div className="mt-2 flex items-center">
            <span className="text-xs text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploader(true)}
              className="ml-2 h-6 text-xs"
            >
              View files
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFiles([])}
              className="ml-2 h-6 text-xs text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
