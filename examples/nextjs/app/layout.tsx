export const metadata = {
  title: "Shaka Player + FastPix (Next.js)",
  description: "FastPix Data SDK example with Shaka Player in the Next.js App Router.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
