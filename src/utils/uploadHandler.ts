import pdfParse from 'pdf-parse';

export async function sendMessageWithFiles(message, files, endpoint) {
  try {
    const formData = new FormData();
    formData.append('message', message);
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return {
      success: true,
      fileContent: data.content || '',
    };
  } catch (error) {
    console.error('Erro ao enviar arquivos:', error);
    return { success: false, error: error.message };
  }
}

export async function processFileUpload(file, endpoint, message) {
  const formData = new FormData();
  formData.append('message', message);
  formData.append('files', file);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return {
      success: true,
      content: data.content || '',
      url: data.url || '',
    };
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    return { success: false, error: error.message };
  }
}
