const chapterSelect = document.getElementById('chapterSelect');
const ayahPerPage = document.getElementById('ayahPerPage');
const chapterInfo = document.getElementById('chapterInfo');
const versesContainer = document.getElementById('versesContainer');
const todayDate = document.getElementById('todayDate');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageIndicator = document.getElementById('pageIndicator');

const API_BASE = 'https://api.quran.com/api/v4';
let activeChapter = null;
let page = 1;

function updateTodayDate() {
  todayDate.textContent = `Tarikh hari ini: ${new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })}`;
}

function showError(error) {
  chapterInfo.innerHTML = `<p class="error">${error.message}</p>`;
}

function getTotalPages() {
  if (!activeChapter?.verses) return 1;
  return Math.max(1, Math.ceil(activeChapter.verses.length / Number(ayahPerPage.value)));
}

function renderPage(direction = 'next') {
  if (!activeChapter?.verses) return;

  const perPage = Number(ayahPerPage.value);
  const start = (page - 1) * perPage;
  const visibleVerses = activeChapter.verses.slice(start, start + perPage);

  versesContainer.classList.remove('flip-next', 'flip-prev');
  versesContainer.classList.add(direction === 'prev' ? 'flip-prev' : 'flip-next');

  versesContainer.innerHTML = visibleVerses.map((verse) => `
    <article class="verse">
      <div><strong>${verse.verse_key}</strong></div>
      <div class="arabic">${verse.text_uthmani || '-'}</div>
      <div class="translation">${verse.translations?.[0]?.text || 'Terjemahan belum tersedia.'}</div>
    </article>
  `).join('');

  const totalPages = getTotalPages();
  pageIndicator.textContent = `Halaman ${page} / ${totalPages}`;
  prevPage.disabled = page <= 1;
  nextPage.disabled = page >= totalPages;
}

async function fetchAllVerses(chapterId) {
  const verses = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const res = await fetch(`${API_BASE}/verses/by_chapter/${chapterId}?language=id&words=false&translations=33&per_page=50&page=${currentPage}&fields=text_uthmani`);
    if (!res.ok) throw new Error('Gagal memuat ayat dari Quran API.');

    const data = await res.json();
    verses.push(...(data.verses || []));
    totalPages = data.pagination?.total_pages || 1;
    currentPage += 1;
  } while (currentPage <= totalPages);

  return verses;
}

async function loadChapter(chapterId) {
  const chapterRes = await fetch(`${API_BASE}/chapters/${chapterId}?language=id`);
  if (!chapterRes.ok) throw new Error('Gagal memuat detail surah.');
  const chapterData = await chapterRes.json();

  const verses = await fetchAllVerses(chapterId);

  activeChapter = {
    chapter: chapterData.chapter,
    verses,
  };

  page = 1;
  chapterInfo.innerHTML = `
    <h2>Surah ${activeChapter.chapter.name_simple} - ${activeChapter.chapter.name_arabic}</h2>
    <p><strong>ID:</strong> ${activeChapter.chapter.id} | <strong>Jumlah Ayat:</strong> ${activeChapter.chapter.verses_count}</p>
    <p><strong>Terjemahan Indonesia:</strong> ${activeChapter.chapter.translated_name?.name || '-'}</p>`;

  renderPage('next');
}

async function loadChapters() {
  const res = await fetch(`${API_BASE}/chapters?language=id`);
  if (!res.ok) throw new Error('Gagal memuat daftar surah.');
  const data = await res.json();

  chapterSelect.innerHTML = (data.chapters || []).map((c) =>
    `<option value="${c.id}">${c.id}. ${c.name_simple} (${c.name_arabic})</option>`
  ).join('');

  if (data.chapters?.length) {
    await loadChapter(data.chapters[0].id);
  }
}

chapterSelect.addEventListener('change', (event) => loadChapter(event.target.value).catch(showError));
ayahPerPage.addEventListener('change', () => {
  page = 1;
  renderPage('next');
});
prevPage.addEventListener('click', () => {
  if (page > 1) {
    page -= 1;
    renderPage('prev');
  }
});
nextPage.addEventListener('click', () => {
  if (page < getTotalPages()) {
    page += 1;
    renderPage('next');
  }
});

updateTodayDate();
loadChapters().catch(showError);
