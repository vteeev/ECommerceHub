import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
  Card,
  CardContent,
  Grid,
  CircularProgress,
} from '@mui/material';
import { apiService } from '../services/api';

interface GuestFormData {
  guest_email: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_phone: string;
  street: string;
  house_number: number;
  apartment_number?: number;
  city: string;
  post_code: string;
}

const GuestCheckout: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<GuestFormData>({
    guest_email: '',
    guest_first_name: '',
    guest_last_name: '',
    guest_phone: '',
    street: '',
    house_number: 1,
    apartment_number: undefined,
    city: '',
    post_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof GuestFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'house_number' || field === 'apartment_number'
        ? value === '' ? undefined : parseInt(value)
        : value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.guest_email || !formData.guest_first_name || !formData.guest_last_name || 
          !formData.guest_phone || !formData.street || !formData.city || !formData.post_code) {
        setError('Wszystkie pola są wymagane.');
        return;
      }

      const cartId = localStorage.getItem('cart_id');
      console.log('Guest checkout - cart_id from localStorage:', cartId);
      
      if (!cartId) {
        setError('Brak produktów w koszyku. Dodaj produkty do koszyka przed składaniem zamówienia.');
        return;
      }

      console.log('Creating guest order with data:', {
        cart_id: cartId,
        ...formData
      });

      // Create guest order
      const order = await apiService.createGuestOrder({
        cart_id: cartId,
        ...formData
      });

      console.log('Guest order created:', order);

      // Create Stripe checkout session
      const session = await apiService.createGuestCheckoutSession({
        orderId: order.id
      });

      console.log('Guest checkout session created:', session);

      // Redirect to Stripe
      window.location.href = session.url;

    } catch (err: any) {
      console.error('Guest checkout error:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || err.message || 'Wystąpił błąd podczas składania zamówienia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Checkout jako gość
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dane osobowe
              </Typography>
              
              <TextField
                fullWidth
                label="Imię"
                value={formData.guest_first_name}
                onChange={handleInputChange('guest_first_name')}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Nazwisko"
                value={formData.guest_last_name}
                onChange={handleInputChange('guest_last_name')}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.guest_email}
                onChange={handleInputChange('guest_email')}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Telefon"
                value={formData.guest_phone}
                onChange={handleInputChange('guest_phone')}
                margin="normal"
                required
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Adres dostawy
              </Typography>
              
              <TextField
                fullWidth
                label="Ulica"
                value={formData.street}
                onChange={handleInputChange('street')}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Numer domu"
                type="number"
                value={formData.house_number || ''}
                onChange={handleInputChange('house_number')}
                margin="normal"
                required
                inputProps={{ min: 1 }}
              />
              
              <TextField
                fullWidth
                label="Numer mieszkania (opcjonalnie)"
                type="number"
                value={formData.apartment_number || ''}
                onChange={handleInputChange('apartment_number')}
                margin="normal"
                inputProps={{ min: 1 }}
              />
              
              <TextField
                fullWidth
                label="Miasto"
                value={formData.city}
                onChange={handleInputChange('city')}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Kod pocztowy"
                value={formData.post_code}
                onChange={handleInputChange('post_code')}
                margin="normal"
                required
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/cart')}
          disabled={loading}
        >
          Powrót do koszyka
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Składanie zamówienia...' : 'Złóż zamówienie i zapłać'}
        </Button>
      </Box>
    </Container>
  );
};

export default GuestCheckout;
