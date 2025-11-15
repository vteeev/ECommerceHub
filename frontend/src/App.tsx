import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Collections from './pages/Collections';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import CheckoutAddress from './pages/CheckoutAddress';
import CheckoutPayment from './pages/CheckoutPayment';
import CheckoutSuccess from './pages/CheckoutSuccess';
import GuestCheckout from './pages/GuestCheckout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});



const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Admin route without main layout */}
            <Route path="/admin" element={<Admin />} />

            {/* All other routes with main layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/checkout/guest" element={<GuestCheckout />} />
              <Route path="/checkout/address" element={<CheckoutAddress />} />
              <Route path="/checkout/payment" element={<CheckoutPayment />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;