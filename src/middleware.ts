import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.AUTH_SECRET,
  callbacks: {
    authorized: ({ token }) => Boolean(token),
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/companies/:path*",
    "/audits/:path*",
    "/checklists/:path*",
    "/non-conformities/:path*",
    "/notifications/:path*",
    "/settings/:path*",
  ],
};
