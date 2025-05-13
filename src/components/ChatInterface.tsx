import React, { useRef, useState } from 'react';
import { SendHorizonal } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/components/ui/sonner';
import { processFileUpload, sendMessageWithFiles } from '../utils/uploadHandler';

export default function ChatInterface({
  input,
  setInput,
  messages,
  setMessages,
  isLoading,
  setIsLoading,
  selectedFiles,
  setSelectedFiles,
  fileInputRef,
}: any) {
  const { user } = useUser();
  const [dragActive, setDragActive] = useState(false);

  const handleSend = async () => {
    if (!input && selectedFiles.length === 0) return;

    setIsLoading(true);
    const messageToSend = input || 'Please analyze this content';

    const newMessages = [
      ...messages,
      {
        role: 'user',
        content: messageToSend,
      },
    ];
    setMessages(newMessages);
    setInput('');

    if (selectedFiles.length > 0) {
      const result = await sendMessageWithFiles(
        selectedFiles,
        `${window.location.origin}/api/upload`,
        messageToSend
      );

      if (result.success) {
        const updatedMessages = [
          ...newMessages,
          {
            role: 'assistant',
            content: result.content,
          },
        ];
        setMessages(updatedMessages);
      } else {
        toast.error(result.error);
      }

      setSelectedFiles([]);
    } else {
      try {
        const response = await fetch(`${window.location.origin}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageToSend,
            history: messages.map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Erro na requisição');
        }

        const data = await response.json();
        const updatedMessages = [
          ...newMessages,
          {
            role: 'assistant',
            content: data.message,
          },
        ];
        setMessages(updatedMessages);
      } catch (error) {
        toast.error('Erro ao enviar mensagem. Por favor, tente novamente.');
        console.error('Erro ao enviar mensagem:', error);
      }
    }

    setIsLoading(false);
  };

  const onDrop = (acceptedFiles: File[]) => {
    setSelectedFiles((prev: File[]) => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
  });

  return (
    <div className="w-full p-2" {...getRootProps()}>
      <input {...getInputProps()} />
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg shadow">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {/* Removendo botão de upload */}
        {/* <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <Paperclip className="w-5 h-5" />
        </button> */}

        {/* Removendo botão de microfone */}
        {/* <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <Mic className="w-5 h-5" />
        </button> */}

        <button
          onClick={handleSend}
          className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-800"
          disabled={isLoading}
        >
          <SendHorizonal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
