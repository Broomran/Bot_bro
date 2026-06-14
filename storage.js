const fs = require('fs');
const path = require('path');

// مجلد التخزين
const STORAGE_DIR = path.join(__dirname, 'storage');

// تأكد من وجود المجلد
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// تحميل JSON من ملف
function loadJSON(filename, defaultValue = {}) {
    try {
        const fullPath = path.join(STORAGE_DIR, filename);
        if (!fs.existsSync(fullPath)) {
            return defaultValue;
        }
        const data = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error loading ${filename}:`, err.message);
        return defaultValue;
    }
}

// حفظ JSON إلى ملف
function saveJSON(filename, data) {
    try {
        const fullPath = path.join(STORAGE_DIR, filename);
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error(`Error saving ${filename}:`, err.message);
        return false;
    }
}

module.exports = { loadJSON, saveJSON };
