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
      <body>{children}</body>
    </html>
  )
}
