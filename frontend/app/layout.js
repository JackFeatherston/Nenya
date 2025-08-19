import './globals.css'

export const metadata = {
  title: 'Nenya - Fraud Detection Globe',
  description: 'Interactive globe visualization for fraud detection system'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white antialiased">
        {children}
      </body>
    </html>
  )
}