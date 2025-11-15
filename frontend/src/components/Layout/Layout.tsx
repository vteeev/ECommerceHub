import React, { useEffect } from 'react';
import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4285f4', // Meta blue
      light: '#6ba0ff',
      dark: '#1a73e8',
    },
    secondary: {
      main: '#ff4081',
      light: '#ff79b0',
      dark: '#c60055',
    },
    background: {
      default: '#0a0a0a', // Very dark background
      paper: '#1a1a1a', // Dark card background
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '24px',
          padding: '12px 24px',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(66, 133, 244, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #4285f4 30%, #6ba0ff 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1a73e8 30%, #4285f4 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            borderColor: '#4285f4',
            boxShadow: '0 8px 30px rgba(66, 133, 244, 0.2)',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: '2rem',
          paddingBottom: '2rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #2a2a2a',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
  },
});

const Layout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect admin users to admin panel from main site pages
  useEffect(() => {
    if (isAuthenticated && user?.is_staff && location.pathname !== '/admin') {
      // Only redirect if not already on admin page and not on login/register pages
      if (!location.pathname.startsWith('/admin') && 
          !location.pathname.startsWith('/login') && 
          !location.pathname.startsWith('/register') &&
          !location.pathname.startsWith('/checkout/success')) {
        navigate('/admin');
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  useEffect(() => {
        // Don't sync cart on checkout success page to avoid interference
        if (location.pathname.startsWith('/checkout/success')) {
            return;
        }

        const syncCart = async () => {
            if (!isAuthenticated) {
                // For guests, keep the cart_id if it exists
                // Don't remove it automatically
                console.log('Guest user - keeping existing cart_id:', localStorage.getItem('cart_id'));
                return;
            }

            // Pobierz token z localStorage
            const token = localStorage.getItem('access_token');
            if (!token) {
                // Jeśli tokena nie ma, nie możemy uwierzytelnić żądania
                console.error('Brak tokena uwierzytelnienia.');
                return;
            }

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/store/customers/me/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // DODAJ NAGŁÓWEK AUTORYZACJI Z TOKENEM
                        'Authorization': `JWT ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                const permanentCartId = data?.cart_id;
                if (permanentCartId) {
                    localStorage.setItem('cart_id', permanentCartId);
                    console.log('cart_id synchronized:', permanentCartId);
                } else {
                    localStorage.removeItem('cart_id');
                    console.log('cart_id removed');
                }

            } catch (error) {
                console.error('Cart sync failed:', error);
                localStorage.removeItem('cart_id');
            }
        };

        syncCart();
    }, [isAuthenticated, user?.id, location.pathname]);


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Container component="main" maxWidth="xl" sx={{ flexGrow: 1, py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;