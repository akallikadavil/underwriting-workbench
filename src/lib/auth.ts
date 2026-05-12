import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.active) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = (user as any).role; token.department = (user as any).department; token.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (token) { (session.user as any).role = token.role; (session.user as any).department = token.department; (session.user as any).id = token.id; }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'underwriting-workbench-secret-2024',
};
