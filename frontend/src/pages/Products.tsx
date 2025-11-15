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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,

  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Product, Collection } from '../types/index';
import apiService from '../services/api';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState('title');
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const search = searchParams.get('search') || '';
    const collection = searchParams.get('collection_id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const ordering = searchParams.get('ordering') || 'title';

    setSearchQuery(search);
    setSelectedCollection(collection ? parseInt(collection) : '');
    setCurrentPage(page);
    setSortBy(ordering);

    fetchProducts({
      search,
      collection_id: collection ? parseInt(collection) : undefined,
      page,
      ordering,
    });
  }, [searchParams]);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchProducts = async (params: {
    search?: string;
    collection_id?: number;
    page?: number;
    ordering?: string;
  }) => {
    setLoading(true);
    try {
      const response = await apiService.getProducts(params);
      setProducts(response.results);
      setTotalPages(Math.ceil(response.count / 10)); // Assuming 10 items per page
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await apiService.getCollections();
      setCollections(response);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCollection) params.set('collection_id', selectedCollection.toString());
    if (sortBy !== 'title') params.set('ordering', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  const handleCollectionChange = (event: any) => {
    setSelectedCollection(event.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
    setCurrentPage(1);
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
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
          <Skeleton sx={{ bgcolor: '#2a2a2a' }} />
        </Typography>
        
        {/* Filter skeleton */}
        <Box sx={{ 
          mb: 6, 
          p: 4, 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          borderRadius: 3,
          border: '1px solid #2a2a2a',
        }}>
          <Skeleton variant="text" width={200} sx={{ bgcolor: '#2a2a2a', mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={56} sx={{ bgcolor: '#2a2a2a', borderRadius: 1 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Skeleton variant="rectangular" height={56} sx={{ bgcolor: '#2a2a2a', borderRadius: 1 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Skeleton variant="rectangular" height={56} sx={{ bgcolor: '#2a2a2a', borderRadius: 1 }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Skeleton variant="rectangular" height={56} sx={{ bgcolor: '#2a2a2a', borderRadius: 1 }} />
            </Grid>
          </Grid>
        </Box>

        {/* Products skeleton */}
        <Grid container spacing={4}>
          {[...Array(12)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card sx={{ 
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '16px',
              }}>
                <Skeleton variant="rectangular" height={220} sx={{ bgcolor: '#2a2a2a' }} />
                <CardContent>
                  <Skeleton variant="text" height={28} sx={{ bgcolor: '#2a2a2a', mb: 1 }} />
                  <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#2a2a2a', mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: '#2a2a2a' }} />
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ bgcolor: '#2a2a2a', borderRadius: 3 }} />
                  </Box>
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
      <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
        Produkty
      </Typography>

      {/* Filters */}
      <Box sx={{ 
        mb: 6, 
        p: 4, 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        borderRadius: 3,
        border: '1px solid #2a2a2a',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
          Filtry i wyszukiwanie
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Szukaj produktów"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0a0a0a',
                  '& fieldset': {
                    borderColor: '#4285f4',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6ba0ff',
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button 
                      onClick={handleSearch}
                      sx={{ 
                        minWidth: 'auto',
                        p: 1,
                        borderRadius: '50%',
                        '&:hover': {
                          backgroundColor: 'rgba(66, 133, 244, 0.1)',
                        },
                      }}
                    >
                      <SearchIcon />
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'text.primary' }}>Kategoria</InputLabel>
              <Select
                value={selectedCollection}
                label="Kategoria"
                onChange={handleCollectionChange}
                sx={{
                  backgroundColor: '#0a0a0a',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4285f4',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6ba0ff',
                  },
                }}
              >
                <MenuItem value="">Wszystkie kategorie</MenuItem>
                {collections.map((collection) => (
                  <MenuItem key={collection.id} value={collection.id}>
                    {collection.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'text.primary' }}>Sortuj według</InputLabel>
              <Select 
                value={sortBy} 
                label="Sortuj według" 
                onChange={handleSortChange}
                sx={{
                  backgroundColor: '#0a0a0a',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4285f4',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6ba0ff',
                  },
                }}
              >
                <MenuItem value="title">Nazwa</MenuItem>
                <MenuItem value="unit_price">Cena: od najniższej</MenuItem>
                <MenuItem value="-unit_price">Cena: od najwyższej</MenuItem>
                <MenuItem value="last_update">Najnowsze</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              sx={{ 
                py: 2,
                fontWeight: 600,
                background: 'linear-gradient(45deg, #4285f4 30%, #6ba0ff 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1a73e8 30%, #4285f4 90%)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Zastosuj filtry
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#4285f4',
                  boxShadow: '0 8px 30px rgba(66, 133, 244, 0.2)',
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <CardMedia
                component="img"
                height="220"
                image={product.images[0]?.image || '/placeholder-product.svg'}
                alt={product.title}
                sx={{ objectFit: 'cover', borderRadius: '16px 16px 0 0' }}
              />
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography gutterBottom variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  {product.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  {product.collection}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                    {formatPrice(product.unit_price)}
                  </Typography>
                  <Chip
                    label={product.inventory > 0 ? 'Dostępny' : 'Wyprzedany'}
                    color={product.inventory > 0 ? 'success' : 'error'}
                    size="small"
                    sx={{ 
                      fontWeight: 500,
                      borderRadius: '12px',
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: '#2a2a2a',
                },
                '&.Mui-selected': {
                  backgroundColor: '#4285f4',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1a73e8',
                  },
                },
              },
            }}
          />
        </Box>
      )}

      {products.length === 0 && !loading && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 12,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          borderRadius: 3,
          border: '1px solid #2a2a2a',
        }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Nie znaleziono produktów
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Spróbuj zmienić kryteria wyszukiwania lub filtry.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Products; 