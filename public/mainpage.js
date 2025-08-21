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

// Search/filter (will work once tools are added dynamically)
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterDropdown = document.getElementById('filterDropdown');

function applySearchAndFilter() {
    const query = searchInput.value.toLowerCase();
    const filter = filterDropdown.value;
    const toolBoxes = Array.from(document.querySelectorAll('.tool-box'));

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
