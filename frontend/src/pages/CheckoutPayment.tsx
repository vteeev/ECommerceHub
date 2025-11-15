import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { Order, Address } from '../types';

const CheckoutPayment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get selected address and order from navigation state or localStorage
  const addressId = location.state?.selectedAddressId || localStorage.getItem('selectedAddressId');
  const orderId = location.state?.orderId || localStorage.getItem('currentOrderId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('CheckoutPayment - Starting fetch with:', { orderId, addressId });
        
        // If we don't have an order ID, create one from cart
        if (!orderId) {
          console.log('No orderId found, creating order from cart');
          const cartId = localStorage.getItem('cart_id');
          if (!cartId) {
            setError('Brak produktów w koszyku.');
            return;
          }
          
          // Create order from cart
          const newOrder = await apiService.createOrder(cartId);
          console.log('Created new order:', newOrder);
          setOrder(newOrder);
          localStorage.setItem('currentOrderId', newOrder.id.toString());
        } else {
          // Get existing order
          console.log('Fetching existing order with ID:', orderId);
          try {
            const orderData = await apiService.getOrder(parseInt(orderId));
            console.log('Fetched order data:', orderData);
            setOrder(orderData);
          } catch (orderError: any) {
            console.error('Error fetching order:', orderError);
            const errorMessage = orderError?.response?.data?.error || orderError?.message || 'Nieznany błąd';
            setError(`Nie udało się pobrać zamówienia: ${errorMessage}`);
            return;
          }
        }

        // Get selected address
        if (addressId) {
          const addressData = await apiService.getAddress(parseInt(addressId));
          setSelectedAddress(addressData);
        } else {
          setError('Nie wybrano adresu dostawy.');
        }
      } catch (err) {
        console.error('Failed to fetch checkout data:', err);
        setError('Nie udało się pobrać danych.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addressId, orderId]);

  const calculateTotal = () => {
    if (!order?.items) return 0;
    return order.items.reduce((total: number, item: any) => total + (item.unit_price * item.quantity), 0);
  };

  const calculateDelivery = () => {
    const subtotal = calculateTotal();
    return subtotal >= 250 ? 0 : 15;
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateDelivery();
  };

  const handlePayment = async () => {
    if (!order || !selectedAddress) {
      setError('Brakuje wymaganych danych do płatności.');
      return;
    }

    try {
      setProcessingPayment(true);
      setError(null);

      // Create Stripe checkout session
      const checkoutData = await apiService.createCheckoutSession({
        orderId: order.id,
        addressId: selectedAddress.id,
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutData.url;
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Wystąpił błąd podczas przetwarzania płatności.');
      console.error('Payment error:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleBackToAddress = () => {
    navigate('/checkout/address');
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    try {
      await apiService.cancelOrder(order.id);
      // Clear order from localStorage but keep cart
      localStorage.removeItem('currentOrderId');
      localStorage.removeItem('selectedAddressId');
      navigate('/cart');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError('Nie udało się anulować zamówienia');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!order || !order.items || order.items.length === 0) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Brak zamówienia lub produktów w zamówieniu.
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/products')}>
          Wróć do produktów
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Podsumowanie zamówienia
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Order Summary */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Produkty w zamówieniu
              </Typography>
              <List>
                {order.items.map((item: any) => (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={item.product.title}
                      secondary={`Ilość: ${item.quantity}`}
                    />
                    <Typography variant="body2">
                      {(item.unit_price * item.quantity).toFixed(2)} PLN
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {selectedAddress && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Adres dostawy
                </Typography>
                <Typography variant="body1">
                  {selectedAddress.street} {selectedAddress.house_number}
                  {selectedAddress.apartment_number && `/${selectedAddress.apartment_number}`}
                </Typography>
                <Typography variant="body1">
                  {selectedAddress.post_code} {selectedAddress.city}
                </Typography>
                <Button 
                  size="small" 
                  onClick={handleBackToAddress}
                  sx={{ mt: 1 }}
                >
                  Zmień adres
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Payment Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Podsumowanie
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Produkty:</Typography>
                  <Typography variant="body2">{calculateTotal().toFixed(2)} PLN</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Dostawa:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ color: calculateDelivery() === 0 ? 'success.main' : 'text.primary' }}
                  >
                    {calculateDelivery() === 0 ? 'DARMOWA' : `${calculateDelivery().toFixed(2)} PLN`}
                  </Typography>
                </Box>
                {calculateTotal() >= 250 && (
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', textAlign: 'right' }}>
                    Darmowa dostawa od 250 PLN!
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Razem:</Typography>
                <Typography variant="h6">
                  {calculateGrandTotal().toFixed(2)} PLN
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePayment}
                disabled={processingPayment || !selectedAddress}
                sx={{ mb: 2 }}
              >
                {processingPayment ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Przetwarzanie...
                  </>
                ) : (
                  'Zapłać i zamów'
                )}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleCancelOrder}
                disabled={processingPayment}
                sx={{ mb: 2 }}
              >
                Anuluj zamówienie
              </Button>

              <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', display: 'block' }}>
                Płatność jest bezpieczna i szyfrowana przez Stripe
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPayment;
