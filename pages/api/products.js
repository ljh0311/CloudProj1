import { getProducts, getProductById, createProduct } from '../../lib/db-service';
import { getSession } from 'next-auth/react';
import { testConnection, getDebugInfo } from '../../lib/mysql';

export default async function handler(req, res) {
    console.log('Products API called:', req.method, req.query);
    
    try {
        // Test database connection first
        const connectionTest = await testConnection();
        if (!connectionTest.success) {
            console.error('Database connection test failed:', connectionTest.error);
            const debugInfo = await getDebugInfo();
            console.error('Database debug info:', debugInfo);
            return res.status(500).json({ 
                error: 'Database connection failed', 
                details: connectionTest.error 
            });
        }
        console.log('Database connection test successful');

        // Check authentication for POST requests
        if (req.method === 'POST') {
            const session = await getSession({ req });
            if (!session || session.user.role !== 'admin') {
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }

        switch (req.method) {
            case 'GET':
                try {
                    const productId = req.query.id;
                    if (productId) {
                        console.log('Fetching single product:', productId);
                        const result = await getProductById(productId);
                        if (!result.success) {
                            console.error('Failed to fetch product:', result.error);
                            return res.status(404).json({ error: result.error });
                        }
                        return res.status(200).json(result.data);
                    }

                    console.log('Fetching all products');
                    const result = await getProducts();
                    console.log('Products query result:', {
                        success: result.success,
                        errorMessage: result.error,
                        productCount: result.data?.length
                    });
                    
                    if (!result.success) {
                        console.error('Failed to fetch products:', result.error);
                        return res.status(500).json({ 
                            error: result.error,
                            message: 'Failed to fetch products from database'
                        });
                    }
                    
                    console.log('Successfully fetched products:', result.data.length);
                    return res.status(200).json({ products: result.data });
                } catch (error) {
                    console.error('Products API Error:', error);
                    return res.status(500).json({ 
                        error: 'Internal server error', 
                        details: error.message,
                        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                    });
                }

            case 'POST':
                try {
                    console.log('Creating new product:', req.body);
                    const result = await createProduct(req.body);
                    if (!result.success) {
                        console.error('Failed to create product:', result.error);
                        return res.status(400).json({ error: result.error });
                    }
                    console.log('Successfully created product:', result.data.id);
                    return res.status(201).json(result.data);
                } catch (error) {
                    console.error('Create Product Error:', error);
                    return res.status(500).json({ 
                        error: 'Internal server error', 
                        details: error.message 
                    });
                }

            default:
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        console.error('Unhandled API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
} 