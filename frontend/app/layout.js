import './globals.css'

export const metadata = {
  title: 'Nenya'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}