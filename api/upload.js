
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS HEADERS - More permissive for development/testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const form = formidable({ 
      multiples: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(500).json({ error: 'Error parsing form data' });
      }

      const file = files.file;

      if (!file || !file[0]) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        const fileBuffer = fs.readFileSync(file[0].filepath);
        const isText = file[0].mimetype?.startsWith('text/') || 
                       file[0].mimetype === 'application/json' ||
                       file[0].mimetype === 'application/pdf';

        const content = isText
          ? `Content from "${file[0].originalFilename}" (${file[0].mimetype})`
          : `📎 File "${file[0].originalFilename}" uploaded successfully (${file[0].mimetype})`;

        // For demonstration, create a dummy URL pointing to a public file
        // In a real app, you'd upload to a storage service and return the URL
        const url = isText ? '' : `/dummy-url/${file[0].originalFilename}`;

        return res.status(200).json({ success: true, content, url });
      } catch (error) {
        console.error('File read error:', error);
        return res.status(500).json({ error: 'Failed to read uploaded file' });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
