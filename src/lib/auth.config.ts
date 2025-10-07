import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/signin",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60, // 1 days
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isView = nextUrl.pathname.startsWith("/ex");
      if (isOnDashboard ) {
        if (isLoggedIn) return true;
        return false; //redirect unauthencated users to login page
      } else if (isLoggedIn) {
        if (isView) {
          return true;
        }
        return Response.redirect(new URL("/dashboard", nextUrl));
       } else if (isView) {
          return true;
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;