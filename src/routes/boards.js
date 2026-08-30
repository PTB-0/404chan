const express = require('express');
const db = require('../db');
const upload = require('../upload');
const { parseNameAndTrip } = require('../util');

const router = express.Router();

function getBoardOr404(req, res) {
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.boardId);
  if (!board) {
    res.status(404).render('404', { title: 'Board bulunamadı' });
    return null;
  }
  return board;
}

router.get('/', (req, res) => {
  const boards = db.prepare('SELECT * FROM boards ORDER BY sort_order').all();
  const boardStats = boards.map((b) => {
    const stats = db
      .prepare('SELECT COUNT(*) AS threadCount FROM threads WHERE board_id = ?')
      .get(b.id);
    const latest = db
      .prepare('SELECT bumped_at FROM threads WHERE board_id = ? ORDER BY bumped_at DESC LIMIT 1')
      .get(b.id);
    return { ...b, threadCount: stats.threadCount, lastActivity: latest ? latest.bumped_at : null };
  });
  res.render('home', { title: '404chan - Teknoloji Panosu', boards: boardStats });
});

router.get('/b/:boardId', (req, res) => {
  const board = getBoardOr404(req, res);
  if (!board) return;
  const threads = db
    .prepare('SELECT * FROM threads WHERE board_id = ? ORDER BY is_pinned DESC, bumped_at DESC')
    .all(board.id);
  const threadsWithPreview = threads.map((t) => {
    const previewReplies = db
      .prepare('SELECT * FROM posts WHERE thread_id = ? ORDER BY id DESC LIMIT 3')
      .all(t.id)
      .reverse();
    return { ...t, previewReplies };
  });
  res.render('board', { title: `/${board.id}/ - ${board.name}`, board, threads: threadsWithPreview });
});

router.post('/b/:boardId/new', upload.single('image'), (req, res) => {
  const board = getBoardOr404(req, res);
  if (!board) return;

  const message = (req.body.message || '').trim().slice(0, 4000);
  const subject = (req.body.subject || '').trim().slice(0, 100);
  if (!message && !req.file) {
    return res.status(400).render('404', { title: 'Hata', message: 'Mesaj veya görsel gerekli.' });
  }

  const { name, tripcode } = parseNameAndTrip(req.body.name);
  const now = Date.now();

  const info = db
    .prepare(
      `INSERT INTO threads (board_id, subject, name, tripcode, message, image_path, image_name, created_at, bumped_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      board.id,
      subject || null,
      name,
      tripcode,
      message,
      req.file ? `/uploads/${req.file.filename}` : null,
      req.file ? req.file.originalname : null,
      now,
      now
    );

  res.redirect(`/b/${board.id}/thread/${info.lastInsertRowid}`);
});

router.get('/b/:boardId/thread/:threadId', (req, res) => {
  const board = getBoardOr404(req, res);
  if (!board) return;
  const thread = db
    .prepare('SELECT * FROM threads WHERE id = ? AND board_id = ?')
    .get(req.params.threadId, board.id);
  if (!thread) return res.status(404).render('404', { title: 'Konu bulunamadı' });

  const posts = db.prepare('SELECT * FROM posts WHERE thread_id = ? ORDER BY id ASC').all(thread.id);
  res.render('thread', { title: thread.subject || `Konu #${thread.id}`, board, thread, posts });
});

router.post('/b/:boardId/thread/:threadId/reply', upload.single('image'), (req, res) => {
  const board = getBoardOr404(req, res);
  if (!board) return;
  const thread = db
    .prepare('SELECT * FROM threads WHERE id = ? AND board_id = ?')
    .get(req.params.threadId, board.id);
  if (!thread) return res.status(404).render('404', { title: 'Konu bulunamadı' });

  const message = (req.body.message || '').trim().slice(0, 4000);
  if (!message && !req.file) {
    return res.redirect(`/b/${board.id}/thread/${thread.id}`);
  }

  const { name, tripcode } = parseNameAndTrip(req.body.name);
  const now = Date.now();

  db.prepare(
    `INSERT INTO posts (thread_id, board_id, name, tripcode, message, image_path, image_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    thread.id,
    board.id,
    name,
    tripcode,
    message,
    req.file ? `/uploads/${req.file.filename}` : null,
    req.file ? req.file.originalname : null,
    now
  );

  db.prepare('UPDATE threads SET reply_count = reply_count + 1, bumped_at = ? WHERE id = ?').run(
    now,
    thread.id
  );

  res.redirect(`/b/${board.id}/thread/${thread.id}#bottom`);
});

module.exports = router;
