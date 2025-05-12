
interface UploadResult {
  success: boolean;
  content?: string;
  url?: string;
  error?: string;
  message?: string;
}

export const processFileUpload = async (
  file: File,
  apiEndpoint: string,
  message?: string
): Promise<UploadResult> => {
  console.log('Processing file upload:', file.name, 'type:', file.type);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add the message to the form data if provided
    if (message && message.trim()) {
      formData.append('message', message.trim());
    }
    
    // Use the current domain for API calls instead of hardcoded URLs
    const currentDomain = window.location.origin;
    const endpoint = apiEndpoint.startsWith('http') 
      ? apiEndpoint 
      : `${currentDomain}/api/upload`;
    
    console.log('Uploading to endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      // Don't set mode or credentials for same-origin requests
      // Only set them if needed for cross-origin requests
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error response:', errorText, 'Status:', response.status);
      return {
        success: false,
        error: errorText || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('Upload success, data:', data);

    return {
      success: true,
      content: data.content || '',
      url: data.url || '',
      message: data.message || '',
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during upload',
    };
  }
};
