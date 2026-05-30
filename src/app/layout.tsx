import type { Metadata } from 'next'
import { Lora, Nunito, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import DevErrorSuppressor from '@/components/DevErrorSuppressor'

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  display: 'swap',
})

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Plan B to Z — Career Transitions for Ex-UPSC Aspirants',
  description:
    'Discover fulfilling career paths after UPSC. AI-powered matching, real stories, mentor connections, and a 90-day launchpad for every path.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${nunito.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#ffffff] text-[#1e293b]">
        <DevErrorSuppressor />
        {children}
      </body>
    </html>
  )
}
