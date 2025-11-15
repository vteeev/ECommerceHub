import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Container,
  InputBase,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { styled, alpha } from '@mui/material/styles';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();



  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOrders = () => {
    navigate('/orders');
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 0, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            InternetShop
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, ml: 4 }}>
            {isAuthenticated && (
              <Button
                color="inherit"
                onClick={() => navigate('/dashboard')}
                sx={{ textTransform: 'none' }}
              >
                Dashboard
              </Button>
            )}
            <Button
              color="inherit"
              onClick={() => navigate('/products')}
              sx={{ textTransform: 'none' }}
            >
              Produkty
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/collections')}
              sx={{ textTransform: 'none' }}
            >
              Kolekcje
            </Button>
            {isAuthenticated && user?.is_staff && (
              <Button
                color="inherit"
                onClick={() => navigate('/admin')}
                sx={{ textTransform: 'none' }}
              >
                Admin
              </Button>
            )}
          </Box>

          <Search>
            <form onSubmit={handleSearch}>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Szukaj produktów..."
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </Search>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={handleCartClick}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={0} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>

            {isAuthenticated ? (
              <>
                <IconButton
                  color="inherit"
                  onClick={handleMenuOpen}
                >
                  <PersonIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                    Profil
                  </MenuItem>
                  <MenuItem onClick={() => { handleOrders(); navigate('/orders'); }}>
                    Moje zamówienia
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    Wyloguj
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none' }}
              >
                Zaloguj
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 