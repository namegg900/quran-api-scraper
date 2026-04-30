const chapterSelect = document.getElementById('chapterSelect');
const chapterInfo = document.getElementById('chapterInfo');
const versesContainer = document.getElementById('versesContainer');
const todayDate = document.getElementById('todayDate');

todayDate.textContent = `Tarikh hari ini: ${new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}`;

async function loadChapters() {
  const res = await fetch('/api/chapters');
  if (!res.ok) throw new Error('Gagal memuat daftar surah.');
  const data = await res.json();

  chapterSelect.innerHTML = data.chapters
    .map(
      (c) =>
        `<option value="${c.id}">${c.id}. ${c.name_simple} (${c.name_arabic})</option>`
    )
    .join('');

  if (data.chapters.length > 0) {
    await loadChapter(data.chapters[0].id);
  }
}

async function loadChapter(chapterId) {
  const res = await fetch(`/api/chapter/${chapterId}`);
  if (!res.ok) throw new Error('Gagal memuat detail surah.');
  const data = await res.json();

  chapterInfo.innerHTML = `
    <h2>Surah ${data.chapter.name_simple} - ${data.chapter.name_arabic}</h2>
    <p><strong>ID:</strong> ${data.chapter.id} | <strong>Jumlah Ayat:</strong> ${data.chapter.verses_count}</p>
    <p><strong>Terjemahan Indonesia:</strong> ${data.chapter.translated_names?.id || '-'}</p>
  `;

  versesContainer.innerHTML = data.verses
    .map(
      (verse) => `
      <article class="verse">
        <div><strong>${verse.verse_key}</strong></div>
        <div class="arabic">${verse.text_uthmani}</div>
        <div class="translation">${verse.translations?.id || '-'}</div>
      </article>
    `
    )
    .join('');
}

chapterSelect.addEventListener('change', (event) => {
  loadChapter(event.target.value).catch(showError);
});

function showError(error) {
  chapterInfo.innerHTML = `<p style="color: #b42318;">${error.message}</p>`;
}

loadChapters().catch(showError);
