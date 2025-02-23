import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../../lib/db-service';

export const authOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password required');
                }

                try {
                    console.log('Authorizing user:', credentials.email);
                    const result = await getUserByEmail(credentials.email);
                    
                    if (!result.success) {
                        console.error('User not found:', result.error);
                        return null;
                    }

                    const user = result.data;
                    const isValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isValid) {
                        console.error('Invalid password for user:', credentials.email);
                        return null;
                    }

                    console.log('User authorized successfully:', user.email);
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    };
                } catch (error) {
                    console.error('Authorization error:', error);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.type === 'credentials') {
                return true;
            }
            return false;
        },
        async jwt({ token, user, account, profile, trigger }) {
            if (trigger === 'signIn' && user) {
                token.id = user.id;
                token.role = user.role;
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    id: token.id,
                    name: token.name,
                    email: token.email,
                    role: token.role
                };
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth',
        error: '/auth',
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);