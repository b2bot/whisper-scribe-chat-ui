import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { FileUploader } from './FileUploader';
import { toast } from '@/components/ui/sonner';
import { useUser } from '../contexts/UserContext';
import { Send, Mic, MicOff, FileImage, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { processFileUpload, sendMessageWithFiles } from '../utils/uploadHandler';

export const ChatInterface: React.FC = () => {
  const {
    messages,
    addMessage,
    isProcessing,
    setIsProcessing,
    clearHistory,
  } = useUser();
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (
      isProcessing ||
      (input.trim() === '' && selectedFiles.length === 0 && recordedChunks.length === 0)
    ) return;

    const userMessage = input.trim() || 'Por favor, analise este conteúdo';
    addMessage({ role: 'user', content: userMessage });
    setInput('');
    setIsProcessing(true);

    let fileData = null;

    if (selectedFiles.length > 0) {
      const uploadResult = await sendMessageWithFiles(userMessage, selectedFiles[0], '/api/upload');
      if (!uploadResult.success) {
        toast.error(`Erro ao enviar arquivos: ${uploadResult.error}`);
        setIsProcessing(false);
        return;
      }
      fileData = uploadResult.content;
      setFileContent(fileData);
    }

    try {
      const response = await fetch(`${window.location.origin}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          fileContent: fileData,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na resposta da API');
      }

      const data = await response.json();
      if (data?.reply) {
        addMessage({ role: 'assistant', content: data.reply });
      } else {
        toast.error('Resposta inválida do assistente.');
      }
    } catch (error) {
      toast.error('Falha ao processar mensagem. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
      setSelectedFiles([]);
      setFileContent(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => setRecordedChunks(chunks);

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast.error('Erro ao acessar o microfone');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message, index) => (
          <MessageBubble key={index} role={message.role} content={message.content} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showUploader && (
        <FileUploader
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          onClose={() => setShowUploader(false)}
        />
      )}

      <div className="border-t border-border p-4">
        <div className="flex items-end space-x-2">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isProcessing}
            className="resize-none"
          />

          <div className="flex flex-col space-y-2">
            {/* Botão de upload de arquivos - COMENTADO */}
            {/*
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
            */}

            {/* Botão de gravação de áudio - COMENTADO */}
            {/*
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
            */}

            {/* Botão de envio de mensagem - PERMANECE VISÍVEL */}
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || (input.trim() === '' && selectedFiles.length === 0 && recordedChunks.length === 0)}
            >
              {isProcessing ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
