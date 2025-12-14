import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ブロック崩し - Blockuzai',
  description: 'AIだけでブロック崩しできるかな',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>{children}</body>
    </html>
  )
}
