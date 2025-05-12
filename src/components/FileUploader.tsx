
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Check, FileAudio, FileImage, File } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface FileUploaderProps {
  onFileUpload: (files: FileList, message?: string) => void;
  message?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, message }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Supported file types
  const supportedTypes = [
    'audio/mp3',
    'audio/mpeg',
    'application/pdf',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  // Max file size in bytes (15MB)
  const MAX_FILE_SIZE = 15 * 1024 * 1024;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check if file type is supported
  const isFileSupported = (file: File) => {
    // Check by MIME type
    if (supportedTypes.includes(file.type)) return true;
    
    // Fallback to extension check
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension === 'mp3' || 
           extension === 'pdf' || 
           extension === 'txt' || 
           extension === 'csv' ||
           extension === 'jpg' || 
           extension === 'jpeg' || 
           extension === 'png' || 
           extension === 'gif';
  };

  // Check if file size is within limit
  const isFileSizeValid = (file: File) => {
    return file.size <= MAX_FILE_SIZE;
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('audio/') || file.name.endsWith('.mp3')) {
      return <FileAudio className="h-5 w-5" />;
    } else if (file.type.startsWith('image/')) {
      return <FileImage className="h-5 w-5" />;
    } else {
      return <File className="h-5 w-5" />;
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Check for unsupported file types
      const unsupportedFiles = files.filter(file => !isFileSupported(file));
      if (unsupportedFiles.length > 0) {
        toast.error(`Unsupported file type(s): ${unsupportedFiles.map(f => f.name).join(', ')}`);
      }
      
      // Check for files that exceed size limit
      const oversizedFiles = files.filter(file => !isFileSizeValid(file));
      if (oversizedFiles.length > 0) {
        toast.error(`File(s) exceed the 15MB limit: ${oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ')}`);
      }
      
      // Filter valid files
      const validFiles = files.filter(file => isFileSupported(file) && isFileSizeValid(file));
      setSelectedFiles(validFiles);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      // Check for unsupported file types
      const unsupportedFiles = files.filter(file => !isFileSupported(file));
      if (unsupportedFiles.length > 0) {
        toast.error(`Unsupported file type(s): ${unsupportedFiles.map(f => f.name).join(', ')}`);
      }
      
      // Check for files that exceed size limit
      const oversizedFiles = files.filter(file => !isFileSizeValid(file));
      if (oversizedFiles.length > 0) {
        toast.error(`File(s) exceed the 15MB limit: ${oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ')}`);
      }
      
      // Filter valid files
      const validFiles = files.filter(file => isFileSupported(file) && isFileSizeValid(file));
      setSelectedFiles(validFiles);
    }
  };

  // Trigger file input click
  const onButtonClick = () => {
    inputRef.current?.click();
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle upload
  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      // Create a FileList-like object from the array
      const dataTransfer = new DataTransfer();
      selectedFiles.forEach(file => {
        dataTransfer.items.add(file);
      });
      
      onFileUpload(dataTransfer.files, message);
      setSelectedFiles([]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept=".mp3,.pdf,.txt,.csv,.jpg,.jpeg,.png,.gif"
        />
        
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          Arraste e solte os arquivos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Suporta MP3, PDF, TXT, CSV e imagens (máx. 15MB)
        </p>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onButtonClick}
        >
          Selecionar arquivos
        </Button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Selected files:</p>
          {selectedFiles.map((file, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-2 bg-secondary rounded-md"
            >
              <div className="flex items-center space-x-2">
                {getFileIcon(file)}
                <span className="text-sm truncate" style={{ maxWidth: '200px' }}>
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <div className="flex justify-end mt-4">
            <Button onClick={handleUpload} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
              {message ? ' with message' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
