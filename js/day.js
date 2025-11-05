document.addEventListener("DOMContentLoaded", () => {
    const dailyBtn = document.getElementById('daily-btn');
    const content = document.getElementById('content');
    const menuItems = document.querySelectorAll('.menu-item');
    const homeBtn = document.querySelector('[data-page="home.html"]');

    // === Create Floating Buttons (hidden by default) ===
    const floatingActions = document.createElement('div');
    floatingActions.className = 'floating-actions';
    floatingActions.style.display = 'none'; // hidden initially
    floatingActions.innerHTML = `
        <button class="float-btn heart" id="heartBtn"><i class="bi bi-heart"></i></button>
        <button class="float-btn save" id="saveBtn"><i class="bi bi-bookmark"></i></button>
        <button class="float-btn bible" id="readFullBtn"><i class="bi bi-book"></i></button>
    `;
    document.body.appendChild(floatingActions);

    // === Universal Page Loader ===
    async function loadPage(page, callback = null) {
        try {
            const res = await fetch(page);
            const html = await res.text();
            content.innerHTML = html;
            reinitScripts();
            if (callback) callback();
        } catch (err) {
            console.error("Page load error:", err);
            content.innerHTML = "<p style='text-align:center; color:red;'>Error loading page.</p>";
        }
    }

    function reinitScripts() {
        if (typeof initBibleFunctions === 'function') initBibleFunctions();
        if (typeof initAppFeatures === 'function') initAppFeatures();
        if (typeof initSearch === 'function') initSearch();
    }

    // === Menu Buttons ===
    menuItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');

            // Daily verse
            if (item === dailyBtn) {
                await loadDailyVerseSection();
                setActive(item);
                return;
            }

            // Hide floating buttons when not on Daily Verse
            floatingActions.style.display = 'none';

            await loadPage(page);
            setActive(item);
        });
    });

    function setActive(el) {
        menuItems.forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }

    // === Daily Verse Page Loader ===
    async function loadDailyVerseSection() {
        content.innerHTML = `
            <div class="daily-verse-container">
                <div class="verse-box">
                    <h2>Daily Verse</h2>
                    <p id="verse-text">Loading...</p>
                    <small id="verse-ref"></small>
                </div>
            </div>
        `;

        await loadDailyVerse();
        initFloatingButtons();
        floatingActions.style.display = 'flex';
    }

    // === Daily Verse Logic ===
    let midnightTimeout = null;
    let midnightInterval = null;

    function msUntilMidnight() {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setHours(24, 0, 0, 0);
        return nextMidnight - now;
    }

    async function loadDailyVerse() {
        try {
            // Get version from localStorage (sync with bible page or daily page)
            const savedState = JSON.parse(localStorage.getItem('bibleState') || '{}');
            const dailyVersion = localStorage.getItem('dailyVersion');
            const version = savedState.version || dailyVersion || 'NIV';

            let biblePath;
            let bible;
            const basePath = window.location.pathname.includes("/pages/") 
                ? "../Bible%20Versions/" 
                : "Bible%20Versions/";

            // Load based on version type
            if (['MBBTAG12', 'ASND', 'CEBUANO', 'KAPAMPANGAN'].includes(version)) {
                if (version === 'MBBTAG12') {
                    biblePath = `${basePath}Tagalog/MBBTAG12.xml`;
                } else if (version === 'ASND') {
                    biblePath = `${basePath}ASND/ASND.xml`;
                } else if (version === 'CEBUANO') {
                    biblePath = `${basePath}CEBUANO/CEBUANO.xml`;
                } else if (version === 'KAPAMPANGAN') {
                    biblePath = `${basePath}KAPAMPANGAN/KAPAMPANGAN.xml`;
                }

                const response = await fetch(biblePath);
                const xml = await response.text();
                const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");
                
                // Parse XML (simplified - using same logic from bible.js)
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

                bible = {};
                const books = xmlDoc.getElementsByTagName("book");
                for (let book of books) {
                    const num = parseInt(book.getAttribute("number"));
                    const name = tagalogBookNames[num] || `Aklat ${num}`;
                    bible[name] = {};
                    const chapters = book.getElementsByTagName("chapter");
                    for (let chapter of chapters) {
                        const chapNum = chapter.getAttribute("number");
                        bible[name][chapNum] = {};
                        const verses = chapter.getElementsByTagName("verse");
                        for (let verse of verses) {
                            const vNum = verse.getAttribute("number");
                            const text = verse.textContent.trim();
                            bible[name][chapNum][vNum] = text;
                        }
                    }
                }
            } else {
                biblePath = `${basePath}${version}/${version}_bible.json`;
                const response = await fetch(biblePath);
                bible = await response.json();
            }

            const today = new Date();
            // Remove version from seed so same date = same reference across versions
            const seed = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

            function seededRandom(seedStr) {
                let hash = 0;
                for (let i = 0; i < seedStr.length; i++) {
                    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
                }
                return (Math.abs(hash) % 1000000) / 1000000;
            }

            const books = Object.keys(bible);
            const book = books[Math.floor(seededRandom(seed) * books.length)];
            const chapters = Object.keys(bible[book]);
            const chapter = chapters[Math.floor(seededRandom(seed + "c") * chapters.length)];
            const verses = Object.keys(bible[book][chapter]);
            const verse = verses[Math.floor(seededRandom(seed + "v") * verses.length)];

            const verseText = bible[book][chapter][verse];
            document.getElementById("verse-text").textContent = verseText;
            document.getElementById("verse-ref").textContent = `${book} ${chapter}:${verse}`;

            // Schedule next update at midnight
            if (midnightTimeout) clearTimeout(midnightTimeout);
            if (midnightInterval) clearInterval(midnightInterval);
            
            const timeToMidnight = msUntilMidnight();
            midnightTimeout = setTimeout(() => {
                loadDailyVerse(); // Reload verse at midnight
                midnightInterval = setInterval(loadDailyVerse, 24 * 60 * 60 * 1000); // Then every 24 hours
            }, timeToMidnight);
        } catch (err) {
            document.getElementById("verse-text").textContent = "Error loading verse.";
            console.error("Error loading verse:", err);
        }
    }

    // === Floating Buttons Functionality ===
    function initFloatingButtons() {
        const heartBtn = document.getElementById('heartBtn');
        const saveBtn = document.getElementById('saveBtn');
        const readFullBtn = document.getElementById('readFullBtn');

        heartBtn.onclick = () => {
            heartBtn.classList.toggle('hearted');
            const icon = heartBtn.querySelector('i');
            icon.classList.toggle('bi-heart');
            icon.classList.toggle('bi-heart-fill');
        };

        saveBtn.onclick = () => {
            const verseText = document.getElementById('verse-text').textContent;
            const verseRef = document.getElementById('verse-ref').textContent;
            const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');
            savedVerses.push({ text: verseText, reference: verseRef });
            localStorage.setItem('savedVerses', JSON.stringify(savedVerses));
            alert('Verse saved to your collection!');
        };

        readFullBtn.onclick = () => {
            const verseRef = document.getElementById('verse-ref').textContent;
            if (verseRef) {
                const [book, chapter] = verseRef.split(' ');
                window.location.href = `bible.html?book=${encodeURIComponent(book)}&chapter=${chapter}`;
            }
        };
    }

    // === Default: Always Load Home Page on Reload ===
    loadPage('home.html', () => setActive(homeBtn));
});