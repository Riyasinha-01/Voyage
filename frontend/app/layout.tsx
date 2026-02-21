import Providers from "./providers";
export const metadata = {
  title: "Voyage",
  description: "AI Powered Travel Planner",
  openGraph: {
    title: "Voyage",
    description: "AI Powered Travel Planner",
    url: "https://planwithvoyage.vercel.app",
    siteName: "Voyage",
    images: [
      {
        url: "/thumbnail.png", // image in public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
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