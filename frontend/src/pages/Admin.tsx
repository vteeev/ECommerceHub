import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, CircularProgress } from '@mui/material';

const Admin: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Automatyczne przekierowanie do Django admina dla użytkowników staff
    if (isAuthenticated && user?.is_staff) {
      window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/admin/`;
    }
  }, [isAuthenticated, user]);

  // Jeśli użytkownik nie jest zalogowany lub nie jest staff, przekieruj do loginu
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jeśli użytkownik nie jest staff, przekieruj do strony głównej
  if (!user?.is_staff) {
    return <Navigate to="/" replace />;
  }

  // Pokazuj loading podczas przekierowania
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Przekierowywanie do panelu administracyjnego...
      </Typography>
    </Box>
  );
};

export default Admin; 