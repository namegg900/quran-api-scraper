import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const CHAPTERS_DIR = join(process.cwd(), 'chapters');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method tidak diizinkan.' });
  }

  try {
    const files = (await readdir(CHAPTERS_DIR))
      .filter((name) => name.endsWith('.json'))
      .sort((a, b) => Number(a.replace('.json', '')) - Number(b.replace('.json', '')));

    const chapters = [];
    for (const fileName of files) {
      const chapterData = JSON.parse(await readFile(join(CHAPTERS_DIR, fileName), 'utf8'));
      chapters.push({
        id: chapterData.chapter.id,
        name_simple: chapterData.chapter.name_simple,
        name_arabic: chapterData.chapter.name_arabic,
        verses_count: chapterData.chapter.verses_count,
        translated_names: chapterData.chapter.translated_names,
      });
    }

    return res.status(200).json({ chapters });
  } catch (error) {
    return res.status(500).json({ error: `Gagal memuat daftar surah: ${error.message}` });
  }
}
