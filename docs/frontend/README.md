# Frontend Architecture

This document outlines the architecture and design of the Elo Insight frontend.

## Directory Structure

```
frontend/
├── public/                # Static assets
├── src/                   # Source code
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable UI components
│   │   ├── common/        # Shared components (buttons, inputs, etc.)
│   │   ├── layout/        # Layout components (header, footer, etc.)
│   │   └── features/      # Feature-specific components
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # API service functions
│   ├── store/             # State management
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main application component
│   └── index.tsx          # Application entry point
├── .env                   # Environment variables
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Component Design

### Component Hierarchy

```
App
├── Navbar
├── Routes
│   ├── HomePage
│   ├── RegisterPage
│   ├── LoginPage
│   ├── ProfilePage
│   └── StatisticsPage
│       ├── StatCard
│       ├── GameSelector
│       └── PlatformConnector
└── Footer
```

### Component Structure

Components follow a consistent structure:

```tsx
// Component file (StatCard.tsx)
import React from 'react';
import './StatCard.css';
import { StatCardProps } from '../../types';

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <p className="stat-card-value">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
```

### Styling Approach

- Tailwind CSS for utility-first styling
- Component-specific CSS for complex components
- Responsive design for all screen sizes

## State Management

### Local Component State

For component-specific state:

```tsx
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

### Context API

For shared state across components:

```tsx
// AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { getProfile } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Implementation details...
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## API Integration

### Service Functions

```tsx
// services/stats.ts
import axios from 'axios';
import { CS2Stats } from '../types';

const API_URL = process.env.REACT_APP_API_URL;

export const getCS2Stats = async (steamId: string): Promise<CS2Stats> => {
  try {
    const response = await axios.get(`${API_URL}/api/stats/cs2`, {
      params: { steam_id: steamId },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch CS2 stats');
  }
};
```

### Custom Hooks for API Calls

```tsx
// hooks/useStats.ts
import { useState, useEffect } from 'react';
import { CS2Stats } from '../types';
import { getCS2Stats } from '../services/stats';

export const useCS2Stats = (steamId: string) => {
  const [stats, setStats] = useState<CS2Stats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await getCS2Stats(steamId);
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch stats');
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (steamId) {
      fetchStats();
    }
  }, [steamId]);

  return { stats, isLoading, error };
};
```

## Routing

Using React Router for navigation:

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

const PrivateRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<PrivateRoute element={<ProfilePage />} />} />
        <Route path="/statistics" element={<PrivateRoute element={<StatisticsPage />} />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Authentication Flow

1. User submits login credentials
2. Backend validates and returns JWT token
3. Frontend stores token in localStorage/cookies
4. Token is included in subsequent API requests
5. Protected routes check authentication status

## Error Handling

- Global error boundary for unexpected errors
- Form validation with error messages
- API error handling with user-friendly messages
- Loading states for asynchronous operations

## Testing Strategy

- Unit tests for components with React Testing Library
- Integration tests for page components
- Mock API calls for testing
- Accessibility testing

## Performance Optimization

- Code splitting for route-based components
- Lazy loading of heavy components
- Memoization of expensive calculations
- Image optimization
- Caching of API responses
