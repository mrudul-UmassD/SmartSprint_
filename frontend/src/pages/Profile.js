import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  TextField,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// API URL
const API_URL = 'http://localhost:5000/api';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: '',
    bio: '',
    department: '',
    location: '',
    phone: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Stats state - in a real app, these would be fetched from API
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch the profile data from an API endpoint:
        // const response = await axios.get(`${API_URL}/users/${user.id}/profile`);
        // setProfileData(response.data.data);
        
        // For now, we'll use the user data from context
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          role: user.role || '',
          bio: user.bio || '',
          department: user.department || '',
          location: user.location || '',
          phone: user.phone || '',
        });
        
        // Mock stats data
        setStats({
          totalProjects: 5,
          completedProjects: 2,
          totalTasks: 18,
          completedTasks: 12,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data. Please try again.');
        setLoading(false);
      }
    };
    
    if (user) {
      fetchProfileData();
    }
  }, [user]);
  
  // Handle profile data change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };
  
  // Handle password data change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
    // Clear password error when user types
    if (passwordError) setPasswordError('');
  };
  
  // Toggle profile edit mode
  const toggleProfileEdit = () => {
    setIsEditingProfile(!isEditingProfile);
    if (!isEditingProfile) {
      // Entering edit mode, keep current values
    } else {
      // Exiting edit mode without saving, reset to original values
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        bio: user.bio || '',
        department: user.department || '',
        location: user.location || '',
        phone: user.phone || '',
      });
    }
  };
  
  // Toggle password edit mode
  const togglePasswordEdit = () => {
    setIsEditingPassword(!isEditingPassword);
    if (!isEditingPassword) {
      // Entering edit mode
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
    // Clear any existing errors
    setPasswordError('');
  };
  
  // Save profile data
  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // In a real app, you would send the updated profile data to an API endpoint:
      // const response = await axios.put(`${API_URL}/users/${user.id}/profile`, profileData);
      
      // Update user in auth context
      updateUser({
        ...user,
        ...profileData,
      });
      
      // Exit edit mode
      setIsEditingProfile(false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success',
      });
      
      setSaving(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
      setSaving(false);
    }
  };
  
  // Save new password
  const savePassword = async () => {
    // Validate passwords
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    try {
      setSaving(true);
      
      // In a real app, you would send the password data to an API endpoint:
      // await axios.put(`${API_URL}/users/${user.id}/password`, {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword,
      // });
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Exit edit mode
      setIsEditingPassword(false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Password updated successfully',
        severity: 'success',
      });
      
      setSaving(false);
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError('Failed to update password. Please check your current password and try again.');
      setSaving(false);
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };
  
  // Get avatar color based on name
  const getAvatarColor = (name) => {
    const colors = [
      '#1976d2', // blue
      '#388e3c', // green
      '#d32f2f', // red
      '#f57c00', // orange
      '#7b1fa2', // purple
      '#0097a7', // teal
      '#c2185b', // pink
      '#455a64', // blue-grey
    ];
    
    if (!name) return colors[0];
    
    // Simple hash function to get consistent color for a name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" fontWeight={600} sx={{ mb: 4 }}>
        My Profile
      </Typography>
      
      <Grid container spacing={4}>
        {/* Profile Information Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: getAvatarColor(profileData.name),
                    fontSize: '2rem',
                    mr: 3,
                  }}
                >
                  {getInitials(profileData.name)}
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {profileData.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {profileData.email}
                  </Typography>
                  <Chip
                    label={profileData.role}
                    size="small"
                    color={profileData.role === 'Admin' ? 'primary' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
              <Button
                variant={isEditingProfile ? 'outlined' : 'contained'}
                color={isEditingProfile ? 'error' : 'primary'}
                startIcon={isEditingProfile ? <CloseIcon /> : <EditIcon />}
                onClick={toggleProfileEdit}
                disabled={saving}
              >
                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile || saving}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile || saving}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!isEditingProfile || saving}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={profileData.role}
                    onChange={handleProfileChange}
                    label="Role"
                    disabled={true} // Role can't be changed by the user
                  >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Team Member">Team Member</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile || saving}
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={profileData.department}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile || saving}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={profileData.location}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile || saving}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile || saving}
                  variant="outlined"
                />
              </Grid>
            </Grid>
            
            {isEditingProfile && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Paper>
          
          {/* Password Section */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LockIcon fontSize="large" sx={{ color: 'primary.main', mr: 2 }} />
                <Typography variant="h6">Password</Typography>
              </Box>
              <Button
                variant={isEditingPassword ? 'outlined' : 'contained'}
                color={isEditingPassword ? 'error' : 'primary'}
                startIcon={isEditingPassword ? <CloseIcon /> : <VpnKeyIcon />}
                onClick={togglePasswordEdit}
                disabled={saving}
              >
                {isEditingPassword ? 'Cancel' : 'Change Password'}
              </Button>
            </Box>
            
            {passwordError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {passwordError}
              </Alert>
            )}
            
            {isEditingPassword ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={saving}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={saving}
                    required
                    variant="outlined"
                    helperText="Password must be at least 8 characters long"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={saving}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={savePassword}
                      disabled={saving}
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary">
                For security reasons, your password is hidden. Click "Change Password" to update your password.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Statistics and Activity Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Activity Statistics
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Projects
                  </Typography>
                  <Typography variant="h4">{stats.totalProjects}</Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completed Projects
                  </Typography>
                  <Typography variant="h4">{stats.completedProjects}</Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Tasks
                  </Typography>
                  <Typography variant="h4">{stats.totalTasks}</Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completed Tasks
                  </Typography>
                  <Typography variant="h4">{stats.completedTasks}</Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ '& > div': { mb: 2 } }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Account Created
                </Typography>
                <Typography variant="body1">
                  {new Date().toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Login
                </Typography>
                <Typography variant="body1">
                  {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Account Status
                </Typography>
                <Chip 
                  label="Active" 
                  color="success" 
                  size="small" 
                  sx={{ mt: 0.5 }} 
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile; 