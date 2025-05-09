import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*'); // ou defina domínio exato
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }

  // Bloqueia outros métodos
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // CORS headers (reais)
  res.setHeader('Access-Control-Allow-Origin', '*'); // ou domínio específico
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = fs.readFileSync(file.filepath);
      const base64 = buffer.toString('base64'); // alternativo: utf-8 para texto
      return res.status(200).json({ content: base64 });
    } catch (error) {
      console.error('File read error:', error);
      return res.status(500).json({ error: 'Failed to read uploaded file' });
    }
  });
}
