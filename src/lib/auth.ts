import Credentials from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';
import { verifyPassword } from "@/lib/hash";
import { signInSchema } from "@/lib/zod";
import { prisma } from "@/lib/prisma";

import { DefaultSession } from "next-auth";
import { Role } from '@prisma/client';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: Role | null;
    } & DefaultSession["user"];
  }
}

// -----------------------------
// Configuration NextAuth
// -----------------------------
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",           // tu utilises jwt — ok si tu veux sessions stateless
    maxAge: 1 * 24 * 60 * 60, // 1 day
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials, req) {
        try {
          // Valide les credentials côté serveur avec zod
          const payload = await signInSchema.parseAsync(credentials);
          const { email, password } = payload;

          // Récupère l'utilisateur (si présent)
          const user = await prisma.user.findUnique({ where: { email } });

          // Si pas d'utilisateur ou pas de hash => rejet
          if (!user || !user.password) return null;

          // Vérifie le mot de passe
          const matched = await verifyPassword(password, user.password);
          if (!matched) return null;

          // Retour attendu par NextAuth: au moins id/email/name
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error) {
          // En cas d'échec (validation ou bcrypt), on renvoie null (échec auth)
          // Tu peux logger ici pour debug ; évite de renvoyer des messages sensibles
          console.error('Authorize error (credentials):', error);
          return null;
        }
      }
    })
  ],

  // -----------------------------
  // Callbacks
  // -----------------------------
  callbacks: {
    /**
     * authorized: callback utilisé dans App Router pour contrôler l'accès aux handlers/route
     * Ici on retourne true si l'utilisateur est connecté, false sinon; on pourrait retourner
     * aussi une Response pour redirection personnalisée (selon les besoins).
     */
    authorized({ auth, request: { nextUrl } }) {
      try {
        const isLoggedIn = !!auth?.user;
        const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
        if (isOnDashboard) {
          // Si page dashboard => requiert authentification
          return isLoggedIn;
        }
        // par défaut, on autorise et laisse NextAuth gérer la redirection si besoin
        return true;
      } catch (err) {
        console.error('authorized callback error:', err);
        return false;
      }
    },

    /**
     * session: injecte id & role dans session.user côté client
     */
    async session({ token, session }) {
      // token.sub provient du JWT (subject)
      if (token?.sub && session.user) {
        session.user.id = String(token.sub);
      }
      if (session.user) {
        // sécurise la présence de données
        session.user.name = token?.name ?? session.user.name ?? null;
        session.user.email = token?.email ?? session.user.email ?? null;
        session.user.role = (token?.role ?? null) as Role | null;
      }
      return session;
    },

    /**
     * jwt: utilisé pour construire / mettre à jour le token JWT
     * - on gère le cas 'initial sign in' (user présent)
     * - on essaye d'actualiser les infos si besoin (token.sub présent)
     */
    async jwt({ token, user, account }) {
      try {
        // Cas initial (après authorize) — user contient les infos retournées par authorize
        if (user) {
          token.id = String((user as any).id ?? token.sub);
          token.name = (user as any).name ?? token.name;
          token.email = (user as any).email ?? token.email;
          token.role = (user as any).role ?? token.role ?? 'USER';
          return token;
        }

        // Si token.sub existant, tente de synchroniser le rôle/infos depuis la DB
        // (utile si rôle a changé en base)
        if (token?.sub) {
          try {
            const existingUser = await prisma.user.findUnique({ where: { id: String(token.sub) } });
            if (existingUser) {
              token.name = existingUser.name ?? token.name;
              token.email = existingUser.email ?? token.email;
              token.role = existingUser.role ?? token.role ?? 'USER';
            }
          } catch (dbErr) {
            console.error('Erreur lecture user dans jwt callback:', dbErr);
            // on laisse le token tel quel si erreur DB
          }
        }

        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },
  },

  // -----------------------------
  // Events (optionnel) : utile pour debug/log
  // -----------------------------
  events: {
    async signIn(message) {
      // message: { user, account, isNewUser }
      try {
        console.log('NextAuth signIn event:', message.user?.email);
      } catch { /* noop */ }
    },
    async signOut(message) {
      try {
        console.log('NextAuth signOut event:', message);
      } catch { /* noop */ }
    }
  },

  // Page de connexion personnalisée
  pages: {
    signIn: '/signin',
  },

  // Petite sécurité supplémentaire : timeout raisonnable pour JWT
  // (la plupart des réglages sont déjà dans `session.maxAge` plus haut)
});
