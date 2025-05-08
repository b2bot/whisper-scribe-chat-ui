
interface UploadResult {
  success: boolean;
  content?: string;
  url?: string;
  error?: string;
}

/**
 * Process file upload and handle different file types
 */
export const processFileUpload = async (
  file: File,
  apiEndpoint: string
): Promise<UploadResult> => {
  // Check file type
  const fileType = getFileType(file);
  
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileType);
    
    // Upload file
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to upload file');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      content: data.content || '',
      url: data.url || '',
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Determine file type from file object
 */
const getFileType = (file: File): string => {
  // Check by MIME type first
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'document';
  if (file.type === 'text/plain') return 'document';
  if (file.type === 'text/csv') return 'document';
  
  // Fallback to extension check
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'mp3') return 'audio';
  if (['pdf', 'txt', 'csv'].includes(extension || '')) return 'document';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return 'image';
  
  return 'unknown';
};
