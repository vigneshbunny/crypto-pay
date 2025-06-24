# REST Express Crypto Wallet Application

## Overview

This is a full-stack web application that provides a mobile-first TRX (TRON) cryptocurrency wallet service. The application allows users to register, generate secure wallets, view balances, send/receive TRX and USDT tokens, and track transaction history. It's built with a React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management, localStorage for authentication
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized builds
- **Mobile-First Design**: Responsive design optimized for mobile devices with bottom navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: In-memory session storage with potential for external session stores

### Database Design
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection Pooling**: Neon serverless connection pooling for scalability

## Key Components

### Authentication System
- User registration and login with email/password
- Password hashing using crypto.pbkdf2Sync
- Client-side authentication state management with localStorage
- Session-based authentication for API endpoints

### Wallet Management
- Automatic wallet generation upon user registration
- TRON blockchain integration for TRX and USDT support
- Private key encryption using AES-256-GCM
- Balance tracking and real-time updates
- QR code generation for wallet addresses

### Transaction System
- Send TRX and USDT tokens to other addresses
- Transaction history tracking with status updates
- Gas fee estimation and transaction confirmation monitoring
- Support for pending, confirmed, and failed transaction states

### Security Features
- Private key encryption with configurable encryption keys
- Secure password hashing with salt
- Environment-based configuration for sensitive data
- Input validation using Zod schemas

## Data Flow

1. **User Registration**: User creates account → Wallet is automatically generated → Private keys are encrypted and stored
2. **Authentication**: User logs in → Session is created → Client receives auth token
3. **Balance Updates**: User requests balance update → Backend queries TRON network → Database is updated → Frontend reflects new balances
4. **Send Transaction**: User submits transaction → Backend validates and signs → Transaction is broadcast to network → Status is tracked and updated
5. **Transaction History**: Frontend queries transaction history → Backend returns paginated results → UI displays with real-time status updates

## External Dependencies

### Blockchain Integration
- **TronWeb**: JavaScript library for TRON blockchain interactions
- **TRON API**: Integration with TronGrid API for network operations
- **USDT Contract**: TRC-20 USDT token contract interaction

### UI and Development
- **Radix UI**: Accessible component primitives for React
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management and validation
- **Date-fns**: Date manipulation and formatting

### Development Tools
- **Vite**: Fast build tool with HMR support
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment optimization for Replit

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR on port 5000
- **Database**: PostgreSQL with environment-based connection string
- **Environment Variables**: Support for TRON API keys and encryption keys

### Production Build
- **Frontend**: Vite build process generating optimized static assets
- **Backend**: ESBuild bundling server code for Node.js execution
- **Database Migrations**: Drizzle Kit for schema synchronization
- **Deployment Target**: Autoscale deployment on Replit infrastructure

### Configuration Management
- Environment-based configuration for different deployment stages
- Secure handling of API keys and encryption secrets
- Database URL configuration for different environments

## Changelog
```
Changelog:
- June 24, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```