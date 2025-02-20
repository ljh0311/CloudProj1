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
                    console.log('Attempting to authenticate user:', credentials.email);
                    const result = await getUserByEmail(credentials.email);
                    
                    if (!result.success) {
                        console.error('Error during authentication:', result.error);
                        return null;
                    }

                    const user = result.data;
                    if (!user) {
                        console.log('No user found with email:', credentials.email);
                        return null;
                    }

                    console.log('Comparing passwords for user:', credentials.email);
                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    if (!isValid) {
                        console.log('Invalid password for user:', credentials.email);
                        return null;
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
                    return null;
                }
            }
        })
    ],
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
    debug: true
};

export default NextAuth(authOptions); 