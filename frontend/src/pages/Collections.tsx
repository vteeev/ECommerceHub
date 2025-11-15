import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Skeleton,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Collection } from '../types/index';
import apiService from '../services/api';

const Collections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await apiService.getCollections();
      setCollections(response);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionClick = (collectionId: number) => {
    navigate(`/products?collection_id=${collectionId}`);
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
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
      <Typography variant="h4" component="h1" gutterBottom>
        Collections
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Browse our product collections and discover amazing items in each category.
      </Typography>

      <Grid container spacing={3}>
        {collections.map((collection) => (
          <Grid item xs={12} sm={6} md={4} key={collection.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
              }}
              onClick={() => handleCollectionClick(collection.id)}
            >
              <CardMedia
                component="img"
                height="200"
                image={collection.featured_product?.images[0]?.image || '/placeholder-product.svg'}
                alt={collection.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {collection.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {collection.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={`${collection.products_count || 0} products`} 
                    size="small" 
                    color="primary" 
                  />
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCollectionClick(collection.id);
                    }}
                  >
                    Browse
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {collections.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No collections found.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Collections; 