// ==========================================
// DevSuite Local Backend Server (server.js)
// ==========================================

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS) from the root directory
app.use(express.static(__dirname));

// Ensure directories exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Ensure 'database.json' exists
const dbPath = path.join(__dirname, 'database.json');
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '[]', 'utf8');
}

// Ensure 'logs.json' exists
const logsPath = path.join(__dirname, 'logs.json');
if (!fs.existsSync(logsPath)) {
  fs.writeFileSync(logsPath, '[]', 'utf8');
}

// Multer Storage Configuration (Separate destinations for program files vs image files)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'image') {
      cb(null, uploadsDir);
    } else {
      cb(null, downloadsDir);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Helper: Format bytes to human readable size
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 1;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper: Read database.json
function getToolsFromDb() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading database.json', e);
    return [];
  }
}

// Helper: Write database.json
function saveToolsToDb(tools) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(tools, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing database.json', e);
  }
}

// Helper: Read logs.json
function getLogsFromDb() {
  try {
    const data = fs.readFileSync(logsPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Helper: Write log activity
function logActivity(action, details) {
  try {
    const logs = getLogsFromDb();
    const newLog = {
      action,
      details,
      time: new Date().toLocaleTimeString('ar-EG') + ' - ' + new Date().toLocaleDateString('ar-EG')
    };
    logs.unshift(newLog);
    if (logs.length > 15) logs.splice(15);
    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (e) {
    console.error('Error logging activity', e);
  }
}

// -----------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------

// 0. Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body || {};
  if (password === 'BOUSBIA.2003.xd.B') {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// 1. Get all tools
app.get('/api/tools', (req, res) => {
  const tools = getToolsFromDb();
  res.json(tools);
});

// 2. Get activity logs
app.get('/api/logs', (req, res) => {
  const logs = getLogsFromDb();
  res.json(logs);
});

// 3. Get system stats
app.get('/api/stats', (req, res) => {
  const tools = getToolsFromDb();
  const totalTools = tools.length;
  const totalDownloads = tools.reduce((sum, t) => sum + (t.downloadCount || 0), 0);
  res.json({ totalTools, totalDownloads });
});

// 4. Create new tool (With Program Upload & Image Upload & Auto Size Calculation)
app.post('/api/tools', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), (req, res) => {
  try {
    const tools = getToolsFromDb();
    
    // Check if program file is uploaded
    const programFile = req.files['file'] ? req.files['file'][0] : null;
    if (!programFile) {
      return res.status(400).json({ error: 'ملف البرنامج مطلوب لإنشاء أداة جديدة.' });
    }
    
    // Auto calculate file size and name
    const fileSize = formatBytes(programFile.size);
    const fileName = programFile.originalname;
    
    // Check if image file is uploaded
    const imageFile = req.files['image'] ? req.files['image'][0] : null;
    const imagePath = imageFile ? `/uploads/${imageFile.originalname}` : '';
    
    // Parse JSON arrays/objects sent from frontend Form
    let features = [];
    try { features = JSON.parse(req.body.features); } catch (e) { features = []; }
    
    let requirements = {
      os: 'Windows 10/11 64-bit',
      ram: '4 GB RAM',
      cpu: 'Intel i3 أو ما يعادله',
      disk: '50 MB'
    };
    try { requirements = JSON.parse(req.body.requirements); } catch (e) {}

    const newTool = {
      id: 'tool-' + Date.now(),
      name: req.body.name,
      version: req.body.version || 'v1.0.0',
      category: req.body.category || 'أدوات عامة',
      shortDescription: req.body.shortDescription,
      longDescription: req.body.longDescription,
      fileSize: fileSize, 
      fileName: fileName, 
      imagePath: imagePath, // Save image path!
      downloadCount: 0,
      rating: 5.0,
      releaseDate: new Date().toISOString().split('T')[0],
      features: features,
      requirements: requirements,
      iconType: req.body.iconType || 'fa-cube'
    };
    
    tools.push(newTool);
    saveToolsToDb(tools);
    
    logActivity('نشر أداة برمجية جديدة', `${newTool.name} (${newTool.version}) - الحجم: ${newTool.fileSize}`);
    
    res.status(201).json({ success: true, tool: newTool });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب على الخادم.' });
  }
});

// 5. Update existing tool (Supports optional new program file and/or new image upload)
app.put('/api/tools/:id', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), (req, res) => {
  try {
    const { id } = req.params;
    const tools = getToolsFromDb();
    const index = tools.findIndex(t => t.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'الأداة البرمجية غير موجودة.' });
    }
    
    const existingTool = tools[index];
    
    let fileSize = existingTool.fileSize;
    let fileName = existingTool.fileName;
    let imagePath = existingTool.imagePath;
    
    // If a new program file is uploaded, replace the old one
    const programFile = req.files['file'] ? req.files['file'][0] : null;
    if (programFile) {
      fileSize = formatBytes(programFile.size);
      fileName = programFile.originalname;
      
      // Delete old program file if name is different
      if (existingTool.fileName && existingTool.fileName !== fileName) {
        const oldFilePath = path.join(downloadsDir, existingTool.fileName);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }
    
    // If a new product image is uploaded, replace the old one
    const imageFile = req.files['image'] ? req.files['image'][0] : null;
    if (imageFile) {
      imagePath = `/uploads/${imageFile.originalname}`;
      
      // Delete old image file if name is different and it's not a default image
      if (existingTool.imagePath && existingTool.imagePath !== imagePath) {
        const oldImageName = path.basename(existingTool.imagePath);
        // Protect default shared images from deletion
        const isDefaultImage = ['system_booster.png', 'ocr_grabber.png', 'auto_clicker.png', 'port_scanner.png', 'snippet_keeper.png'].includes(oldImageName);
        
        if (!isDefaultImage) {
          const oldImagePath = path.join(uploadsDir, oldImageName);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }
    }
    
    let features = [];
    try { features = JSON.parse(req.body.features); } catch (e) { features = existingTool.features; }
    
    let requirements = existingTool.requirements;
    try { requirements = JSON.parse(req.body.requirements); } catch (e) {}
    
    tools[index] = {
      ...existingTool,
      name: req.body.name || existingTool.name,
      version: req.body.version || existingTool.version,
      category: req.body.category || existingTool.category,
      shortDescription: req.body.shortDescription || existingTool.shortDescription,
      longDescription: req.body.longDescription || existingTool.longDescription,
      fileSize: fileSize,
      fileName: fileName,
      imagePath: imagePath,
      features: features,
      requirements: requirements,
      iconType: req.body.iconType || existingTool.iconType
    };
    
    saveToolsToDb(tools);
    
    logActivity('تعديل بيانات أداة', `${tools[index].name} (${tools[index].version})`);
    
    res.json({ success: true, tool: tools[index] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب على الخادم.' });
  }
});

// 6. Delete tool (Also deletes its associated files from disk)
app.delete('/api/tools/:id', (req, res) => {
  try {
    const { id } = req.params;
    let tools = getToolsFromDb();
    const tool = tools.find(t => t.id === id);
    
    if (!tool) {
      return res.status(404).json({ error: 'الأداة البرمجية غير موجودة.' });
    }
    
    // Delete physical program file
    if (tool.fileName) {
      const filePath = path.join(downloadsDir, tool.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete physical image file if not a default one
    if (tool.imagePath) {
      const imageName = path.basename(tool.imagePath);
      const isDefaultImage = ['system_booster.png', 'ocr_grabber.png', 'auto_clicker.png', 'port_scanner.png', 'snippet_keeper.png'].includes(imageName);
      
      if (!isDefaultImage) {
        const imageFilePath = path.join(uploadsDir, imageName);
        if (fs.existsSync(imageFilePath)) {
          fs.unlinkSync(imageFilePath);
        }
      }
    }
    
    // Remove from array
    tools = tools.filter(t => t.id !== id);
    saveToolsToDb(tools);
    
    logActivity('حذف أداة برمجية', tool.name);
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الحذف على الخادم.' });
  }
});

// 7. Increment Download Count on Download click
app.post('/api/tools/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const tools = getToolsFromDb();
    const tool = tools.find(t => t.id === id);
    
    if (!tool) {
      return res.status(404).json({ error: 'الأداة غير موجودة.' });
    }
    
    tool.downloadCount = (tool.downloadCount || 0) + 1;
    saveToolsToDb(tools);
    
    logActivity(`تم تحميل الأداة: ${tool.name}`, `عدد التحميلات الجديد: ${tool.downloadCount}`);
    
    res.json({ success: true, downloadCount: tool.downloadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل التحميل.' });
  }
});

// 8. Import Database JSON
app.post('/api/import', (req, res) => {
  try {
    const importedTools = req.body;
    if (Array.isArray(importedTools)) {
      saveToolsToDb(importedTools);
      logActivity('استيراد قاعدة البيانات', `شحن ${importedTools.length} أداة من ملف JSON بنجاح`);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'البيانات المرسلة غير صالحة. يجب أن تكون مصفوفة.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء استيراد البيانات على الخادم.' });
  }
});

// 9. Reset database back to default 5 tools (with generated image paths seeded!)
app.post('/api/reset', (req, res) => {
  try {
    const DEFAULT_TOOLS = [
      {
        id: 'tool-system-booster',
        name: 'System Booster Pro',
        version: 'v2.4.0',
        category: 'أدوات نظام',
        shortDescription: 'تنظيف الملفات المؤقتة وسجلات التصفح غير المرغوبة لتسريع استجابة نظام ويندوز بنسبة تصل إلى 40%.',
        longDescription: 'أداة خفيفة وقوية تم تصميمها خصيصاً لتحسين أداء نظام التشغيل ويندوز. تقوم الأداة بفحص النظام بأكمله بحثاً عن مخلفات البرامج، سجلات الكاش التالفة، والملفات المؤقتة التي تستهلك المساحة وتسبب بطء النظام. تمنحك الأداة تحكماً كاملاً في البرامج التي تبدأ مع إقلاع النظام لتقليص زمن التشغيل بشكل ملحوظ.',
        fileSize: '14.2 MB',
        fileName: 'system_booster_setup.exe',
        imagePath: '/uploads/system_booster.png', // Seeded image!
        downloadCount: 428,
        rating: 4.8,
        releaseDate: '2026-05-12',
        features: [
          'تنظيف فوري وآمن للملفات المؤقتة وسجلات التصفح المتراكمة',
          'إيقاف وتأجيل البرامج غير الضرورية عند إقلاع نظام ويندوز',
          'مراقبة فورية لاستهلاك المعالج والذاكرة العشوائية مع ميزة التحسين بضغطة زر',
          'إصلاح سجلات الريجستري (Registry) التالفة وإزالة مدخلات البرامج المحذوفة'
        ],
        requirements: {
          os: 'Windows 10 / 11 (64-bit)',
          ram: '4 GB RAM أو أعلى',
          cpu: 'Intel Core i3 أو معالج AMD مكافئ',
          disk: '45 MB مساحة تخزينية خالية'
        },
        iconType: 'fa-rocket'
      },
      {
        id: 'tool-ocr-grabber',
        name: 'Smart OCR Grabber',
        version: 'v1.2.5',
        category: 'أتمتة وإنتاجية',
        shortDescription: 'استخراج النصوص العربية والإنجليزية بدقة متناهية من الصور ولقطات الشاشة بضغطة زر واحدة ودون إنترنت.',
        longDescription: 'برنامج ذكي ومبتكر يقوم باستخراج النصوص المكتوبة داخل الصور أو لقطات الشاشة وتحويلها إلى نصوص قابلة للتحرير والنسخ الفوري. يتميز البرنامج بالقدرة على المعالجة المحلية الكاملة (دون الحاجة للاتصال بالإنترنت) لضمان خصوصية بياناتك المطلقة، مع دعم ممتاز للمستندات والخطوط العربية المعقدة.',
        fileSize: '8.7 MB',
        fileName: 'ocr_grabber_installer.zip',
        imagePath: '/uploads/ocr_grabber.png', // Seeded image!
        downloadCount: 312,
        rating: 4.9,
        releaseDate: '2026-06-02',
        features: [
          'محرك ذكاء اصطناعي محلي لاستخراج النصوص العربية بدقة تصل إلى 98%',
          'اختصار ذكي لالتقاط لقطة شاشة واستخراج النص منها فوراً',
          'دعم كامل لاستخراج النصوص ثنائية اللغة (عربي وإنجليزي مختلط)',
          'تصدير النصوص المستخرجة مباشرة بصيغة TXT أو مستند Word'
        ],
        requirements: {
          os: 'Windows 8.1 / 10 / 11 (64-bit)',
          ram: '2 GB RAM أو أعلى',
          cpu: 'Intel Core i3 أو ما يعادله',
          disk: '30 MB مساحة خالية'
        },
        iconType: 'fa-terminal'
      },
      {
        id: 'tool-auto-clicker',
        name: 'Auto-Clicker Master',
        version: 'v3.1.0',
        category: 'أتمتة وإنتاجية',
        shortDescription: 'محاكي نقرات الفأرة السريع والمتطور لتسجيل وتكرار سيناريوهات النقر المعقدة للألعاب وللاختبارات.',
        longDescription: 'أداة احترافية تمنحك القدرة على أتمتة نقرات الفأرة بشكل كامل على شاشتك. يمكنك تعيين فترات زمنية دقيقة جداً تفصل بين النقرات (بالملي ثانية)، وتحديد نوع النقر (مفرد، مزدوج، نقرة يمين أو يسار). يحتوي البرنامج على مسجل سيناريوهات متطور لحفظ مسارات الفأرة وإعادة تشغيلها تلقائياً بالكامل.',
        fileSize: '3.5 MB',
        fileName: 'auto_clicker.zip',
        imagePath: '/uploads/auto_clicker.png', // Seeded image!
        downloadCount: 895,
        rating: 4.7,
        releaseDate: '2026-04-20',
        features: [
          'سرعة نقر فائقة تصل إلى 1000 نقرة في الثانية الواحدة',
          'إمكانية تحديد إحداثيات شاشة دقيقة للنقر، أو النقر في موقع مؤشر الفأرة',
          'نظام تسجيل السيناريوهات (Macro Recorder) لتكرار الخطوات البرمجية والألعاب',
          'مفاتيح اختصار ذكية وقابلة للتخصيص بالكامل للبدء والإيقاف السريع'
        ],
        requirements: {
          os: 'Windows 7 / 8 / 10 / 11',
          ram: '1 GB RAM',
          cpu: 'معالج ثنائي النواة بتردد 1.5 GHz أو أعلى',
          disk: '10 MB مساحة تخزينية'
        },
        iconType: 'fa-arrows-to-dot'
      },
      {
        id: 'tool-port-scanner',
        name: 'Port Scanner Ultra',
        version: 'v1.0.2',
        category: 'حماية وأمان',
        shortDescription: 'فحص أمان خوادمك وشبكاتك المحلية واكتشاف الثغرات والمنافذ المفتوحة في ثوانٍ معدودة.',
        longDescription: 'أداة فحص أمني مخصصة لمهندسي الشبكات ومحترفي الحماية والمطورين. يقوم البرنامج بإجراء فحص فائق السرعة على عناوين IP المحددة لاكتشاف المنافذ (Ports) المفتوحة والخدمات النشطة خلفها. يساعدك البرنامج على تقييم سلامة خوادمك وإغلاق الثغرات لمنع الاختراقات المحتملة.',
        fileSize: '5.1 MB',
        fileName: 'port_scanner_ultra.exe',
        imagePath: '/uploads/port_scanner.png', // Seeded image!
        downloadCount: 154,
        rating: 4.6,
        releaseDate: '2026-06-15',
        features: [
          'فحص متوازي متعدد الخيوط (Multi-threaded) لفحص آلاف المنافذ في ثوانٍ',
          'التعرف التلقائي على الخدمات والبروتوكولات النشطة (HTTP, FTP, SSH, RDP...)',
          'توليد تقارير أمنية مفصلة تشمل توصيات تقنية لإغلاق الثغرات',
          'إمكانية فحص نطاق كامل من عناوين IP في الشبكة المحلية دفعة واحدة'
        ],
        requirements: {
          os: 'Windows 10 / 11',
          ram: '4 GB RAM',
          cpu: 'Intel Core i3 أو أعلى مع كارت شبكة يدعم الاتصال اللاسلكي أو السلكي',
          disk: '20 MB مساحة تخزينية خالية'
        },
        iconType: 'fa-shield-halved'
      },
      {
        id: 'tool-snippet-keeper',
        name: 'Code Snippet Keeper',
        version: 'v1.8.0',
        category: 'برمجة ومطورين',
        shortDescription: 'مستودع وقاعدة بيانات شخصية لتخزين وتصنيف مقتطفات الأكواد البرمجية مع ميزة التلوين والبحث الفوري.',
        longDescription: 'برنامج منظم الأكواد هو الرفيق المثالي لكل مطور. يسمح لك بتخزين وحفظ مقتطفات الأكواد (Snippets) الهامة التي تعيد استخدامها بكثرة في مشاريعك. يدعم البرنامج التلوين البرمجي الذكي لأكثر من 30 لغة برمجة، مع محرك بحث فوري وسريع يسهل لك العثور على أي كود ونسخه بضغطة زر.',
        fileSize: '18.6 MB',
        fileName: 'snippet_keeper.zip',
        imagePath: '/uploads/snippet_keeper.png', // Seeded image!
        downloadCount: 267,
        rating: 4.9,
        releaseDate: '2026-05-30',
        features: [
          'تلوين برمجي ذكي (Syntax Highlighting) لـ HTML, CSS, JS, Python, C#, C++, SQL...',
          'نظام تصنيف وتجميع متقدم بالوسوم (Tags) والأقسام المتعددة',
          'زر نسخ سريع واختصارات لوحة مفاتيح لتسهيل عملية النسخ واللصق في بيئات التطوير',
          'تشفير قاعدة البيانات المحلية لحماية الأكواد السرية أو كلمات المرور المسجلة'
        ],
        requirements: {
          os: 'Windows 10 / 11 / macOS Mojave أو أعلى',
          ram: '4 GB RAM',
          cpu: 'Intel Core i5 أو ما يعادله',
          disk: '100 MB مساحة للتثبيت وقاعدة البيانات'
        },
        iconType: 'fa-terminal'
      }
    ];
    
    saveToolsToDb(DEFAULT_TOOLS);
    
    // Reset logs
    fs.writeFileSync(logsPath, '[]', 'utf8');
    logActivity('إعادة ضبط النظام كاملة', 'استعادة 5 أدوات ومسح السجلات');
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء إعادة ضبط البيانات.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`DevSuite local server running on http://localhost:${PORT}`);
  console.log(`You can open http://localhost:${PORT} in your browser.`);
  console.log(`All uploaded files will be stored in: ${downloadsDir}`);
  console.log(`All uploaded images will be stored in: ${uploadsDir}`);
  console.log(`===================================================`);
});
