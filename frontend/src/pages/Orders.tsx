import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types/index';
import apiService from '../services/api';

const Orders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getOrders();
      setOrders(response);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === null || price === undefined) {
      return 'N/A';
    }
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!isAuthenticated) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 4 }}>
          Please log in to view your orders.
        </Alert>
      </Container>
    );
  }

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
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={fetchOrders}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        My Orders
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        View your order history and track your purchases.
      </Typography>

      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No orders found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You haven't placed any orders yet.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Order #{order.id}
                    </Typography>
                    <Chip 
                      label={order.payment_status} 
                      color={getStatusColor(order.payment_status)}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Placed on: {new Date(order.placed_at).toLocaleDateString()}
                  </Typography>

                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product.title}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatPrice(item.unit_price)}</TableCell>
                            <TableCell align="right">{formatPrice(item.unit_price * item.quantity)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3}>
                            <Typography variant="subtitle2">
                              <strong>Total</strong>
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2">
                              <strong>{formatPrice(order.total_price)}</strong>
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Orders; 