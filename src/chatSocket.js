const db = require('./db');
const { parseNameAndTrip, formatMessage } = require('./util');

const MAX_MESSAGE_LENGTH = 1000;

function registerChatSocket(io) {
  io.on('connection', (socket) => {
    let currentRoom = null;

    socket.on('join_room', (roomId) => {
      const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(roomId);
      if (!room) return;

      if (currentRoom) {
        socket.leave(currentRoom);
        io.to(currentRoom).emit('user_count', io.sockets.adapter.rooms.get(currentRoom)?.size || 0);
      }

      currentRoom = roomId;
      socket.join(roomId);
      io.to(roomId).emit('user_count', io.sockets.adapter.rooms.get(roomId)?.size || 0);
    });

    socket.on('chat_message', (payload) => {
      if (!currentRoom || !payload) return;
      const rawMessage = String(payload.message || '').trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!rawMessage) return;

      const { name, tripcode } = parseNameAndTrip(payload.name);
      const now = Date.now();

      const info = db
        .prepare(
          `INSERT INTO chat_messages (room_id, name, tripcode, message, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(currentRoom, name, tripcode, rawMessage, now);

      io.to(currentRoom).emit('chat_message', {
        id: info.lastInsertRowid,
        name,
        tripcode,
        message: rawMessage,
        html: formatMessage(rawMessage),
        created_at: now,
      });
    });

    socket.on('disconnect', () => {
      if (currentRoom) {
        io.to(currentRoom).emit('user_count', (io.sockets.adapter.rooms.get(currentRoom)?.size || 1) - 1);
      }
    });
  });
}

module.exports = registerChatSocket;
