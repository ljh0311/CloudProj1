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
                try {
                    if (!credentials?.email || !credentials?.password) {
                        throw new Error('Please enter both email and password');
                    }

                    console.log('Attempting to authenticate user:', credentials.email);
                    const result = await getUserByEmail(credentials.email);
                    
                    if (!result.success) {
                        console.error('Error during authentication:', result.error);
                        throw new Error('Authentication failed');
                    }

                    const user = result.data;
                    if (!user) {
                        console.log('No user found with email:', credentials.email);
                        throw new Error('No user found with this email');
                    }

                    console.log('Comparing passwords for user:', credentials.email);
                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    if (!isValid) {
                        console.log('Invalid password for user:', credentials.email);
                        throw new Error('Invalid password');
                    }

                    console.log('Authentication successful for user:', credentials.email);
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    };
                } catch (error) {
                    console.error('Authentication error:', error);
                    throw error;
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
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
        error: '/auth'
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        }
    }
};

export default NextAuth(authOptions); 