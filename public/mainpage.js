const toolsContainer = document.getElementById('toolsContainer');
const searchInput = document.getElementById('searchInput');
const filterDropdown = document.getElementById('filterDropdown');

let allTools = []; // store all tools from backend

// === Sidebar toggles ===
const leftSidebar = document.getElementById("leftSidebar");
const rightSidebar = document.getElementById("rightSidebar");
const mainDashBtn = document.getElementById("mainDashBtn");
const categoryBtn = document.getElementById("categoryBtn");

// Toggle left sidebar
mainDashBtn.addEventListener("click", () => {
    leftSidebar.classList.toggle("open");
    rightSidebar.classList.remove("open"); // close right if open
});

// Toggle right sidebar
categoryBtn.addEventListener("click", () => {
    rightSidebar.classList.toggle("open");
    leftSidebar.classList.remove("open"); // close left if open
});

// Close sidebars when clicking outside
document.addEventListener("click", (e) => {
    if (
        !leftSidebar.contains(e.target) &&
        !mainDashBtn.contains(e.target) &&
        leftSidebar.classList.contains("open")
    ) {
        leftSidebar.classList.remove("open");
    }
    if (
        !rightSidebar.contains(e.target) &&
        !categoryBtn.contains(e.target) &&
        rightSidebar.classList.contains("open")
    ) {
        rightSidebar.classList.remove("open");
    }
});

// === Tools logic ===

// Fetch tools from backend
async function loadTools() {
    try {
        const res = await fetch('http://localhost:5000/api/tools'); // ✅ correct port
// ✅ backend endpoint
        allTools = await res.json();
        renderTools();
    } catch (err) {
        console.error('Error loading tools:', err);
        toolsContainer.innerHTML = '<p style="color:red;">Failed to load tools.</p>';
    }
}

// Render tools with search + filter
function renderTools() {
    const searchTerm = searchInput.value.toLowerCase();
    const filter = filterDropdown.value;

    toolsContainer.innerHTML = '';

    const filtered = allTools.filter(tool => {
        const matchesSearch =
            tool.toolName.toLowerCase().includes(searchTerm) ||
            (tool.shortDesc || '').toLowerCase().includes(searchTerm);

        const matchesFilter =
            filter === 'all' ||
            (filter === 'verified' && tool.status === 'approved') ||
            (filter === 'unverified' && tool.status !== 'approved');

        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        toolsContainer.innerHTML = '<p>No tools found.</p>';
        return;
    }

    filtered.forEach(tool => {
        const box = document.createElement('div');
        box.className = 'tool-box comic-outline';
        box.innerHTML = `
            <div class="tool-header">
                <img src="${tool.logoFile ? '/' + tool.logoFile : 'default-logo.png'}" 
                     alt="${tool.toolName}" 
                     class="tool-logo">
                <h3 class="tool-name">${tool.toolName}</h3>
            </div>
            <p class="tool-desc">${tool.shortDesc || ''}</p>
            <p class="tool-status">
                ${tool.status === 'approved' ? '✅ Approved' : '⌛ Pending'}
            </p>
            <div class="tool-actions">
                <a href="${tool.toolLink || '#'}" target="_blank" class="try-btn">Try Tool</a>
                ${tool.demoLink ? `<a href="${tool.demoLink}" target="_blank" class="desc-btn">Demo</a>` : ''}
            </div>
        `;
        toolsContainer.appendChild(box);
    });
}

// Event listeners
searchInput.addEventListener('input', renderTools);
filterDropdown.addEventListener('change', renderTools);

// Load tools initially + auto-refresh every 5s
loadTools();
setInterval(loadTools, 5000);
