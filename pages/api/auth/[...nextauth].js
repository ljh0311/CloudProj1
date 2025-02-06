import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../../utils/db';

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    const user = getUserByEmail(credentials.email);
                    
                    if (!user) {
                        throw new Error('No user found with this email');
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    
                    if (!isValid) {
                        throw new Error('Invalid password');
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        isAdmin: user.role === 'admin'
                    };
                } catch (error) {
                    throw new Error(error.message);
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.isAdmin = user.isAdmin;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.role = token.role;
            session.user.isAdmin = token.isAdmin;
            return session;
        }
    },
    pages: {
        signIn: '/auth',
        error: '/auth'
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key' // Replace with your secret in production
}); 