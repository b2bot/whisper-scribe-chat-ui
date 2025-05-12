
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
  console.log('Processing file upload:', file.name, 'type:', file.type, 'size:', Math.round(file.size / 1024), 'KB');
  
  try {
    // Check file size before attempting upload (client-side validation)
    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      console.error('File too large:', file.name, 'size:', Math.round(file.size / 1024), 'KB');
      return {
        success: false,
        error: `File too large (${Math.round(file.size / (1024 * 1024))}MB). Maximum size is 15MB.`,
      };
    }
    
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
    });

    if (!response.ok) {
      let errorText;
      try {
        // Try to parse the error as JSON
        const errorData = await response.json();
        errorText = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      } catch (e) {
        // If JSON parsing fails, get the error as text
        errorText = await response.text();
      }
      
      console.error('Upload error response:', errorText, 'Status:', response.status);
      
      // Special handling for common errors
      if (response.status === 413) {
        return {
          success: false,
          error: `File too large. Maximum size is 15MB. Current file: ${Math.round(file.size / (1024 * 1024))}MB.`,
        };
      }
      
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

// New function to handle sending message with files
export const sendMessageWithFiles = async (
  message: string,
  files: File[],
  apiEndpoint: string
): Promise<{success: boolean, error?: string}> => {
  console.log(`Sending message with ${files.length} files`);
  
  try {
    if (files.length === 0) {
      // If no files, just return success to let the regular message flow continue
      return { success: true };
    }
    
    // Check if any file exceeds the size limit
    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        return {
          success: false,
          error: `File too large: ${file.name} (${Math.round(file.size / (1024 * 1024))}MB). Maximum size is 15MB.`,
        };
      }
    }
    
    // Process all files with the message
    const results = await Promise.all(
      files.map((file, index) => 
        // Only send the message with the first file
        processFileUpload(file, apiEndpoint, index === 0 ? message : undefined)
      )
    );
    
    // Check if any uploads failed
    const failedUploads = results.filter(result => !result.success);
    if (failedUploads.length > 0) {
      return {
        success: false,
        error: failedUploads.map(r => r.error).join('; '),
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send message with files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing files',
    };
  }
};
