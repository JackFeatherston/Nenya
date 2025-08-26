import './globals.css'

export const metadata = {
  title: 'Nenya',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#E9EBEE', color: '#616771' }} className="antialiased">
        {children}
      </body>
    </html>
  )
}