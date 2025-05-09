import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader('Access-Control-Allow-Origin', 'https://max-zeta-eight.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const file = files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const fileBuffer = fs.readFileSync(file[0].filepath);
      const isText = file[0].mimetype?.startsWith('text/') || file[0].mimetype === 'application/json';

      const content = isText
        ? fileBuffer.toString('utf-8')
        : `📎 File "${file[0].originalFilename}" uploaded successfully (${file[0].mimetype})`;

      return res.status(200).json({ content, url: '' });
    } catch (error) {
      console.error('File read error:', error);
      return res.status(500).json({ error: 'Failed to read uploaded file' });
    }
  });
}
