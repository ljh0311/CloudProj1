# KAPPY - Vintage Streetwear E-commerce Platform

A modern e-commerce platform specializing in vintage streetwear, built with Next.js and designed for Singapore's youth fashion scene.

[![Next.js](https://img.shields.io/badge/Next.js-13.0-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js->=14-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Development](#-development)
- [Environment Setup](#-environment-setup)
- [Contributing](#-contributing)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

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

- **Performance**
  - Server-side rendering
  - Image optimization
  - Code splitting

## 🏗️ Project Structure

```
CloudProj1/
├── components/          # Reusable React components
├── pages/              # Next.js pages and API routes
├── public/             # Static assets
├── utils/              # Utility functions
├── data/              # JSON data and mock APIs
├── scripts/           # Utility scripts
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
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Database
DATABASE_URL=your_database_url

# API Keys
NEXT_PUBLIC_API_URL=your_api_url
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for functions
- Keep components small and focused

## 🎯 Roadmap

- [ ] Enhanced shopping cart functionality
- [ ] Payment gateway integration
- [ ] Admin dashboard improvements
- [ ] Inventory management system
- [ ] Product reviews and ratings
- [ ] Social media integration
- [ ] Wishlist functionality
- [ ] Size guide implementation

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

---

Made with ❤️ by the KAPPY team 