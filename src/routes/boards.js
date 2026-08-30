const fs = require('fs');
const path = require('path');
const express = require('express');
const db = require('../db');
const upload = require('../upload');
const { ADMIN_KEY } = require('../config');
const { parseNameAndTrip, hashDeletePassword, verifyDeletePassword } = require('../util');

const router = express.Router();

function getBoardOr404(req, res) {
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.boardId);
  if (!board) {
    res.status(404).render('404', { title: 'Board bulunamadı' });
    return null;
  }
  return board;
}

function removeUploadedImage(imagePath) {
  if (!imagePath) return;
  const filePath = path.join(__dirname, '..', '..', 'public', imagePath);
  fs.unlink(filePath, () => {});
}

function canDelete(providedKey, providedPassword, storedHash) {
  if (providedKey && providedKey === ADMIN_KEY) return true;
  return verifyDeletePassword(providedPassword, storedHash);
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

router.get('/ara', (req, res) => {
  const q = (req.query.q || '').trim().slice(0, 100);
  let results = [];

  if (q) {
    const like = `%${q}%`;
    const threadMatches = db
      .prepare(
        `SELECT id AS thread_id, board_id, subject, message, created_at, id AS post_id, 'thread' AS kind
         FROM threads WHERE subject LIKE ? OR message LIKE ?
         ORDER BY created_at DESC LIMIT 40`
      )
      .all(like, like);

    const postMatches = db
      .prepare(
        `SELECT thread_id, board_id, message, created_at, id AS post_id, 'post' AS kind
         FROM posts WHERE message LIKE ?
         ORDER BY created_at DESC LIMIT 40`
      )
      .all(like);

    results = [...threadMatches, ...postMatches]
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 50);
  }

  res.render('search', { title: `"${q}" için arama sonuçları`, q, results });
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
  const deletePasswordHash = hashDeletePassword(req.body.password);
  const now = Date.now();

  const info = db
    .prepare(
      `INSERT INTO threads (board_id, subject, name, tripcode, message, image_path, image_name, created_at, bumped_at, delete_password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      now,
      deletePasswordHash
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
  const deletePasswordHash = hashDeletePassword(req.body.password);
  const now = Date.now();

  db.prepare(
    `INSERT INTO posts (thread_id, board_id, name, tripcode, message, image_path, image_name, created_at, delete_password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    thread.id,
    board.id,
    name,
    tripcode,
    message,
    req.file ? `/uploads/${req.file.filename}` : null,
    req.file ? req.file.originalname : null,
    now,
    deletePasswordHash
  );

  db.prepare('UPDATE threads SET reply_count = reply_count + 1, bumped_at = ? WHERE id = ?').run(
    now,
    thread.id
  );

  res.redirect(`/b/${board.id}/thread/${thread.id}#bottom`);
});

router.post('/b/:boardId/thread/:threadId/delete', (req, res) => {
  const board = getBoardOr404(req, res);
  if (!board) return;
  const thread = db
    .prepare('SELECT * FROM threads WHERE id = ? AND board_id = ?')
    .get(req.params.threadId, board.id);
  if (!thread) return res.status(404).render('404', { title: 'Konu bulunamadı' });

  if (!canDelete(req.body.key, req.body.password, thread.delete_password_hash)) {
    return res.status(403).render('404', { title: 'Yetkisiz', message: 'Şifre hatalı.' });
  }

  const posts = db.prepare('SELECT image_path FROM posts WHERE thread_id = ?').all(thread.id);
  posts.forEach((p) => removeUploadedImage(p.image_path));
  removeUploadedImage(thread.image_path);

  db.prepare('DELETE FROM posts WHERE thread_id = ?').run(thread.id);
  db.prepare('DELETE FROM threads WHERE id = ?').run(thread.id);

  res.redirect(`/b/${board.id}`);
});

router.post('/b/:boardId/thread/:threadId/post/:postId/delete', (req, res) => {
  const board = getBoardOr404(req, res);
  if (!board) return;
  const post = db
    .prepare('SELECT * FROM posts WHERE id = ? AND thread_id = ? AND board_id = ?')
    .get(req.params.postId, req.params.threadId, board.id);
  if (!post) return res.status(404).render('404', { title: 'Gönderi bulunamadı' });

  if (!canDelete(req.body.key, req.body.password, post.delete_password_hash)) {
    return res.status(403).render('404', { title: 'Yetkisiz', message: 'Şifre hatalı.' });
  }

  removeUploadedImage(post.image_path);
  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
  db.prepare('UPDATE threads SET reply_count = MAX(reply_count - 1, 0) WHERE id = ?').run(
    req.params.threadId
  );

  res.redirect(`/b/${board.id}/thread/${req.params.threadId}`);
});

router.post('/b/:boardId/thread/:threadId/report', (req, res) => {
  const board = getBoardOr404(req, res);
  if (!board) return;
  db.prepare('UPDATE threads SET report_count = report_count + 1 WHERE id = ? AND board_id = ?').run(
    req.params.threadId,
    board.id
  );
  res.redirect(`/b/${board.id}/thread/${req.params.threadId}`);
});

router.post('/b/:boardId/thread/:threadId/post/:postId/report', (req, res) => {
  const board = getBoardOr404(req, res);
  if (!board) return;
  db.prepare(
    'UPDATE posts SET report_count = report_count + 1 WHERE id = ? AND thread_id = ? AND board_id = ?'
  ).run(req.params.postId, req.params.threadId, board.id);
  res.redirect(`/b/${board.id}/thread/${req.params.threadId}`);
});

module.exports = router;
