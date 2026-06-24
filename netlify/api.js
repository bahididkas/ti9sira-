const { getStore } = require('@netlify/blobs');
const Busboy = require('busboy');

const DEFAULT_TOOLS = [
  {
    id: 'tool-system-booster', name: 'System Booster Pro', version: 'v2.4.0', category: 'أدوات نظام',
    shortDescription: 'تنظيف الملفات المؤقتة وسجلات التصفح غير المرغوبة لتسريع استجابة نظام ويندوز بنسبة تصل إلى 40%.',
    longDescription: 'أداة خفيفة وقوية تم تصميمها خصيصاً لتحسين أداء نظام التشغيل ويندوز. تقوم الأداة بفحص النظام بأكمله بحثاً عن مخلفات البرامج، سجلات الكاش التالفة، والملفات المؤقتة التي تستهلك المساحة وتسبب بطء النظام.',
    fileSize: '14.2 MB', fileName: 'system_booster_setup.exe', imagePath: '',
    downloadCount: 428, rating: 4.8, releaseDate: '2026-05-12',
    features: ['تنظيف فوري وآمن للملفات المؤقتة وسجلات التصفح المتراكمة', 'إيقاف وتأجيل البرامج غير الضرورية عند إقلاع نظام ويندوز', 'مراقبة فورية لاستهلاك المعالج والذاكرة العشوائية مع ميزة التحسين بضغطة زر', 'إصلاح سجلات الريجستري (Registry) التالفة وإزالة مدخلات البرامج المحذوفة'],
    requirements: { os: 'Windows 10 / 11 (64-bit)', ram: '4 GB RAM أو أعلى', cpu: 'Intel Core i3 أو معالج AMD مكافئ', disk: '45 MB مساحة تخزينية خالية' },
    iconType: 'fa-rocket'
  },
  {
    id: 'tool-ocr-grabber', name: 'Smart OCR Grabber', version: 'v1.2.5', category: 'أتمتة وإنتاجية',
    shortDescription: 'استخراج النصوص العربية والإنجليزية بدقة متناهية من الصور ولقطات الشاشة بضغطة زر واحدة ودون إنترنت.',
    longDescription: 'برنامج ذكي ومبتكر يقوم باستخراج النصوص المكتوبة داخل الصور أو لقطات الشاشة وتحويلها إلى نصوص قابلة للتحرير والنسخ الفوري. يتميز البرنامج بالقدرة على المعالجة المحلية الكاملة (دون الحاجة للاتصال بالإنترنت) لضمان خصوصية بياناتك المطلقة.',
    fileSize: '8.7 MB', fileName: 'ocr_grabber_installer.zip', imagePath: '',
    downloadCount: 312, rating: 4.9, releaseDate: '2026-06-02',
    features: ['محرك ذكاء اصطناعي محلي لاستخراج النصوص العربية بدقة تصل إلى 98%', 'اختصار ذكي لالتقاط لقطة شاشة واستخراج النص منها فوراً', 'دعم كامل لاستخراج النصوص ثنائية اللغة (عربي وإنجليزي مختلط)', 'تصدير النصوص المستخرجة مباشرة بصيغة TXT أو مستند Word'],
    requirements: { os: 'Windows 8.1 / 10 / 11 (64-bit)', ram: '2 GB RAM أو أعلى', cpu: 'Intel Core i3 أو ما يعادله', disk: '30 MB مساحة خالية' },
    iconType: 'fa-terminal'
  },
  {
    id: 'tool-auto-clicker', name: 'Auto-Clicker Master', version: 'v3.1.0', category: 'أتمتة وإنتاجية',
    shortDescription: 'محاكي نقرات الفأرة السريع والمتطور لتسجيل وتكرار سيناريوهات النقر المعقدة للألعاب وللاختبارات.',
    longDescription: 'أداة احترافية تمنحك القدرة على أتمتة نقرات الفأرة بشكل كامل على شاشتك. يمكنك تعيين فترات زمنية دقيقة جداً تفصل بين النقرات (بالملي ثانية)، وتحديد نوع النقر (مفرد، مزدوج، نقرة يمين أو يسار).',
    fileSize: '3.5 MB', fileName: 'auto_clicker.zip', imagePath: '',
    downloadCount: 895, rating: 4.7, releaseDate: '2026-04-20',
    features: ['سرعة نقر فائقة تصل إلى 1000 نقرة في الثانية الواحدة', 'إمكانية تحديد إحداثيات شاشة دقيقة للنقر، أو النقر في موقع مؤشر الفأرة', 'نظام تسجيل السيناريوهات (Macro Recorder) لتكرار الخطوات البرمجية والألعاب', 'مفاتيح اختصار ذكية وقابلة للتخصيص بالكامل للبدء والإيقاف السريع'],
    requirements: { os: 'Windows 7 / 8 / 10 / 11', ram: '1 GB RAM', cpu: 'معالج ثنائي النواة بتردد 1.5 GHz أو أعلى', disk: '10 MB مساحة تخزينية' },
    iconType: 'fa-arrows-to-dot'
  },
  {
    id: 'tool-port-scanner', name: 'Port Scanner Ultra', version: 'v1.0.2', category: 'حماية وأمان',
    shortDescription: 'فحص أمان خوادمك وشبكاتك المحلية واكتشاف الثغرات والمنافذ المفتوحة في ثوانٍ معدودة.',
    longDescription: 'أداة فحص أمني مخصصة لمهندسي الشبكات ومحترفي الحماية والمطورين. يقوم البرنامج بإجراء فحص فائق السرعة على عناوين IP المحددة لاكتشاف المنافذ (Ports) المفتوحة والخدمات النشطة خلفها.',
    fileSize: '5.1 MB', fileName: 'port_scanner_ultra.exe', imagePath: '',
    downloadCount: 154, rating: 4.6, releaseDate: '2026-06-15',
    features: ['فحص متوازي متعدد الخيوط (Multi-threaded) لفحص آلاف المنافذ في ثوانٍ', 'التعرف التلقائي على الخدمات والبروتوكولات النشطة (HTTP, FTP, SSH, RDP...)', 'توليد تقارير أمنية مفصلة تشمل توصيات تقنية لإغلاق الثغرات', 'إمكانية فحص نطاق كامل من عناوين IP في الشبكة المحلية دفعة واحدة'],
    requirements: { os: 'Windows 10 / 11', ram: '4 GB RAM', cpu: 'Intel Core i3 أو أعلى مع كارت شبكة يدعم الاتصال اللاسلكي أو السلكي', disk: '20 MB مساحة تخزينية خالية' },
    iconType: 'fa-shield-halved'
  },
  {
    id: 'tool-snippet-keeper', name: 'Code Snippet Keeper', version: 'v1.8.0', category: 'برمجة ومطورين',
    shortDescription: 'مستودع وقاعدة بيانات شخصية لتخزين وتصنيف مقتطفات الأكواد البرمجية مع ميزة التلوين والبحث الفوري.',
    longDescription: 'برنامج منظم الأكواد هو الرفيق المثالي لكل مطور. يسمح لك بتخزين وحفظ مقتطفات الأكواد (Snippets) الهامة التي تعيد استخدامها بكثرة في مشاريعك.',
    fileSize: '18.6 MB', fileName: 'snippet_keeper.zip', imagePath: '',
    downloadCount: 267, rating: 4.9, releaseDate: '2026-05-30',
    features: ['تلوين برمجي ذكي (Syntax Highlighting) لـ HTML, CSS, JS, Python, C#, C++, SQL...', 'نظام تصنيف وتجميع متقدم بالوسوم (Tags) والأقسام المتعددة', 'زر نسخ سريع واختصارات لوحة مفاتيح لتسهيل عملية النسخ واللصق في بيئات التطوير', 'تشفير قاعدة البيانات المحلية لحماية الأكواد السرية أو كلمات المرور المسجلة'],
    requirements: { os: 'Windows 10 / 11 / macOS Mojave أو أعلى', ram: '4 GB RAM', cpu: 'Intel Core i5 أو ما يعادله', disk: '100 MB مساحة للتثبيت وقاعدة البيانات' },
    iconType: 'fa-terminal'
  }
];

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function parseCookies(event) {
  const cookieStr = event.headers.cookie || event.headers.Cookie || '';
  const cookies = {};
  cookieStr.split(';').forEach(c => {
    const parts = c.trim().split('=');
    if (parts[0]) cookies[parts[0]] = parts[1] || '';
  });
  return cookies;
}

function adminAuth(event) {
  const cookies = parseCookies(event);
  return cookies['admin_token'] === 'authenticated';
}

async function getTools(store) {
  try {
    const data = await store.get('tools', { type: 'json' });
    return data && data.length ? data : [];
  } catch { return []; }
}

async function saveTools(store, tools) {
  await store.set('tools', JSON.stringify(tools));
}

async function getLogs(store) {
  try {
    const data = await store.get('logs', { type: 'json' });
    return data || [];
  } catch { return []; }
}

async function saveLogs(store, logs) {
  await store.set('logs', JSON.stringify(logs));
}

async function logActivity(store, action, details) {
  const logs = await getLogs(store);
  logs.unshift({ action, details, time: new Date().toLocaleTimeString('ar-EG') + ' - ' + new Date().toLocaleDateString('ar-EG') });
  if (logs.length > 15) logs.length = 15;
  await saveLogs(store, logs);
}

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};
    const ct = event.headers['content-type'] || event.headers['Content-Type'] || '';
    if (!ct.includes('multipart/form-data')) {
      try {
        const body = JSON.parse(event.body || '{}');
        Object.assign(fields, body);
        return resolve({ fields, files });
      } catch { return resolve({ fields: { _raw: event.body }, files }); }
    }
    const bb = Busboy({ headers: { 'content-type': ct } });
    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', d => chunks.push(d));
      file.on('end', () => { files[name] = { buffer: Buffer.concat(chunks), filename: info.filename, mimeType: info.mimeType }; });
    });
    bb.on('finish', () => resolve({ fields, files }));
    bb.on('error', reject);
    bb.end(Buffer.from(event.body, 'base64'));
  });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Cookie',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

exports.handler = async (event, context) => {
  const store = getStore('devsuite-data');
  const method = event.httpMethod;
  const path = event.path;
  const apiPath = path.replace(/^\/api/, '');

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    // ===== SERVE FILES (uploads & downloads) =====
    if (path.startsWith('/uploads/') || path.startsWith('/downloads/')) {
      const filename = path.split('/').pop();
      const prefix = path.startsWith('/uploads/') ? 'img_' : 'file_';
      const data = await store.get(prefix + filename);
      if (!data) {
        if (path.startsWith('/uploads/')) {
          return {
            statusCode: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' },
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="#1a1a2e" width="400" height="200"/><text fill="#4b5563" font-size="18" x="200" y="110" text-anchor="middle" font-family="sans-serif">صورة غير متوفرة</text></svg>'
          };
        }
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'الملف غير موجود' }) };
      }
      let contentType = 'application/octet-stream';
      const ext = filename.split('.').pop().toLowerCase();
      const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', ico: 'image/x-icon', pdf: 'application/pdf', zip: 'application/zip', rar: 'application/x-rar-compressed', '7z': 'application/x-7z-compressed', exe: 'application/x-msdownload', msi: 'application/x-msi' };
      if (mimeMap[ext]) contentType = mimeMap[ext];
      const isImage = contentType.startsWith('image/');
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': contentType, ...(isImage ? {} : { 'Content-Disposition': `attachment; filename="${filename}"` }), 'Cache-Control': 'public, max-age=31536000' },
        body: data,
        isBase64Encoded: true
      };
    }

    // ===== API ROUTES =====

    // GET /api/tools
    if (method === 'GET' && (apiPath === '/tools' || apiPath === '/tools/' || apiPath === '')) {
      let tools = await getTools(store);
      if (!tools.length) { await saveTools(store, DEFAULT_TOOLS); tools = DEFAULT_TOOLS; }
      return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify(tools) };
    }

    // GET /api/logs
    if (method === 'GET' && (apiPath === '/logs' || apiPath === '/logs/')) {
      const logs = await getLogs(store);
      return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify(logs) };
    }

    // GET /api/stats
    if (method === 'GET' && (apiPath === '/stats' || apiPath === '/stats/')) {
      const tools = await getTools(store);
      const totalTools = tools.length;
      const totalDownloads = tools.reduce((s, t) => s + (t.downloadCount || 0), 0);
      return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ totalTools, totalDownloads }) };
    }

    // POST /api/tools - Create
    if (method === 'POST' && (apiPath === '/tools' || apiPath === '/tools/' || apiPath === '')) {
      const { fields, files } = await parseMultipart(event);
      if (!files.file) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'ملف البرنامج مطلوب لإنشاء أداة جديدة.' }) };
      }
      const fileSize = formatBytes(files.file.buffer.length);
      const fileName = files.file.filename;
      await store.set('file_' + fileName, files.file.buffer.toString('base64'));
      let imagePath = '';
      if (files.image) {
        imagePath = '/uploads/' + files.image.filename;
        await store.set('img_' + files.image.filename, files.image.buffer.toString('base64'));
      }
      let features = []; try { features = JSON.parse(fields.features); } catch {}
      let requirements = { os: 'Windows 10/11 64-bit', ram: '4 GB RAM', cpu: 'Intel i3 أو ما يعادله', disk: '50 MB' }; try { requirements = JSON.parse(fields.requirements); } catch {}
      const tools = await getTools(store);
      const newTool = { id: 'tool-' + Date.now(), name: fields.name, version: fields.version || 'v1.0.0', category: fields.category || 'أدوات عامة', shortDescription: fields.shortDescription, longDescription: fields.longDescription, fileSize, fileName, imagePath, downloadCount: 0, rating: 5.0, releaseDate: new Date().toISOString().split('T')[0], features, requirements, iconType: fields.iconType || 'fa-cube' };
      tools.push(newTool);
      await saveTools(store, tools);
      await logActivity(store, 'نشر أداة برمجية جديدة', newTool.name + ' (' + newTool.version + ') - الحجم: ' + newTool.fileSize);
      return { statusCode: 201, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, tool: newTool }) };
    }

    // PUT /api/tools/:id
    if (method === 'PUT' && apiPath.startsWith('/tools/')) {
      const toolId = apiPath.replace('/tools/', '');
      const { fields, files } = await parseMultipart(event);
      const tools = await getTools(store);
      const idx = tools.findIndex(t => t.id === toolId);
      if (idx === -1) return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'الأداة غير موجودة.' }) };
      const existing = tools[idx];
      let fileSize = existing.fileSize, fileName = existing.fileName, imagePath = existing.imagePath;
      if (files.file) { fileSize = formatBytes(files.file.buffer.length); fileName = files.file.filename; await store.set('file_' + fileName, files.file.buffer.toString('base64')); }
      if (files.image) { imagePath = '/uploads/' + files.image.filename; await store.set('img_' + files.image.filename, files.image.buffer.toString('base64')); }
      let features = existing.features; try { features = JSON.parse(fields.features); } catch {}
      let requirements = existing.requirements; try { requirements = JSON.parse(fields.requirements); } catch {}
      tools[idx] = { ...existing, name: fields.name || existing.name, version: fields.version || existing.version, category: fields.category || existing.category, shortDescription: fields.shortDescription || existing.shortDescription, longDescription: fields.longDescription || existing.longDescription, fileSize, fileName, imagePath, features, requirements, iconType: fields.iconType || existing.iconType };
      await saveTools(store, tools);
      await logActivity(store, 'تعديل بيانات أداة', tools[idx].name + ' (' + tools[idx].version + ')');
      return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, tool: tools[idx] }) };
    }

    // DELETE /api/tools/:id
    if (method === 'DELETE' && apiPath.startsWith('/tools/')) {
      const toolId = apiPath.replace('/tools/', '');
      let tools = await getTools(store);
      const tool = tools.find(t => t.id === toolId);
      if (!tool) return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'الأداة غير موجودة.' }) };
      if (tool.fileName) await store.delete('file_' + tool.fileName).catch(() => {});
      if (tool.imagePath) {
        const imgName = tool.imagePath.split('/').pop();
        if (imgName) await store.delete('img_' + imgName).catch(() => {});
      }
      tools = tools.filter(t => t.id !== toolId);
      await saveTools(store, tools);
      await logActivity(store, 'حذف أداة برمجية', tool.name);
      return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
    }

    // POST /api/tools/:id/download
    if (method === 'POST' && /^\/tools\/.+\/download$/.test(apiPath)) {
      const toolId = apiPath.split('/')[2];
      const tools = await getTools(store);
      const tool = tools.find(t => t.id === toolId);
      if (!tool) return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'الأداة غير موجودة.' }) };
      tool.downloadCount = (tool.downloadCount || 0) + 1;
      await saveTools(store, tools);
      await logActivity(store, 'تم تحميل الأداة: ' + tool.name, 'عدد التحميلات الجديد: ' + tool.downloadCount);
      return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, downloadCount: tool.downloadCount }) };
    }

    // POST /api/import
    if (method === 'POST' && (apiPath === '/import' || apiPath === '/import/')) {
      const imported = JSON.parse(event.body);
      if (Array.isArray(imported)) {
        await saveTools(store, imported);
        await logActivity(store, 'استيراد قاعدة البيانات', 'شحن ' + imported.length + ' أداة من ملف JSON بنجاح');
        return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
      }
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'البيانات غير صالحة.' }) };
    }

    // POST /api/reset
    if (method === 'POST' && (apiPath === '/reset' || apiPath === '/reset/')) {
      await saveTools(store, DEFAULT_TOOLS);
      await saveLogs(store, []);
      await logActivity(store, 'إعادة ضبط النظام كاملة', 'استعادة 5 أدوات ومسح السجلات');
      return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
    }

    // POST /api/auth/login
    if (method === 'POST' && (apiPath === '/auth/login' || apiPath === '/auth/login/')) {
      const { password } = JSON.parse(event.body || '{}');
      if (password === 'admin123') {
        return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Set-Cookie': 'admin_token=authenticated; Path=/; Max-Age=86400; SameSite=Lax' }, body: JSON.stringify({ success: true }) };
      }
      return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'كلمة المرور غير صحيحة' }) };
    }

    // POST /api/auth/logout
    if (method === 'POST' && (apiPath === '/auth/logout' || apiPath === '/auth/logout/')) {
      return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Set-Cookie': 'admin_token=; Path=/; Max-Age=0' }, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Route not found' }) };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Internal server error: ' + err.message }) };
  }
};
