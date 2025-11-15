import React, { useEffect, useState } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Container,
  Chip,
  Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Product, Collection } from '../types/index';
import apiService from '../services/api';


const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, collectionsResponse] = await Promise.all([
          apiService.getProducts({ page: 1 }),
          apiService.getCollections(),
        ]);
        
        setFeaturedProducts(productsResponse.results.slice(0, 6));
        setCollections(collectionsResponse.slice(0, 4));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(price);
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h3" component="h1" gutterBottom>
          <Skeleton />
        </Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
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

  return (
    <Container>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4285f4 0%, #1a73e8 50%, #0d47a1 100%)',
          color: 'white',
          py: 12,
          px: 4,
          borderRadius: 4,
          mb: 8,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            Przyszłość zakupów
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
            Odkryj niesamowite produkty w immersyjnym doświadczeniu zakupowym
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/products')}
            sx={{ 
              mt: 2,
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Rozpocznij zakupy
          </Button>
        </Box>
      </Box>

      {/* Featured Products */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h2" component="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          Polecane produkty
        </Typography>
        <Grid container spacing={4}>
          {featuredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <CardMedia
                  component="img"
                  height="220"
                  image={product.images[0]?.image || '/placeholder-product.svg'}
                  alt={product.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography gutterBottom variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    {product.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    {product.collection}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                      {formatPrice(product.unit_price)}
                    </Typography>
                    <Chip
                      label={product.inventory > 0 ? 'Dostępny' : 'Wyprzedany'}
                      color={product.inventory > 0 ? 'success' : 'error'}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Collections */}
      <Box>
        <Typography variant="h2" component="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          Przeglądaj kategorie
        </Typography>
        <Grid container spacing={4}>
          {collections.map((collection) => (
            <Grid item xs={12} sm={6} md={3} key={collection.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => navigate(`/collections/${collection.id}`)}
              >
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    {collection.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {collection.products_count} produktów
                  </Typography>
                  <Box
                    sx={{
                      width: 60,
                      height: 4,
                      backgroundColor: 'primary.main',
                      margin: '0 auto',
                      borderRadius: 2,
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Home; 