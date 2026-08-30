const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, '404chan.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id TEXT NOT NULL,
  subject TEXT,
  name TEXT NOT NULL DEFAULT 'Anonim',
  tripcode TEXT,
  message TEXT NOT NULL,
  image_path TEXT,
  image_name TEXT,
  created_at INTEGER NOT NULL,
  bumped_at INTEGER NOT NULL,
  reply_count INTEGER NOT NULL DEFAULT 0,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (board_id) REFERENCES boards(id)
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  board_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Anonim',
  tripcode TEXT,
  message TEXT NOT NULL,
  image_path TEXT,
  image_name TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES threads(id)
);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Anonim',
  tripcode TEXT,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_threads_board ON threads(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
`);

const BOARDS = [
  { id: 'g', name: 'Teknoloji', description: 'Genel teknoloji tartışmaları', sort_order: 1 },
  { id: 'prog', name: 'Programlama', description: 'Diller, algoritmalar, kod inceleme', sort_order: 2 },
  { id: 'web', name: 'Web Geliştirme', description: 'Frontend, backend, framework\'ler', sort_order: 3 },
  { id: 'sec', name: 'Siber Güvenlik', description: 'Hacking, pentest, güvenlik açıkları', sort_order: 4 },
  { id: 'net', name: 'Ağ & Sistem', description: 'Networking, sunucular, sysadmin', sort_order: 5 },
  { id: 'hw', name: 'Donanım', description: 'PC yapımı, bileşenler, elektronik', sort_order: 6 },
  { id: 'ai', name: 'Yapay Zeka', description: 'Makine öğrenmesi, LLM\'ler, veri bilimi', sort_order: 7 },
  { id: 'mobil', name: 'Mobil', description: 'Android, iOS, mobil geliştirme', sort_order: 8 },
  { id: 'oyun', name: 'Oyun Geliştirme', description: 'Game dev, engine\'ler, grafik programlama', sort_order: 9 },
  { id: 'retro', name: 'Retro Teknoloji', description: 'Eski donanım, retro bilgisayarlar, emülasyon', sort_order: 10 },
];

const CHAT_ROOMS = [
  { id: 'lobi', name: 'Lobi', description: 'Genel sohbet', sort_order: 1 },
  { id: 'programlama', name: 'Programlama', description: 'Kod hakkında canlı sohbet', sort_order: 2 },
  { id: 'guvenlik', name: 'Güvenlik', description: 'Siber güvenlik sohbeti', sort_order: 3 },
  { id: 'donanim', name: 'Donanım', description: 'Donanım ve derleme sohbeti', sort_order: 4 },
  { id: 'yapay-zeka', name: 'Yapay Zeka', description: 'AI/ML sohbeti', sort_order: 5 },
  { id: 'random', name: 'Off-topic', description: 'Konu dışı her şey', sort_order: 6 },
];

const insertBoard = db.prepare(
  'INSERT OR IGNORE INTO boards (id, name, description, sort_order) VALUES (@id, @name, @description, @sort_order)'
);
const insertRoom = db.prepare(
  'INSERT OR IGNORE INTO chat_rooms (id, name, description, sort_order) VALUES (@id, @name, @description, @sort_order)'
);

const seed = db.transaction(() => {
  for (const b of BOARDS) insertBoard.run(b);
  for (const r of CHAT_ROOMS) insertRoom.run(r);
});
seed();

module.exports = db;
