# PostgreSQL Setup Guide

This guide will help you set up your local PostgreSQL database for the KAPPY project.

## Prerequisites

1. PostgreSQL installed on your system
2. Node.js and npm installed

## Setup Steps

### 1. Install PostgreSQL Dependencies

The project now uses PostgreSQL instead of MySQL. The required dependencies have been installed:

```bash
npm install pg
```

### 2. Create PostgreSQL Database

1. Open your PostgreSQL client (pgAdmin, psql, or any other client)
2. Create a new database named `kappy_db`:

```sql
CREATE DATABASE kappy_db;
```

### 3. Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=kappy_db
DB_PORT=5432

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Environment
NODE_ENV=development
```

**Important:** Replace `your_password_here` with your actual PostgreSQL password.

### 4. Initialize Database

Run the database initialization script to create tables and sample data:

```bash
npm run init-db
```

This will:

- Create the necessary tables (users, products, orders)
- Insert sample product data
- Set up the database schema

### 5. Start the Development Server

```bash
npm run dev
```

## Database Schema

The following tables are created:

### Users Table

- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `password` (VARCHAR)
- `role` (VARCHAR, DEFAULT 'customer')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Products Table

- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `price` (DECIMAL)
- `category` (VARCHAR)
- `image` (TEXT)
- `material` (VARCHAR)
- `description` (TEXT)
- `size_s_stock` (INTEGER)
- `size_m_stock` (INTEGER)
- `size_l_stock` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Orders Table

- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER, REFERENCES users(id))
- `order_number` (VARCHAR, UNIQUE)
- `items` (JSONB)
- `subtotal` (DECIMAL)
- `tax` (DECIMAL)
- `shipping` (DECIMAL)
- `total` (DECIMAL)
- `status` (VARCHAR)
- `shipping_address` (JSONB)
- `billing_address` (JSONB)
- `payment_method` (JSONB)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Troubleshooting

### Connection Issues

- Ensure PostgreSQL is running on your system
- Verify the database credentials in your `.env` file
- Check that the database `kappy_db` exists

### Permission Issues

- Make sure your PostgreSQL user has the necessary permissions
- You may need to grant privileges to your user on the database

### Port Issues

- Default PostgreSQL port is 5432
- If you're using a different port, update the `DB_PORT` in your `.env` file

## Migration from MySQL

The following changes have been made to migrate from MySQL to PostgreSQL:

1. **Database Driver**: Changed from `mysql2` to `pg`
2. **Connection Configuration**: Updated to use PostgreSQL connection parameters
3. **Query Syntax**: Updated parameterized queries to use `$1, $2, ...` instead of `?`
4. **Data Types**: Updated to use PostgreSQL-specific data types (JSONB, SERIAL, etc.)
5. **Transaction Handling**: Updated to use PostgreSQL transaction syntax

## Files Modified

- `lib/postgres.js` - New PostgreSQL connection configuration
- `lib/db-service-postgres.js` - New database service layer for PostgreSQL
- `scripts/init-postgres-db.js` - Database initialization script
- `pages/api/products.js` - Updated to use PostgreSQL service
- `pages/api/auth/signup.js` - Updated to use PostgreSQL service
- `pages/api/auth/[...nextauth].js` - Updated to use PostgreSQL service
- `pages/api/orders/create.js` - Updated to use PostgreSQL service
- `pages/api/orders/get-user-orders.js` - Updated to use PostgreSQL service
- `pages/api/admin/getData.js` - Updated to use PostgreSQL service
- `pages/api/test-db.js` - Updated to use PostgreSQL service
- `package.json` - Updated scripts and dependencies
- `check-env.js` - Updated environment variable checks
