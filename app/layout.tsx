import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ช่วยที.com — เพื่อนช่วยรอดสิ้นเดือน",
  description: "บันทึกรายรับ-รายจ่าย สแกนสลิปโอนเงิน วิเคราะห์การใช้จ่าย สำหรับนักศึกษาไทย",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ช่วยที",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "ช่วยที.com",
    description: "เพื่อนช่วยรอดสิ้นเดือน สำหรับนักศึกษา",
    siteName: "ช่วยที.com",
  },
}

export const viewport: Viewport = {
  themeColor: "#FF3478",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
