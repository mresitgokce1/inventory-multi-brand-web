# Multi-Brand Inventory Platform

A React TypeScript application for managing QR code scanning, authentication, and product information across multiple brands.

## Features

- 🔐 **JWT Authentication** - Login with access/refresh token support
- 📱 **QR Code Scanning** - Mobile-first responsive QR landing pages
- 🏷️ **Product Information** - Public and private product details with role-based access
- 🖨️ **QR Code Generation** - Manager dashboard to generate and print QR codes
- 🎨 **Responsive Design** - Mobile-optimized interface for scanning devices
- 🔒 **Protected Routes** - Role-based access control for managers and admins

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router v7 
- **HTTP Client**: Axios with JWT interceptors
- **State Management**: React Query for data fetching/caching
- **Styling**: Custom CSS with utility classes (mobile-first responsive)
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mresitgokce1/inventory-multi-brand-web.git
cd inventory-multi-brand-web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your API base URL:
```env
VITE_API_URL=https://your-api-domain.com
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

### Testing

Run tests:
```bash
npm test
```

## Routes

### Public Routes
- `/login` - Authentication page
- `/p/:code` - QR code landing page (shows public product info)

### Protected Routes  
- `/dashboard/products` - Manager dashboard for QR generation

## API Integration

The application expects the following backend endpoints:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Token refresh  
- `GET /api/qr/resolve/:code` - Resolve QR code to product data
- `GET /api/products` - Get products for authenticated user's brand
- `POST /api/products/:id/qr-code` - Generate QR code for product

## User Flow

1. **QR Scanning**: Users scan QR codes that redirect to `/p/:code`
2. **Public View**: All users see public product information (name, price, brand, etc.)
3. **Authentication**: Managers can sign in to access private information
4. **Private View**: Authenticated managers see additional details (SKU, stock) via toggle
5. **QR Generation**: Managers can generate and print new QR codes from dashboard

## Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/         # React contexts (Auth)
├── pages/           # Page components
├── services/        # API service layers
├── types/           # TypeScript type definitions
├── __tests__/       # Test files
└── App.tsx         # Main app component
```

## Environment Variables

- `VITE_API_URL` - Base URL for your backend API

## License

MIT License - see LICENSE file for details.
