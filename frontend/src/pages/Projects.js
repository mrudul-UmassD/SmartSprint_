import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  CircularProgress,
  Chip,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

// API URL
const API_URL = 'http://localhost:5000/api';

// Project status options
const PROJECT_STATUS_OPTIONS = [
  'Not Started',
  'In Planning',
  'Active',
  'Paused',
  'Completed',
  'Archived',
];

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'Not Started',
  });
  
  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/projects`);
        setProjects(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      // Search filter
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter
      const matchesStatus = filterStatus ? project.status === filterStatus : true;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by date (newest/oldest)
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      // Sort by name (a-z/z-a)
      else if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });
  
  // Handle project click
  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };
  
  // Handle open dialog
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  
  // Handle close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Reset form
    setNewProject({
      name: '',
      description: '',
      status: 'Not Started',
    });
    setError('');
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({
      ...newProject,
      [name]: value,
    });
    // Clear error when user types
    if (error) setError('');
  };
  
  // Handle create project
  const handleCreateProject = async () => {
    // Validate form
    if (!newProject.name.trim()) {
      setError('Project name is required');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await axios.post(`${API_URL}/projects`, newProject);
      
      // Add the new project to the list
      setProjects([response.data.data, ...projects]);
      
      // Close dialog
      handleCloseDialog();
      
      // Navigate to the new project
      navigate(`/projects/${response.data.data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.response?.data?.message || 'Failed to create project. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Not Started':
        return '#9e9e9e';
      case 'In Planning':
        return '#673ab7';
      case 'Active':
        return '#2196f3';
      case 'Paused':
        return '#ff9800';
      case 'Completed':
        return '#4caf50';
      case 'Archived':
        return '#607d8b';
      default:
        return '#9e9e9e';
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Projects
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Create Project
            </Button>
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          View and manage all your projects.
        </Typography>
      </Box>
      
      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Filter by Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="small"
              SelectProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {PROJECT_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="small"
              SelectProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SortIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="name-asc">Name (A-Z)</MenuItem>
              <MenuItem value="name-desc">Name (Z-A)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
                setSortBy('newest');
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Projects List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredProjects.length > 0 ? (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} md={4} key={project.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(project.status),
                        color: 'white',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {project.description
                      ? project.description.length > 150
                        ? `${project.description.substring(0, 150)}...`
                        : project.description
                      : 'No description available.'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Created by:
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {project.creator_name || 'Unknown'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button
                    fullWidth
                    onClick={() => handleProjectClick(project.id)}
                  >
                    View Project
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || filterStatus
              ? 'No projects match your search criteria. Try changing your filters.'
              : 'You have no projects yet. Create your first project to get started.'}
          </Typography>
          {isAdmin && !searchQuery && !filterStatus && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Create Project
            </Button>
          )}
        </Paper>
      )}
      
      {/* Create Project Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Fill in the details below to create a new project.
          </DialogContentText>
          {error && (
            <Box sx={{ mb: 2, color: 'error.main', typography: 'body2' }}>
              {error}
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Project Name"
            type="text"
            fullWidth
            value={newProject.name}
            onChange={handleInputChange}
            required
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            value={newProject.description}
            onChange={handleInputChange}
            variant="outlined"
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            name="status"
            label="Status"
            fullWidth
            value={newProject.status}
            onChange={handleInputChange}
            variant="outlined"
          >
            {PROJECT_STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained" 
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Projects; 