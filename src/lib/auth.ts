// Better Auth: profesorski računi (e-mail i lozinka) u našoj Neon bazi. Prijava kodom ostaje uz ovo.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

function createAuth() {
  const appUrl = process.env.BETTER_AUTH_URL;
  const appHost = appUrl ? new URL(appUrl).host : undefined;
  const dev = process.env.NODE_ENV !== "production";
  return betterAuth({
    // neon-http nema transakcija, zato bez `transaction: true`
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    // Samo naš projekt na Vercelu (produkcija i pregledi u timu leon-kresos-projects); localhost samo u razvoju
    baseURL: {
      allowedHosts: [...(appHost ? [appHost] : []), "riihack.vercel.app", "riihack-*-leon-kresos-projects.vercel.app", ...(dev ? ["localhost:*", "127.0.0.1:*"] : [])],
      fallback: appUrl,
    },
    trustedOrigins: [
      ...(appUrl ? [appUrl] : []),
      "https://riihack.vercel.app",
      "https://riihack-*-leon-kresos-projects.vercel.app",
      ...(dev ? ["http://localhost:*", "http://127.0.0.1:*"] : []),
    ],
    plugins: [nextCookies()], // mora biti zadnji
  });
}

type Auth = ReturnType<typeof createAuth>;
let _auth: Auth | undefined;

// Lijeno kao i db: uvoz ne traži BETTER_AUTH_SECRET, pa `next build` (i CI) radi bez tajni.
export function getAuth(): Auth {
  return (_auth ??= createAuth());
}

export type AuthSession = Auth["$Infer"]["Session"];
