const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

const app = express();
const PORT = process.env.PORT || 3000;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_bayjid");
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: "silent" }),
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;
    if (qr) {
      console.log("\n🟢 Scan this QR to connect WhatsApp:");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      console.log("✅ Connected to WhatsApp as", sock.user.name);
    } else if (connection === "close") {
      console.log("🔄 Connection closed, restarting...");
      startBot();
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();

app.get("/", (req, res) => {
  res.send("🟩 BaYjid WhatsApp Bot is Running — use terminal to scan QR!");
});

app.listen(PORT, () => console.log(`🌍 BaYjid Bot Server running on port ${PORT}`));