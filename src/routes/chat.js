const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/sohbet', (req, res) => {
  const rooms = db.prepare('SELECT * FROM chat_rooms ORDER BY sort_order').all();
  const roomsWithCount = rooms.map((r) => {
    const count = db
      .prepare('SELECT COUNT(*) AS c FROM chat_messages WHERE room_id = ?')
      .get(r.id);
    return { ...r, messageCount: count.c };
  });
  res.render('chat_list', { title: 'Sohbet Odaları - 404chan', rooms: roomsWithCount });
});

router.get('/sohbet/:roomId', (req, res) => {
  const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(req.params.roomId);
  if (!room) return res.status(404).render('404', { title: 'Oda bulunamadı' });

  const history = db
    .prepare('SELECT * FROM chat_messages WHERE room_id = ? ORDER BY id DESC LIMIT 100')
    .all(room.id)
    .reverse();

  res.render('chat_room', { title: `#${room.name} - Sohbet`, room, history });
});

module.exports = router;
