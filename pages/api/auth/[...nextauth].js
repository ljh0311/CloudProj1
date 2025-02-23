import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../../lib/db-service';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
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
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth',
        error: '/auth',
    },
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true
};

export default NextAuth(authOptions);