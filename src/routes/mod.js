const fs = require('fs');
const path = require('path');
const express = require('express');
const db = require('../db');
const { ADMIN_KEY } = require('../config');

const router = express.Router();

function removeUploadedImage(imagePath) {
  if (!imagePath) return;
  const filePath = path.join(__dirname, '..', '..', 'public', imagePath);
  fs.unlink(filePath, () => {});
}

function isValidKey(key) {
  return typeof key === 'string' && key.length > 0 && key === ADMIN_KEY;
}

router.get('/mod', (req, res) => {
  const key = req.query.key || '';
  if (!isValidKey(key)) {
    return res.render('mod_login', { title: 'Moderasyon Girişi', error: key ? 'Anahtar hatalı.' : null });
  }

  const reportedThreads = db
    .prepare(
      `SELECT threads.*, boards.parent_id AS board_parent_id FROM threads
       JOIN boards ON boards.id = threads.board_id
       WHERE report_count > 0 ORDER BY report_count DESC, bumped_at DESC LIMIT 50`
    )
    .all();
  const reportedPosts = db
    .prepare(
      `SELECT posts.*, boards.parent_id AS board_parent_id FROM posts
       JOIN boards ON boards.id = posts.board_id
       WHERE report_count > 0 ORDER BY report_count DESC, created_at DESC LIMIT 50`
    )
    .all();
  const pinnedThreads = db
    .prepare(
      `SELECT threads.*, boards.parent_id AS board_parent_id FROM threads
       JOIN boards ON boards.id = threads.board_id
       WHERE is_pinned = 1 ORDER BY bumped_at DESC`
    )
    .all();

  res.render('mod_panel', { title: 'Moderasyon Paneli', key, reportedThreads, reportedPosts, pinnedThreads });
});

router.post('/mod/thread/:id/pin', (req, res) => {
  const key = req.body.key || '';
  if (!isValidKey(key)) return res.status(403).render('404', { title: 'Yetkisiz' });

  const thread = db.prepare('SELECT * FROM threads WHERE id = ?').get(req.params.id);
  if (!thread) return res.status(404).render('404', { title: 'Konu bulunamadı' });

  db.prepare('UPDATE threads SET is_pinned = ? WHERE id = ?').run(thread.is_pinned ? 0 : 1, thread.id);
  res.redirect(`/mod?key=${encodeURIComponent(key)}`);
});

router.post('/mod/thread/:id/dismiss', (req, res) => {
  const key = req.body.key || '';
  if (!isValidKey(key)) return res.status(403).render('404', { title: 'Yetkisiz' });

  db.prepare('UPDATE threads SET report_count = 0 WHERE id = ?').run(req.params.id);
  res.redirect(`/mod?key=${encodeURIComponent(key)}`);
});

router.post('/mod/post/:id/dismiss', (req, res) => {
  const key = req.body.key || '';
  if (!isValidKey(key)) return res.status(403).render('404', { title: 'Yetkisiz' });

  db.prepare('UPDATE posts SET report_count = 0 WHERE id = ?').run(req.params.id);
  res.redirect(`/mod?key=${encodeURIComponent(key)}`);
});

router.post('/mod/thread/:id/delete', (req, res) => {
  const key = req.body.key || '';
  if (!isValidKey(key)) return res.status(403).render('404', { title: 'Yetkisiz' });

  const thread = db.prepare('SELECT * FROM threads WHERE id = ?').get(req.params.id);
  if (!thread) return res.status(404).render('404', { title: 'Konu bulunamadı' });

  const posts = db.prepare('SELECT image_path FROM posts WHERE thread_id = ?').all(thread.id);
  posts.forEach((p) => removeUploadedImage(p.image_path));
  removeUploadedImage(thread.image_path);

  db.prepare('DELETE FROM posts WHERE thread_id = ?').run(thread.id);
  db.prepare('DELETE FROM threads WHERE id = ?').run(thread.id);

  res.redirect(`/mod?key=${encodeURIComponent(key)}`);
});

router.post('/mod/post/:id/delete', (req, res) => {
  const key = req.body.key || '';
  if (!isValidKey(key)) return res.status(403).render('404', { title: 'Yetkisiz' });

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).render('404', { title: 'Gönderi bulunamadı' });

  removeUploadedImage(post.image_path);
  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
  db.prepare('UPDATE threads SET reply_count = MAX(reply_count - 1, 0) WHERE id = ?').run(post.thread_id);

  res.redirect(`/mod?key=${encodeURIComponent(key)}`);
});

module.exports = router;
