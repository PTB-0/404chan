const crypto = require('crypto');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 4chan-style "Name#password" -> Name + hashed tripcode (not compatible with
// the original DES-based algorithm, just an equivalent anonymous-identity gag).
function parseNameAndTrip(rawName) {
  const input = (rawName || '').trim();
  if (!input) return { name: 'Anonim', tripcode: null };

  const hashIndex = input.indexOf('#');
  if (hashIndex === -1) {
    return { name: input.slice(0, 40), tripcode: null };
  }

  const name = input.slice(0, hashIndex).trim().slice(0, 40) || 'Anonim';
  const secret = input.slice(hashIndex + 1);
  if (!secret) return { name, tripcode: null };

  const hash = crypto.createHash('sha256').update(secret).digest('base64');
  const tripcode = hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  return { name, tripcode };
}

// Escapes HTML, then adds greentext (>quote lines) and >>123 reply styling.
function formatMessage(raw) {
  const escaped = escapeHtml(raw || '');
  return escaped
    .split('\n')
    .map((line) => {
      let out = line.replace(/&gt;&gt;(\d+)/g, '<a href="#p$1" class="reply-link">&gt;&gt;$1</a>');
      if (/^&gt;(?!&gt;)/.test(line.trim())) {
        out = `<span class="greentext">${out}</span>`;
      }
      return out;
    })
    .join('<br>');
}

function timeAgo(timestamp) {
  const diffMs = Date.now() - timestamp;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}sn önce`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}sa önce`;
  const day = Math.floor(hr / 24);
  return `${day}gün önce`;
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleString('tr-TR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

module.exports = { escapeHtml, parseNameAndTrip, formatMessage, timeAgo, formatDate };
