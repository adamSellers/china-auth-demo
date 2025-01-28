import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  CircularProgress,
  Link,
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  ChevronRight as ChevronRightIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';

const HomePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Salesforce OAuth Demo
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h5" gutterBottom>
          Deployment Instructions
        </Typography>

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Deploy to Heroku
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
            <ListItemText primary="Fork the repository to your GitHub account" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
            <ListItemText primary="Create a new Heroku application" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
            <ListItemText primary="Connect your GitHub repository to Heroku" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Configure the following environment variables:"
              secondary={
                <List dense>
                  <ListItem>
                    <ListItemText primary="SESSION_SECRET" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="SF_CLIENT_ID" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="SF_CLIENT_SECRET" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="SF_CALLBACK_URL" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="SF_LOGIN_URL" />
                  </ListItem>
                </List>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
            <ListItemText primary="Deploy the main branch" />
          </ListItem>
        </List>

        <Button
          variant="text"
          startIcon={<GitHubIcon />}
          component={Link}
          href="https://github.com/yourusername/repo"
          target="_blank"
          sx={{ mt: 2 }}
        >
          View Example Codebase
        </Button>
      </Paper>

      <Paper sx={{ p: 3 }} elevation={2}>
        <Typography variant="h5" gutterBottom>
          Login with Salesforce
        </Typography>

        <Box sx={{ my: 3 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Connecting to Salesforce environment:
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace' }}
          >
            {import.meta.env.VITE_SF_LOGIN_URL || 'Not configured'}
          </Paper>
        </Box>

        <Button
          variant="contained"
          size="large"
          href="/auth/salesforce"
          startIcon={<TerminalIcon />}
        >
          Continue with Salesforce
        </Button>
      </Paper>
    </Container>
  );
};

export default HomePage;