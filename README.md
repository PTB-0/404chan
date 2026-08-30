# 404chan

Teknoloji odaklı, anonim bir 4chan klonu. Konu bazlı panolar (board) ve gerçek
zamanlı yazılı sohbet odaları içerir.

## Özellikler

- **Panolar**: `/g/`, `/prog/`, `/web/`, `/sec/`, `/net/`, `/hw/`, `/ai/`, `/mobil/`, `/oyun/`, `/retro/`
- Anonim konu açma ve yanıtlama, opsiyonel görsel yükleme (jpg/png/gif/webp)
- Opsiyonel `İsim#şifre` tripcode desteği
- Greentext (`>alıntı`) ve `>>123` yanıt bağlantıları
- **Sohbet**: konu bazlı, Socket.IO ile gerçek zamanlı yazılı sohbet odaları, kalıcı mesaj geçmişi

## Çalıştırma

```bash
npm install
npm start        # http://localhost:3000
# veya geliştirme sırasında otomatik yeniden başlatma için:
npm run dev
```

Veritabanı (SQLite) `data/404chan.db` dosyasında, yüklenen görseller ise
`public/uploads/` altında tutulur.

## Teknoloji

Express, better-sqlite3, EJS, Socket.IO — build adımı gerektirmeyen, sunucu
taraflı basit bir yığın.
