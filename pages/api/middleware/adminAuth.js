import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export async function isAdmin(req, res) {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
        return {
            success: false,
            error: 'Authentication required'
        };
    }

    if (session.user.role !== 'admin') {
        return {
            success: false,
            error: 'Admin access required'
        };
    }

    return {
        success: true,
        user: session.user
    };
}

export async function withAdminAuth(handler) {
    return async (req, res) => {
        const authResult = await isAdmin(req, res);
        
        if (!authResult.success) {
            return res.status(403).json({ 
                success: false, 
                error: authResult.error 
            });
        }

        // Add the authenticated user to the request
        req.user = authResult.user;
        return handler(req, res);
    };
} 