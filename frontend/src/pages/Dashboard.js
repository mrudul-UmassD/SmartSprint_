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
  Divider,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Folder as FolderIcon,
  Task as TaskIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

// API URL
const API_URL = 'http://localhost:5000/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
  });
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects
        const projectsResponse = await axios.get(`${API_URL}/projects`);
        const projectsData = projectsResponse.data.data;
        setProjects(projectsData.slice(0, 3)); // Show only 3 most recent projects
        
        // Fetch tasks
        const tasksResponse = await axios.get(`${API_URL}/tasks`);
        const tasksData = tasksResponse.data.data;
        setTasks(tasksData.slice(0, 5)); // Show only 5 most recent tasks
        
        // Calculate statistics
        setStats({
          totalProjects: projectsData.length,
          totalTasks: tasksData.length,
          completedTasks: tasksData.filter(task => task.status === 'Approved').length,
          inProgressTasks: tasksData.filter(task => task.status === 'In Progress').length,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Handle navigation to project or task detail
  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };
  
  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
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
  
  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'Created':
        return '#9e9e9e';
      case 'Assigned':
        return '#673ab7';
      case 'In Progress':
        return '#2196f3';
      case 'Submitted':
        return '#ff9800';
      case 'Under Review':
        return '#ff5722';
      case 'Approved':
        return '#4caf50';
      case 'Rejected':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
          Welcome, {user?.name || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your current projects and tasks.
        </Typography>
      </Box>
      
      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-widget" sx={{ backgroundColor: '#e3f2fd' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Projects
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FolderIcon sx={{ fontSize: 48, color: '#1976d2', mr: 2 }} />
              <Typography variant="h4" component="div" fontWeight={600}>
                {stats.totalProjects}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-widget" sx={{ backgroundColor: '#e8f5e9' }}>
            <Typography variant="h6" color="success.dark" gutterBottom>
              Completed Tasks
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TaskIcon sx={{ fontSize: 48, color: '#388e3c', mr: 2 }} />
              <Typography variant="h4" component="div" fontWeight={600}>
                {stats.completedTasks}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-widget" sx={{ backgroundColor: '#fff3e0' }}>
            <Typography variant="h6" color="warning.dark" gutterBottom>
              In Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 48, color: '#e65100', mr: 2 }} />
              <Typography variant="h4" component="div" fontWeight={600}>
                {stats.inProgressTasks}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-widget" sx={{ backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Tasks
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TaskIcon sx={{ fontSize: 48, color: '#616161', mr: 2 }} />
              <Typography variant="h4" component="div" fontWeight={600}>
                {stats.totalTasks}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Recent Projects Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2" fontWeight={600}>
            Recent Projects
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/projects')}
          >
            View All
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {projects.length > 0 ? (
            projects.map((project) => (
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
                    <Typography variant="h6" component="div" gutterBottom noWrap>
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(project.status),
                        color: 'white',
                        mb: 2,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description ? (
                        project.description.length > 120 
                          ? `${project.description.substring(0, 120)}...` 
                          : project.description
                      ) : 'No description available.'}
                    </Typography>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => handleProjectClick(project.id)}
                      sx={{ ml: 'auto' }}
                    >
                      View Project
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No projects found. Create your first project to get started.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/projects')}
                >
                  Create Project
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Recent Tasks Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2" fontWeight={600}>
            Recent Tasks
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/tasks')}
          >
            View All
          </Button>
        </Box>
        
        {tasks.length > 0 ? (
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid item xs={12} key={task.id}>
                <Paper
                  sx={{
                    p: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    },
                    borderLeft: `4px solid ${
                      task.priority === 'High'
                        ? '#f44336'
                        : task.priority === 'Medium'
                        ? '#ff9800'
                        : '#4caf50'
                    }`,
                  }}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                      {task.title}
                    </Typography>
                    <Chip
                      label={task.status}
                      size="small"
                      sx={{
                        backgroundColor: getTaskStatusColor(task.status),
                        color: 'white',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Project: {task.project_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assigned to: {task.assignee_name || 'Unassigned'}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No tasks found. Create your first task to get started.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate('/tasks')}
            >
              Create Task
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard; 