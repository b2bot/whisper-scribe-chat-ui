interface UploadResult {
  success: boolean;
  content?: string;
  url?: string;
  error?: string;
}

export const processFileUpload = async (
  file: File,
  apiEndpoint: string
): Promise<UploadResult> => {
  console.log('Processing file upload:', file.name, 'type:', file.type);
  
  const fileType = getFileType(file);
  console.log('Detected file type:', fileType);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileType);

    console.log('Sending request to:', apiEndpoint);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'include',
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error response:', errorText);
      throw new Error(errorText || `Failed to upload file: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Upload success, response data:', data);

    return {
      success: true,
      content: data.content ?? data.reply ?? JSON.stringify(data),
      url: data.url ?? '',
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during file upload'
    };
  }
};

const getFileType = (file: File): string => {
  console.log('Determining file type for:', file.name, 'MIME:', file.type);

  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'document';
  if (file.type === 'text/plain') return 'document';
  if (file.type === 'text/csv') return 'document';

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'mp3') return 'audio';
  if (['pdf', 'txt', 'csv'].includes(extension || '')) return 'document';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return 'image';

  return 'unknown';
};
