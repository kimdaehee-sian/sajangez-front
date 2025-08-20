import './globals.css';

export const metadata = {
  title: 'Frontend App',
  description: 'Next.js frontend application with Tailwind CSS',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className='antialiased'>{children}</body>
    </html>
  );
}
