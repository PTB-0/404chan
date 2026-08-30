const crypto = require('crypto');

const ADMIN_KEY = process.env.ADMIN_KEY || crypto.randomBytes(9).toString('base64url');

if (!process.env.ADMIN_KEY) {
  console.log('----------------------------------------------------');
  console.log('ADMIN_KEY ortam değişkeni ayarlanmadığı için otomatik oluşturuldu:');
  console.log(ADMIN_KEY);
  console.log('Moderasyon paneline (/mod) bu anahtarla giriş yapabilirsin.');
  console.log('Kalıcı bir anahtar istersen ADMIN_KEY ortam değişkenini kendin belirle.');
  console.log('----------------------------------------------------');
}

module.exports = { ADMIN_KEY };
