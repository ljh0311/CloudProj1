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
                        console.error('Missing credentials');
                        throw new Error('Please enter both email and password');
                    }

                    console.log('Attempting to authenticate user:', credentials.email);
                    const result = await getUserByEmail(credentials.email);
                    console.log('getUserByEmail result:', result);
                    
                    if (!result.success) {
                        console.error('Error during authentication:', result.error);
                        throw new Error(result.error || 'Authentication failed');
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
        async signIn({ user, account, profile, email, credentials }) {
            console.log('SignIn callback:', { user, account, profile, email, credentials });
            return true;
        },
        async jwt({ token, user, account, profile }) {
            console.log('JWT callback:', { token, user, account, profile });
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token, user }) {
            console.log('Session callback:', { session, token, user });
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
    debug: true,
    logger: {
        error(code, metadata) {
            console.error('NextAuth Error:', code, metadata);
        },
        warn(code) {
            console.warn('NextAuth Warning:', code);
        },
        debug(code, metadata) {
            console.log('NextAuth Debug:', code, metadata);
        }
    }
};

export default NextAuth(authOptions);