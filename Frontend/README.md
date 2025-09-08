# 📦 VanishBin Frontend

A modern, responsive frontend for VanishBin - a secure temporary file and text sharing platform built with Preact, Vite, and TailwindCSS.

## 🚀 Features

### 📁 **File & Text Sharing**
- **Drag & Drop Upload**: Intuitive file upload with drag-and-drop support
- **Text Sharing**: Share formatted text content with syntax highlighting
- **Multiple Formats**: Support for images, videos, audio, PDFs, and documents
- **File Preview**: Real-time preview for images, videos, audio, and PDFs
- **Download Options**: Multiple download methods with progress indicators

### 🔍 **Content Management**
- **Browse All Content**: View all shared files and text in a grid layout
- **Advanced Search**: Search by title, filename, or content with real-time highlighting
- **Infinite Scrolling**: Lazy loading with automatic content fetching
- **Time-based Sorting**: Latest uploads shown first for better organization

### ⏰ **Expiration System**
- **Auto-Expiry**: Content automatically expires after 3 hours
- **Live Countdown**: Real-time display of remaining time
- **Visual Indicators**: Color-coded time warnings (green → orange → red)
- **Expiry Notifications**: Clear messaging when content expires

### 🎨 **User Experience**
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean interface with smooth animations and transitions
- **Loading States**: Comprehensive loading indicators and progress feedback
- **Error Handling**: User-friendly error messages and retry options

## 🛠️ Tech Stack

- **Framework**: [Preact](https://preactjs.com/) - Fast 3kB alternative to React
- **Build Tool**: [Vite](https://vitejs.dev/) - Next generation frontend tooling
- **Styling**: [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Routing**: [Preact Router](https://github.com/preactjs/preact-router) - Client-side routing

## 📋 Prerequisites

- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher (comes with Node.js)
- **Backend**: VanishBin Backend server running on port 5000

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd VanishBin/Frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
# VITE_API_URL=http://localhost:5000/api  # Backend API URL
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready bundle |
| `npm run preview` | Preview production build locally |

## 🏗️ Project Structure

```
src/
├── components/              # React components
│   ├── AllContentPage.jsx   # Browse all shared content
│   ├── ResultCard.jsx       # Upload success display
│   ├── UploadForm.jsx       # File/text upload interface
│   └── ViewPage.jsx         # Individual content viewer
├── config/
│   └── api.js              # API endpoints configuration
├── utils/
│   └── helpers.js          # Utility functions
├── assets/                 # Static assets
├── app.jsx                 # Main application component
├── main.jsx               # Application entry point
├── app.css                # Global styles
└── index.css              # Base CSS imports
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `/api` |

### Vite Configuration

```javascript
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

## 🎯 Features Deep Dive

### Upload System
- **Multi-format Support**: Images, videos, audio, PDFs, documents
- **Size Limits**: Maximum 10MB per file
- **Progress Tracking**: Real-time upload progress
- **Error Handling**: Comprehensive error messages

### Search & Filter
- **Debounced Search**: 300ms delay for optimal performance
- **Multi-field Search**: Search across titles, filenames, and content
- **Highlighting**: Visual highlighting of search terms
- **Real-time Results**: Instant search results as you type

### Infinite Scrolling
- **Lazy Loading**: Load 12 items initially, more on scroll
- **Auto-fetch**: Automatic loading at 80% scroll position
- **Manual Control**: "Load More" button as fallback
- **Performance**: Optimized for large datasets

### Content Display
- **Grid Layout**: Responsive card-based display
- **Media Preview**: Inline preview for supported formats
- **Download Options**: Multiple download methods
- **Share Links**: Easy copy-to-clipboard functionality

## 🔗 API Integration

The frontend communicates with the VanishBin backend through these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload files and text |
| `/api/:id` | GET | Retrieve shared content |
| `/api/file/:id` | GET | Download files directly |
| `/api/all` | GET | List all shared content |

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: Tailored for different screen sizes
- **Touch Friendly**: Large touch targets and gestures
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🎨 Styling & Theming

### TailwindCSS Classes
- **Colors**: Blue primary, gray neutrals, semantic colors
- **Typography**: System font stack with proper hierarchy
- **Spacing**: Consistent 4px grid system
- **Animations**: Smooth transitions and loading states

### Custom Components
- **Cards**: Elevated surfaces with hover effects
- **Buttons**: Primary, secondary, and danger variants
- **Forms**: Styled inputs with validation states
- **Icons**: SVG icons from Heroicons

## 🔄 State Management

- **Local State**: Preact hooks for component state
- **Global State**: Props passing for shared data
- **API State**: Loading, error, and success states
- **Search State**: Debounced search with filter state

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Hosting
1. Build the project: `npm run build`
2. Upload the `dist/` folder to your hosting provider
3. Configure your server to serve `index.html` for all routes
4. Set environment variables for production API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is part of the VanishBin application suite.

## 🆘 Support

- **Issues**: Create an issue in the repository
- **Documentation**: Check the project wiki
- **Backend**: Ensure VanishBin backend is running on port 5000

---

Built with ❤️ using Preact + Vite + TailwindCSS