import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ShoppingBag,
  TrendingUp,
  Star,
  ArrowForward,
  Notifications,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  favoriteProducts: number;
  recentActivity: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSpent: 0,
    favoriteProducts: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user orders and calculate stats
      const orders = await apiService.getOrders();
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.total_price, 0);
      
      setStats({
        totalOrders,
        totalSpent,
        favoriteProducts: 12, // Mock data
        recentActivity: 5, // Mock data
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(price);
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Ładowanie...
          </Typography>
        </Box>
      </Container>
    );
  }

  const statCards = [
    {
      title: 'Łączne zamówienia',
      value: stats.totalOrders,
      icon: <ShoppingBag />,
      color: '#4285f4',
      gradient: 'linear-gradient(135deg, #4285f4 0%, #6ba0ff 100%)',
    },
    {
      title: 'Wydane środki',
      value: formatPrice(stats.totalSpent),
      icon: <TrendingUp />,
      color: '#34a853',
      gradient: 'linear-gradient(135deg, #34a853 0%, #7cb342 100%)',
    },
    {
      title: 'Ulubione produkty',
      value: stats.favoriteProducts,
      icon: <Star />,
      color: '#fbbc04',
      gradient: 'linear-gradient(135deg, #fbbc04 0%, #fdd835 100%)',
    },
    {
      title: 'Aktywność',
      value: `${stats.recentActivity} dni temu`,
      icon: <Notifications />,
      color: '#ea4335',
      gradient: 'linear-gradient(135deg, #ea4335 0%, #ff6b6b 100%)',
    },
  ];

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #4285f4 0%, #6ba0ff 100%)',
                fontSize: '2rem',
                fontWeight: 600,
              }}
            >
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                Witaj, {user?.first_name || user?.username}!
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Zarządzaj swoim kontem i przeglądaj statystyki
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => navigate('/profile')}
            sx={{
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%)',
              },
            }}
          >
            <Settings />
          </IconButton>
        </Box>
        
        {/* Progress bar for user level (mock) */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Poziom użytkownika
            </Typography>
            <Typography variant="body2" color="primary">
              Level 3 - Premium
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={75}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#2a2a2a',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #4285f4 0%, #6ba0ff 100%)',
                borderRadius: 4,
              },
            }}
          />
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: 160,
                background: stat.gradient,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  transform: 'translate(30px, -30px)',
                },
              }}
            >
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ opacity: 0.8, zIndex: 1 }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Szybkie akcje
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<ShoppingBag />}
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/products')}
                  sx={{
                    py: 2,
                    justifyContent: 'space-between',
                    borderColor: '#4285f4',
                    '&:hover': {
                      background: 'rgba(66, 133, 244, 0.1)',
                      borderColor: '#4285f4',
                    },
                  }}
                >
                  Przeglądaj produkty
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Star />}
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/orders')}
                  sx={{
                    py: 2,
                    justifyContent: 'space-between',
                    borderColor: '#34a853',
                    color: '#34a853',
                    '&:hover': {
                      background: 'rgba(52, 168, 83, 0.1)',
                      borderColor: '#34a853',
                    },
                  }}
                >
                  Moje zamówienia
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Notifications />}
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/collections')}
                  sx={{
                    py: 2,
                    justifyContent: 'space-between',
                    borderColor: '#fbbc04',
                    color: '#fbbc04',
                    '&:hover': {
                      background: 'rgba(251, 188, 4, 0.1)',
                      borderColor: '#fbbc04',
                    },
                  }}
                >
                  Kolekcje
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Settings />}
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/profile')}
                  sx={{
                    py: 2,
                    justifyContent: 'space-between',
                    borderColor: '#ea4335',
                    color: '#ea4335',
                    '&:hover': {
                      background: 'rgba(234, 67, 53, 0.1)',
                      borderColor: '#ea4335',
                    },
                  }}
                >
                  Ustawienia profilu
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 4, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Status konta
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Chip
                label="Konto zweryfikowane"
                color="success"
                sx={{ mb: 2, fontWeight: 500 }}
              />
              <Typography variant="body2" color="text.secondary">
                Twoje konto jest w pełni zweryfikowane i gotowe do użytku.
              </Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Członek od:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('pl-PL') : 'Niedostępne'}
              </Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/profile')}
              sx={{ mt: 2 }}
            >
              Zarządzaj kontem
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
