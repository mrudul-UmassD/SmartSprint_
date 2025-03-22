import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
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
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
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

// Task priority options
const TASK_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  
  // Edit project state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editProject, setEditProject] = useState({
    name: '',
    description: '',
    status: '',
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  
  // Delete project state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // Add task state
  const [openAddTaskDialog, setOpenAddTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Not Started',
    priority: 'Medium',
    dueDate: '',
  });
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskError, setTaskError] = useState('');
  
  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch project and tasks
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        // Fetch project details
        const projectResponse = await axios.get(`${API_URL}/projects/${projectId}`);
        setProject(projectResponse.data.data);
        
        // Set up edit form with current values
        setEditProject({
          name: projectResponse.data.data.name,
          description: projectResponse.data.data.description || '',
          status: projectResponse.data.data.status,
        });
        
        // Fetch tasks for this project
        const tasksResponse = await axios.get(`${API_URL}/projects/${projectId}/tasks`);
        setTasks(tasksResponse.data.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError(error.response?.data?.message || 'Failed to load project. Please try again.');
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
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
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low':
        return '#8bc34a';
      case 'Medium':
        return '#ff9800';
      case 'High':
        return '#f44336';
      case 'Urgent':
        return '#9c27b0';
      default:
        return '#9e9e9e';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Handle edit dialog
  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    // Reset form to current values
    if (project) {
      setEditProject({
        name: project.name,
        description: project.description || '',
        status: project.status,
      });
    }
    setError('');
  };
  
  // Handle delete dialog
  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };
  
  // Handle add task dialog
  const handleOpenAddTaskDialog = () => {
    setOpenAddTaskDialog(true);
  };
  
  const handleCloseAddTaskDialog = () => {
    setOpenAddTaskDialog(false);
    // Reset form
    setNewTask({
      title: '',
      description: '',
      status: 'Not Started',
      priority: 'Medium',
      dueDate: '',
    });
    setTaskError('');
  };
  
  // Handle input change for edit project
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditProject({
      ...editProject,
      [name]: value,
    });
    // Clear error when user types
    if (error) setError('');
  };
  
  // Handle input change for add task
  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value,
    });
    // Clear error when user types
    if (taskError) setTaskError('');
  };
  
  // Handle update project
  const handleUpdateProject = async () => {
    // Validate form
    if (!editProject.name.trim()) {
      setError('Project name is required');
      return;
    }
    
    try {
      setSubmittingEdit(true);
      const response = await axios.put(`${API_URL}/projects/${projectId}`, editProject);
      
      // Update project in state
      setProject(response.data.data);
      
      // Close dialog
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error.response?.data?.message || 'Failed to update project. Please try again.');
      setSubmittingEdit(false);
    }
  };
  
  // Handle delete project
  const handleDeleteProject = async () => {
    try {
      await axios.delete(`${API_URL}/projects/${projectId}`);
      
      // Navigate back to projects list
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.response?.data?.message || 'Failed to delete project. Please try again.');
      handleCloseDeleteDialog();
    }
  };
  
  // Handle add task
  const handleAddTask = async () => {
    // Validate form
    if (!newTask.title.trim()) {
      setTaskError('Task title is required');
      return;
    }
    
    try {
      setSubmittingTask(true);
      const taskToAdd = {
        ...newTask,
        project_id: projectId,
      };
      
      const response = await axios.post(`${API_URL}/tasks`, taskToAdd);
      
      // Add the new task to the list
      setTasks([...tasks, response.data.data]);
      
      // Close dialog
      handleCloseAddTaskDialog();
    } catch (error) {
      console.error('Error adding task:', error);
      setTaskError(error.response?.data?.message || 'Failed to add task. Please try again.');
      setSubmittingTask(false);
    }
  };
  
  // Handle task click
  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };
  
  // Calculate project stats
  const calculateStats = () => {
    if (!tasks.length) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        completionPercentage: 0,
      };
    }
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
    const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionPercentage,
    };
  };
  
  const stats = calculateStats();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  if (!project && !loading) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          Project not found or you don't have permission to view it.
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      {/* Project Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          mb: 2 
        }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              {project.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip
                label={project.status}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(project.status),
                  color: 'white',
                  mr: 2,
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <PersonIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {project.creator_name || 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(project.created_at)}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {isAdmin && (
            <Box sx={{ mt: { xs: 2, sm: 0 } }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleOpenEditDialog}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleOpenDeleteDialog}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>
        
        <Typography variant="body1" sx={{ mt: 2 }}>
          {project.description || 'No description available.'}
        </Typography>
      </Box>
      
      {/* Project Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Tasks
              </Typography>
              <Typography variant="h4" component="div">
                {stats.totalTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Tasks
              </Typography>
              <Typography variant="h4" component="div">
                {stats.completedTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" component="div">
                {stats.inProgressTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completion
              </Typography>
              <Typography variant="h4" component="div">
                {stats.completionPercentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} aria-label="project tabs">
            <Tab label="Tasks" />
            <Tab label="Activity" />
          </Tabs>
        </Box>
      </Box>
      
      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Tasks Tab */}
        {tabIndex === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Project Tasks</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAddTaskDialog}
              >
                Add Task
              </Button>
            </Box>
            
            {tasks.length > 0 ? (
              <Paper>
                <List>
                  {tasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem 
                        button 
                        onClick={() => handleTaskClick(task.id)}
                        sx={{ 
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                          py: 1.5,
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="subtitle1" component="span">
                                {task.title}
                              </Typography>
                              <Chip
                                label={task.priority}
                                size="small"
                                sx={{
                                  ml: 1,
                                  backgroundColor: getPriorityColor(task.priority),
                                  color: 'white',
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {task.description 
                                  ? task.description.length > 100 
                                    ? `${task.description.substring(0, 100)}...` 
                                    : task.description 
                                  : 'No description'
                                }
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Chip
                                  label={task.status}
                                  size="small"
                                  sx={{
                                    backgroundColor: getStatusColor(task.status),
                                    color: 'white',
                                    height: 20,
                                    '& .MuiChip-label': {
                                      px: 1,
                                      py: 0,
                                      fontSize: '0.7rem',
                                    },
                                  }}
                                />
                                {task.dueDate && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                    <AccessTimeIcon 
                                      fontSize="small" 
                                      sx={{ 
                                        color: 'text.secondary', 
                                        fontSize: '0.875rem',
                                        mr: 0.5 
                                      }} 
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      Due: {formatDate(task.dueDate)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="View Details">
                            <IconButton edge="end" onClick={() => handleTaskClick(task.id)}>
                              <AssignmentIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < tasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No tasks found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  This project doesn't have any tasks yet. Add your first task to get started.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddTaskDialog}
                >
                  Add Task
                </Button>
              </Paper>
            )}
          </Box>
        )}
        
        {/* Activity Tab */}
        {tabIndex === 1 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Activity Feed
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Project activity tracking will be implemented soon.
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Edit Project Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
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
            value={editProject.name}
            onChange={handleEditInputChange}
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
            value={editProject.description}
            onChange={handleEditInputChange}
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
            value={editProject.status}
            onChange={handleEditInputChange}
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
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateProject} 
            variant="contained" 
            color="primary"
            disabled={submittingEdit}
          >
            {submittingEdit ? 'Updating...' : 'Update Project'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Project Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this project? This action cannot be undone, and all tasks associated with this project will also be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteProject} variant="contained" color="error">
            Delete Project
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Task Dialog */}
      <Dialog open={openAddTaskDialog} onClose={handleCloseAddTaskDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Fill in the details below to create a new task for this project.
          </DialogContentText>
          {taskError && (
            <Box sx={{ mb: 2, color: 'error.main', typography: 'body2' }}>
              {taskError}
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Task Title"
            type="text"
            fullWidth
            value={newTask.title}
            onChange={handleTaskInputChange}
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
            value={newTask.description}
            onChange={handleTaskInputChange}
            variant="outlined"
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                margin="dense"
                name="status"
                label="Status"
                fullWidth
                value={newTask.status}
                onChange={handleTaskInputChange}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                {PROJECT_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                margin="dense"
                name="priority"
                label="Priority"
                fullWidth
                value={newTask.priority}
                onChange={handleTaskInputChange}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                {TASK_PRIORITY_OPTIONS.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            name="dueDate"
            label="Due Date"
            type="date"
            fullWidth
            value={newTask.dueDate}
            onChange={handleTaskInputChange}
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseAddTaskDialog}>Cancel</Button>
          <Button 
            onClick={handleAddTask} 
            variant="contained" 
            color="primary"
            disabled={submittingTask}
          >
            {submittingTask ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDetail; 