import { createAuthClient } from "better-auth/react";

// Same auth system as the store and the auth site: sessions live in
// asclepius-api. The wms only hosts its own sign-in form, so staff never see
// the customer login, and locally the cookie lands on localhost where the
// browser can use it.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://api.bhmhlth.com",
  basePath: "/auth",
});
