"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function RootLayout({ children }: any) {
  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId="894705257860-cueoes9jk5doldd7vkbne9bkvkgjnn8t.apps.googleusercontent.com">
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}