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
            async authorize(credentials, req) {
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

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        image: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    throw new Error('Authentication failed');
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
        updateAge: 60 * 60, // 1 hour
    },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
        maxAge: 24 * 60 * 60, // 24 hours
        encryption: true,
    },
    cookies: {
        sessionToken: {
            name: `__Secure-next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true,
                domain: process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : undefined
            }
        },
        callbackUrl: {
            name: `__Secure-next-auth.callback-url`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true
            }
        },
        csrfToken: {
            name: `__Host-next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true
            }
        }
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.image = user.image;
            }
            
            if (trigger === "update" && session) {
                token.name = session.name;
                token.image = session.image;
            }

            // Add timestamp for additional security
            token.iat = Math.floor(Date.now() / 1000);
            token.exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
            
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.image = token.image;

                // Add session expiry
                session.expires = new Date(token.exp * 1000).toISOString();
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth',
        error: '/auth',
        signOut: '/'
    },
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET,
    useSecureCookies: true,
    events: {
        async signOut({ session, token }) {
            // Cleanup any session-related data
            if (token) {
                token.exp = 0; // Immediately expire the token
            }
        },
        async error(error) {
            console.error('NextAuth Error:', error);
        }
    }
};

export default NextAuth(authOptions); 