// app/layout.tsx
import { Lora, Inter } from 'next/font/google'
import './globals.css'

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`}>
      {/* Move your base styles here */}
      <body className="bg-[#faf9f7] text-stone-800 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}