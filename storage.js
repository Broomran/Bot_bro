const fs = require("fs");
const path = require("path");

// المجلد الرئيسي للتخزين
const STORAGE_DIR = path.join(__dirname, "storage");

// تأكد من وجود مجلد storage
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function ensureFile(filename, defaultData = []) {
    const fullPath = path.join(STORAGE_DIR, filename);
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, JSON.stringify(defaultData, null, 2));
    }
}

function loadJSON(filename, defaultData = []) {
    // إزالة ./ من بداية المسار إذا وجدت
    let cleanFilename = filename;
    if (cleanFilename.startsWith("./")) {
        cleanFilename = cleanFilename.substring(2);
    }
    
    ensureFile(cleanFilename, defaultData);
    const fullPath = path.join(STORAGE_DIR, cleanFilename);
    return JSON.parse(fs.readFileSync(fullPath));
}

function saveJSON(filename, data) {
    let cleanFilename = filename;
    if (cleanFilename.startsWith("./")) {
        cleanFilename = cleanFilename.substring(2);
    }
    
    const fullPath = path.join(STORAGE_DIR, cleanFilename);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

module.exports = {
    loadJSON,
    saveJSON
};
