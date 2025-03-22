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
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  PriorityHigh as PriorityIcon,
  Flag as FlagIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

// API URL
const API_URL = 'http://localhost:5000/api';

// Status options
const STATUS_OPTIONS = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled',
];

// Priority options
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const TaskDetail = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Edit task state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: '',
    project_id: '',
    assigned_to: '',
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Delete task state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Fetch task, project, and related data
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true);
        
        // Fetch task details
        const taskResponse = await axios.get(`${API_URL}/tasks/${taskId}`);
        setTask(taskResponse.data.data);
        
        // Set up edit form with current values
        setEditTask({
          title: taskResponse.data.data.title,
          description: taskResponse.data.data.description || '',
          status: taskResponse.data.data.status,
          priority: taskResponse.data.data.priority,
          dueDate: taskResponse.data.data.dueDate || '',
          project_id: taskResponse.data.data.project_id,
          assigned_to: taskResponse.data.data.assigned_to || '',
        });
        
        // Fetch project details
        const projectResponse = await axios.get(`${API_URL}/projects/${taskResponse.data.data.project_id}`);
        setProject(projectResponse.data.data);
        
        // Fetch all projects for the edit dialog
        const projectsResponse = await axios.get(`${API_URL}/projects`);
        setProjects(projectsResponse.data.data);
        
        // Fetch users for assignment dropdown
        const usersResponse = await axios.get(`${API_URL}/users`);
        setUsers(usersResponse.data.data);
        
        // Fetch comments (Mock data for now)
        // In a real app, you would fetch comments from an endpoint like:
        // const commentsResponse = await axios.get(`${API_URL}/tasks/${taskId}/comments`);
        // setComments(commentsResponse.data.data);
        setComments([
          {
            id: 1,
            text: 'I will start working on this task tomorrow.',
            created_at: '2023-11-10T14:30:00',
            user: {
              id: 1,
              name: 'John Doe',
            },
          },
          {
            id: 2,
            text: 'Please let me know if you need any help with this.',
            created_at: '2023-11-11T09:15:00',
            user: {
              id: 2,
              name: 'Jane Smith',
            },
          },
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching task data:', error);
        setError(error.response?.data?.message || 'Failed to load task. Please try again.');
        setLoading(false);
      }
    };
    
    fetchTaskData();
  }, [taskId]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Not Started':
        return '#9e9e9e';
      case 'In Progress':
        return '#2196f3';
      case 'On Hold':
        return '#ff9800';
      case 'Completed':
        return '#4caf50';
      case 'Cancelled':
        return '#f44336';
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
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get avatar color by name
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
  
  // Handle edit dialog
  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    // Reset form to current values
    if (task) {
      setEditTask({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || '',
        project_id: task.project_id,
        assigned_to: task.assigned_to || '',
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
  
  // Handle input change for edit task
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditTask({
      ...editTask,
      [name]: value,
    });
    // Clear error when user types
    if (error) setError('');
  };
  
  // Handle update task
  const handleUpdateTask = async () => {
    // Validate form
    if (!editTask.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    try {
      setSubmittingEdit(true);
      const response = await axios.put(`${API_URL}/tasks/${taskId}`, editTask);
      
      // Update task in state
      setTask(response.data.data);
      
      // If project changed, fetch new project details
      if (response.data.data.project_id !== task.project_id) {
        const projectResponse = await axios.get(`${API_URL}/projects/${response.data.data.project_id}`);
        setProject(projectResponse.data.data);
      }
      
      // Close dialog
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.response?.data?.message || 'Failed to update task. Please try again.');
      setSubmittingEdit(false);
    }
  };
  
  // Handle delete task
  const handleDeleteTask = async () => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      
      // Navigate back to tasks list
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.response?.data?.message || 'Failed to delete task. Please try again.');
      handleCloseDeleteDialog();
    }
  };
  
  // Handle comment input change
  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
  };
  
  // Handle submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setSubmittingComment(true);
      
      // In a real app, you would send the comment to an API endpoint:
      // const response = await axios.post(`${API_URL}/tasks/${taskId}/comments`, {
      //   text: newComment,
      // });
      
      // For now, we'll mock the response
      const mockComment = {
        id: Date.now(),
        text: newComment,
        created_at: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
        },
      };
      
      // Add the new comment to the list
      setComments([...comments, mockComment]);
      
      // Clear the input
      setNewComment('');
      setSubmittingComment(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      setSubmittingComment(false);
    }
  };
  
  // Get assigned user name
  const getAssignedUserName = () => {
    if (!task?.assigned_to) return 'Unassigned';
    const assignedUser = users.find(u => u.id === task.assigned_to);
    return assignedUser ? assignedUser.name : 'Unknown';
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  if (!task && !loading) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          Task not found or you don't have permission to view it.
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/tasks')} sx={{ mt: 2 }}>
          Back to Tasks
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      {/* Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tasks')}
          variant="text"
          sx={{ mr: 2 }}
        >
          Back to Tasks
        </Button>
        {project && (
          <Button
            startIcon={<FolderIcon />}
            onClick={() => navigate(`/projects/${project.id}`)}
            variant="text"
          >
            {project.name}
          </Button>
        )}
      </Box>
      
      {/* Task Header */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          mb: 2 
        }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              {task.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mt: 1, gap: 2 }}>
              <Chip
                label={task.status}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(task.status),
                  color: 'white',
                }}
              />
              <Chip
                label={task.priority}
                size="small"
                icon={<PriorityIcon sx={{ color: 'white !important' }} />}
                sx={{
                  backgroundColor: getPriorityColor(task.priority),
                  color: 'white',
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
              {task.dueDate && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    Due: {formatDate(task.dueDate)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
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
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {task.description || 'No description provided.'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>
                <List disablePadding>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AssignmentIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Status" 
                      secondary={task.status} 
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PriorityIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Priority" 
                      secondary={task.priority}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EventIcon color="action" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Due Date" 
                      secondary={formatDate(task.dueDate)}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FolderIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Project" 
                      secondary={project ? project.name : 'Unknown'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          fontSize: '0.75rem',
                          bgcolor: getAvatarColor(getAssignedUserName()),
                        }}
                      >
                        {getInitials(getAssignedUserName())}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary="Assigned To" 
                      secondary={getAssignedUserName()}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} aria-label="task tabs">
            <Tab label="Comments" icon={<CommentIcon />} iconPosition="start" />
            <Tab label="Activity" icon={<AssignmentIcon />} iconPosition="start" />
          </Tabs>
        </Box>
      </Box>
      
      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Comments Tab */}
        {tabIndex === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Comments
            </Typography>
            
            {/* Comment Form */}
            <Box sx={{ display: 'flex', mb: 4, mt: 2 }}>
              <Avatar 
                sx={{ 
                  mr: 2,
                  bgcolor: getAvatarColor(user?.name || ''),
                }}
              >
                {getInitials(user?.name || '')}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={handleCommentChange}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SendIcon />}
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment ? 'Sending...' : 'Send'}
                  </Button>
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Comments List */}
            {comments.length > 0 ? (
              <Box>
                {comments.map((comment) => (
                  <Box key={comment.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex' }}>
                      <Avatar 
                        sx={{ 
                          mr: 2,
                          bgcolor: getAvatarColor(comment.user.name),
                        }}
                      >
                        {getInitials(comment.user.name)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">
                            {comment.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(comment.created_at)} at {formatTime(comment.created_at)}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                          {comment.text}
                        </Typography>
                      </Box>
                    </Box>
                    {comments.indexOf(comment) < comments.length - 1 && (
                      <Divider sx={{ mt: 3 }} />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CommentIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  No comments yet. Be the first to add a comment!
                </Typography>
              </Box>
            )}
          </Paper>
        )}
        
        {/* Activity Tab */}
        {tabIndex === 1 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Activity Log
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Task activity tracking will be implemented soon.
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Edit Task Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          {error && (
            <Box sx={{ mb: 2, color: 'error.main', typography: 'body2' }}>
              {error}
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Task Title"
            type="text"
            fullWidth
            value={editTask.title}
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
            value={editTask.description}
            onChange={handleEditInputChange}
            variant="outlined"
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="project-select-label">Project</InputLabel>
                <Select
                  labelId="project-select-label"
                  id="project-select"
                  name="project_id"
                  value={editTask.project_id}
                  label="Project"
                  onChange={handleEditInputChange}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="dueDate"
                label="Due Date"
                type="date"
                fullWidth
                value={editTask.dueDate}
                onChange={handleEditInputChange}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  id="status-select"
                  name="status"
                  value={editTask.status}
                  label="Status"
                  onChange={handleEditInputChange}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="priority-select-label">Priority</InputLabel>
                <Select
                  labelId="priority-select-label"
                  id="priority-select"
                  name="priority"
                  value={editTask.priority}
                  label="Priority"
                  onChange={handleEditInputChange}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="assigned-to-label">Assigned To</InputLabel>
                <Select
                  labelId="assigned-to-label"
                  id="assigned-to"
                  name="assigned_to"
                  value={editTask.assigned_to}
                  label="Assigned To"
                  onChange={handleEditInputChange}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateTask} 
            variant="contained" 
            color="primary"
            disabled={submittingEdit}
          >
            {submittingEdit ? 'Updating...' : 'Update Task'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Task Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteTask} variant="contained" color="error">
            Delete Task
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TaskDetail; 