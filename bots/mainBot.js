const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket = null;

let CHILD_BOTS = {};

function packet() {
    return "MAIN-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

// =====================================
// UPDATE CONSOLE
// =====================================

function updateConsole() {

    const total = Object.keys(CHILD_BOTS).length;

    console.log("================================");
    console.log("[ACTIVE CHILDBOTS]", total);

    Object.values(CHILD_BOTS).forEach(bot => {

        console.log(
            `[BOT] ${bot.username} -> ${bot.room}`
        );

    });

    console.log("================================");
}

// =====================================
// SEND PM
// =====================================

function send(to, body) {

    try {

        if (!socket) return;

        if (socket.readyState !== 1) return;

        socket.send(JSON.stringify({

            handler: "chat_message",

            type: "text",

            to,

            body,

            id: packet()

        }));

    } catch(err) {

        console.log("[SEND ERROR]", err.message);

    }

}

// =====================================
// START MAIN BOT
// =====================================

function start(username, password) {

    return new Promise((resolve) => {

        console.log("[MAINBOT CONNECTING...]");

        socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let finished = false;

        socket.on("open", () => {

            console.log("[MAIN SOCKET OPEN]");

            socket.send(JSON.stringify({

                handler: "login",

                username,

                password,

                id: packet()

            }));

        });

        socket.on("message", async(data) => {

            let msg;

            try {

                msg = JSON.parse(data.toString());

            } catch {

                return;

            }

            // ================= LOGIN =================

            if (msg.handler === "login_event") {

                if (msg.type === "success") {

                    console.log("[MAIN LOGIN SUCCESS]");

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: true
                        });

                    }

                    loadSavedBots();

                }

                if (
                    msg.type === "failed" ||
                    msg.type === "error"
                ) {

                    console.log("[MAIN LOGIN FAILED]");

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: false
                        });

                    }

                }

            }

            // ================= PM =================

            if (msg.handler === "chat_message") {

                handlePM(msg);

            }

        });

        socket.on("close", () => {

            console.log("[MAIN CLOSED]");

            setTimeout(() => {

                start(username, password);

            }, 5000);

        });

        socket.on("error", (err) => {

            console.log("[MAIN ERROR]", err.message);

        });

        // ================= KEEP ALIVE =================

        setInterval(() => {

            try {

                if (
                    socket &&
                    socket.readyState === 1
                ) {

                    socket.send(JSON.stringify({

                        handler: "ping",

                        id: packet()

                    }));

                }

            } catch {}

        }, 20000);

    });

}

// =====================================
// HANDLE PM
// =====================================

function handlePM(msg) {

    const from = msg.from;

    const body =
        (msg.body || "")
        .trim();

    console.log("[PM]", from, body);

    // ================= HELP =================

    if (body.toLowerCase() === "help" || body.toLowerCase() === "مساعدة") {

        return send(from,

`🤖 *BOT SERVER / سيرفر البوت* 🤖

📖 *English Instructions:* 🇬🇧
━━━━━━━━━━━━━━━━━━━━━
To create a new bot, send:
\`Dd room username password\`

📝 *Example:* ✨
\`Dd myroom bot1 123456\`

🔍 *Parameters:* 📋
• \`room\`    → Chat room name 🏠
• \`username\` → Bot username 👤
• \`password\` → Bot password 🔐

━━━━━━━━━━━━━━━━━━━━━

📖 *التعليمات العربية:* 🇸🇦
━━━━━━━━━━━━━━━━━━━━━
لإنشاء بوت جديد، أرسل:
\`Dd اسم_الغرفة اسم_المستخدم كلمة_السر\`

📝 *مثال:* ✨
\`Dd غرفتي بوت1 123456\`

🔍 *المعاملات:* 📋
• \`اسم_الغرفة\` → اسم غرفة المحادثة 🏠
• \`اسم_المستخدم\` → اسم البوت 👤
• \`كلمة_السر\` → كلمة سر البوت 🔐

━━━━━━━━━━━━━━━━━━━━━
✅ *No symbols or hashtags needed!*
🚫 *لا تحتاج رموز أو علامات #*`
        );

    }

    // ================= CREATE =================

    // التحقق من الأمر بصيغة Dd (غير حساس لحالة الأحرف)
    const lowerBody = body.toLowerCase();
    
    if (lowerBody.startsWith("dd ")) {
        createBot(from, body);
    }

}

// =====================================
// CREATE BOT
// =====================================

async function createBot(owner, command) {

    try {

        // إزالة "dd " من بداية الأمر (3 أحرف لأن dd + مسافة)
        const afterCommand = command.substring(3).trim();
        
        // تقسيم باستخدام المسافات
        const parts = afterCommand.split(/\s+/);
        
        const room = parts[0];
        const username = parts[1];
        const password = parts[2];

        // التحقق من صحة المدخلات
        if (!room || !username || !password) {

            return send(owner,

`❌ *Invalid Command / أمر غير صحيح* ❌

📖 *English:* 🇬🇧
Please use:
\`Dd room username password\`

📝 *Example:* ✨
\`Dd myroom bot1 123456\`

━━━━━━━━━━━━━━━━━━━━━

📖 *العربية:* 🇸🇦
الرجاء استخدام:
\`Dd اسم_الغرفة اسم_المستخدم كلمة_السر\`

📝 *مثال:* ✨
\`Dd غرفتي بوت1 123456\`

━━━━━━━━━━━━━━━━━━━━━
💡 *Tip:* Use \`help\` or \`مساعدة\` for more info`
            );

        }

        // التحقق من وجود بوت نشط في نفس الغرفة
        if (CHILD_BOTS[room]) {

            return send(
                owner,
`⚠️ *Bot already exists in this room!* ⚠️

📖 A bot is already active in \`${room}\`
🗑️ Please stop it first or use another room.

━━━━━━━━━━━━━━━━━━━━━
⚠️ *يوجد بوت نشط في هذه الغرفة!* ⚠️

📖 بوت يعمل بالفعل في \`${room}\`
🗑️ الرجاء إيقافه أولاً أو استخدام غرفة أخرى`
            );

        }

        // تحميل البوتات المحفوظة
        let bots =
            loadJSON(
                "./storage/bots.json",
                []
            );

        bots = bots.filter(x =>
            x &&
            x.room &&
            x.username
        );

        const config = {

            room,
            username,
            password,
            owner,

            roomMasters: [],

            welcome: true,

            quiz: true

        };

        send(
            owner,
`🔨 *Creating bot... / جاري إنشاء البوت...* 🔨

📖 Please wait a moment...
📖 الرجاء الانتظار لحظة...

👤 Username: ${username}
🏠 Room: ${room}`
        );

        const result =
            await ChildBot.start(config);

        if (!result.success) {

            return send(
                owner,
`❌ *Bot creation failed!* ❌

📖 Could not connect to the chat server.
🔐 Please check your username and password.

━━━━━━━━━━━━━━━━━━━━━
❌ *فشل إنشاء البوت!* ❌

📖 لا يمكن الاتصال بسيرفر المحادثة.
🔐 الرجاء التحقق من اسم المستخدم وكلمة السر.`
            );

        }

        // حفظ البوت في الذاكرة
        CHILD_BOTS[room] = {

            room,
            username,

            socket: result.socket

        };

        // حفظ البوت في ملف التخزين
        bots = bots.filter(
            x => x.room !== room
        );

        bots.push(config);

        saveJSON(
            "./storage/bots.json",
            bots
        );

        console.log(
            `[BOT CONNECTED] ${username}`
        );

        updateConsole();

        send(owner,

`✅ *BOT CREATED SUCCESSFULLY!* ✅

━━━━━━━━━━━━━━━━━━━━━
📖 *English:* 🇬🇧
🏠 Room: \`${room}\`
👤 Bot: \`${username}\`
🔐 Status: Connected & Active ✨

━━━━━━━━━━━━━━━━━━━━━
📖 *العربية:* 🇸🇦
🏠 الغرفة: \`${room}\`
👤 البوت: \`${username}\`
🔐 الحالة: متصل ونشط ✨

━━━━━━━━━━━━━━━━━━━━━
💡 \`help\` / \`مساعدة\` for more commands`
        );

    } catch(err) {

        console.log(
            "[CREATE BOT ERROR]",
            err
        );

        send(
            owner,
`💥 *Bot crashed / تعطل البوت* 💥

📖 An error occurred while creating the bot.
🔄 Please try again later.

━━━━━━━━━━━━━━━━━━━━━
📖 حدث خطأ أثناء إنشاء البوت.
🔄 الرجاء المحاولة مرة أخرى لاحقًا.`
        );

    }

}

// =====================================
// LOAD SAVED
// =====================================

async function loadSavedBots() {

    const bots =
        loadJSON(
            "./storage/bots.json",
            []
        );

    console.log(
        "[LOADING SAVED BOTS]",
        bots.length
    );

    for (const bot of bots) {

        try {

            if (CHILD_BOTS[bot.room])
                continue;

            const result =
                await ChildBot.start(bot);

            if (result.success) {

                CHILD_BOTS[bot.room] = {

                    room: bot.room,

                    username: bot.username,

                    socket: result.socket

                };

                console.log(
                    `[RECONNECTED] ${bot.username}`
                );

            }

        } catch(err) {

            console.log(
                "[LOAD BOT ERROR]",
                err.message
            );

        }

    }

    updateConsole();

}

module.exports = {
    start
};
