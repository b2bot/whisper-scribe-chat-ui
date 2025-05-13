import { Buffer } from 'buffer';
import pdfParse from 'pdf-parse';

interface UploadResult {
  success: boolean;
  url?: string;
  content?: string;
  error?: string;
}

// Função para processar upload com mensagem e arquivos
export async function processUpload(file: File, endpoint: string, message: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("message", message);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro HTTP:", errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return {
      success: true,
      content: data?.content || '',
      url: data?.url || '',
    };
  } catch (error: any) {
    console.error("Erro ao processar upload:", error);
    return {
      success: false,
      error: error?.message || "Erro desconhecido no upload"
    };
  }
}
