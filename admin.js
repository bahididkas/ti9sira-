// ==========================================
// DevSuite Admin Dashboard Logic (admin.js)
// ==========================================

// Global State
let tools = [];
let currentFeatures = []; // Temporary holder for features of the tool being added/edited

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth();
  setupEventListeners();
});

// Theme Initialization (Reads from shared localStorage)
function initTheme() {
  const currentTheme = localStorage.getItem('devsuite_theme') || 'dark';
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.body.classList.remove('light-theme');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

// Check Session Authentication State
function checkAuth() {
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
  const authScreen = document.getElementById('admin-auth-screen');
  const dashboardLayout = document.getElementById('admin-dashboard-layout');
  
  if (isLoggedIn) {
    if (authScreen) authScreen.style.display = 'none';
    if (dashboardLayout) {
      dashboardLayout.style.display = 'grid';
      // Load data from server and refresh dashboard
      loadDataAndRefresh();
    }
  } else {
    if (authScreen) authScreen.style.display = 'flex';
    if (dashboardLayout) dashboardLayout.style.display = 'none';
  }
}

// Load tools from Server and Refresh Dashboard Views
async function loadDataAndRefresh() {
  try {
    const res = await fetch('/api/tools');
    if (res.ok) {
      tools = await res.json();
      renderDashboard();
    } else {
      console.error('Failed to load tools from server');
    }
  } catch (e) {
    console.error('Error loading tools from server', e);
  }
}

// Setup Event Listeners for Admin UI
function setupEventListeners() {
  // Theme Toggle
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      localStorage.setItem('devsuite_theme', isLight ? 'light' : 'dark');
      themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });
  }
  
  // Auth Form Submission
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }
  
  // Logout Button
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Sidebar Navigation Tabs
  const navItems = document.querySelectorAll('.admin-nav-item[data-tab]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  // Dynamic Features input (+) Button
  const addFeatureBtn = document.getElementById('add-feature-btn');
  const featureInput = document.getElementById('feature-input');
  if (addFeatureBtn && featureInput) {
    addFeatureBtn.addEventListener('click', addFeatureFromInput);
    featureInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addFeatureFromInput();
      }
    });
  }

  // Live Image Preview change listener
  const imageInput = document.getElementById('tool-image');
  const imagePreview = document.getElementById('image-preview');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  
  if (imageInput && imagePreview && imagePreviewContainer) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePreview.src = event.target.result;
          imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
      }
    });
  }
  
  // Tool Form Submission (Multipart File Upload)
  const toolForm = document.getElementById('tool-form');
  if (toolForm) {
    toolForm.addEventListener('submit', handleToolFormSubmit);
  }
  
  // Cancel Form Button
  const cancelFormBtn = document.getElementById('cancel-form-btn');
  if (cancelFormBtn) {
    cancelFormBtn.addEventListener('click', resetAndReturnToManage);
  }
  
  // Search in management table
  const adminSearchInput = document.getElementById('admin-search-input');
  if (adminSearchInput) {
    adminSearchInput.addEventListener('keyup', handleAdminSearch);
  }
  
  // Backup & Import Events
  const btnExport = document.getElementById('btn-export-json');
  if (btnExport) btnExport.addEventListener('click', exportDataAsJSON);
  
  const btnTriggerImport = document.getElementById('btn-trigger-import');
  const fileInputImport = document.getElementById('import-file-input');
  if (btnTriggerImport && fileInputImport) {
    btnTriggerImport.addEventListener('click', () => fileInputImport.click());
    fileInputImport.addEventListener('change', importDataToServerJSON);
  }
  
  const btnResetDb = document.getElementById('btn-reset-db');
  if (btnResetDb) btnResetDb.addEventListener('click', resetDatabaseToDefault);
}

// Handle Authentication Submit
async function handleAuthSubmit(e) {
  e.preventDefault();
  
  const passwordInput = document.getElementById('auth-password');
  const errorMsg = document.getElementById('auth-error-msg');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  if (!passwordInput || !submitBtn) return;
  
  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>جاري التحقق...</span>';
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value })
    });
    
    if (res.ok) {
      if (errorMsg) errorMsg.style.display = 'none';
      sessionStorage.setItem('admin_logged_in', 'true');
      passwordInput.value = '';
      checkAuth();
    } else {
      if (errorMsg) {
        errorMsg.style.display = 'block';
        errorMsg.style.animation = 'none';
        setTimeout(() => { errorMsg.style.animation = 'shake 0.3s ease'; }, 10);
      }
      passwordInput.value = '';
      passwordInput.focus();
    }
  } catch (err) {
    if (errorMsg) {
      errorMsg.textContent = 'فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
      errorMsg.style.display = 'block';
    }
    passwordInput.value = '';
    passwordInput.focus();
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

// Handle Logout
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  sessionStorage.removeItem('admin_logged_in');
  checkAuth();
}

// Switch Navigation Tabs
function switchTab(tabId) {
  // Update Sidebar active state
  document.querySelectorAll('.admin-nav-item[data-tab]').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Update Panels active state
  document.querySelectorAll('.admin-panel-card').forEach(panel => {
    if (panel.id === tabId) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
  
  // Refresh content on tab load
  if (tabId === 'tab-stats') {
    renderStatsTab();
  } else if (tabId === 'tab-manage-tools') {
    renderManageToolsTable(tools);
  }
}

// Render Dashboard Data
function renderDashboard() {
  renderStatsTab();
  renderManageToolsTable(tools);
}

// Render Stats Tab Details
async function renderStatsTab() {
  const totalToolsEl = document.getElementById('dashboard-total-tools');
  const totalDownloadsEl = document.getElementById('dashboard-total-downloads');
  
  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      const stats = await res.json();
      if (totalToolsEl) totalToolsEl.textContent = stats.totalTools;
      if (totalDownloadsEl) totalDownloadsEl.textContent = stats.totalDownloads;
    }
  } catch (e) {
    console.error('Error fetching stats', e);
  }
  
  // Render Activity Logs from server
  renderActivityLogs();
}

// Render Activity logs in table from Server
async function renderActivityLogs() {
  const logsTableBody = document.getElementById('dashboard-activity-log');
  if (!logsTableBody) return;
  
  try {
    const res = await fetch('/api/logs');
    if (res.ok) {
      const logs = await res.json();
      
      if (logs.length === 0) {
        logsTableBody.innerHTML = `
          <tr>
            <td colspan="3" class="text-center" style="color: var(--text-secondary);">لا توجد نشاطات مسجلة حالياً.</td>
          </tr>
        `;
        return;
      }
      
      logsTableBody.innerHTML = '';
      
      logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight: 600; color: var(--text-primary);"><i class="fa-solid fa-circle-info" style="color: var(--accent-primary); margin-left: 8px;"></i> ${log.action}</td>
          <td class="english-text" style="font-size: 13px; color: var(--text-secondary);">${log.details}</td>
          <td class="english-text" style="font-size: 12px; color: var(--text-muted);">${log.time}</td>
        `;
        logsTableBody.appendChild(row);
      });
    }
  } catch (e) {
    console.error('Error fetching logs', e);
  }
}

// Render Manage Tools Table List
function renderManageToolsTable(toolsList) {
  const tableBody = document.getElementById('admin-tools-table-body');
  if (!tableBody) return;
  
  if (toolsList.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center" style="padding: 30px; color: var(--text-secondary);">
          <i class="fa-solid fa-folder-open" style="font-size: 24px; margin-bottom: 8px;"></i>
          <p>لا توجد أدوات برمجية لعرضها حالياً.</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = '';
  
  toolsList.forEach(tool => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>
        <div class="admin-table-tool-name">
          <div class="tool-icon-box" style="width: 32px; height: 32px; font-size: 14px; border-radius: 6px;">
            <i class="fa-solid ${tool.iconType || 'fa-cube'}"></i>
          </div>
          <span>${tool.name}</span>
          <span class="english-text" style="font-size: 11px; background: var(--btn-bg); padding: 2px 6px; border-radius: 4px; font-weight: 400; color: var(--accent-primary);">${tool.version}</span>
        </div>
      </td>
      <td><span class="tool-category" style="font-size: 12px;">${tool.category}</span></td>
      <td><span class="english-text" style="font-weight: 600;">${tool.downloadCount || 0}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-action edit" onclick="editTool('${tool.id}')" title="تعديل الأداة">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-action delete" onclick="deleteTool('${tool.id}')" title="حذف الأداة">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Handle Admin Live Search in Manage Tools Table
function handleAdminSearch() {
  const query = document.getElementById('admin-search-input').value.toLowerCase().trim();
  const filtered = tools.filter(t => 
    t.name.toLowerCase().includes(query) || 
    t.category.toLowerCase().includes(query) || 
    t.shortDescription.toLowerCase().includes(query)
  );
  renderManageToolsTable(filtered);
}

// Add a Feature item to temporary feature list
function addFeatureFromInput() {
  const featureInput = document.getElementById('feature-input');
  if (!featureInput) return;
  
  const val = featureInput.value.trim();
  if (val === '') return;
  
  currentFeatures.push(val);
  featureInput.value = '';
  featureInput.focus();
  
  renderCurrentFeaturesList();
}

// Render temporary features list inside form
function renderCurrentFeaturesList() {
  const container = document.getElementById('features-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  currentFeatures.forEach((feat, index) => {
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    item.innerHTML = `
      <span>${feat}</span>
      <button type="button" class="dynamic-item-delete" onclick="removeFeature(${index})">
        <i class="fa-solid fa-circle-xmark"></i>
      </button>
    `;
    container.appendChild(item);
  });
}

// Remove feature from temporary list
window.removeFeature = function(index) {
  currentFeatures.splice(index, 1);
  renderCurrentFeaturesList();
};

// Reset Form fields and switch back to Management tab
function resetAndReturnToManage() {
  const toolForm = document.getElementById('tool-form');
  if (toolForm) toolForm.reset();
  
  document.getElementById('edit-tool-id').value = '';
  document.getElementById('form-panel-title').textContent = 'نشر أداة برمجية جديدة';
  document.getElementById('submit-form-btn').querySelector('span').textContent = 'حفظ ونشر الأداة';
  document.getElementById('edit-file-note').style.display = 'none';
  
  // Hide image preview
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
  if (imagePreview) imagePreview.src = '';
  
  currentFeatures = [];
  renderCurrentFeaturesList();
  
  switchTab('tab-manage-tools');
}

// Handle Add/Edit Tool Form Submit (Using FormData to support file and image upload)
async function handleToolFormSubmit(e) {
  e.preventDefault();
  
  const editId = document.getElementById('edit-tool-id').value;
  const fileInput = document.getElementById('tool-file');
  const imageInput = document.getElementById('tool-image');
  
  // Validation: New tools must have a program file uploaded
  if (!editId && fileInput.files.length === 0) {
    alert('يرجى اختيار ملف البرنامج (.exe أو .zip أو .rar) لرفعه ونشره.');
    return;
  }
  
  const submitBtn = document.getElementById('submit-form-btn');
  const originalBtnHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>جاري رفع الملفات وحفظ البيانات...</span>';
  
  // Build FormData for multipart upload
  const formData = new FormData();
  formData.append('name', document.getElementById('tool-name').value.trim());
  formData.append('version', document.getElementById('tool-version').value.trim());
  formData.append('category', document.getElementById('tool-category').value);
  formData.append('iconType', document.getElementById('tool-icon').value);
  formData.append('shortDescription', document.getElementById('tool-short-desc').value.trim());
  formData.append('longDescription', document.getElementById('tool-long-desc').value.trim());
  
  // JSON arrays/objects must be stringified to be sent in FormData
  formData.append('features', JSON.stringify(currentFeatures));
  
  const reqs = {
    os: document.getElementById('req-os').value.trim(),
    ram: document.getElementById('req-ram').value.trim(),
    cpu: document.getElementById('req-cpu').value.trim(),
    disk: document.getElementById('req-disk').value.trim()
  };
  formData.append('requirements', JSON.stringify(reqs));
  
  // Append program file if selected
  if (fileInput.files.length > 0) {
    formData.append('file', fileInput.files[0]);
  }
  
  // Append image file if selected
  if (imageInput.files.length > 0) {
    formData.append('image', imageInput.files[0]);
  }
  
  try {
    let url = '/api/tools';
    let method = 'POST';
    
    if (editId) {
      url = `/api/tools/${editId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method: method,
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert(editId ? 'تم تعديل بيانات الأداة بنجاح!' : 'تم نشر الأداة البرمجية ورفع الملفات وحساب حجم الملف تلقائياً بنجاح!');
      
      // Reload tools and statistics
      await loadDataAndRefresh();
      
      // Reset and go back
      resetAndReturnToManage();
    } else {
      alert('فشل حفظ الأداة: ' + (result.error || 'خطأ غير معروف على الخادم.'));
    }
  } catch (err) {
    console.error('Error submitting form', err);
    alert('فشل الاتصال بالخادم لرفع الملفات وحفظ البيانات. يرجى التأكد من تشغيل الخادم.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHTML;
  }
}

// Populate Form for Editing an existing tool
window.editTool = function(toolId) {
  const tool = tools.find(t => t.id === toolId);
  if (!tool) return;
  
  // Set values
  document.getElementById('edit-tool-id').value = tool.id;
  document.getElementById('tool-name').value = tool.name;
  document.getElementById('tool-version').value = tool.version;
  document.getElementById('tool-category').value = tool.category;
  document.getElementById('tool-icon').value = tool.iconType || 'fa-cube';
  document.getElementById('tool-short-desc').value = tool.shortDescription;
  document.getElementById('tool-long-desc').value = tool.longDescription;
  
  // Requirements
  document.getElementById('req-os').value = tool.requirements.os || 'Windows 10/11 64-bit';
  document.getElementById('req-ram').value = tool.requirements.ram || '4 GB RAM';
  document.getElementById('req-cpu').value = tool.requirements.cpu || 'Intel i3 أو ما يعادله';
  document.getElementById('req-disk').value = tool.requirements.disk || '50 MB';
  
  // Features
  currentFeatures = tool.features ? [...tool.features] : [];
  renderCurrentFeaturesList();
  
  // Change UI texts
  document.getElementById('form-panel-title').textContent = `تعديل بيانات الأداة: ${tool.name}`;
  document.getElementById('submit-form-btn').querySelector('span').textContent = 'حفظ التعديلات';
  
  // Show file upload note
  document.getElementById('edit-file-note').style.display = 'block';
  
  // Show current image preview if exists
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  
  if (tool.imagePath && imagePreviewContainer && imagePreview) {
    imagePreview.src = tool.imagePath;
    imagePreviewContainer.style.display = 'block';
  } else if (imagePreviewContainer) {
    imagePreviewContainer.style.display = 'none';
  }
  
  // Switch to Form Tab
  switchTab('tab-add-tool');
};

// Delete Tool from Server
window.deleteTool = async function(toolId) {
  const tool = tools.find(t => t.id === toolId);
  if (!tool) return;
  
  const confirmDelete = confirm(`هل أنت متأكد من رغبتك في حذف أداة "${tool.name}" نهائياً من المتجر وحذف ملفاتها وصورها المرفوعة من القرص؟ لا يمكن التراجع عن هذا الإجراء.`);
  
  if (confirmDelete) {
    try {
      const res = await fetch(`/api/tools/${toolId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('تم حذف الأداة وملفاتها بنجاح.');
        await loadDataAndRefresh();
      } else {
        const errData = await res.json();
        alert('فشل الحذف: ' + (errData.error || 'خطأ غير معروف'));
      }
    } catch (e) {
      console.error('Error deleting tool', e);
      alert('فشل الاتصال بالخادم لحذف الأداة.');
    }
  }
};

// Export tools array as a JSON file download
function exportDataAsJSON() {
  const jsonStr = JSON.stringify(tools, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tools_data_backup.json';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Import tools array and upload to Server
async function importDataToServerJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      const parsed = JSON.parse(event.target.result);
      
      // Basic validation
      if (Array.isArray(parsed)) {
        const confirmImport = confirm(`أنت على وشك استيراد ${parsed.length} أداة. سيؤدي هذا إلى استبدال قاعدة بيانات الخادم بالكامل. هل أنت متأكد؟`);
        if (!confirmImport) {
          e.target.value = '';
          return;
        }
        
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(parsed)
        });
        
        if (res.ok) {
          alert('تم استيراد قاعدة البيانات إلى الخادم بنجاح!');
          e.target.value = '';
          await loadDataAndRefresh();
        } else {
          const errData = await res.json();
          alert('فشل الاستيراد على الخادم: ' + (errData.error || 'خطأ'));
        }
      } else {
        alert('الملف الذي قمت برفعه غير صالح. يجب أن يحتوي على مصفوفة أدوات برمجية صحيحة.');
      }
    } catch (err) {
      alert('فشل قراءة الملف. يرجى التأكد من اختيار ملف JSON صحيح.');
      console.error(err);
    }
  };
  
  reader.readAsText(file);
}

// Reset Database back to default 5 tools on Server
async function resetDatabaseToDefault() {
  const confirmReset = confirm('تحذير هام جداً: سيؤدي هذا الإجراء إلى مسح كافة الأدوات التي قمت برفعها على الخادم، واستعادة الأدوات الـ 5 الافتراضية وصورها وحذف جميع سجلات النشاط. هل تريد الاستمرار؟');
  
  if (confirmReset) {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST'
      });
      
      if (res.ok) {
        alert('تم إعادة ضبط الخادم للحالة الافتراضية بنجاح.');
        location.reload();
      } else {
        alert('فشل إعادة الضبط على الخادم.');
      }
    } catch (e) {
      console.error('Error resetting db', e);
      alert('فشل الاتصال بالخادم لإجراء إعادة الضبط.');
    }
  }
}
