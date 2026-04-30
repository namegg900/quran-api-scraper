import { readFile } from 'fs/promises';
import { join } from 'path';

const CHAPTERS_DIR = join(process.cwd(), 'chapters');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method tidak diizinkan.' });
  }

  const chapterId = req.query?.id;
  if (!chapterId || Number.isNaN(Number(chapterId))) {
    return res.status(400).json({ error: 'ID surah tidak valid.' });
  }

  try {
    const raw = await readFile(join(CHAPTERS_DIR, `${chapterId}.json`), 'utf8');
    return res.status(200).json(JSON.parse(raw));
  } catch (error) {
    return res.status(500).json({ error: `Gagal memuat surah: ${error.message}` });
  }
}
