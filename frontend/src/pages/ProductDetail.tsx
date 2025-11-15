import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  Button,
  Box,
  Chip,
  Skeleton,
  TextField,
  Alert,

  Divider,
} from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { Product } from '../types/index';
import apiService from '../services/api';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
    }
  }, [id]);

  const fetchProduct = async (productId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getProduct(productId);
      setProduct(response);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      await apiService.addToCart(product.id, quantity);
      // Możesz dodać powiadomienie o sukcesie
      alert('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add product to cart');
    } finally {
      setAddingToCart(false);
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
      <Container>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={40} />
            <Skeleton variant="text" height={100} />
            <Skeleton variant="rectangular" height={50} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Product not found'}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/products')}
          sx={{ mt: 2 }}
        >
          Back to Products
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Button 
        variant="outlined" 
        onClick={() => navigate('/products')}
        sx={{ mb: 3 }}
      >
        ← Back to Products
      </Button>

      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={product.images[0]?.image || '/placeholder-product.svg'}
              alt={product.title}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {product.title}
          </Typography>
          
          <Typography variant="h5" color="primary" gutterBottom>
            {formatPrice(product.unit_price)}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Chip
              label={product.inventory > 0 ? 'In Stock' : 'Out of Stock'}
              color={product.inventory > 0 ? 'success' : 'error'}
              sx={{ mr: 1 }}
            />
            <Chip label={product.collection} variant="outlined" />
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            {product.description}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Add to Cart Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quantity
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, max: product.inventory }}
                sx={{ width: 100 }}
              />
              <Typography variant="body2" color="text.secondary">
                {product.inventory} available
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingCartIcon />}
              onClick={handleAddToCart}
              disabled={product.inventory === 0 || addingToCart}
              fullWidth
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          </Box>

          {/* Product Info */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Product Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>SKU:</strong> {product.id}<br />
              <strong>Category:</strong> {product.collection}<br />
              <strong>Last Updated:</strong> {new Date(product.last_update).toLocaleDateString()}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetail; 