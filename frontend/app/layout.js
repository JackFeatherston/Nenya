export const metadata = {
    title: 'Hello World App',
    description: 'A simple Hello World application',
  }
  
  export default function RootLayout({ children }) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    )
  }