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
      const data = fs.readFileSync(file[0].filepath, 'utf-8');
      return res.status(200).json({ content: data, url: '' });
    } catch (error) {
      console.error('File read error:', error);
      return res.status(500).json({ error: 'Failed to read uploaded file' });
    }
  });
}
