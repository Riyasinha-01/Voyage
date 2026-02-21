import Providers from "./providers";
export const metadata = {
  title: "Voyage",
};

export default function RootLayout({ children }: any) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}