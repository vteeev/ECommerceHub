import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const isGuest = searchParams.get('guest') === 'true';

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !orderId) {
        setError('Brak wymaganych parametrów płatności');
        setLoading(false);
        return;
      }

      try {
        let responseData;
        
        if (isGuest) {
          // Use guest payment verification endpoint
          responseData = await apiService.verifyGuestPayment(sessionId, parseInt(orderId));
          setGuestEmail(responseData.guest_email || null);
        } else {
          // Use authenticated user payment verification endpoint
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/store/payment-success/?session_id=${sessionId}&order_id=${orderId}`, {
            method: 'GET',
            headers: {
              'Authorization': `JWT ${localStorage.getItem('access_token')}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Payment verification failed:', errorData);
            setError(errorData.error || 'Nie udało się potwierdzić płatności');
            return;
          }
          
          responseData = await response.json();
        }

        // Payment verified, clear localStorage
        localStorage.removeItem('cart_id');
        localStorage.removeItem('selectedAddressId');
        localStorage.removeItem('currentOrderId');
        
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setError(err.response?.data?.error || 'Wystąpił błąd podczas weryfikacji płatności');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, orderId]);

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const handleViewOrders = () => {
    navigate('/orders');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', mt: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Przetwarzanie płatności...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/cart')}>
          Wróć do koszyka
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <CheckCircleIcon 
          sx={{ 
            fontSize: 80, 
            color: 'success.main',
            mb: 2 
          }} 
        />
        
        <Typography variant="h4" gutterBottom color="success.main">
          Płatność zakończona pomyślnie!
        </Typography>
        
        <Typography variant="h6" color="textSecondary" sx={{ mb: 4 }}>
          Dziękujemy za zakup. Twoje zamówienie zostało przyjęte.
          {isGuest && ' Potwierdzenie zostanie wysłane na podany adres email.'}
        </Typography>

        <Card sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Szczegóły zamówienia
            </Typography>
            {orderId && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Numer zamówienia:</strong> #{orderId}
              </Typography>
            )}
            {guestEmail && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong> {guestEmail}
              </Typography>
            )}
            {sessionId && (
              <Typography variant="body2" color="textSecondary">
                <strong>ID sesji płatności:</strong> {sessionId}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 2 }}>
              {isGuest 
                ? 'Otrzymasz potwierdzenie zamówienia na podany adres email.'
                : 'Otrzymasz potwierdzenie zamówienia na adres email przypisany do Twojego konta.'
              }
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {!isGuest && isAuthenticated && (
            <Button
              variant="contained"
              onClick={handleViewOrders}
              size="large"
            >
              Zobacz moje zamówienia
            </Button>
          )}
          
          <Button
            variant={!isGuest && isAuthenticated ? "outlined" : "contained"}
            onClick={handleContinueShopping}
            size="large"
          >
            Kontynuuj zakupy
          </Button>
          
          {isGuest && (
            <Button
              variant="outlined"
              onClick={() => navigate('/auth')}
              size="large"
            >
              Załóż konto
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default CheckoutSuccess;
