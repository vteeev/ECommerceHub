import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Box,
  IconButton,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Cart as CartType } from '../types/index';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Cart: React.FC = () => {
  const [cart, setCart] = useState<CartType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // poczekaj aż auth się załaduje
    
    // For guests, try to load cart immediately if cart_id exists
    if (!isAuthenticated) {
      const cartId = localStorage.getItem('cart_id');
      if (cartId) {
        loadCart();
      } else {
        setLoading(false); // No cart for guest yet
      }
      return;
    }
    
    // For authenticated users, wait for cart_id to be synchronized by Layout
    const cartId = localStorage.getItem('cart_id');
    if (!cartId) return; // poczekaj aż Layout zsynchronizuje cart_id
    loadCart();
    // eslint-disable-next-line
  }, [isLoading, isAuthenticated, user?.id]);

  useEffect(() => {
    // Only run this for authenticated users who need cart sync
    if (!isAuthenticated || isLoading) return;
    
    let interval: NodeJS.Timeout | null = null;

    const checkCartId = () => {
      const cartId = localStorage.getItem('cart_id');
      if (cartId && !cartLoaded) {
        loadCart();
        setCartLoaded(true);
        if (interval) clearInterval(interval);
      }
    };

    checkCartId();
    interval = setInterval(checkCartId, 200);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.id, isAuthenticated, cartLoaded, isLoading]);

  const loadCart = async () => {
    try {
      let cartId = localStorage.getItem('cart_id');

      if (!cartId) {
        const newCart = await apiService.createCart();
        cartId = newCart.id;
        localStorage.setItem('cart_id', cartId);
      }

      const cartData = await apiService.getCart(cartId);
      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = async (itemId: number, newQuantity: number) => {
    if (!cart) return;

    const item = cart.items.find(i => i.id === itemId);
    if (!item) return;

    const maxInventory = item.product.inventory;

    if (newQuantity > maxInventory) {
      setError(`Only ${maxInventory} items available in stock for "${item.product.title}".`);
      
      // Auto-clear error after 2 seconds
      setTimeout(() => {
        setError(null);
      }, 2000);
      
      return;
    }

    setUpdating(prev => ({ ...prev, [itemId]: true }));

    try {
      if (newQuantity <= 0) {
        await apiService.removeFromCart(cart.id, itemId);
      } else {
        await apiService.updateCartItem(cart.id, itemId, newQuantity);
      }
      await loadCart(); // Refresh cart data
    } catch (error) {
      console.error('Error updating cart item:', error);
      setError('Failed to update cart item');

      // Auto-clear error after 2 seconds
      setTimeout(() => {
        setError(null);
      }, 2000);
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const removeItem = async (itemId: number) => {
    if (!cart) return;

    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await apiService.removeFromCart(cart.id, itemId);
      await loadCart();
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item from cart');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleCheckout = () => {
    if (isAuthenticated) {
      // Zalogowany użytkownik - przejdź do wyboru adresu
      navigate('/checkout/address');
    } else {
      // Gość - przejdź do checkout dla gości
      navigate('/checkout/guest');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(price);
  };

  const calculateDelivery = () => {
    if (!cart) return 15;
    return cart.total_price >= 250 ? 0 : 15;
  };

  const calculateGrandTotal = () => {
    if (!cart) return 0;
    return cart.total_price + calculateDelivery();
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          <Skeleton />
        </Typography>
        <Grid container spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingCartIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Add some products to your cart to get started
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Shopping Cart
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {cart.items.map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Typography variant="h6" component="h3">
                      {item.product.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatPrice(item.product.unit_price)} each
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        disabled={updating[item.id]}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        size="small"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          updateItemQuantity(item.id, value);
                        }}
                        sx={{ width: 60 }}
                        disabled={updating[item.id]}
                      />
                      <IconButton
                        size="small"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        disabled={updating[item.id]}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="h6" color="primary">
                      {formatPrice(item.total_price)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <IconButton
                      color="error"
                      onClick={() => removeItem(item.id)}
                      disabled={updating[item.id]}
                    >
                      {updating[item.id] ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Subtotal:</Typography>
                <Typography>{formatPrice(cart.total_price)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Shipping:</Typography>
                <Typography>
                  {calculateDelivery() === 0 ? 'Free' : formatPrice(calculateDelivery())}
                  {cart.total_price < 250 && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      Free shipping on orders over {formatPrice(250)}
                    </Typography>
                  )}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">
                  {formatPrice(calculateGrandTotal())}
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleCheckout}
                disabled={cart.items.length === 0}
              >
                {isAuthenticated ? 'Proceed to Checkout' : 'Checkout as Guest'}
              </Button>
              {!isAuthenticated && (
                <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                  You can checkout as a guest or{' '}
                  <Button 
                    variant="text" 
                    size="small" 
                    onClick={() => navigate('/auth')}
                    sx={{ p: 0, textTransform: 'none' }}
                  >
                    login
                  </Button>
                  {' '}for a faster experience
                </Typography>
              )}
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigate('/products')}
                sx={{ mt: 1 }}
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;