import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'DeryaHoca Canlı - Dijital Fen Bilimleri Sınıfı',
    description: 'K-12 öğrencileri için WebRTC tabanlı interaktif canlı ders platformu. Lightboard teknolojisiyle zenginleştirilmiş Fen Bilimleri dersleri.',
    keywords: ['canlı ders', 'online eğitim', 'fen bilimleri', 'derya hoca', 'lightboard', 'interaktif sınıf'],
    authors: [{ name: 'DeryaHoca' }],
    openGraph: {
        title: 'DeryaHoca Canlı - Dijital Fen Bilimleri Sınıfı',
        description: 'Lightboard teknolojisiyle zenginleştirilmiş interaktif Fen Bilimleri dersleri',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr" className="dark">
            <head>
                {/* Google Fonts - Orbitron, Montserrat, Inter, Quicksand */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&family=Quicksand:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />

                {/* Favicon */}
                <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔬</text></svg>" />
            </head>
            <body className="science-lab-bg antialiased">
                {children}
            </body>
        </html>
    );
}
