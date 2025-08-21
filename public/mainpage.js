// Sidebar toggling
const leftSidebar = document.getElementById('leftSidebar');
const rightSidebar = document.getElementById('rightSidebar');
const mainDashBtn = document.getElementById('mainDashBtn');
const categoryBtn = document.getElementById('categoryBtn');
const homeBtn = document.getElementById('homeBtn');

mainDashBtn.addEventListener('click', () => {
    leftSidebar.classList.toggle('open');
});
categoryBtn.addEventListener('click', () => {
    rightSidebar.classList.toggle('open');
});
homeBtn.addEventListener('click', () => {
    leftSidebar.classList.remove('open');
});

// Profile avatar links to profile.html
const profileAvatar = document.getElementById('profileAvatar');
profileAvatar.addEventListener('click', (e) => {
    window.location.href = 'profile.html';
});

// Tools data
const tools = [
    {
        name: 'Keyword Extractor',
        desc: 'Extract keywords instantly.',
        verified: true
    },
    {
        name: 'Headline Generator',
        desc: 'Catchy headlines.',
        verified: true
    },
    {
        name: 'Text Summarizer',
        desc: 'Short summaries.',
        verified: true
    },
    {
        name: 'Text Classification',
        desc: 'Categorize text automatically.',
        verified: false
    }
];

// Search/filter
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterDropdown = document.getElementById('filterDropdown');
const toolBoxes = Array.from(document.querySelectorAll('.tool-box'));

function applySearchAndFilter() {
    const query = searchInput.value.toLowerCase();
    const filter = filterDropdown.value;
    toolBoxes.forEach(box => {
        const name = box.getAttribute('data-tool').toLowerCase();
        const desc = box.querySelector('.tool-desc').textContent.toLowerCase();
        const verified = box.getAttribute('data-verified') === 'true';
        let matched = name.includes(query) || desc.includes(query);
        if (filter === 'verified' && !verified) matched = false;
        if (filter === 'unverified' && verified) matched = false;
        box.style.display = matched ? '' : 'none';
    });
}

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        applySearchAndFilter();
    }
});
searchBtn.addEventListener('click', applySearchAndFilter);
filterDropdown.addEventListener('change', applySearchAndFilter);

// Favorites
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('ai-tool-favorites') || '[]');
    } catch {
        return [];
    }
}
function setFavorites(favs) {
    localStorage.setItem('ai-tool-favorites', JSON.stringify(favs));
}
function updateFavoriteHearts() {
    const favs = getFavorites();
    toolBoxes.forEach(box => {
        const heart = box.querySelector('.favorite-heart');
        const tool = box.getAttribute('data-tool');
        if (favs.includes(tool)) {
            heart.classList.add('active');
        } else {
            heart.classList.remove('active');
        }
    });
}
toolBoxes.forEach(box => {
    const heart = box.querySelector('.favorite-heart');
    const tool = box.getAttribute('data-tool');
    heart.addEventListener('click', (e) => {
        e.stopPropagation();
        let favs = getFavorites();
        if (favs.includes(tool)) {
            favs = favs.filter(x => x !== tool);
        } else {
            favs.push(tool);
        }
        setFavorites(favs);
        updateFavoriteHearts();
    });
});
updateFavoriteHearts();

// Try Now/Description
toolBoxes.forEach(box => {
    box.querySelector('.try-btn').addEventListener('click', () => {
        alert(`Try Now: ${box.getAttribute('data-tool')} (demo coming soon!)`);
    });
    box.querySelector('.desc-btn').addEventListener('click', () => {
        alert(`Description: ${box.getAttribute('data-tool')}\n${box.querySelector('.tool-desc').textContent}`);
    });
});

// Sidebar close on outside click
document.addEventListener('click', function(e) {
    if (leftSidebar.classList.contains('open')) {
        if (!leftSidebar.contains(e.target) && !mainDashBtn.contains(e.target)) {
            leftSidebar.classList.remove('open');
        }
    }
    if (rightSidebar.classList.contains('open')) {
        if (!rightSidebar.contains(e.target) && !categoryBtn.contains(e.target)) {
            rightSidebar.classList.remove('open');
        }
    }
});

// Prevent sidebar click from bubbling to document
[leftSidebar, rightSidebar].forEach(sb => {
    sb.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});