
import { Buffer } from "buffer";

interface UploadResult {
  success: boolean;
  url?: string;
  content?: string;
  fileContent?: string;
  error?: string;
}

/**
 * Process file upload to server
 */
async function processFileUpload(file: File, endpoint: string, message: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("message", message);
  formData.append("file", file);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      // Handle HTTP error status
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorText = await response.text();
        console.error("HTTP Error:", response.status, errorText);
        errorMessage = errorText || errorMessage;
      } catch (err) {
        console.error("Error reading error response:", err);
      }
      return { success: false, error: errorMessage };
    }

    // Parse response as JSON
    try {
      const data = await response.json();
      return {
        success: true,
        content: data?.content || "",
        fileContent: data?.content || "",
        url: data?.url || "",
      };
    } catch (err) {
      console.error("Error parsing JSON response:", err);
      return { 
        success: false, 
        error: "Failed to parse server response" 
      };
    }
  } catch (error: any) {
    console.error("Error processing upload:", error);
    return {
      success: false,
      error: error?.message || "Unknown upload error"
    };
  }
}

/**
 * Send message with file attachments
 */
async function sendMessageWithFiles(message: string, files: File | File[], endpoint: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("message", message);
  
  // Handle both single file and array of files
  if (Array.isArray(files)) {
    files.forEach(file => {
      formData.append("file", file);
    });
  } else {
    formData.append("file", files);
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      // Handle HTTP error status
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorText = await response.text();
        console.error("HTTP Error:", response.status, errorText);
        errorMessage = errorText || errorMessage;
      } catch (err) {
        console.error("Error reading error response:", err);
      }
      return { success: false, error: errorMessage };
    }

    // Parse response as JSON
    try {
      const data = await response.json();
      return {
        success: true,
        content: data?.content || "",
        fileContent: data?.content || "",
        url: data?.url || "",
      };
    } catch (err) {
      console.error("Error parsing JSON response:", err);
      return { 
        success: false, 
        error: "Failed to parse server response" 
      };
    }
  } catch (error: any) {
    console.error("Error sending files:", error);
    return {
      success: false,
      error: error?.message || "Unknown error sending file"
    };
  }
}

// Export with correct names as used in ChatInterface
export { processFileUpload, sendMessageWithFiles };
