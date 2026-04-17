export const metadata = {
  title: 'Enterprise DQ Platform',
  description: 'AI-driven Data Quality & DPDP Masking via Gemma Local LLM',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
