import { createServer } from 'http';
import { readFile, readdir } from 'fs/promises';
import { extname, join } from 'path';

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = join(process.cwd(), 'public');
const CHAPTERS_DIR = join(process.cwd(), 'chapters');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

async function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': MIME_TYPES['.json'] });
  res.end(JSON.stringify(payload));
}

async function serveStatic(res, pathName) {
  try {
    const cleanPath = pathName === '/' ? '/index.html' : pathName;
    const fullPath = join(PUBLIC_DIR, cleanPath);
    const data = await readFile(fullPath);
    const mimeType = MIME_TYPES[extname(fullPath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  } catch {
    await sendJson(res, 404, { error: 'File tidak ditemukan.' });
  }
}

async function handleApi(req, res) {
  try {
    if (req.url === '/api/chapters') {
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

      return sendJson(res, 200, { chapters });
    }

    if (req.url?.startsWith('/api/chapter/')) {
      const chapterId = req.url.split('/').pop();
      if (!chapterId || Number.isNaN(Number(chapterId))) {
        return sendJson(res, 400, { error: 'ID surah tidak valid.' });
      }

      const filePath = join(CHAPTERS_DIR, `${chapterId}.json`);
      const raw = await readFile(filePath, 'utf8');
      return sendJson(res, 200, JSON.parse(raw));
    }

    return sendJson(res, 404, { error: 'Endpoint tidak ditemukan.' });
  } catch (error) {
    return sendJson(res, 500, { error: `Terjadi kesalahan server: ${error.message}` });
  }
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    return sendJson(res, 400, { error: 'Permintaan tidak valid.' });
  }

  if (req.url.startsWith('/api/')) {
    return handleApi(req, res);
  }

  return serveStatic(res, req.url);
});

server.listen(PORT, () => {
  console.log(`Quran web app berjalan di http://localhost:${PORT}`);
});
