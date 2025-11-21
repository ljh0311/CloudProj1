# Database Error Handling Guide

This guide covers the comprehensive error handling system implemented for the PostgreSQL database connection in the KAPPY project.

## Overview

The application now includes robust error handling for database operations with:

- Detailed error logging
- User-friendly error messages
- Automatic retry mechanisms
- Health monitoring
- Graceful degradation

## Error Types and Solutions

### 1. Connection Errors

#### `ECONNREFUSED`

**Error**: Connection refused
**Cause**: PostgreSQL server is not running
**Solution**:

```bash
# Start PostgreSQL service
# Windows:
net start postgresql-x64-15

# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

#### `ENOTFOUND`

**Error**: Host not found
**Cause**: Incorrect database host configuration
**Solution**: Check your `.env` file:

```env
DB_HOST=localhost  # Should be correct hostname/IP
```

#### `28P01`

**Error**: Authentication failed
**Cause**: Wrong username or password
**Solution**: Verify credentials in `.env`:

```env
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

### 2. Database Errors

#### `3D000`

**Error**: Database does not exist
**Cause**: Database hasn't been created
**Solution**:

```bash
# Create database
npm run init-db
```

#### `42501`

**Error**: Insufficient privileges
**Cause**: User lacks necessary permissions
**Solution**: Grant privileges in PostgreSQL:

```sql
GRANT ALL PRIVILEGES ON DATABASE kappy_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

### 3. Configuration Errors

#### `POOL_NOT_INITIALIZED`

**Error**: Database connection pool not initialized
**Cause**: Missing environment variables
**Solution**: Check your `.env` file has all required variables:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=kappy_db
DB_PORT=5432
```

## Error Handling Components

### 1. PostgreSQL Connection (`lib/postgres.js`)

- **Pool Management**: Automatic connection pooling with error recovery
- **Retry Logic**: Automatic retries for transient errors
- **Error Classification**: Specific handling for different error codes
- **Security**: Query logging limited to prevent sensitive data exposure

### 2. Database Service Layer (`lib/db-service-postgres.js`)

- **Consistent Error Format**: All database operations return standardized error responses
- **Detailed Logging**: Comprehensive error logging for debugging
- **User-Friendly Messages**: Clear error messages for end users

### 3. Error Handler Utility (`utils/databaseErrorHandler.js`)

- **Custom Error Class**: `DatabaseError` for structured error handling
- **Error Response Factory**: Consistent error response format
- **Middleware**: `withDatabaseErrorHandling` for API route protection
- **Health Monitoring**: Database health check utilities

### 4. API Error Handling

All API endpoints now include:

- **Connection Testing**: Pre-operation database connectivity checks
- **Graceful Degradation**: Proper error responses instead of crashes
- **User-Friendly Messages**: Clear suggestions for resolving issues

## Health Monitoring

### Database Health Check Endpoint

Access the database health status at:

```
GET /api/health/database
```

**Response Format**:

```json
{
  "status": "healthy|unhealthy",
  "database": {
    "healthy": true,
    "message": "Database connection healthy",
    "details": {},
    "debug": {
      "connected": true,
      "host": "localhost",
      "database": "kappy_db"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### Health Check Script

Create a health check script:

```bash
# Check database health
curl http://localhost:3000/api/health/database
```

## Troubleshooting Steps

### 1. Check Database Status

```bash
# Test database connection
npm run check-env
```

### 2. Verify Environment Variables

```bash
# Check if all required variables are set
node check-env.js
```

### 3. Test Database Connection

```bash
# Test direct connection
node -e "
const { testConnection } = require('./lib/postgres');
testConnection().then(console.log).catch(console.error);
"
```

### 4. Check PostgreSQL Service

```bash
# Windows
sc query postgresql-x64-15

# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

### 5. Verify Database Exists

```sql
-- Connect to PostgreSQL and check databases
\l
```

## Error Response Format

All database errors now return a consistent format:

```json
{
  "success": false,
  "error": "Failed to fetch products",
  "details": {
    "code": "ECONNREFUSED",
    "message": "Connection refused",
    "suggestion": "PostgreSQL server is not running. Please start the database service."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Frontend Error Handling

The frontend now includes:

- **User-Friendly Error Messages**: Clear explanations of what went wrong
- **Retry Mechanisms**: Buttons to retry failed operations
- **Graceful Degradation**: Proper error states instead of crashes
- **Loading States**: Clear indication when operations are in progress

## Best Practices

### 1. Environment Configuration

- Always use environment variables for database configuration
- Never commit sensitive credentials to version control
- Use different configurations for development and production

### 2. Error Logging

- Log errors with sufficient detail for debugging
- Include timestamps and context information
- Avoid logging sensitive data

### 3. User Experience

- Provide clear, actionable error messages
- Include suggestions for resolving issues
- Implement retry mechanisms where appropriate

### 4. Monitoring

- Regularly check database health
- Monitor connection pool usage
- Set up alerts for critical errors

## Common Issues and Solutions

### Issue: "Database connection failed" on startup

**Solution**:

1. Check if PostgreSQL is running
2. Verify environment variables
3. Ensure database exists
4. Check user permissions

### Issue: Intermittent connection errors

**Solution**:

1. Check connection pool settings
2. Monitor database server resources
3. Verify network connectivity
4. Check for connection limits

### Issue: Authentication errors after password change

**Solution**:

1. Update `.env` file with new password
2. Restart the application
3. Verify user exists in PostgreSQL

### Issue: Permission denied errors

**Solution**:

1. Check user privileges in PostgreSQL
2. Grant necessary permissions
3. Verify database ownership

## Support

If you encounter database issues:

1. **Check the logs**: Look for detailed error messages in the console
2. **Use health endpoint**: Test database connectivity via `/api/health/database`
3. **Verify configuration**: Ensure all environment variables are set correctly
4. **Test connection**: Use the provided test scripts to isolate issues
5. **Check PostgreSQL**: Verify the database server is running and accessible

For persistent issues, check the PostgreSQL logs and ensure your database server is properly configured and running.
