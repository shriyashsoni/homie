import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider } from 'convex/react';
import { convexReact } from './lib/convexClient';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConvexProvider client={convexReact}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ConvexProvider>
  </StrictMode>
);
