import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "authenticated",
      issuer: "https://jimiykxrjetomvpeoaeu.supabase.co/auth/v1",
      jwks: "https://jimiykxrjetomvpeoaeu.supabase.co/auth/v1/.well-known/jwks.json",
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;
