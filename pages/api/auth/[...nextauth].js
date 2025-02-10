import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readJsonFile } from '../../../utils/jsonOperations';
import bcrypt from 'bcryptjs';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email", placeholder: "your@email.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    const { users } = await readJsonFile('users.json');
                    const user = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

                    if (!user) {
                        console.log('No user found with email:', credentials.email);
                        return null;
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    
                    if (!isValid) {
                        console.log('Invalid password for user:', credentials.email);
                        return null;
                    }

                    console.log('User authenticated successfully:', user.email, 'Role:', user.role);

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        image: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.image = user.image;
            }
            
            // Handle user updates
            if (trigger === "update" && session) {
                token.name = session.name;
                token.image = session.image;
            }
            
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.image = token.image;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth',
        error: '/auth',
        signOut: '/',
    },
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions); 