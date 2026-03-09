# 🛍️ E-Commerce Platform - Premium Multi-Vendor Marketplace

A fully-featured, internationalized e-commerce platform with customer, vendor, and admin portals. Built with modern web technologies and a premium glassmorphism design aesthetic.

## ✨ Features

### 🌍 **Internationalization (i18n)**
- **Full RTL/LTR Support**: Automatic layout mirroring for Arabic
- **290+ Translation Keys**: Complete coverage across all features
- **Languages**: Arabic (العربية) & English
- **Dynamic Switching**: Real-time language/direction changes

### 👥 **Customer Portal**
- Premium landing page with hero section, testimonials, newsletter
- Advanced product browsing with filters and search
- Detailed product pages with tabbed interface
- Smart shopping cart with quantity controls
- Streamlined checkout process
- User dashboard with:
  - Profile management
  - Order history and tracking
  - Address book
  - Wishlist

### 💼 **Vendor Portal**
- Business command center dashboard with KPIs:
  - Total sales analytics
  - Active product count
  - Pending order notifications
  - Store rating
- Product management:
  - Searchable product grid
  - Quick stock updates
  - Professional add/edit forms
- Order fulfillment interface
- Wallet and payout tracking

### 🛡️ **Admin Portal**
- Platform command center with global metrics:
  - Total revenue
  - User statistics
  - Product count
  - Active vendor tracking
- User management:
  - Role-based access control (Admin/Vendor/User)
  - User activation/deactivation
  - Search and filter capabilities
- Vendor management:
  - Vendor approval workflow
  - Payout processing
  - Balance tracking
- Top products analytics

## 🎨 Design System

### **Visual Aesthetic**
- **Theme**: Dark/Navy/Gold glassmorphism
- **Typography**: Custom heading and body fonts
- **Color Palette**: Carefully curated for premium feel
  - Primary: Deep navy blue
  - Accent: Elegant gold
  - Success/Warning/Danger: Semantic colors

### **Reusable Components**
```javascript
- Input.jsx          // RTL-aware form input with validation
- CustomButton       // Consistent button styles (primary, secondary, outline, etc.)
- PageContainer      // Standard page wrapper with margins
- ToastProvider      // Global notification system
- SearchSuggestions  // Smart product search
```

### **CSS Logical Properties**
All layouts use modern logical properties for automatic RTL support:
- `padding-inline-start` instead of `padding-left`
- `inset-inline-end` instead of `right`
- `margin-block` for vertical spacing

## 🚀 Technology Stack

### **Frontend**
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Internationalization**: react-i18next
- **State Management**: Zustand (for cart, auth)
- **Styling**: CSS Modules + CSS-in-JS (styled-jsx)

### **Backend** (if integrated)
- RESTful API architecture
- JWT authentication
- Multi-vendor order routing
- Wallet and payout system

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to frontend directory
cd ecommerce-store/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 🔧 Configuration

### **Environment Variables**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_DEFAULT_LANGUAGE=ar
```

### **i18n Configuration**
Languages are configured in `src/i18n/index.js`. Translation files are located in:
```
src/locales/
├── ar/
│   └── translation.json
└── en/
    └── translation.json
```

## 📱 Responsive Design

The platform is fully responsive with breakpoints:
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

## 🎯 User Roles

### **Customer**
- Browse and purchase products
- Manage profile and addresses
- Track orders
- Save wishlist items

### **Vendor**
- Manage product inventory
- Process orders
- Track sales and earnings
- Access business analytics

### **Admin**
- Platform-wide management
- User and vendor administration
- System configuration
- Financial oversight

## 🗂️ Project Structure

```
frontend/src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Input.jsx
│   │   ├── CustomButton.jsx
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── PageContainer.jsx
│   └── ErrorBoundary.jsx
├── pages/
│   ├── Landing.jsx      # Customer pages
│   ├── Profile.jsx
│   ├── AdminDashboard.jsx    # Admin pages
│   ├── AdminUsers.jsx
│   ├── SupplierDashboard.jsx # Vendor pages
│   └── VendorProducts.jsx
├── locales/            # Translation files
├── services/           # API service layer
├── store/              # State management
└── styles/
    └── design-tokens.css
```

## 🔐 Authentication

The platform uses JWT-based authentication:
- Access tokens for API requests
- Refresh token rotation
- Role-based route protection
- Automatic token refresh

## 🌐 API Integration

All API calls are centralized in the `services/` directory:
```javascript
- api.js              // Base axios instance
- productService.js   // Product CRUD
- authService.js      // Authentication
- adminService.js     // Admin operations
- supplierService.js  // Vendor operations
```

## 🎨 Theming

The application supports light/dark modes (toggle hidden by default but functional):
```javascript
- ThemeToggle component in Header
- CSS variables for theme switching
- Persisted in localStorage
```

## ✅ Code Quality

- **ESLint**: Configured for React best practices
- **Prettier**: Consistent code formatting
- **PropTypes**: Runtime type checking
- **Error Boundaries**: Graceful error handling

## 📈 Performance Optimizations

- Lazy loading for route components
- Image optimization
- Debounced search
- Memoized expensive calculations

## 🧪 Testing (Recommended Setup)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🚀 Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### **Deployment Platforms**
- Vercel (recommended for Vite)
- Netlify
- AWS S3 + CloudFront
- Custom server with Nginx

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

[Specify your license here]

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@example.com

---

**Built with ❤️ using modern web technologies**
