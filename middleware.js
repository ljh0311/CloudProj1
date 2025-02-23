import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from 'next-auth/jwt'

// Rate limiting configuration
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}

const rateLimitStore = new Map()

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        
        // If trying to access admin route without admin role
        if (isAdminRoute && token?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Rate limiting logic
        const ip = req.ip || '127.0.0.1'
        const now = Date.now()
        const windowStart = now - rateLimit.windowMs
        
        if (req.nextUrl.pathname.startsWith('/api/')) {
            const tokenArray = rateLimitStore.get(ip) || []
            const windowRequests = tokenArray.filter(timestamp => timestamp > windowStart)
            
            if (windowRequests.length >= rateLimit.max) {
                return new NextResponse(JSON.stringify({
                    error: 'Too many requests',
                    message: 'Please try again later'
                }), {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': Math.ceil(rateLimit.windowMs / 1000)
                    }
                })
            }
            
            windowRequests.push(now)
            rateLimitStore.set(ip, windowRequests)
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        },
    }
);

export const config = {
    matcher: [
        '/admin/:path*',
        '/profile/:path*',
        '/orders/:path*'
    ]
}; 