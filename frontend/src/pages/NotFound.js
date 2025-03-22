import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Paper,
} from '@mui/material';
import {
  SentimentDissatisfied as SadIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={2}
        sx={{ 
          textAlign: 'center', 
          p: 6, 
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <SadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        
        <Typography variant="h4" component="h1" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/dashboard"
            startIcon={<DashboardIcon />}
            size="large"
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound; 