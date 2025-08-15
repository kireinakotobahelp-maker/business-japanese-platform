import { Metadata } from 'next'
import './globals.css'

const cacheBuster = Date.now().toString()

export const metadata: Metadata = {
  title: 'Kireina Web - 美しい日本語学習',
  description: 'ビジネス敬語とコミュニケーションスキルを学ぶ現代的なWebアプリケーション',
  other: {
    'cache-control': 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
    'pragma': 'no-cache',
    'expires': '0',
    'surrogate-control': 'no-store',
    'x-cache-bust': cacheBuster
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta httpEquiv="cache-control" content="no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0" />
        <meta httpEquiv="pragma" content="no-cache" />
        <meta httpEquiv="expires" content="0" />
        <meta httpEquiv="surrogate-control" content="no-store" />
        <meta name="cache-bust" content={cacheBuster} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('🚀 Kireina Web - Auto Scroll Version: ${cacheBuster}');
              
              // 強制的にページをリロード（キャッシュ回避）
              if (typeof window !== 'undefined' && window.performance) {
                if (performance.navigation.type === 2) {
                  location.reload(true);
                }
              }
              
              // Service Workerをクリア
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
              
              // ブラウザキャッシュを強制クリア
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (let name of names) {
                    caches.delete(name);
                  }
                });
              }
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
