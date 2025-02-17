# KAPPY - Vintage Streetwear E-commerce Platform

A modern e-commerce platform specializing in vintage streetwear, built with Next.js and designed for Singapore's youth fashion scene.

[![Next.js](https://img.shields.io/badge/Next.js-13.0-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js->=14-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [System Requirements](#-system-requirements)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Development](#-development)
- [Cloud Deployment](#-cloud-deployment)
- [Environment Setup](#-environment-setup)
- [Contributing](#-contributing)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- MySQL (for local development)
- Redis (for caching)

### Installation
```bash
# Clone the repository
git clone https://github.com/ljh0311/CloudProj1.git
cd CloudProj1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 🎯 System Requirements

### Functionality (** - Highest Priority)
- [x] User Authentication System
  - NextAuth implementation with JWT
  - Role-based access control
  - Secure password handling with bcrypt
- [x] Product Management
  - Dynamic product catalog
  - Real-time inventory tracking
  - Category management
- [x] Shopping Cart System
  - Real-time updates
  - Persistent storage
  - Multi-item management
- [x] Order Processing
  - Order creation and tracking
  - Status updates
  - Order history
- [x] Admin Dashboard
  - User management
  - Product management
  - Order oversight

### Scalability (* - Priority)
- [ ] Database Implementation
  ```javascript
  // utils/db.js
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
  ```
- [ ] Caching System
  ```javascript
  // utils/cache.js
  import Redis from 'ioredis';
  
  const redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
  });
  ```
- [ ] Content Delivery Network (CDN)
- [ ] Load Balancing

### Elasticity (* - Priority)
- [ ] Auto-scaling Configuration
  ```yaml
  # aws/auto-scaling.yml
  AutoScalingGroup:
    MinSize: 2
    MaxSize: 10
    DesiredCapacity: 2
    HealthCheckType: ELB
    HealthCheckGracePeriod: 300
  ```
- [ ] Container Orchestration
- [ ] Elastic Load Balancer
- [ ] Microservices Architecture

### Reliability (* - Priority)
- [ ] Health Monitoring
  ```javascript
  // pages/api/health.js
  export default async function handler(req, res) {
      try {
          await pool.query('SELECT 1');
          res.status(200).json({
              status: 'healthy',
              timestamp: new Date().toISOString()
          });
      } catch (error) {
          res.status(503).json({
              status: 'unhealthy',
              error: error.message
          });
      }
  }
  ```
- [ ] Automated Backups
- [ ] Error Handling
- [ ] Circuit Breakers
- [ ] Retry Mechanisms

### Security (* - Priority)
- [x] Authentication & Authorization
- [ ] Rate Limiting
  ```javascript
  // middleware/rateLimit.js
  import rateLimit from 'express-rate-limit';
  
  export const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
  });
  ```
- [ ] Security Headers
  ```javascript
  // next.config.js
  module.exports = {
      async headers() {
          return [
              {
                  source: '/:path*',
                  headers: [
                      {
                          key: 'X-Frame-Options',
                          value: 'DENY'
                      },
                      {
                          key: 'X-Content-Type-Options',
                          value: 'nosniff'
                      },
                      {
                          key: 'Strict-Transport-Security',
                          value: 'max-age=31536000; includeSubDomains'
                      }
                  ]
              }
          ];
      }
  };
  ```
- [ ] CSRF Protection
- [ ] XSS Prevention

## ✨ Features

- **Authentication System**
  - Secure user authentication
  - Role-based access control
  - Protected routes

- **Product Management**
  - Dynamic product catalog
  - Advanced filtering
  - Real-time inventory updates

- **Modern UI/UX**
  - Responsive design
  - Animated transitions
  - Dark mode support

- **Cloud Infrastructure**
  - AWS EC2 deployment
  - RDS MySQL database
  - Automated setup scripts
  - Data migration tools

## 🏗️ Project Structure

```
CloudProj1/
├── components/          # Reusable React components
├── pages/              # Next.js pages and API routes
├── public/             # Static assets
├── utils/              # Utility functions
├── data/              # JSON data and backups
├── scripts/           # Deployment and migration scripts
└── docs/              # Documentation
```

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **UI Components**: [Chakra UI](https://chakra-ui.com/)
- **Styling**: [Emotion](https://emotion.sh/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [React Context](https://reactjs.org/docs/context.html)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Database**: MySQL (via RDS)
- **Caching**: Redis
- **Cloud Provider**: AWS

## 💻 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🔐 Environment Setup

Create a `.env.local` file with the following variables:

```env
# App Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kappy_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🎯 Project Tasks & Progress

- [🔄] Phase 1: Design & Planning (Initial project setup and architecture planning)
  - [x] Requirements Analysis
    - [x] Define functional & non-functional requirements (Core features and system constraints)
    - [x] Document user base and storage needs (User profiles and data requirements)
    - [x] Establish project scope and constraints (Project boundaries and limitations)
  - [ ] Cloud Service Model Selection
    - [ ] IaaS selection & justification (AWS infrastructure choice rationale)
    - [ ] Technical & business implications analysis (Cost and technical impact assessment)
  - [ ] Cloud Deployment Strategy
    - [ ] Public cloud deployment model selection (AWS public cloud implementation)
    - [ ] Justification documentation (Reasoning for cloud choices)
  - [ ] Cloud Storage and Database Architecture
    - [ ] RDS & S3 storage solution design (Database and file storage planning)
    - [ ] Risk mitigation strategies (Data backup and recovery plans)
  - [ ] High Availability and Security Planning
    - [ ] Load balancing architecture (Traffic distribution design)
    - [ ] Security & encryption planning (Data protection measures)

- [🔄] Phase 2: Implementation (Active development phase)
  - [ ] AWS Infrastructure Setup
    - [ ] EC2 instance configuration (Server setup and configuration)
    - [ ] Security groups setup (Network security rules)
    - [ ] VPC networking configuration (Private network setup)
    - [ ] IAM roles and policies (Access control implementation)
  - [x] Web Application Development
    - [x] Next.js application setup (Frontend framework implementation)
    - [x] UI/UX implementation (User interface design)
    - [x] Authentication system (User login and security)
    - [x] Product management (Inventory and product features)
  - [🔄] Database Implementation
    - [x] MySQL schema design (Database structure planning)
    - [x] Migration scripts (Data transfer tools)
    - [🔄] Data seeding (Initial data population)
    - [ ] Backup procedures (Data recovery planning)
  - [🔄] Deployment Configuration
    - [x] Environment setup (Development and production environments)
    - [x] Deployment scripts (Automated deployment tools)
    - [🔄] SSL/TLS configuration (Security certificate setup)
    - [ ] Monitoring setup (System health tracking)

- [ ] Phase 3: Testing & Optimization (Quality assurance and performance tuning)
  - [🔄] Performance Testing
    - [🔄] Load testing with JMeter (System capacity testing)
    - [ ] Stress testing (System limits evaluation)
    - [ ] Performance optimization (Speed and efficiency improvements)
  - [ ] Security Assessment
    - [ ] Vulnerability scanning (Security weakness detection)
    - [ ] Security hardening (System protection enhancement)
  - [🔄] Documentation
    - [x] API documentation (Interface specifications)
    - [x] Deployment guides (Installation instructions)
    - [🔄] User manuals (End-user guides)
    - [ ] System architecture docs (Technical documentation)
  - [ ] Final Review
    - [ ] Code review (Code quality assessment)
    - [ ] Performance metrics analysis (System performance evaluation)
    - [ ] Cost optimization (Resource usage efficiency)
    - [ ] Scalability assessment (Growth capacity evaluation)

Legend:
- [x] Completed
- [🔄] In Progress
- [ ] Not Started

## 📚 Documentation

- [Component Documentation](docs/components.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)

## 🎨 Design Guidelines

- **Colors**
  - Primary: Black (#000000)
  - Secondary: White (#FFFFFF)
  - Accent: Based on collections

- **Typography**
  - Headings: System font stack
  - Body: System font stack
  - Monospace: For code blocks

- **Spacing**
  - Base unit: 4px
  - Grid system: 12 columns
  - Responsive breakpoints: 480px, 768px, 1024px, 1280px

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔐 Authentication

### User Roles
- **Admin**: Full system access (`admin@kappy.com`)
- **Customer**: Standard user privileges (default for new registrations)

### Features
- Secure password hashing with bcrypt
- JWT-based session management
- Role-based access control
- Protected API routes
- Automatic session renewal

---
