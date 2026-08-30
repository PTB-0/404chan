(function () {
  const room = document.querySelector('.chat-room');
  if (!room) return;

  const roomId = room.dataset.roomId;
  const messagesEl = document.getElementById('chat-messages');
  const userCountEl = document.getElementById('user-count');
  const form = document.getElementById('chat-form');
  const nameInput = document.getElementById('chat-name');
  const messageInput = document.getElementById('chat-input');

  const storedName = localStorage.getItem('404chan-name');
  if (storedName) nameInput.value = storedName;

  const socket = io();
  socket.emit('join_room', roomId);

  socket.on('user_count', (count) => {
    userCountEl.textContent = Math.max(count, 0);
  });

  socket.on('chat_message', (msg) => {
    appendMessage(msg);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    const name = nameInput.value.trim();
    localStorage.setItem('404chan-name', name);

    socket.emit('chat_message', { name, message });
    messageInput.value = '';
  });

  function appendMessage(msg) {
    const el = document.createElement('div');
    el.className = 'chat-message';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'post-name';
    nameSpan.textContent = msg.name;
    if (msg.tripcode) {
      const tripSpan = document.createElement('span');
      tripSpan.className = 'trip';
      tripSpan.textContent = ' !' + msg.tripcode;
      nameSpan.appendChild(tripSpan);
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'post-time';
    timeSpan.textContent = new Date(msg.created_at).toLocaleTimeString('tr-TR');

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'post-message';
    bodyDiv.innerHTML = msg.html;

    el.appendChild(nameSpan);
    el.appendChild(timeSpan);
    el.appendChild(bodyDiv);
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
})();
