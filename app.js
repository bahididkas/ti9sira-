// ==========================================
// DevSuite Storefront Application Logic (app.js)
// ==========================================

// Global State
let tools = [];
const DEFAULT_THEME_KEY = 'devsuite_theme';

// Document Ready
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await initData();
  setupEventListeners();
  renderStorefront();
});

// Theme Initialization
function initTheme() {
  const currentTheme = localStorage.getItem(DEFAULT_THEME_KEY) || 'dark';
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
  } else {
    document.body.classList.remove('light-theme');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
  }
}

// Data Initialization (Loads from server API)
async function initData() {
  try {
    const res = await fetch('/api/tools');
    if (res.ok) {
      tools = await res.json();
    } else {
      console.error('Failed to load tools from server API');
      showErrorPlaceholder('فشل تحميل الأدوات البرمجية من الخادم.');
    }
  } catch (e) {
    console.error('Error fetching tools from server', e);
    showErrorPlaceholder('فشل الاتصال بالخادم المحلي. يرجى التأكد من تشغيل الخادم.');
  }
}

// Helper: Show error on UI if server is unreachable
function showErrorPlaceholder(message) {
  const toolsGrid = document.getElementById('tools-grid');
  if (toolsGrid) {
    toolsGrid.innerHTML = `
      <div class="text-center" style="grid-column: 1 / -1; padding: 60px 20px; color: var(--text-secondary);">
        <i class="fa-solid fa-server" style="font-size: 44px; margin-bottom: 16px; color: #ef4444;"></i>
        <p style="font-size: 16px; font-weight: 600;">${message}</p>
        <p style="font-size: 13px; opacity: 0.7; margin-top: 6px;">توجيه للمطور: قم بتشغيل الأمر <code class="english-text" style="background:var(--btn-bg); padding:2px 6px; border-radius:4px;">node server.js</code> في مجلد المشروع، ثم افتح <a href="http://localhost:3000" class="english-text" style="color:var(--accent-primary);">http://localhost:3000</a>.</p>
      </div>
    `;
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Theme Toggle Click
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
  
  // Search Input Keyup
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keyup', handleSearchAndFilter);
  }
  
  // Modal Close Events
  const modalCloseBtn = document.getElementById('modal-close');
  const modalOverlay = document.getElementById('modal-overlay');
  
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  
  // ESC key press to close modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
}

// Toggle Theme (Dark / Light)
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  localStorage.setItem(DEFAULT_THEME_KEY, isLight ? 'light' : 'dark');
  
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }
}

// Render the Storefront Interface
function renderStorefront() {
  const toolsGrid = document.getElementById('tools-grid');
  if (!toolsGrid || tools.length === 0) return;
  
  // Calculate and update stats
  updateStats();
  
  // Render category filter tags
  renderCategoryFilters();
  
  // Render tools grid
  renderToolsList(tools);
}

// Calculate and Render General Stats from local array
function updateStats() {
  const totalToolsEl = document.getElementById('stat-total-tools');
  const totalDownloadsEl = document.getElementById('stat-total-downloads');
  
  if (totalToolsEl) {
    totalToolsEl.textContent = tools.length;
  }
  
  if (totalDownloadsEl) {
    const sumDownloads = tools.reduce((sum, tool) => sum + (tool.downloadCount || 0), 0);
    totalDownloadsEl.textContent = formatNumber(sumDownloads);
  }
}

// Format Numbers beautifully (e.g. 1500 -> 1.5K)
function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num;
}

// Dynamically Render Category Tags in Showcase Controls
function renderCategoryFilters() {
  const filterContainer = document.getElementById('category-filters');
  if (!filterContainer) return;
  
  // Extract unique categories
  const categories = ['all', ...new Set(tools.map(tool => tool.category))];
  
  // Clear container (keep the first 'all' button)
  filterContainer.innerHTML = '';
  
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `filter-tag ${cat === 'all' ? 'active' : ''}`;
    btn.setAttribute('data-category', cat);
    btn.textContent = cat === 'all' ? 'الكل' : cat;
    
    btn.addEventListener('click', () => {
      // Toggle active class
      document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
      btn.classList.add('active');
      handleSearchAndFilter();
    });
    
    filterContainer.appendChild(btn);
  });
}

// Render tools card list in the grid
function renderToolsList(filteredTools) {
  const toolsGrid = document.getElementById('tools-grid');
  if (!toolsGrid) return;
  
  if (filteredTools.length === 0) {
    toolsGrid.innerHTML = `
      <div class="text-center" style="grid-column: 1 / -1; padding: 60px 20px; color: var(--text-secondary);">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 40px; margin-bottom: 16px; color: var(--accent-secondary);"></i>
        <p style="font-size: 16px; font-weight: 600;">لا توجد أدوات مطابقة لبحثك حالياً.</p>
        <p style="font-size: 13px; opacity: 0.7; margin-top: 4px;">جرب كتابة مصطلح بحث آخر أو تغيير التصنيف المحدد.</p>
      </div>
    `;
    return;
  }
  
  toolsGrid.innerHTML = '';
  
  filteredTools.forEach((tool) => {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.setAttribute('data-id', tool.id);
    
    // Check if tool has product image
    const bannerHTML = tool.imagePath 
      ? `<div class="tool-card-banner">
           <img src="${tool.imagePath}" alt="${tool.name}" class="tool-card-image" loading="lazy">
           <span class="tool-category floating">${tool.category}</span>
         </div>`
      : `<div class="tool-card-banner placeholder-gradient">
           <i class="fa-solid ${tool.iconType || 'fa-cube'} placeholder-icon"></i>
           <span class="tool-category floating">${tool.category}</span>
         </div>`;
    
    card.innerHTML = `
      ${bannerHTML}
      
      <div class="tool-card-content">
        <h3 class="tool-title">
          <div class="tool-icon-box small">
            <i class="fa-solid ${tool.iconType || 'fa-cube'}"></i>
          </div>
          <span style="flex-grow: 1;">${tool.name}</span>
          <span class="tool-version">${tool.version}</span>
        </h3>
        
        <p class="tool-short-desc">${tool.shortDescription}</p>
        
        <div class="tool-meta">
          <div class="tool-meta-item">
            <i class="fa-solid fa-download"></i>
            <span><span class="english-text">${tool.downloadCount || 0}</span> تحميل</span>
          </div>
          <div class="tool-meta-item">
            <i class="fa-solid fa-weight-hanging"></i>
            <span class="english-text">${tool.fileSize}</span>
          </div>
        </div>
        
        <div class="tool-card-actions">
          <button class="btn-glass btn-primary download-btn" onclick="triggerDownload(event, '${tool.id}')">
            <i class="fa-solid fa-cloud-arrow-down"></i>
            <span>تحميل مباشر</span>
            <div class="progress-bar"></div>
          </button>
          <button class="btn-glass" onclick="openToolDetails('${tool.id}')">
            <i class="fa-solid fa-info"></i>
            <span>التفاصيل</span>
          </button>
        </div>
      </div>
    `;
    
    toolsGrid.appendChild(card);
  });
}

// Handle Search and Filter logic combined
function handleSearchAndFilter() {
  const searchInput = document.getElementById('search-input');
  const activeFilterBtn = document.querySelector('.filter-tag.active');
  
  if (!searchInput || !activeFilterBtn) return;
  
  const query = searchInput.value.toLowerCase().trim();
  const category = activeFilterBtn.getAttribute('data-category');
  
  const filtered = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(query) || 
                          tool.shortDescription.toLowerCase().includes(query) ||
                          tool.category.toLowerCase().includes(query);
                          
    const matchesCategory = category === 'all' || tool.category === category;
    
    return matchesSearch && matchesCategory;
  });
  
  renderToolsList(filtered);
}

// Open Details Modal and Populate with Tool Data (Steam-like Page layout)
window.openToolDetails = function(toolId) {
  const tool = tools.find(t => t.id === toolId);
  if (!tool) return;
  
  const modal = document.getElementById('detail-modal');
  const modalBodyContent = document.getElementById('modal-body-content');
  
  if (!modal || !modalBodyContent) return;
  
  // Generate features HTML list
  let featuresHTML = '';
  if (tool.features && tool.features.length > 0) {
    tool.features.forEach(feat => {
      featuresHTML += `<li>${feat}</li>`;
    });
  } else {
    featuresHTML = `<li>لا توجد ميزات مسجلة حالياً لهذه الأداة.</li>`;
  }
  
  // Large modal banner
  const modalBannerHTML = tool.imagePath 
    ? `<div class="modal-banner">
         <img src="${tool.imagePath}" alt="${tool.name}" class="modal-banner-image">
         <div class="modal-banner-overlay"></div>
       </div>`
    : `<div class="modal-banner placeholder-gradient">
         <i class="fa-solid ${tool.iconType || 'fa-cube'} placeholder-icon"></i>
         <div class="modal-banner-overlay"></div>
       </div>`;
  
  modalBodyContent.innerHTML = `
    ${modalBannerHTML}
    
    <div class="modal-details-container">
      <div class="modal-header-info">
        <div class="tool-icon-box">
          <i class="fa-solid ${tool.iconType || 'fa-cube'}"></i>
        </div>
        <div class="modal-title-wrapper">
          <h3>
            ${tool.name}
            <span class="tool-version">${tool.version}</span>
          </h3>
          <span class="tool-category">${tool.category}</span>
        </div>
      </div>
      
      <p class="modal-description">${tool.longDescription || tool.shortDescription}</p>
      
      <div class="modal-grid">
        <!-- Key Features Section -->
        <div>
          <h4 class="modal-section-title">
            <i class="fa-solid fa-square-check"></i>
            <span>أبرز الميزات والخصائص</span>
          </h4>
          <ul class="features-list">
            ${featuresHTML}
          </ul>
        </div>
        
        <!-- System Requirements Section -->
        <div>
          <h4 class="modal-section-title">
            <i class="fa-solid fa-computer"></i>
            <span>متطلبات تشغيل النظام</span>
          </h4>
          <ul class="reqs-list">
            <li><strong>نظام التشغيل:</strong> <span>${tool.requirements.os}</span></li>
            <li><strong>الذاكرة (RAM):</strong> <span>${tool.requirements.ram}</span></li>
            <li><strong>المعالج (CPU):</strong> <span>${tool.requirements.cpu}</span></li>
            <li><strong>المساحة الشاغرة:</strong> <span>${tool.requirements.disk}</span></li>
          </ul>
          
          <div style="margin-top: 24px; font-size: 13px; color: var(--text-muted);">
            <p><i class="fa-solid fa-calendar-day" style="margin-left: 6px;"></i> تاريخ النشر: <span class="english-text">${tool.releaseDate}</span></p>
            <p style="margin-top: 6px;"><i class="fa-solid fa-file-shield" style="margin-left: 6px;"></i> حجم الملف: <span class="english-text">${tool.fileSize}</span></p>
          </div>
        </div>
      </div>
      
      <div class="modal-footer-actions">
        <button class="btn-glass" onclick="closeModal()">إغلاق النافذة</button>
        <button class="btn-glass btn-primary download-btn" onclick="triggerDownload(event, '${tool.id}')" style="min-width: 150px;">
          <i class="fa-solid fa-cloud-arrow-down"></i>
          <span>تحميل مباشر</span>
          <div class="progress-bar"></div>
        </button>
      </div>
    </div>
  `;
  
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

// Close Details Modal
window.closeModal = function() {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// Trigger Direct Download (Simulates premium loader, increments stats, starts real browser download)
window.triggerDownload = function(event, toolId) {
  event.stopPropagation();
  
  const tool = tools.find(t => t.id === toolId);
  if (!tool) return;
  
  // Find download button in UI (could be in card or in modal)
  const buttons = document.querySelectorAll(`.download-btn`);
  let activeButtons = [];
  
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick').includes(toolId)) {
      activeButtons.push(btn);
    }
  });
  
  if (activeButtons.length === 0) return;
  
  // If already downloading, prevent duplicate
  if (activeButtons[0].classList.contains('downloading')) return;
  
  activeButtons.forEach(btn => {
    btn.classList.add('downloading');
    btn.querySelector('span').textContent = 'جاري التحميل...';
    btn.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';
  });
  
  // Simulate Progress Bar
  let progress = 0;
  const progressBarInterval = setInterval(async () => {
    progress += 5;
    activeButtons.forEach(btn => {
      const bar = btn.querySelector('.progress-bar');
      if (bar) bar.style.width = `${progress}%`;
    });
    
    if (progress >= 100) {
      clearInterval(progressBarInterval);
      
      // Complete Simulation
      setTimeout(async () => {
        activeButtons.forEach(btn => {
          btn.classList.remove('downloading');
          btn.querySelector('span').textContent = 'تحميل مباشر';
          btn.querySelector('i').className = 'fa-solid fa-cloud-arrow-down';
          const bar = btn.querySelector('.progress-bar');
          if (bar) bar.style.width = '0%';
        });
        
        // Fetch server to increment download count
        try {
          const res = await fetch(`/api/tools/${toolId}/download`, {
            method: 'POST'
          });
          
          if (res.ok) {
            const data = await res.json();
            tool.downloadCount = data.downloadCount;
            
            // Update Stats UI and Grid
            updateStats();
            
            // Re-render only the counts in the grid cards
            document.querySelectorAll('.tool-card').forEach(card => {
              if (card.getAttribute('data-id') === toolId) {
                const downloadCountEl = card.querySelector('.tool-meta-item span .english-text');
                if (downloadCountEl) downloadCountEl.textContent = tool.downloadCount;
              }
            });
          }
        } catch(err) {
          console.error('Failed to log download on server', err);
          tool.downloadCount = (tool.downloadCount || 0) + 1;
          updateStats();
        }
        
        // Trigger browser file download
        startBrowserFileDownload(tool.fileName);
      }, 300);
    }
  }, 75);
};

// Start the browser download action
function startBrowserFileDownload(fileName) {
  const filePath = `/downloads/${fileName}`;
  
  // Create virtual link to trigger download
  const link = document.createElement('a');
  link.href = filePath;
  link.download = fileName;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Handle Mock Contact Form Submit
function handleContactSubmit(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const nameVal = document.getElementById('contact-name').value;
  
  if (!submitBtn) return;
  
  const originalHTML = submitBtn.innerHTML;
  
  // Show sending state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>جاري الإرسال...</span>';
  
  setTimeout(() => {
    // Show success state
    submitBtn.className = 'btn-glass btn-primary form-submit-btn';
    submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    submitBtn.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.2)';
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>تم إرسال رسالتك بنجاح!</span>';
    
    // Reset Form
    e.target.reset();
    
    // Restore button after 3 seconds
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.className = 'btn-glass btn-primary form-submit-btn';
      submitBtn.style.background = '';
      submitBtn.style.boxShadow = '';
      submitBtn.innerHTML = originalHTML;
    }, 3000);
  }, 1200);
}
