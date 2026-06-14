const fs = require("fs");
const path = require("path");

const STORAGE_DIR = path.join(__dirname, "storage");

if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function cleanPath(filename) {
    // إزالة ./ من البداية
    let clean = filename;
    if (clean.startsWith("./")) {
        clean = clean.substring(2);
    }
    // إزالة storage/ من البداية إذا وجدت (لمنع التكرار)
    if (clean.startsWith("storage/")) {
        clean = clean.substring(8);
    }
    return clean;
}

function ensureFile(filename, defaultData = []) {
    const clean = cleanPath(filename);
    const fullPath = path.join(STORAGE_DIR, clean);
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, JSON.stringify(defaultData, null, 2));
    }
}

function loadJSON(filename, defaultData = []) {
    const clean = cleanPath(filename);
    ensureFile(clean, defaultData);
    const fullPath = path.join(STORAGE_DIR, clean);
    return JSON.parse(fs.readFileSync(fullPath));
}

function saveJSON(filename, data) {
    const clean = cleanPath(filename);
    const fullPath = path.join(STORAGE_DIR, clean);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

module.exports = {
    loadJSON,
    saveJSON
};
