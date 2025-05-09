import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Send, Mic, MicOff, FileImage, FileVideo, FileAudio, X } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { FileUploader } from './FileUploader';
import { processFileUpload } from '../utils/uploadHandler';
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
    if (input.trim() === '' && recordedChunks.length === 0) return;
    
    const newMessage = {
      role: 'user' as const,
      content: input,
      id: generateId()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Simulate API call
      // Replace with your actual API call to send the message to your backend
      const response = await fetch('https://max-zeta-eight.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Add assistant's response
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
  
  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    setShowUploader(false);
    setIsProcessing(true);
    setUploadProgress(0);
    
    try {
      // Create a message for the files being uploaded
      const attachments = Array.from(files).map(file => ({
        type: file.type,
        name: file.name,
      }));
      
      const uploadMessage: Message = {
        role: 'user',
        content: `Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`,
        id: generateId(),
        attachments
      };
      
      setMessages(prev => [...prev, uploadMessage]);
      
      // Process the files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = (i / files.length) * 100;
        setUploadProgress(progress);
        
        const result = await processFileUpload(
          file, 
          'https://max-zeta-eight.vercel.app/api/upload'
        );
        
        if (result.error) {
          toast.error(`Error processing ${file.name}: ${result.error}`);
          continue;
        }
        
        // Update the message with processed content
        setMessages(prev => 
          prev.map(msg => 
            msg.id === uploadMessage.id 
              ? {
                  ...msg,
                  attachments: msg.attachments?.map((att, idx) => 
                    idx === i 
                      ? { ...att, content: result.content, url: result.url } 
                      : att
                  )
                }
              : msg
          )
        );
      }
      
      setUploadProgress(100);
      
      // Add assistant response about the files
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've processed ${files.length} file${files.length > 1 ? 's' : ''}. How can I help you with them?`,
        id: generateId()
      }]);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files. Please try again.');
      
      // Add error response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, there was an error processing your files. Please try again.",
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
        
        // Process the audio recording
        processAudioRecording(chunks);
      });
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };
  
  const processAudioRecording = async (chunks: Blob[]) => {
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(chunks, { type: 'audio/mp3' });
      const file = new File([audioBlob], 'recording.mp3', { type: 'audio/mp3' });
      
      // Create a message for the recording
      const uploadMessage: Message = {
        role: 'user',
        content: 'Voice message',
        id: generateId(),
        attachments: [{
          type: file.type,
          name: file.name,
        }]
      };
      
      setMessages(prev => [...prev, uploadMessage]);
      
      // Process the audio file
      const result = await processFileUpload(
        file, 
        'https://max-zeta-eight.vercel.app/api/upload'
      );
      
      if (result.error) {
        toast.error(`Error processing recording: ${result.error}`);
        return;
      }
      
      // Update the message with transcription
      setMessages(prev => 
        prev.map(msg => 
          msg.id === uploadMessage.id 
            ? {
                ...msg,
                content: result.content || 'Voice message',
                attachments: msg.attachments?.map(att => 
                  ({ ...att, content: result.content, url: result.url })
                )
              }
            : msg
        )
      );
      
      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've processed your voice message. ${result.content ? "Here's what I heard: " + result.content : ""}`,
        id: generateId()
      }]);
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
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
        <h1 className="text-xl font-semibold text-center">Assistente Leadclinic</h1>
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
            <h3 className="text-sm font-medium">Upload Files</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploader(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <FileUploader onFileUpload={handleFileUpload} />
        </div>
      )}
      
      <div className="p-4 border-t border-border">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
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
              title="Upload files"
            >
              <FileImage className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              title={isRecording ? "Stop recording" : "Start recording"}
              className={isRecording ? "bg-red-500 text-white hover:bg-red-600 hover:text-white" : ""}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || (input.trim() === '' && recordedChunks.length === 0)}
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
