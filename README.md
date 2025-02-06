# KAPPY - Vintage Streetwear E-commerce Platform

KAPPY is a modern e-commerce platform specializing in vintage streetwear curated for Singapore's youth and climate. This web application is built using Next.js and features a responsive design with modern animations.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
```bash
git clone [your-repository-url]
cd web-shop
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
web-shop/
├── components/          # Reusable React components
│   ├── Logo.js         # Logo component with styling
│   ├── Navbar.js       # Navigation bar component
│   └── AnimatedBackground.js  # Animated background effects
├── pages/              # Next.js pages
│   ├── _app.js        # App wrapper with global styles
│   ├── index.js       # Homepage
│   ├── about.js       # About page
│   └── shop.js        # Shop page (in development)
├── public/            # Static assets
│   └── images/       # Image assets
└── styles/           # Global styles and theme
```

## 🎨 Features

- **Modern Design**: Black and white theme with animated elements
- **Responsive Layout**: Mobile-first approach with responsive design
- **Brand Story**: Dedicated about page with animated sections
- **Performance Optimized**: Built with Next.js for optimal performance

## 🛠️ Tech Stack

- **Framework**: Next.js
- **UI Library**: Chakra UI
- **Animations**: Framer Motion
- **Styling**: Emotion
- **Icons**: React Icons

## 📱 Pages

### Homepage
- Brand showcase
- Featured collections
- Quick navigation to key sections

### About Page
- Brand story
- Mission statement
- Core values
- Community section

## 🔄 Development Workflow

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "Description of changes"
```

3. Push to your branch:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request for review

## 📦 Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Run production build
- `npm run lint`: Run linter

## 🎯 Future Development

- [ ] Implement shopping cart functionality
- [ ] Add product catalog
- [ ] Integrate payment gateway
- [ ] Add user authentication
- [ ] Create admin dashboard
- [ ] Implement inventory management
- [ ] Add size guide
- [ ] Integrate social media feeds

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 Notes

- The project uses a dark theme to match the brand aesthetic
- All images should be optimized before adding to the project
- Keep animations subtle and professional
- Maintain mobile responsiveness for all new features
- Follow the existing code style and component structure

## 💡 Design Principles

- Clean, minimalist aesthetic
- Focus on typography and spacing
- Responsive and mobile-first
- Accessibility-conscious
- Performance-optimized

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=your_api_url
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Chakra UI Documentation](https://chakra-ui.com/docs/getting-started)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 🎨 Brand Guidelines

- Primary Color: Black (#000000)
- Secondary Color: White (#FFFFFF)
- Font: System font stack for optimal performance
- Logo: Must be displayed according to brand specifications 