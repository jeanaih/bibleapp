let bibleData = null;
let currentBook = 'Genesis';
let currentChapter = '1';

// === ENGLISH BOOK LISTS ===
const oldTestament = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs', 'Ecclesiastes', 'Song Of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
];

const newTestament = [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

// === TAGALOG BOOKS ===
const tagalogBookNames = {
    1: "Genesis", 2: "Exodo", 3: "Levitico", 4: "Mga Bilang", 5: "Deuteronomio",
    6: "Josue", 7: "Mga Hukom", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
    11: "1 Mga Hari", 12: "2 Mga Hari", 13: "1 Cronica", 14: "2 Cronica",
    15: "Ezra", 16: "Nehemias", 17: "Ester", 18: "Job", 19: "Mga Awit",
    20: "Mga Kawikaan", 21: "Eclesiastes", 22: "Awit ni Solomon", 23: "Isaias",
    24: "Jeremias", 25: "Panaghoy", 26: "Ezekiel", 27: "Daniel", 28: "Oseas",
    29: "Joel", 30: "Amos", 31: "Obadias", 32: "Jonas", 33: "Mikas",
    34: "Nahum", 35: "Habakuk", 36: "Zefanias", 37: "Hagai", 38: "Zacarias",
    39: "Malakias",
    40: "Mateo", 41: "Marcos", 42: "Lucas", 43: "Juan",
    44: "Mga Gawa", 45: "Roma", 46: "1 Corinto", 47: "2 Corinto",
    48: "Galacia", 49: "Efeso", 50: "Filipos", 51: "Colosas",
    52: "1 Tesalonica", 53: "2 Tesalonica", 54: "1 Timoteo",
    55: "2 Timoteo", 56: "Tito", 57: "Filemon", 58: "Hebreo",
    59: "Santiago", 60: "1 Pedro", 61: "2 Pedro", 62: "1 Juan",
    63: "2 Juan", 64: "3 Juan", 65: "Judas", 66: "Pahayag"
};

// === MAIN INIT ===
document.addEventListener('DOMContentLoaded', initializeBible);

async function initializeBible() {
    const saved = JSON.parse(localStorage.getItem('bibleState'));
    if (saved) {
        currentBook = saved.book || 'Genesis';
        currentChapter = saved.chapter || '1';
        const verSel = document.getElementById('bibleVersion');
        const currentVersionSpan = document.getElementById('currentVersion');

        if (verSel && saved.version) {
            verSel.value = saved.version;
            // Update the visible version display
            if (currentVersionSpan) {
                currentVersionSpan.textContent = saved.version;
            }
        }
    }

    // Event Listeners
    document.getElementById('bibleVersion').addEventListener('change', onVersionSwitch);
    document.getElementById('selectBookChapter').addEventListener('click', toggleUnifiedModal);
    document.getElementById('prevChapter').addEventListener('click', () => changeChapter(-1));
    document.getElementById('nextChapter').addEventListener('click', () => changeChapter(1));
    document.querySelectorAll('.tab-btn').forEach(btn =>
        btn.addEventListener('click', e => switchTestament(e.target.dataset.testament))
    );

    initializeSearch();
    await loadBible();

    // Handle URL parameters for direct navigation to verse
    checkUrlParams();

    // Apply dark mode if enabled
    applyDarkMode();

    // Initialize version modal
    initVersionModal();

    // Adjust search icon position based on version filter width
    adjustSearchIconPosition();
}

function applyDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    const bibleContent = document.getElementById('bibleContent');
    if (bibleContent && isDarkMode) {
        bibleContent.classList.add('dark-mode');
    }
}

// Dynamically adjust search icon position to follow version filter
function adjustSearchIconPosition() {
    const versionTrigger = document.getElementById('versionTrigger');
    const searchTrigger = document.querySelector('.search-trigger');

    if (!versionTrigger || !searchTrigger) return;

    function updatePosition() {
        const versionWidth = versionTrigger.offsetWidth;
        const gap = 16; // Gap between search and version buttons
        const rightPosition = versionWidth + gap + 20; // 20px is version's right margin
        searchTrigger.style.right = `${rightPosition}px`;
    }

    // Update on load
    setTimeout(updatePosition, 100); // Small delay to ensure element is rendered

    // Update on resize
    window.addEventListener('resize', updatePosition);

    // Update when version text changes (observer for dynamic content)
    const observer = new MutationObserver(updatePosition);
    observer.observe(versionTrigger, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

// === VERSION MODAL ===
function initVersionModal() {
    const versionTrigger = document.getElementById('versionTrigger');
    const versionModal = document.getElementById('versionModal');
    const closeBtn = document.getElementById('closeVersionModal');
    const versionItems = document.querySelectorAll('.version-item');
    const versionSelect = document.getElementById('bibleVersion');
    const currentVersionSpan = document.getElementById('currentVersion');

    // Open modal
    versionTrigger.addEventListener('click', () => {
        versionModal.classList.add('active');
        versionTrigger.classList.add('active');
        updateActiveVersion();
    });

    // Close modal
    closeBtn.addEventListener('click', closeModal);
    versionModal.addEventListener('click', (e) => {
        if (e.target === versionModal) closeModal();
    });

    function closeModal() {
        versionModal.classList.remove('active');
        versionTrigger.classList.remove('active');
    }

    // Select version
    versionItems.forEach(item => {
        item.addEventListener('click', () => {
            const version = item.dataset.version;
            versionSelect.value = version;
            currentVersionSpan.textContent = version;

            // Trigger change event
            versionSelect.dispatchEvent(new Event('change'));

            closeModal();
        });
    });

    function updateActiveVersion() {
        const currentVersion = versionSelect.value;
        versionItems.forEach(item => {
            if (item.dataset.version === currentVersion) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Update display on version change
    versionSelect.addEventListener('change', () => {
        currentVersionSpan.textContent = versionSelect.value;
    });
}

// === CHECK URL PARAMETERS ===
function checkUrlParams() {
    // First check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let book = urlParams.get('book');
    let chapter = urlParams.get('chapter');
    let verse = urlParams.get('verse');

    // If no URL params, check localStorage for navigation from daily page
    if (!book) {
        const navigateData = localStorage.getItem('navigateToVerse');
        if (navigateData) {
            try {
                const data = JSON.parse(navigateData);
                book = data.book;
                chapter = data.chapter;
                verse = data.verse;
                // Clear after reading
                localStorage.removeItem('navigateToVerse');
            } catch (e) {
                console.error('Error parsing navigateToVerse data:', e);
            }
        }
    }

    if (book) {
        // Navigate to the specified verse
        setTimeout(() => {
            navigateToVerse(book, chapter, verse);
        }, 500); // Small delay to ensure Bible data is loaded
    }
}

// === SMOOTH VERSION SWITCH ===
async function onVersionSwitch() {
    const contentDiv = document.getElementById('bibleContent');
    contentDiv.classList.add('fade-out');

    setTimeout(async () => {
        await loadBible();
        contentDiv.classList.remove('fade-out');
        contentDiv.classList.add('fade-in');
        setTimeout(() => contentDiv.classList.remove('fade-in'), 200); // Reduced from 400ms
    }, 100); // Reduced from 250ms
}

// === LOAD BIBLE ===
async function loadBible() {
    const version = document.getElementById('bibleVersion').value;
    const contentDiv = document.getElementById('bibleContent');
    contentDiv.innerHTML = `<div class="loading">Loading ${version}...</div>`;

    try {
        let biblePath, response;

        // ✅ Tagalog-family versions (MBBTAG12, ASND, Cebuano)
        if (['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version)) {
            if (version === 'MBBTAG12') {
                biblePath = `../Bible Versions/Tagalog/MBBTAG12.xml`;
            } else if (version === 'ASND') {
                biblePath = `../Bible Versions/ASND/ASND.xml`;
            } else if (version === 'CEBUANO') {
                biblePath = `../Bible Versions/CEBUANO/CEBUANO.xml`;
            }
            else if (version === 'KAPAMPANGAN') {
                biblePath = `../Bible Versions/KAPAMPANGAN/KAPAMPANGAN.xml`;
            }

            response = await fetch(biblePath);
            const xml = await response.text();
            const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");
            bibleData = parseMBBTagalog(xmlDoc);
        } else {
            // ✅ JSON-based (English) versions
            biblePath = `../Bible Versions/${version}/${version}_bible.json`;
            response = await fetch(biblePath);
            bibleData = await response.json();
        }

        if (!bibleData) throw new Error("No Bible data loaded");

        updateTestamentTabs(version);
        setupBookList('old', version);
        syncBookLanguage(version);
        updateCurrentBookDisplay();
        await displayContent();
        saveBibleState();

    } catch (err) {
        console.error('Error loading Bible:', err);
        contentDiv.innerHTML = `
      <div class="error">
        <p>Failed to load ${version} content.</p>
        <button onclick="loadBible()">Retry</button>
      </div>`;
    }
}

// === SYNC BOOK LANGUAGE ===
function syncBookLanguage(version) {
    const isTagalogLike = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);
    const allBooks = [...oldTestament, ...newTestament];

    if (isTagalogLike) {
        const engIndex = allBooks.indexOf(currentBook) + 1;
        if (engIndex > 0 && tagalogBookNames[engIndex]) {
            currentBook = tagalogBookNames[engIndex];
        }
    } else {
        const tagIndex = Object.values(tagalogBookNames).indexOf(currentBook);
        if (tagIndex >= 0) {
            currentBook = allBooks[tagIndex] || 'Genesis';
        }
    }
}

// === PARSE XML ===
function parseMBBTagalog(xmlDoc) {
    const data = {};
    const books = xmlDoc.getElementsByTagName("book");

    for (let book of books) {
        const num = parseInt(book.getAttribute("number"));
        const name = tagalogBookNames[num] || `Aklat ${num}`;
        data[name] = {};

        const chapters = book.getElementsByTagName("chapter");
        for (let chapter of chapters) {
            const chapNum = chapter.getAttribute("number");
            data[name][chapNum] = {};
            const verses = chapter.getElementsByTagName("verse");
            for (let verse of verses) {
                const vNum = verse.getAttribute("number");
                const text = verse.textContent.trim();
                data[name][chapNum][vNum] = text;
            }
        }
    }
    return data;
}

// === BOOK LIST HANDLER ===
function setupBookList(testament, version) {
    const bookList = document.getElementById('modalList');
    bookList.innerHTML = '';
    // Set book mode class for 2-column grid
    bookList.className = 'modal-list book-mode';

    const isTagalogLike = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);
    let books;

    if (isTagalogLike) {
        const nums = testament === 'old'
            ? Array.from({ length: 39 }, (_, i) => i + 1)
            : Array.from({ length: 27 }, (_, i) => i + 40);
        books = nums.map(num => tagalogBookNames[num]);
    } else {
        books = testament === 'old' ? oldTestament : newTestament;
    }

    books.forEach(book => {
        const el = document.createElement('div');
        el.className = 'book-item';
        el.textContent = book;
        el.addEventListener('click', () => selectBook(book));
        bookList.appendChild(el);
    });
}

// === TESTAMENT TABS ===
function updateTestamentTabs(version) {
    const tabOld = document.querySelector('[data-testament="old"]');
    const tabNew = document.querySelector('[data-testament="new"]');
    const isTagalogLike = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);

    if (isTagalogLike) {
        tabOld.textContent = 'Lumang Tipan';
        tabNew.textContent = 'Bagong Tipan';
    } else {
        tabOld.textContent = 'Old Testament';
        tabNew.textContent = 'New Testament';
    }
}

function switchTestament(testament) {
    document.querySelectorAll('.tab-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.testament === testament)
    );
    const version = document.getElementById('bibleVersion').value;
    setupBookList(testament, version);
}

// === BOOK & CHAPTER SELECTION ===
function selectBook(book) {
    currentBook = book;
    const modalTitle = document.getElementById('modalTitle');
    const testamentTabs = document.getElementById('testamentTabs');
    const modalList = document.getElementById('modalList');
    const modal = document.getElementById('unifiedModal');

    modalTitle.textContent = `${book}`;
    testamentTabs.style.display = 'none';
    modal.dataset.mode = 'chapter';
    // Set chapter mode class for grid layout
    modalList.className = 'modal-list chapter-mode';

    if (!bibleData || !bibleData[book]) return;

    const total = Object.keys(bibleData[book]).length;
    modalList.innerHTML = '';

    // Create grid layout for chapters
    for (let i = 1; i <= total; i++) {
        const div = document.createElement('div');
        div.className = `chapter-item ${i === parseInt(currentChapter) ? 'active' : ''}`;
        div.textContent = i;
        div.addEventListener('click', () => {
            currentChapter = i.toString();
            modal.dataset.mode = 'book';
            toggleUnifiedModal();
            updateCurrentBookDisplay();
            displayContent();
            saveBibleState();

            // Scroll to top of the page smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        modalList.appendChild(div);
    }
}

// Update the updateCurrentBookDisplay function
function updateCurrentBookDisplay() {
    // Main display
    document.getElementById('selectBookChapter').innerHTML = `
    <span id="currentBook">${currentBook}</span>
    <span id="currentChapter">${currentChapter}</span>
  `;

    document.getElementById('bookTitle').innerHTML = `
    <span class="book-name">${currentBook}</span>
    <span class="chapter-number">${currentChapter}</span>`;

    // Update navigation buttons
    updateNavigationButtons();
}

// Add new function to update navigation buttons
function updateNavigationButtons() {
    if (!bibleData || !bibleData[currentBook]) return;

    const total = Object.keys(bibleData[currentBook]).length;
    const current = parseInt(currentChapter);

    // Previous chapter
    const prevChap = current > 1 ? current - 1 : total;
    document.getElementById('prevChapterText').textContent = ` ${prevChap}`;

    // Next chapter
    const nextChap = current < total ? current + 1 : 1;
    document.getElementById('nextChapterText').textContent = `${nextChap} `;

    // Enable/disable buttons based on availability
    document.getElementById('prevChapter').disabled = !bibleData[currentBook][prevChap.toString()];
    document.getElementById('nextChapter').disabled = !bibleData[currentBook][nextChap.toString()];
}

// Update the changeChapter function
function changeChapter(delta) {
    if (!bibleData || !bibleData[currentBook]) return;
    const total = Object.keys(bibleData[currentBook]).length;
    let newChap = parseInt(currentChapter) + delta;
    if (newChap < 1) newChap = total;
    if (newChap > total) newChap = 1;
    currentChapter = newChap.toString();
    updateCurrentBookDisplay();
    displayContent();
    saveBibleState();

    // Scroll to top of the page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === UNIFIED MODAL ===
function toggleUnifiedModal() {
    const modal = document.getElementById('unifiedModal');
    const modalTitle = document.getElementById('modalTitle');
    const testamentTabs = document.getElementById('testamentTabs');

    if (modal.style.display === 'block') {
        modal.style.display = 'none';
        return;
    }

    modal.style.display = 'block';
    if (!modal.dataset.mode || modal.dataset.mode === 'book') {
        modalTitle.textContent = 'Select Book';
        testamentTabs.style.display = 'flex';
        const version = document.getElementById('bibleVersion').value;
        setupBookList('old', version);
    }
}

// === DISPLAY CONTENT ===
async function displayContent() {
    const div = document.getElementById('bibleContent');
    if (!bibleData || !bibleData[currentBook] || !bibleData[currentBook][currentChapter]) {
        div.innerHTML = '<p>No content available.</p>';
        return;
    }

    const verses = bibleData[currentBook][currentChapter];
    const heartedVerses = JSON.parse(localStorage.getItem('heartedVerses') || '{}');
    const highlights = JSON.parse(localStorage.getItem('verseHighlights') || '{}');
    const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');

    div.innerHTML = Object.entries(verses)
        .map(([num, text]) => {
            const verseKey = `${currentBook}:${currentChapter}:${num}`;
            const verseRef = `${currentBook} ${currentChapter}:${num}`;
            const isHearted = heartedVerses[verseKey];
            const isSaved = savedVerses.some(v => v.reference === verseRef);
            const verseHighlights = highlights[verseKey] || [];

            // Apply highlights to text
            let displayText = text;
            if (verseHighlights.length > 0) {
                verseHighlights.forEach(hl => {
                    const regex = new RegExp(`(${escapeRegex(hl.text)})`, 'gi');
                    displayText = displayText.replace(regex, `<mark style="background-color: ${hl.color};">$1</mark>`);
                });
            }

            const heartIcon = isHearted ? '<i class="bi bi-heart-fill verse-heart"></i>' : '';
            const bookmarkIcon = isSaved ? '<i class="bi bi-bookmark-fill verse-bookmark"></i>' : '';
            return `<div class="verse" data-verse-key="${verseKey}" data-verse-ref="${verseRef}">
        <strong>${num}</strong> ${displayText} ${heartIcon}${bookmarkIcon}
      </div>`;
        })
        .join('');

    // Add verse interaction listeners
    setupVerseInteractions();
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// === SAVE STATE ===
function saveBibleState() {
    const version = document.getElementById('bibleVersion').value;
    localStorage.setItem('bibleState', JSON.stringify({
        book: currentBook,
        chapter: currentChapter,
        version
    }));
}

// === MODALS ===
document.addEventListener('click', e => {
    const modal = document.getElementById('unifiedModal');
    if (e.target === modal) {
        modal.dataset.mode = 'book';
        toggleUnifiedModal();
    }
});

// === SMART SEARCH === 
function initializeSearch() {
    const searchInput = document.getElementById('bibleSearch');
    const suggestionsDiv = document.getElementById('searchSuggestions');

    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Handle search from URL params if any
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        searchInput.value = searchQuery;
        handleSearch({ target: searchInput });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    const suggestionsDiv = document.getElementById('searchSuggestions');

    if (query.length < 2) {
        suggestionsDiv.innerHTML = '';
        return;
    }

    const results = await searchBible(query);
    displaySearchSuggestions(results, query);
}

// === IMPROVED SMART SEARCH === 
function levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j - 1][i] + 1,
                matrix[j][i - 1] + 1,
                matrix[j - 1][i - 1] + cost
            );
        }
    }

    return matrix[b.length][a.length];
}

async function searchBible(query) {
    const results = [];
    const normalizedQuery = query.toLowerCase().trim();

    // Enhanced patterns for different search types
    const patterns = {
        bookChapterVerse: /^((?:[123]\s)?[A-Za-z\s]+)\s*(\d+)(?:[\s:]+(\d+))?$/i,
        chapterVerse: /^(\d+)[\s:]+(\d+)$/,
        chapter: /^(\d+)$/,
        text: /^(.+)$/
    };

    // Get all books in current language
    const version = document.getElementById('bibleVersion').value;
    const isTagalogVersion = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);

    // Try book chapter verse pattern first
    const bcvMatch = normalizedQuery.match(patterns.bookChapterVerse);
    if (bcvMatch) {
        const [, bookPart, chapter, verse] = bcvMatch;
        const bookMatches = findBookMatches(bookPart, isTagalogVersion);

        for (const match of bookMatches) {
            if (bibleData[match.book]?.[chapter]) {
                if (verse) {
                    if (bibleData[match.book][chapter][verse]) {
                        results.push({
                            type: 'reference',
                            book: match.book,
                            chapter,
                            verse,
                            text: bibleData[match.book][chapter][verse],
                            score: match.score
                        });
                    }
                } else {
                    // Match whole chapter
                    results.push({
                        type: 'chapter',
                        book: match.book,
                        chapter,
                        score: match.score
                    });
                }
            }
        }
    }

    // If no exact matches found, search for partial matches
    if (results.length === 0) {
        // Search through all books and content
        for (const book in bibleData) {
            const bookScore = getBookMatchScore(book.toLowerCase(), normalizedQuery);

            for (const chapter in bibleData[book]) {
                for (const verse in bibleData[book][chapter]) {
                    const text = bibleData[book][chapter][verse].toLowerCase();
                    const textScore = text.includes(normalizedQuery) ?
                        (text.split(normalizedQuery).length - 1) : 0;

                    if (bookScore > 0.3 || textScore > 0) {
                        results.push({
                            type: 'text',
                            book,
                            chapter,
                            verse,
                            text: bibleData[book][chapter][verse],
                            score: Math.max(bookScore, textScore / 10)
                        });
                    }
                }
            }
        }
    }

    // Sort results by score
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10); // Return top 10 results
}

function findBookMatches(bookQuery, isTagalogVersion) {
    const matches = [];
    const searchQuery = bookQuery.toLowerCase().trim();

    // Search in both English and Tagalog books
    const searchBooks = (books, isTagalog) => {
        books.forEach(book => {
            const score = getBookMatchScore(book.toLowerCase(), searchQuery);
            if (score > 0.3) { // Threshold for similarity
                matches.push({
                    book,
                    score,
                    isTagalog
                });
            }
        });
    };

    // Search in both languages
    searchBooks(Object.values(tagalogBookNames), true);
    searchBooks([...oldTestament, ...newTestament], false);

    // Sort by score and prefer current language version
    matches.sort((a, b) => {
        if (a.isTagalog === isTagalogVersion && b.isTagalog !== isTagalogVersion) return -1;
        if (a.isTagalog !== isTagalogVersion && b.isTagalog === isTagalogVersion) return 1;
        return b.score - a.score;
    });

    return matches;
}

function getBookMatchScore(bookName, query) {
    // Check exact match first
    if (bookName === query) return 1;
    if (bookName.includes(query)) return 0.8;

    // Check for word matches
    const bookWords = bookName.split(/\s+/);
    const queryWords = query.split(/\s+/);

    let maxWordScore = 0;
    for (const queryWord of queryWords) {
        for (const bookWord of bookWords) {
            const similarity = 1 - (levenshteinDistance(bookWord, queryWord) /
                Math.max(bookWord.length, queryWord.length));
            maxWordScore = Math.max(maxWordScore, similarity);
        }
    }

    return maxWordScore;
}

// Update displaySearchSuggestions for better presentation
function displaySearchSuggestions(results, query) {
    const suggestionsDiv = document.getElementById('searchSuggestions');

    if (results.length === 0) {
        suggestionsDiv.innerHTML = '<div class="suggestion-item">No matches found. Try different spelling or format (e.g., "John 3:16" or "Juan 3 16")</div>';
        return;
    }

    const groupedResults = {
        exact: results.filter(r => r.exact),
        others: results.filter(r => !r.exact)
    };

    suggestionsDiv.innerHTML = [
        ...groupedResults.exact.map(formatSuggestion),
        ...groupedResults.others.map(formatSuggestion)
    ].join('');
}

function formatSuggestion(result) {
    const highlightMatch = (text, query) => {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    };

    switch (result.type) {
        case 'reference':
            return `<div class="suggestion-item" onclick="navigateToVerse('${result.book}', '${result.chapter}', '${result.verse}')">
                <div class="suggestion-title">${result.book} ${result.chapter}:${result.verse}</div>
                <div class="suggestion-preview">${truncateText(result.text, 60)}</div>
            </div>`;
        case 'chapter':
            return `<div class="suggestion-item" onclick="navigateToVerse('${result.book}', '${result.chapter}')">
                <div class="suggestion-title">${result.book} ${result.chapter}</div>
                <div class="suggestion-preview">View entire chapter</div>
            </div>`;
        case 'book':
            return `<div class="suggestion-item" onclick="navigateToVerse('${result.book}')">
                <div class="suggestion-title">${result.book}</div>
                <div class="suggestion-preview">View book</div>
            </div>`;
        case 'text':
            return `<div class="suggestion-item" onclick="navigateToVerse('${result.book}', '${result.chapter}', '${result.verse}')">
                <div class="suggestion-title">${result.book} ${result.chapter}:${result.verse}</div>
                <div class="suggestion-preview">${truncateText(result.text, 60)}</div>
            </div>`;
    }
}

function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function navigateToVerse(book, chapter, verse) {
    currentBook = book;
    if (chapter) currentChapter = chapter;

    // Close search overlay
    document.getElementById('searchOverlay')?.classList.remove('active');

    // Update display and save state
    updateCurrentBookDisplay();
    displayContent().then(() => {
        if (verse) {
            // Small delay to ensure DOM is fully rendered
            setTimeout(() => {
                // Use data-verse-key to find the exact verse
                const verseKey = `${book}:${chapter}:${verse}`;
                console.log('Looking for verse:', verseKey);
                const verseElement = document.querySelector(`[data-verse-key="${verseKey}"]`);

                if (verseElement) {
                    console.log('Found verse element, scrolling to it');

                    // First, scroll to the verse without highlighting
                    verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Wait for scroll to complete before highlighting
                    setTimeout(() => {
                        console.log('Adding highlight after scroll');
                        verseElement.classList.add('highlighted');

                        // Remove highlight on scroll
                        const removeHighlightOnScroll = () => {
                            verseElement.classList.remove('highlighted');
                            document.getElementById('bibleContent')?.removeEventListener('scroll', removeHighlightOnScroll);
                            window.removeEventListener('scroll', removeHighlightOnScroll);
                        };

                        // Add scroll listeners with a small delay to prevent immediate removal
                        setTimeout(() => {
                            document.getElementById('bibleContent')?.addEventListener('scroll', removeHighlightOnScroll, { once: true });
                            window.addEventListener('scroll', removeHighlightOnScroll, { once: true });
                        }, 300);

                        // Also remove highlight after 5 seconds as fallback
                        setTimeout(() => {
                            verseElement.classList.remove('highlighted');
                            document.getElementById('bibleContent')?.removeEventListener('scroll', removeHighlightOnScroll);
                            window.removeEventListener('scroll', removeHighlightOnScroll);
                        }, 5000);
                    }, 500); // Wait 500ms after scroll starts before highlighting
                } else {
                    console.error('Verse element not found:', verseKey);
                }
            }, 500); // Initial delay for DOM rendering
        }
    });

    // Save Bible state
    saveBibleState();
}

// === VERSE INTERACTIONS (HEART & HIGHLIGHT) ===
function setupVerseInteractions() {
    const verses = document.querySelectorAll('.verse');
    let lastTap = 0;

    verses.forEach(verse => {
        // Double tap for mobile
        verse.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                showVerseContextMenu(verse, e.touches[0].clientX, e.touches[0].clientY);
            }
            lastTap = currentTime;
        });

        // Right click for desktop
        verse.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showVerseContextMenu(verse, e.clientX, e.clientY);
        });
    });
}

function showVerseContextMenu(verseElement, x, y) {
    // Remove existing menu
    const existing = document.getElementById('verseContextMenu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'verseContextMenu';
    menu.className = 'verse-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const verseKey = verseElement.dataset.verseKey;
    const verseRef = verseElement.dataset.verseRef;
    const heartedVerses = JSON.parse(localStorage.getItem('heartedVerses') || '{}');
    const isHearted = heartedVerses[verseKey];

    const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');
    const isSaved = savedVerses.some(v => v.reference === verseRef);

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    const highlights = JSON.parse(localStorage.getItem('verseHighlights') || '{}');
    const verseHighlights = highlights[verseKey] || [];
    const hasHighlights = verseHighlights.length > 0;

    menu.innerHTML = `
      
    
    <div class="context-menu-icon" data-action="heart" title="${isHearted ? 'Remove Heart' : 'Add Heart'}">
      <i class="bi bi-heart${isHearted ? '-fill' : ''}"></i>
    </div>
    <div class="context-menu-icon" data-action="copy-text" title="Copy Verse">
      <i class="bi bi-clipboard"></i>
    </div>
    <div class="context-menu-icon" data-action="save" title="${isSaved ? 'Remove Bookmark' : 'Save Verse'}">
      <i class="bi bi-bookmark${isSaved ? '-fill' : ''}"></i>
    </div>
    ${selectedText ? `
      <div class="context-menu-divider"></div>
      <div class="context-menu-icon" data-action="highlight" data-color="#fef08a" title="Yellow">
        <div class="highlight-dot" style="background: #fef08a;"></div>
      </div>
      <div class="context-menu-icon" data-action="highlight" data-color="#fecaca" title="Red">
        <div class="highlight-dot" style="background: #fecaca;"></div>
      </div>
      <div class="context-menu-icon" data-action="highlight" data-color="#bbf7d0" title="Green">
        <div class="highlight-dot" style="background: #bbf7d0;"></div>
      </div>
      <div class="context-menu-icon" data-action="highlight" data-color="#bfdbfe" title="Blue">
        <div class="highlight-dot" style="background: #bfdbfe;"></div>
      </div>
      <div class="context-menu-icon" data-action="highlight" data-color="#e9d5ff" title="Purple">
        <div class="highlight-dot" style="background: #e9d5ff;"></div>
      </div>
    ` : ''}
   
    ${hasHighlights ? `
      <div class="context-menu-divider"></div>
      <div class="context-menu-icon" data-action="remove-highlight" title="Remove All Highlights">
        <i class="bi bi-eraser"></i>
      </div>
    ` : ''}
  `;

    document.body.appendChild(menu);

    // Handle menu item clicks
    menu.querySelectorAll('.context-menu-icon').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;

            if (action === 'heart') {
                toggleHeart(verseKey);
            } else if (action === 'save') {
                toggleSaveVerse(verseElement);
            } else if (action === 'highlight') {
                const color = item.dataset.color;
                addHighlight(verseKey, selectedText, color);
            } else if (action === 'remove-highlight') {
                removeAllHighlights(verseKey);
            } else if (action === 'copy-text') {
                const verseText = verseElement.textContent.trim();
                const verseRef = verseElement.dataset.verseRef;
                const textToCopy = `${verseRef} ${verseText}`;

                navigator.clipboard.writeText(textToCopy).then(() => {
                    // Show a small notification that text was copied
                    const notification = document.createElement('div');
                    notification.textContent = 'Verse copied to clipboard';
                    notification.style.position = 'fixed';
                    notification.style.bottom = '20px';
                    notification.style.left = '50%';
                    notification.style.transform = 'translateX(-50%)';
                    notification.style.backgroundColor = '#4CAF50';
                    notification.style.color = 'white';
                    notification.style.padding = '10px 20px';
                    notification.style.borderRadius = '4px';
                    notification.style.zIndex = '1000';
                    document.body.appendChild(notification);

                    // Remove the notification after 2 seconds
                    setTimeout(() => {
                        notification.style.transition = 'opacity 0.5s';
                        notification.style.opacity = '0';
                        setTimeout(() => notification.remove(), 500);
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }

            menu.remove();
        });
    });

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }, 10);
    });
}

function toggleSaveVerse(verseElement) {
    const verseRef = verseElement.dataset.verseRef;
    const verseKey = verseElement.dataset.verseKey;

    // Get the verse text (remove the verse number and icons)
    const verseTextElement = verseElement.cloneNode(true);
    verseTextElement.querySelector('strong').remove();
    const icons = verseTextElement.querySelectorAll('i');
    icons.forEach(icon => icon.remove());
    const verseText = verseTextElement.textContent.trim();

    const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');
    const index = savedVerses.findIndex(v => v.reference === verseRef);

    if (index >= 0) {
        // Remove from saved
        savedVerses.splice(index, 1);
    } else {
        // Add to saved
        savedVerses.unshift({
            reference: verseRef,
            text: verseText,
            timestamp: Date.now()
        });
    }

    localStorage.setItem('savedVerses', JSON.stringify(savedVerses));
    displayContent();
}

function toggleHeart(verseKey) {
    const heartedVerses = JSON.parse(localStorage.getItem('heartedVerses') || '{}');

    if (heartedVerses[verseKey]) {
        delete heartedVerses[verseKey];
    } else {
        heartedVerses[verseKey] = Date.now();
    }

    localStorage.setItem('heartedVerses', JSON.stringify(heartedVerses));
    displayContent();
}

function addHighlight(verseKey, text, color) {
    const highlights = JSON.parse(localStorage.getItem('verseHighlights') || '{}');

    if (!highlights[verseKey]) {
        highlights[verseKey] = [];
    }

    // Check if already highlighted
    const existing = highlights[verseKey].find(h => h.text === text);
    if (existing) {
        existing.color = color; // Update color
    } else {
        highlights[verseKey].push({ text, color, timestamp: Date.now() });
    }

    localStorage.setItem('verseHighlights', JSON.stringify(highlights));
    displayContent();
}

function removeAllHighlights(verseKey) {
    const highlights = JSON.parse(localStorage.getItem('verseHighlights') || '{}');
    delete highlights[verseKey];
    localStorage.setItem('verseHighlights', JSON.stringify(highlights));
    displayContent();
}

// Add this new function after initializeSearch()
function toggleSearch() {
    const overlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('bibleSearch');

    overlay.classList.toggle('active');

    if (overlay.classList.contains('active')) {
        searchInput.focus();
        // Clear previous search when opening
        searchInput.value = '';
        document.getElementById('searchSuggestions').innerHTML = '';
    }
}

// Add ESC key handler to close search
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('searchOverlay').classList.remove('active');
    }
});