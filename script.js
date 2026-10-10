
const API_URL =
    "https://berita-indo-api-next.vercel.app/api/cnn-news";

const loader = document.getElementById("loader");
const newsGrid = document.getElementById("newsGrid");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".category-btn");
const loadMoreButton = document.getElementById("loadMore");
const newsCount = document.getElementById("newsCount");
const tickerTrack = document.getElementById("tickerTrack");

let allNews = [];
let filteredNews = [];
let activeCategory = "Semua";
let searchQuery = "";
let visibleCount = 9;
let isLoading = false;

// LOADING: TIDAK MENUNGGU API
function hideLoader() {
    if (!loader || loader.dataset.hidden === "true") return;

    loader.dataset.hidden = "true";
    loader.style.opacity = "0";

    setTimeout(() => {
        loader.style.display = "none";
    }, 250);
}

// TANGGAL HARI INI
function setupDate() {
    const dateElement = document.getElementById("currentDate");
    const yearElement = document.getElementById("currentYear");

    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// AMANKAN TEKS HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// VALIDASI URL
function safeURL(value) {
    try {
        const url = new URL(value);

        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch {
        // URL tidak valid
    }

    return "";
}

// AMBIL GAMBAR
function getImage(news) {
    const image = news.image;

    if (typeof image === "string") return safeURL(image);

    if (image && typeof image === "object") {
        return safeURL(image.large || image.small || "");
    }

    return "";
}

// FORMAT TANGGAL BERITA
function formatDate(value) {
    if (!value) return "Berita terbaru";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Berita terbaru";
    }

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// DETEKSI KATEGORI SEDERHANA
function detectCategory(news) {
    const text = `${news.title || ""} ${news.contentSnippet || ""}`
        .toLowerCase();

    const originalCategory = String(news.category || "").toLowerCase();

    if (originalCategory.includes("politik")) return "Politik";
    if (originalCategory.includes("ekonomi")) return "Ekonomi";
    if (originalCategory.includes("teknologi")) return "Teknologi";
    if (originalCategory.includes("olahraga")) return "Olahraga";
    if (originalCategory.includes("hiburan")) return "Hiburan";

    const keywords = {
        Politik: [
            "politik", "presiden", "menteri", "dpr", "pemilu",
            "pemerintah", "kebijakan", "partai"
        ],
        Ekonomi: [
            "ekonomi", "rupiah", "saham", "bisnis", "investasi",
            "pasar", "bank", "harga", "inflasi"
        ],
        Teknologi: [
            "teknologi", "digital", "aplikasi", "internet", "ai ",
            "artificial intelligence", "ponsel", "smartphone", "gadget"
        ],
        Olahraga: [
            "sepak bola", "bola", "basket", "bulutangkis", "badminton",
            "liga", "timnas", "atlet", "olahraga"
        ],
        Hiburan: [
            "film", "musik", "artis", "aktor", "aktris", "selebritas",
            "konser", "drama", "penyanyi"
        ]
    };

    for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => text.includes(word))) {
            return category;
        }
    }

    return "Berita";
}

// TAMPILKAN SKELETON
function showSkeleton() {
    newsGrid.innerHTML = Array.from(
        { length: 6 },
        () => '<div class="skeleton"></div>'
    ).join("");
}

// PERBARUI TICKER
function renderTicker() {
    if (!allNews.length) return;

    const headlines = allNews
        .slice(0, 5)
        .map(news => escapeHTML(news.title || "Berita terbaru"));

    tickerTrack.textContent = headlines.join("   •   ");
}

// FILTER BERITA
function filterNews() {
    const query = searchQuery.toLowerCase();

    filteredNews = allNews.filter(news => {
        const title = news.title || "";
        const description =
            news.contentSnippet || news.content || "";

        const category = detectCategory(news);

        const matchesSearch =
            title.toLowerCase().includes(query) ||
            description.toLowerCase().includes(query);

        const matchesCategory =
            activeCategory === "Semua" ||
            category === activeCategory;

        return matchesSearch && matchesCategory;
    });
}

// TAMPILKAN BERITA
function renderNews() {
    filterNews();

    const items = filteredNews.slice(0, visibleCount);

    newsCount.textContent =
        `${filteredNews.length} berita ditemukan`;

    if (items.length === 0) {
        newsGrid.innerHTML = `
            <div class="empty-message">
                Tidak ada berita yang cocok dengan pencarian lu.
            </div>
        `;

        loadMoreButton.hidden = true;
        return;
    }

    newsGrid.innerHTML = items.map(news => {
        const title = escapeHTML(news.title || "Tanpa judul");
        const description = escapeHTML(
            news.contentSnippet ||
            news.content ||
            "Baca berita selengkapnya di sumber berita."
        );

        const category = escapeHTML(detectCategory(news));
        const image = getImage(news);
        const link = safeURL(news.link);
        const date = escapeHTML(
            formatDate(news.isoDate || news.pubDate)
        );

        const imageHTML = image
            ? `<img
                class="news-image"
                src="${escapeHTML(image)}"
                alt="${title}"
                loading="lazy"
            >`
            : `<div class="news-image-placeholder">
                Gambar tidak tersedia
            </div>`;

        const linkHTML = link
            ? `<a href="${escapeHTML(link)}"
                target="_blank"
                rel="noopener noreferrer">
                Baca selengkapnya ↗
            </a>`
            : "";

        return `
            <article class="news-card">
                ${imageHTML}

                <div class="news-card-body">
                    <span class="news-category">${category}</span>
                    <h3>${title}</h3>
                    <p>${description}</p>

                    <div class="news-meta">
                        <span>${date}</span>
                        ${linkHTML}
                    </div>
                </div>
            </article>
        `;
    }).join("");

    loadMoreButton.hidden = visibleCount >= filteredNews.length;
}

// AMBIL DATA DARI API
async function fetchNews() {
    if (isLoading) return;

    isLoading = true;
    showSkeleton();
    newsCount.textContent = "Mengambil berita...";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        const articles = Array.isArray(result.data)
            ? result.data
            : Array.isArray(result)
                ? result
                : [];

        if (!articles.length) {
            throw new Error("Data berita kosong");
        }

        allNews = articles;
        visibleCount = 9;

        renderTicker();
        renderNews();
    } catch (error) {
        console.error("Gagal memuat berita:", error);

        newsGrid.innerHTML = `
            <div class="error-message">
                <p>Berita belum bisa dimuat.</p>
                <p>Periksa koneksi internet atau coba lagi nanti.</p>
                <button id="retryButton" type="button">
                    Coba lagi
                </button>
            </div>
        `;

        newsCount.textContent = "Gagal memuat";
        loadMoreButton.hidden = true;

        document.getElementById("retryButton")
            ?.addEventListener("click", fetchNews);
    } finally {
        isLoading = false;
    }
}

// PENCARIAN
searchInput.addEventListener("input", event => {
    searchQuery = event.target.value.trim();
    visibleCount = 9;
    renderNews();
});

// KATEGORI
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        categoryButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        activeCategory = button.dataset.category;

        visibleCount = 9;
        renderNews();
    });
});

// MUAT LEBIH BANYAK
loadMoreButton.addEventListener("click", () => {
    visibleCount += 9;
    renderNews();
});

// MULAI WEBSITE
setupDate();

// Loader tidak menunggu proses pengambilan berita.
setTimeout(hideLoader, 1000);

// Ambil berita secara terpisah.
fetchNews();
