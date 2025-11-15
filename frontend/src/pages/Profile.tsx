import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  LocationOn as LocationIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Customer, Address } from '../types';

interface ProfileFormData {
  email: string;
  password: string;
  phone: string;
}

interface AddressFormData {
  street: string;
  city: string;
  post_code: string; // ✨ DODANE POLE: post_code
  house_number: number;
  apartment_number?: number;
}

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    email: '',
    password: '',
    phone: '',
  });
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    street: '',
    city: '',
    post_code: '', // ✨ DODANE POLE: post_code
    house_number: 1,
    apartment_number: undefined,
  });

  // Dialog states
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Edit states
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    }
  }, [isAuthenticated]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [customerData, addressesData] = await Promise.all([
        apiService.getCurrentCustomer(),
        apiService.getAddresses(),
      ]);
      setCustomer(customerData);
      setAddresses(addressesData);
      setProfileForm({
        email: user?.email || '',
        password: '',
        phone: customerData.phone || '',
      });
    } catch (err) {
      setError('Failed to fetch profile data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      if (customer) {
        if (editingPhone) {
          await apiService.updateCurrentCustomer({
            phone: profileForm.phone,
          });
        }
        
        if (editingPassword && profileForm.password) {
          await apiService.changePassword(profileForm.password);
        }
        
        setSuccess('Profile updated successfully');
        setEditingPassword(false);
        setEditingPhone(false);
        setProfileForm({ ...profileForm, password: '' });
        fetchProfileData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleAddressSubmit = async () => {
    try {
      const addressData = {
        street: addressForm.street,
        city: addressForm.city,
        post_code: addressForm.post_code, // ✨ DODANE POLE: post_code
        house_number: addressForm.house_number,
        apartment_number: addressForm.apartment_number === undefined ? null : addressForm.apartment_number,
      };

      console.log('Sending address data:', addressData);

      if (editingAddress) {
        await apiService.updateAddress(editingAddress.id, addressData);
      } else {
        await apiService.createAddress(addressData);
      }
      setOpenAddressDialog(false);
      setEditingAddress(null);
      setAddressForm({ street: '', city: '', house_number: 1, apartment_number: undefined, post_code: '' }); // ✨ ZRESETOWANIE: post_code
      setSuccess('Address saved successfully');
      fetchProfileData();
    } catch (err: any) {
      console.error('Address error:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save address');
    }
  };

  const handleAddressDelete = async (addressId: number) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await apiService.deleteAddress(addressId);
        setSuccess('Address deleted successfully');
        fetchProfileData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete address');
      }
    }
  };

  const handleAddressEdit = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      street: address.street,
      city: address.city,
      post_code: address.post_code, // ✨ DODANE POLE: post_code
      house_number: address.house_number,
      apartment_number: address.apartment_number,
    });
    setOpenAddressDialog(true);
  };

  const handleAddressAdd = () => {
    setEditingAddress(null);
    setAddressForm({ street: '', city: '', house_number: 1, apartment_number: undefined, post_code: '' }); // ✨ ZRESETOWANIE: post_code
    setOpenAddressDialog(true);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Typography variant="h4" align="center" sx={{ mt: 4 }}>
          Please log in to view your profile
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom align="center">
        My Profile
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

      <Grid container spacing={4}>
        {/* Account Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<PersonIcon color="primary" />}
              title="Account Details"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Box component="form" sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileForm.email}
                  margin="normal"
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={editingPassword ? profileForm.password : '••••••••'}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    disabled={!editingPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                           {/* Tutaj możesz dodać przycisk do pokazywania hasła */}
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => setEditingPassword(!editingPassword)}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <EditIcon />
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={editingPhone ? profileForm.phone : '••••••••••'}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    disabled={!editingPhone}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => setEditingPhone(!editingPhone)}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <EditIcon />
                  </Button>
                </Box>

                {(editingPassword || editingPhone) && (
                  <Button
                    variant="contained"
                    onClick={handleProfileUpdate}
                    sx={{ mt: 2 }}
                  >
                    Save Changes
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Methods */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<PaymentIcon color="primary" />}
              title="Payment Methods"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                No payment methods added yet.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                disabled
              >
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Addresses */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<LocationIcon color="primary" />}
              title="Delivery Addresses"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddressAdd}
                >
                  Add Address
                </Button>
              }
            />
            <CardContent>
              {addresses.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No addresses added yet.
                </Typography>
              ) : (
                <List>
                  {addresses.map((address) => (
                    <ListItem key={address.id} divider>
                      <ListItemText
                        primary={`${address.street} ${address.house_number}${address.apartment_number ? `/${address.apartment_number}` : ''}, ${address.post_code} ${address.city}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleAddressEdit(address)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleAddressDelete(address.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Address Dialog */}
      <Dialog open={openAddressDialog} onClose={() => setOpenAddressDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Street"
            value={addressForm.street}
            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="City"
            value={addressForm.city}
            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Post Code" // ✨ DODANE POLE W FORMULARZU
            value={addressForm.post_code}
            onChange={(e) => setAddressForm({ ...addressForm, post_code: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="House Number"
            type="number"
            value={addressForm.house_number}
            onChange={(e) => setAddressForm({ ...addressForm, house_number: parseInt(e.target.value) || 1 })}
            margin="normal"
            inputProps={{ min: 1 }}
          />
          <TextField
            fullWidth
            label="Apartment Number (optional)"
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
          <Button onClick={() => setOpenAddressDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddressSubmit} variant="contained">
            {editingAddress ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;