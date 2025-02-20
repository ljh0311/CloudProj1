import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function getUserByEmail(email) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

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
                    const user = await getUserByEmail(credentials.email);

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
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions); 