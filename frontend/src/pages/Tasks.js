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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
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

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('dueDate');
  const [order, setOrder] = useState('asc');
  const [openNewTaskDialog, setOpenNewTaskDialog] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Not Started',
    priority: 'Medium',
    project_id: '',
    dueDate: '',
  });

  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch tasks and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tasks
        const tasksResponse = await axios.get(`${API_URL}/tasks`);
        setTasks(tasksResponse.data.data);
        
        // Fetch projects for project filter dropdown
        const projectsResponse = await axios.get(`${API_URL}/projects`);
        setProjects(projectsResponse.data.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      // Search filter
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter
      const matchesStatus = filterStatus ? task.status === filterStatus : true;
      
      // Priority filter
      const matchesPriority = filterPriority ? task.priority === filterPriority : true;
      
      // Project filter
      const matchesProject = filterProject ? task.project_id === filterProject : true;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });

  // Sort tasks
  const sortedTasks = filteredTasks.sort((a, b) => {
    let valueA, valueB;
    
    if (orderBy === 'dueDate') {
      valueA = a.dueDate ? new Date(a.dueDate) : new Date(9999, 11, 31);
      valueB = b.dueDate ? new Date(b.dueDate) : new Date(9999, 11, 31);
    } else if (orderBy === 'createdAt') {
      valueA = new Date(a.created_at);
      valueB = new Date(b.created_at);
    } else if (orderBy === 'priority') {
      const priorityRank = { 'Low': 1, 'Medium': 2, 'High': 3, 'Urgent': 4 };
      valueA = priorityRank[a.priority] || 0;
      valueB = priorityRank[b.priority] || 0;
    } else {
      valueA = a[orderBy] || '';
      valueB = b[orderBy] || '';
    }
    
    if (order === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueB < valueA ? -1 : valueB > valueA ? 1 : 0;
    }
  });

  // Get paginated tasks
  const paginatedTasks = sortedTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle sort request
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle task click
  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  // Handle open new task dialog
  const handleOpenNewTaskDialog = () => {
    setOpenNewTaskDialog(true);
  };

  // Handle close new task dialog
  const handleCloseNewTaskDialog = () => {
    setOpenNewTaskDialog(false);
    // Reset form
    setNewTask({
      title: '',
      description: '',
      status: 'Not Started',
      priority: 'Medium',
      project_id: '',
      dueDate: '',
    });
    setError('');
  };

  // Handle input change for new task
  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value,
    });
    // Clear error when user types
    if (error) setError('');
  };

  // Handle create task
  const handleCreateTask = async () => {
    // Validate form
    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    if (!newTask.project_id) {
      setError('Project is required');
      return;
    }
    
    try {
      setSubmittingTask(true);
      const response = await axios.post(`${API_URL}/tasks`, newTask);
      
      // Add the new task to the list
      setTasks([response.data.data, ...tasks]);
      
      // Close dialog
      handleCloseNewTaskDialog();
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.response?.data?.message || 'Failed to create task. Please try again.');
      setSubmittingTask(false);
    }
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
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  // Get project name by id
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterProject('');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Tasks
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenNewTaskDialog}
          >
            Create Task
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          View and manage all your tasks across projects.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search tasks..."
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="priority-filter-label">Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                id="priority-filter"
                value={filterPriority}
                label="Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                {PRIORITY_OPTIONS.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="project-filter-label">Project</InputLabel>
              <Select
                labelId="project-filter-label"
                id="project-filter"
                value={filterProject}
                label="Project"
                onChange={(e) => setFilterProject(e.target.value)}
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tasks Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredTasks.length > 0 ? (
        <Paper>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="tasks table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'title'}
                      direction={orderBy === 'title' ? order : 'asc'}
                      onClick={() => handleRequestSort('title')}
                    >
                      Task
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'project_id'}
                      direction={orderBy === 'project_id' ? order : 'asc'}
                      onClick={() => handleRequestSort('project_id')}
                    >
                      Project
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleRequestSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'priority'}
                      direction={orderBy === 'priority' ? order : 'asc'}
                      onClick={() => handleRequestSort('priority')}
                    >
                      Priority
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'dueDate'}
                      direction={orderBy === 'dueDate' ? order : 'asc'}
                      onClick={() => handleRequestSort('dueDate')}
                    >
                      Due Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTasks.map((task) => (
                  <TableRow 
                    key={task.id}
                    hover
                    onClick={() => handleTaskClick(task.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{task.title}</Typography>
                      {task.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 1,
                          }}
                        >
                          {task.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getProjectName(task.project_id)}</TableCell>
                    <TableCell>
                      <Chip
                        label={task.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(task.status),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.priority}
                        size="small"
                        sx={{
                          backgroundColor: getPriorityColor(task.priority),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(task.dueDate)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task.id);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || filterStatus || filterPriority || filterProject
              ? 'No tasks match your search criteria. Try changing your filters.'
              : 'You have no tasks yet. Create your first task to get started.'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenNewTaskDialog}
          >
            Create Task
          </Button>
        </Paper>
      )}

      {/* Create Task Dialog */}
      <Dialog open={openNewTaskDialog} onClose={handleCloseNewTaskDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Fill in the details below to create a new task.
          </DialogContentText>
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="project-select-label">Project *</InputLabel>
                <Select
                  labelId="project-select-label"
                  id="project-select"
                  name="project_id"
                  value={newTask.project_id}
                  label="Project *"
                  onChange={handleTaskInputChange}
                  required
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
                value={newTask.dueDate}
                onChange={handleTaskInputChange}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  id="status-select"
                  name="status"
                  value={newTask.status}
                  label="Status"
                  onChange={handleTaskInputChange}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="priority-select-label">Priority</InputLabel>
                <Select
                  labelId="priority-select-label"
                  id="priority-select"
                  name="priority"
                  value={newTask.priority}
                  label="Priority"
                  onChange={handleTaskInputChange}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseNewTaskDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateTask} 
            variant="contained" 
            color="primary"
            disabled={submittingTask}
          >
            {submittingTask ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Tasks; 