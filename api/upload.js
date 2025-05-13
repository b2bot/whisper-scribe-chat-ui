
import formidable from 'formidable';
import pdfParse from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '20mb',
  },
};

async function extractFileContent(file) {
  try {
    // Read the file contents into a buffer
    const fileBuffer = require('fs').readFileSync(file.filepath);
    
    // Check file type and extract content accordingly
    if (file.mimetype === 'application/pdf') {
      try {
        // Extract text from PDF using the buffer directly
        const pdfData = await pdfParse(fileBuffer);
        return pdfData.text;
      } catch (pdfError) {
        console.error('Error parsing PDF:', pdfError);
        return `[Error parsing PDF: ${file.originalFilename}]`;
      }
    } else if (file.mimetype?.startsWith('text/') || file.mimetype === 'application/json') {
      // For text files, just return the content
      return fileBuffer.toString('utf8');
    } else if (file.mimetype?.startsWith('audio/')) {
      // For audio files we would ideally transcribe them, but for now just notify
      return `[Audio file uploaded: ${file.originalFilename}]`;
    } else if (file.mimetype?.startsWith('image/')) {
      // For images we would ideally describe them, but for now just notify
      return `[Image file uploaded: ${file.originalFilename}]`;
    }
    
    // Default case for other file types
    return `[File uploaded: ${file.originalFilename} (${file.mimetype})]`;
  } catch (error) {
    console.error('Error extracting file content:', error);
    return `[Error extracting content from ${file.originalFilename}]`;
  }
}

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
      multiples: true,
      maxFileSize: 15 * 1024 * 1024, // 15MB limit
      maxFieldsSize: 20 * 1024 * 1024, // 20MB total form limit
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(500).json({ error: 'Error parsing form data' });
      }

      const file = files.file;
      const message = fields.message ? fields.message[0] : '';

      if (!file || !file[0]) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        // Extract content from file
        const fileContent = await extractFileContent(file[0]);
        
        // For demonstration, create a dummy URL pointing to a public file
        // In a real app, you'd upload to a storage service and return the URL
        const url = `/dummy-url/${file[0].originalFilename}`;

        return res.status(200).json({ 
          success: true, 
          content: fileContent, 
          url,
          // Include the user message in the response if provided
          message: message || '' 
        });
      } catch (error) {
        console.error('File processing error:', error);
        return res.status(500).json({ error: 'Failed to process uploaded file' });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
