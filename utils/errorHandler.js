class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const catchAsync = (fn) => {
    return async (req, res) => {
        try {
            await fn(req, res);
        } catch (error) {
            console.error('Error:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                path: req.url,
                method: req.method,
            });

            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                status: error.status || 'error',
                message: error.message || 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        }
    };
};

export const handleValidationError = (error) => {
    const errors = Object.values(error.errors).map(err => err.message);
    return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
};

export { AppError }; 