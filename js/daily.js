let currentBook = '';
let currentChapter = '';
let currentVerse = '';
let bibleData = null;
let currentVersion = 'NIV'; // Default version

// Cache promise so multiple calls don't refetch
let biblePromise = null;

// === TAGALOG BOOK NAMES (from bible.js) ===
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

// === PARSE XML (from bible.js) ===
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

// AJAX-style async loader with version support
async function loadBible(version = null) {
    const versionToLoad = version || getDailyVersion();

    // If same version already loaded, return cached data
    if (bibleData && currentVersion === versionToLoad) {
        return bibleData;
    }

    // Reset if version changed
    if (currentVersion !== versionToLoad) {
        bibleData = null;
        biblePromise = null;
        currentVersion = versionToLoad;
    }

    if (bibleData) return bibleData; // already loaded
    if (biblePromise) return biblePromise; // currently loading

    let biblePath;
    const path = window.location.pathname;
    const basePath = path.includes("/pages/") || path.includes("\\pages\\")
        ? "../Bible%20Versions/"
        : "Bible%20Versions/";

    // ✅ Tagalog-family versions (MBBTAG12, ASND, Cebuano, Kapampangan)
    if (['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(versionToLoad)) {
        if (versionToLoad === 'MBBTAG12') {
            biblePath = `${basePath}Tagalog/MBBTAG12.xml`;
        } else if (versionToLoad === 'ASND') {
            biblePath = `${basePath}ASND/ASND.xml`;
        } else if (versionToLoad === 'CEBUANO') {
            biblePath = `${basePath}CEBUANO/CEBUANO.xml`;
        } else if (versionToLoad === 'KAPAMPANGAN') {
            biblePath = `${basePath}KAPAMPANGAN/KAPAMPANGAN.xml`;
        }

        console.log("📖 Loading Bible data (XML) via AJAX...");

        biblePromise = fetch(biblePath)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load XML (" + res.status + ")");
                return res.text();
            })
            .then(xml => {
                const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");
                bibleData = parseMBBTagalog(xmlDoc);
                console.log("✅ Bible data loaded successfully.");
                return bibleData;
            })
            .catch(err => {
                console.error("❌ Failed to load Bible:", err);
                const verseTextEl = document.getElementById("verse-text");
                if (verseTextEl) verseTextEl.textContent = "Failed to load verses.";
            });
    } else {
        // ✅ JSON-based (English) versions
        biblePath = `${basePath}${versionToLoad}/${versionToLoad}_bible.json`;

        console.log("📖 Loading Bible data (JSON) via AJAX...");

        biblePromise = fetch(biblePath)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load JSON (" + res.status + ")");
                return res.json();
            })
            .then(json => {
                bibleData = json;
                console.log("✅ Bible data loaded successfully.");
                return bibleData;
            })
            .catch(err => {
                console.error("❌ Failed to load Bible:", err);
                const verseTextEl = document.getElementById("verse-text");
                if (verseTextEl) verseTextEl.textContent = "Failed to load verses.";
            });
    }

    return biblePromise;
}

// Get version from bible page filter only
function getDailyVersion() {
    // Always use version from bible page (bibleState)
    const savedState = JSON.parse(localStorage.getItem('bibleState') || '{}');
    if (savedState && savedState.version) {
        return savedState.version;
    }

    // Default
    return 'NIV';
}

// Display verse smoothly
function displayVerse(data) {
    const verseTextEl = document.getElementById("verse-text");
    const verseRefEl = document.getElementById("verse-ref");

    if (!verseTextEl || !verseRefEl) return;
    if (!data) {
        verseTextEl.textContent = "Loading verse...";
        verseRefEl.textContent = "";
        return;
    }

    verseTextEl.style.opacity = 0;
    verseRefEl.style.opacity = 0;

    setTimeout(() => {
        verseTextEl.textContent = data.text;
        verseRefEl.textContent = `${data.book} ${data.chapter}:${data.verse}`;
        verseTextEl.style.opacity = 1;
        verseRefEl.style.opacity = 1;
    }, 150);
}

// Calculate ms until next midnight
function msUntilMidnight() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    return nextMidnight - now;
}

// Change verse & save to localStorage
async function setNewDailyVerse() {
    const version = getDailyVersion();
    if (!bibleData) {
        await loadBible(version);
    }

    const today = new Date().toDateString();
    // Use actual Bible data to get real chapter/verse counts
    const verseReference = await getDailyVerseReference(bibleData);

    localStorage.setItem("dailyVerse", JSON.stringify({
        date: today,
        reference: verseReference
    }));

    const verseData = getVerseFromReference(verseReference, bibleData, version);
    if (verseData) {
        displayVerse(verseData);
    }
}

// Initialize (AJAX + caching)
async function initDailyVerse() {
    try {
        displayVerse(null); // show "loading verse..."

        // Get current version from bible page
        const version = getDailyVersion();
        await loadBible(version);

        const today = new Date().toDateString();
        const savedData = JSON.parse(localStorage.getItem("dailyVerse") || "null");

        // Get or create verse reference (same for all versions on same date)
        let verseReference;
        if (savedData && savedData.date === today && savedData.reference) {
            verseReference = savedData.reference;
        } else {
            // Use actual Bible data to get real chapter/verse counts
            verseReference = await getDailyVerseReference(bibleData);
            localStorage.setItem("dailyVerse", JSON.stringify({
                date: today,
                reference: verseReference
            }));
        }

        // Get verse text from current version
        let verseData = getVerseFromReference(verseReference, bibleData, version);

        // If verse not found, try to get a valid one
        if (!verseData) {
            // Try loading all books to find a valid verse
            const books = Object.keys(bibleData);
            if (books.length > 0) {
                const isTagalogVersion = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);
                const bookName = isTagalogVersion ? tagalogBookNames[verseReference.bookIndex] : verseReference.englishBookName;
                const fallbackBook = bibleData[bookName] || bibleData[books[0]];
                if (fallbackBook) {
                    const chapters = Object.keys(fallbackBook);
                    if (chapters.length > 0) {
                        const chapter = chapters[0];
                        const verses = Object.keys(fallbackBook[chapter]);
                        if (verses.length > 0) {
                            verseData = {
                                book: bookName || books[0],
                                chapter,
                                verse: verses[0],
                                text: fallbackBook[chapter][verses[0]]
                            };
                        }
                    }
                }
            }
        }

        if (verseData) {
            displayVerse(verseData);
        } else {
            const verseTextEl = document.getElementById("verse-text");
            if (verseTextEl) verseTextEl.textContent = "Unable to load verse.";
        }

        // Listen for version changes from bible page
        setupVersionListener();

        // Schedule refresh at midnight
        const timeToMidnight = msUntilMidnight();
        setTimeout(() => {
            setNewDailyVerse();
            setInterval(setNewDailyVerse, 24 * 60 * 60 * 1000);
        }, timeToMidnight);

        // Also check every minute if the date has changed (in case setTimeout doesn't fire on inactive page)
        setInterval(async () => {
            const currentDate = new Date().toDateString();
            const savedData = JSON.parse(localStorage.getItem("dailyVerse") || "null");
            if (!savedData || savedData.date !== currentDate) {
                await setNewDailyVerse();
            }
        }, 60 * 1000); // check every minute

    } catch (err) {
        console.error("Error initializing daily verse:", err);
        const verseTextEl = document.getElementById("verse-text");
        if (verseTextEl) verseTextEl.textContent = "Unable to load verse.";
    }
}

// Listen for version changes from bible page (via localStorage event)
function setupVersionListener() {
    // Listen for storage events (when bible page changes version)
    window.addEventListener('storage', async (e) => {
        if (e.key === 'bibleState') {
            await reloadDailyVerseForNewVersion();
        }
    });

    // Also check periodically for version changes (for same-tab updates)
    setInterval(async () => {
        const currentBibleState = JSON.parse(localStorage.getItem('bibleState') || '{}');
        if (currentBibleState.version && currentBibleState.version !== currentVersion) {
            await reloadDailyVerseForNewVersion();
        }
    }, 1000);
}

// Reload daily verse when version changes
async function reloadDailyVerseForNewVersion() {
    const newVersion = getDailyVersion();
    if (newVersion === currentVersion) return;

    displayVerse(null); // show loading
    bibleData = null; // clear cache
    biblePromise = null;
    currentVersion = newVersion;

    await loadBible(newVersion);

    // Get today's reference
    const today = new Date().toDateString();
    const savedData = JSON.parse(localStorage.getItem("dailyVerse") || "null");
    let verseReference;

    if (savedData && savedData.date === today && savedData.reference) {
        verseReference = savedData.reference;
    } else {
        verseReference = await getDailyVerseReference(bibleData);
        localStorage.setItem("dailyVerse", JSON.stringify({
            date: today,
            reference: verseReference
        }));
    }

    // Get verse text from new version
    const verseData = getVerseFromReference(verseReference, bibleData, newVersion);
    if (verseData) {
        displayVerse(verseData);
    }
}

// English book list for consistent reference
const englishBookList = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs', 'Ecclesiastes', 'Song Of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

// Weighted book list for daily verses (prioritizing devotion essentials)
// High priority (3x): Psalms, Proverbs, Gospels, Romans, Ephesians, Philippians, James
// Medium priority (2x): Genesis, Exodus, Isaiah, Revelation
// Normal (1x): All other books
const weightedBookList = [
    // High priority books (3x each)
    'Psalm', 'Psalm', 'Psalm',
    'Proverbs', 'Proverbs', 'Proverbs',
    'Matthew', 'Matthew', 'Matthew',
    'Mark', 'Mark', 'Mark',
    'Luke', 'Luke', 'Luke',
    'John', 'John', 'John',
    'Romans', 'Romans', 'Romans',
    'Ephesians', 'Ephesians', 'Ephesians',
    'Philippians', 'Philippians', 'Philippians',
    'James', 'James', 'James',

    // Medium priority books (2x each)
    'Genesis', 'Genesis',
    'Exodus', 'Exodus',
    'Isaiah', 'Isaiah',
    'Revelation', 'Revelation',

    // Normal priority books (1x each)
    'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Ecclesiastes', 'Song Of Solomon',
    'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Acts', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude'
];

// Get verse reference (book index, chapter, verse) based on date
// Uses Bible data to get accurate chapter/verse counts when available
async function getDailyVerseReference(temporaryBibleData = null) {
    const today = new Date();
    const seed = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    // Seeded random function
    function seededRandom(seedStr) {
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
        }
        return (Math.abs(hash) % 1000000) / 1000000;
    }

    // Select book from weighted list (prioritizing devotion essentials)
    const selectedBookName = weightedBookList[Math.floor(seededRandom(seed) * weightedBookList.length)];

    // Find the corresponding index in englishBookList for tagalog mapping
    const bookIndex = englishBookList.indexOf(selectedBookName) + 1;
    const englishBookName = selectedBookName;

    // If we have Bible data, use actual chapter/verse counts
    if (temporaryBibleData) {
        // Check if this is a Tagalog version by checking if any Tagalog book names exist
        const tagalogBookNamesList = Object.values(tagalogBookNames);
        const hasTagalogBooks = Object.keys(temporaryBibleData).some(book =>
            tagalogBookNamesList.includes(book)
        );

        let bookName = englishBookName;
        if (hasTagalogBooks && tagalogBookNames[bookIndex]) {
            bookName = tagalogBookNames[bookIndex];
        }

        if (temporaryBibleData[bookName]) {
            const chapters = Object.keys(temporaryBibleData[bookName]);
            if (chapters.length > 0) {
                const chapterIndex = Math.floor(seededRandom(seed + "c") * chapters.length);
                const chapter = chapters[chapterIndex];
                const verses = Object.keys(temporaryBibleData[bookName][chapter]);
                if (verses.length > 0) {
                    const verseIndex = Math.floor(seededRandom(seed + "v") * verses.length);
                    const verse = verses[verseIndex];
                    return { bookIndex, englishBookName, chapter, verse };
                }
            }
        }
    }

    // Fallback: use estimated max values
    const chapter = Math.floor(seededRandom(seed + "c") * 150) + 1;
    const verse = Math.floor(seededRandom(seed + "v") * 200) + 1;

    return { bookIndex, englishBookName, chapter: chapter.toString(), verse: verse.toString() };
}

// Get verse text from current version using reference
function getVerseFromReference(reference, bibleData, version) {
    if (!reference || !bibleData) return null;

    const isTagalogVersion = ['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version);

    // Get book name in appropriate language
    let bookName;
    if (isTagalogVersion) {
        bookName = tagalogBookNames[reference.bookIndex] || reference.englishBookName;
    } else {
        bookName = reference.englishBookName;
    }

    const chapter = reference.chapter;
    const verse = reference.verse;

    // Try to get exact verse
    if (bibleData[bookName] && bibleData[bookName][chapter] && bibleData[bookName][chapter][verse]) {
        return {
            book: bookName,
            chapter,
            verse,
            text: bibleData[bookName][chapter][verse]
        };
    }

    // If exact verse doesn't exist, try to find a valid verse in that chapter
    if (bibleData[bookName] && bibleData[bookName][chapter]) {
        const verses = Object.keys(bibleData[bookName][chapter]);
        if (verses.length > 0) {
            // Use a consistent verse based on seed
            const verseIndex = parseInt(verse) % verses.length;
            const selectedVerse = verses[verseIndex] || verses[0];
            return {
                book: bookName,
                chapter,
                verse: selectedVerse,
                text: bibleData[bookName][chapter][selectedVerse]
            };
        }
    }

    // If chapter doesn't exist, try to find a valid chapter in that book
    if (bibleData[bookName]) {
        const chapters = Object.keys(bibleData[bookName]);
        if (chapters.length > 0) {
            const chapterIndex = parseInt(chapter) % chapters.length;
            const selectedChapter = chapters[chapterIndex] || chapters[0];
            const verses = Object.keys(bibleData[bookName][selectedChapter]);
            if (verses.length > 0) {
                const selectedVerse = verses[0];
                return {
                    book: bookName,
                    chapter: selectedChapter,
                    verse: selectedVerse,
                    text: bibleData[bookName][selectedChapter][selectedVerse]
                };
            }
        }
    }

    return null;
}

// Navigate to Bible page with daily verse
function navigateToBibleWithDailyVerse() {
    // Get current verse information from the display
    const verseRefEl = document.getElementById("verse-ref");
    if (!verseRefEl) return;

    const verseRef = verseRefEl.textContent.trim();
    if (!verseRef) return;

    // Parse the reference (e.g., "John 3:16" or "Genesis 1:1")
    const match = verseRef.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) return;

    const [, book, chapter, verse] = match;

    // Navigate to bible page with parameters
    const params = new URLSearchParams({
        book: book,
        chapter: chapter,
        verse: verse
    });

    window.location.href = `bible.html?${params.toString()}`;
}

// Run init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDailyVerse);
} else {
    initDailyVerse();
}
