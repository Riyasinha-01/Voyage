"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Providers({ children }: any) {
  return (
    <GoogleOAuthProvider clientId="YOUR_CLIENT_ID">
      {children}
    </GoogleOAuthProvider>
  );
}