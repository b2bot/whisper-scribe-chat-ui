import { IncomingForm } from 'formidable';
import { readFile } from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    try {
      const file = files.file;
      const type = fields.type?.toString();

      if (!file || Array.isArray(file)) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileBuffer = await readFile(file.filepath);
      const content = fileBuffer.toString('utf8');

      console.log('Parsed content from file:', content.slice(0, 100));

      return res.status(200).json({
        success: true,
        reply: content,
        type,
      });
    } catch (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({ error: 'Failed to process file' });
    }
  });
}
