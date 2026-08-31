# 404chan

Teknoloji odaklı, anonim bir 4chan klonu. Konu bazlı panolar (board) ve gerçek
zamanlı yazılı sohbet odaları içerir.

## Özellikler

- **Panolar**: `/g/`, `/prog/`, `/web/`, `/sec/`, `/net/`, `/hw/`, `/ai/`, `/mobil/`, `/o/`, `/retro/`,
  `/k/` (kernel), `/t/` (tutorial), `/a/` (anonimlik), `/biz/` (iş & şirketler), `/ht/` (hackathon)
- **Alt panolar**: `/mec/` (mekanik) bir üst kategori — kendi genel konularının yanı sıra
  `/mec/mec-robotik/`, `/mec/mec-elektronik/`, `/mec/mec-otomasyon/` alt panolarını barındırır
  (Unix dizin mantığı: bir board hem kendi konularını hem alt board'ları içerebilir)
- Anonim konu açma ve yanıtlama, opsiyonel görsel yükleme (jpg/png/gif/webp)
- Opsiyonel `İsim#şifre` tripcode desteği
- Greentext (`>alıntı`) ve `>>123` yanıt bağlantıları
- **Sohbet**: konu bazlı, Socket.IO ile gerçek zamanlı yazılı sohbet odaları, kalıcı mesaj geçmişi
- **Site geneli arama** (`/ara?q=...`): konu başlığı ve mesaj içeriğinde arar
- **Kendi gönderini silme**: konu/yanıt açarken opsiyonel bir "silme şifresi" belirle, sonra aynı şifreyle o gönderiyi (görseliyle birlikte) sil
- **Bildir** butonu: her gönderi bildirilebilir, bildirilenler moderasyon panelinde toplanır
- **Moderasyon paneli** (`/mod`, `ADMIN_KEY` ile giriş): bildirilen konu/yanıtları görüntüle, sil, bildirimi temizle, konu sabitle/kaldır

## Çalıştırma

```bash
npm install
npm start        # http://localhost:3000
# veya geliştirme sırasında otomatik yeniden başlatma için:
npm run dev
```

Veritabanı (SQLite) `data/404chan.db` dosyasında, yüklenen görseller ise
`public/uploads/` altında tutulur.

### Moderasyon anahtarı

`ADMIN_KEY` ortam değişkenini kendin belirlemezsen, sunucu her başlangıçta
rastgele bir anahtar üretip konsola yazar. `/mod` sayfasına bu anahtarla
giriş yapılır. Kalıcı bir anahtar için:

```bash
ADMIN_KEY=cok-gizli-bir-anahtar npm start
```

## Teknoloji

Express, better-sqlite3, EJS, Socket.IO — build adımı gerektirmeyen, sunucu
taraflı basit bir yığın.




<!--I NEED A CHAR FOR THIS PROJECT-->

