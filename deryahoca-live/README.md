# DeryaHoca Live - Sanal Sınıf Platformu

K-12 öğrencileri (5-8. sınıf) için WebRTC tabanlı hafif, tarayıcı-bazlı sanal sınıf platformu.

## 🚀 Özellikler

- **Tek Tıkla Katılım**: Öğrenciler için hesap gerektirmez
- **Çoklu Video Grid**: 1 öğretmen + 10 öğrenci desteği
- **Akıllı Tahta**: Senkronize PDF görüntüleyici
- **Basit Kontroller**: Mikrofon, kamera ve el kaldırma
- **Responsive Tasarım**: Tablet ve mobil uyumlu

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Tarayıcıda aç
open http://localhost:3000
```

## 🔑 Demo Giriş Bilgileri

- **E-posta**: ogretmen@deryahoca.com
- **Şifre**: DeryaHoca2024!

## 📖 Kullanım

### Öğretmen İçin

1. `/teacher/login` adresinden giriş yapın
2. "Yeni Ders Başlat" butonuna tıklayın
3. Oluşturulan linki öğrencilerinizle paylaşın
4. "Derse Katıl" butonuyla derse başlayın
5. PDF seçerek ders materyallerini paylaşın

### Öğrenci İçin

1. Öğretmenden aldığınız linke tıklayın
2. Kamera ve mikrofon izni verin
3. İsminizi yazın
4. "Derse Katıl" butonuyla katılın

## 📁 Proje Yapısı

```
deryahoca-live/
├── server.js           # Node.js + Socket.io sunucusu
├── src/
│   ├── app/           # Next.js sayfa ve API rotaları
│   ├── components/    # React bileşenleri
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Yardımcı fonksiyonlar
│   ├── contexts/      # React Context
│   └── types/         # TypeScript tipleri
└── uploads/pdfs/      # PDF dosyaları
```

## 🛠 Teknolojiler

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io, WebRTC (simple-peer)
- **PDF**: pdf.js

## 📝 Notlar

- Production'da `.env.local` dosyasındaki JWT_SECRET değerini değiştirin
- PDF'leri `uploads/pdfs` klasörüne yükleyin
- WebRTC için HTTPS gereklidir (localhost hariç)

## 📄 Lisans

MIT License - © 2024 DeryaHoca
