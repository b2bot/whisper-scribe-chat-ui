import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method Not Allowed' });
  }

  const form = new formidable.IncomingForm({
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ reply: 'Failed to process file.' });
    }

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ reply: 'No file received' });
    }

    // Apenas para teste: ler e retornar parte do conteúdo se for .txt
    if (file.mimetype === 'text/plain') {
      const content = fs.readFileSync(file.filepath, 'utf8');
      const preview = content.slice(0, 1000); // evita estourar o limite
      return res.status(200).json({ reply: `Arquivo recebido. Conteúdo inicial:\n\n${preview}` });
    }

    return res.status(200).json({ reply: `Arquivo ${file.originalFilename} recebido com sucesso.` });
  });
}
