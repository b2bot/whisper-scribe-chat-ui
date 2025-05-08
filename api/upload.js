// /api/upload.js
import formidable from 'formidable';
import fs from 'fs';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erro no parse:', err);
      return res.status(500).json({ error: 'Erro ao processar upload' });
    }

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const filePath = file.filepath;
    const mimeType = file.mimetype;

    try {
      if (mimeType.startsWith('audio/')) {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(filePath),
          model: 'whisper-1',
        });
        return res.status(200).json({ reply: `🎤 Áudio transcrito: ${transcription.text}` });
      } else if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
        const buffer = fs.readFileSync(filePath);
        const text = buffer.toString();
        return res.status(200).json({ reply: `📎 Arquivo recebido:\n\n${text.substring(0, 1000)}...` });
      } else {
        return res.status(415).json({ error: 'Tipo de arquivo não suportado' });
      }
    } catch (e) {
      console.error('Erro no processamento:', e);
      return res.status(500).json({ error: 'Falha ao analisar o conteúdo' });
    }
  });
}
