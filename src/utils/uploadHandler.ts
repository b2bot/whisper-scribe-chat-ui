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

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error response:', errorText);
      return {
        success: false,
        error: errorText || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('Upload success, data:', data);

    return {
      success: true,
      content: data.content || '',
      url: data.url || '',
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
