import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { apiService } from '../services/api';
import { Address } from '../types';

interface AddressFormData {
  street: string;
  city: string;
  post_code: string;
  house_number: number;
  apartment_number?: number;
}

const CheckoutAddress: React.FC = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    street: '',
    city: '',
    post_code: '',
    house_number: 1,
    apartment_number: undefined,
  });
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const addressesData = await apiService.getAddresses();
      setAddresses(addressesData);
    } catch (err) {
      setError('Nie udało się pobrać adresów.');
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddressSubmit = async () => {
    try {
      const addressData = {
        street: addressForm.street,
        city: addressForm.city,
        post_code: addressForm.post_code,
        house_number: addressForm.house_number,
        apartment_number: addressForm.apartment_number === undefined ? null : addressForm.apartment_number,
      };

      if (editingAddress) {
        await apiService.updateAddress(editingAddress.id, addressData);
        setSuccess('Adres zaktualizowany pomyślnie!');
      } else {
        await apiService.createAddress(addressData);
        setSuccess('Adres dodany pomyślnie!');
      }

      setOpenAddressDialog(false);
      setEditingAddress(null);
      setAddressForm({ street: '', city: '', post_code: '', house_number: 1, apartment_number: undefined });
      fetchAddresses();
    } catch (err) {
      setError('Nie udało się zapisać adresu.');
      console.error('Failed to save address:', err);
    }
  };

  const handleAddressDelete = async (addressId: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten adres?')) {
      try {
        await apiService.deleteAddress(addressId);
        setSuccess('Adres usunięty pomyślnie.');
        fetchAddresses();
      } catch (err) {
        setError('Nie udało się usunąć adresu.');
        console.error('Failed to delete address:', err);
      }
    }
  };

  const handleAddressEdit = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      street: address.street,
      city: address.city,
      post_code: address.post_code,
      house_number: address.house_number,
      apartment_number: address.apartment_number,
    });
    setOpenAddressDialog(true);
  };

  const handleAddressAdd = () => {
    setEditingAddress(null);
    setAddressForm({ street: '', city: '', post_code: '', house_number: 1, apartment_number: undefined });
    setOpenAddressDialog(true);
  };

  const handleSelect = (id: number) => setSelectedAddressId(id);

  const handleContinue = async () => {
    if (selectedAddressId) {
      console.log('Wybrano adres o ID:', selectedAddressId);
      
      try {
        // Create order from cart before going to payment
        const cartId = localStorage.getItem('cart_id');
        if (!cartId) {
          setError('Brak produktów w koszyku.');
          return;
        }
        
        const order = await apiService.createOrder(cartId);
        
        // Save selected address and order ID
        localStorage.setItem('selectedAddressId', selectedAddressId.toString());
        localStorage.setItem('currentOrderId', order.id.toString());
        
        navigate('/checkout/payment', { 
          state: { 
            selectedAddressId,
            orderId: order.id
          } 
        });
      } catch (err) {
        setError('Nie udało się utworzyć zamówienia.');
        console.error('Failed to create order:', err);
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Wybierz adres dostawy
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {addresses.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          Brak dodanych adresów. Dodaj adres, aby kontynuować.
        </Typography>
      ) : (
        <List>
          {addresses.map((address) => (
            <ListItem
              key={address.id}
              selected={selectedAddressId === address.id}
              button
              onClick={() => handleSelect(address.id)}
            >
              <ListItemText
                primary={`${address.street} ${address.house_number}${address.apartment_number ? `/${address.apartment_number}` : ''}, ${address.post_code} ${address.city}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={(e) => { e.stopPropagation(); handleAddressEdit(address); }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => { e.stopPropagation(); handleAddressDelete(address.id); }}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddressAdd}
        >
          Dodaj nowy adres
        </Button>
      </Box>

      <Button
        sx={{ mt: 3 }}
        variant="contained"
        disabled={selectedAddressId === null}
        onClick={handleContinue}
      >
        Kontynuuj
      </Button>
      

      <Dialog open={openAddressDialog} onClose={() => setOpenAddressDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAddress ? 'Edytuj adres' : 'Dodaj nowy adres'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Ulica"
            value={addressForm.street}
            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Miasto"
            value={addressForm.city}
            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Kod pocztowy"
            value={addressForm.post_code}
            onChange={(e) => setAddressForm({ ...addressForm, post_code: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Numer domu"
            type="number"
            value={addressForm.house_number}
            onChange={(e) => setAddressForm({ ...addressForm, house_number: parseInt(e.target.value) || 1 })}
            margin="normal"
            inputProps={{ min: 1 }}
          />
          <TextField
            fullWidth
            label="Numer mieszkania (opcjonalnie)"
            type="number"
            value={addressForm.apartment_number || ''}
            onChange={(e) => setAddressForm({
              ...addressForm,
              apartment_number: e.target.value ? parseInt(e.target.value) : undefined
            })}
            margin="normal"
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddressDialog(false)}>Anuluj</Button>
          <Button onClick={handleAddressSubmit} variant="contained">
            {editingAddress ? 'Zapisz zmiany' : 'Dodaj'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CheckoutAddress;