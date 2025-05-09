// File: /pages/api/upload.js
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new formidable.IncomingForm({
    keepExtensions: true,
    uploadDir: path.join(process.cwd(), '/public/uploads'),
  });

  try {
    // Ensure upload dir exists
    fs.mkdirSync(form.uploadDir, { recursive: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(400).json({ error: 'Error parsing the form' });
      }

      const file = files.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const uploadedFile = Array.isArray(file) ? file[0] : file;
      const fileUrl = `/uploads/${path.basename(uploadedFile.filepath)}`;

      console.log('File uploaded:', uploadedFile);

      // You can add custom processing here if needed
      return res.status(200).json({
        reply: `File uploaded: ${uploadedFile.originalFilename}`,
        url: fileUrl,
      });
    });
  } catch (error) {
    console.error('Unexpected server error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
