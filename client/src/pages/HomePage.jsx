import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
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
  Divider,
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
    <Box sx={{ py: 4 }}>
      {/* Login Section */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }} 
        elevation={2}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          Login with Salesforce
        </Typography>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Connecting to Salesforce environment:
          </Typography>
          <Paper
            variant="outlined"
            sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              fontFamily: 'monospace',
              mb: 3
            }}
          >
            {import.meta.env.VITE_SF_LOGIN_URL || 'Not configured'}
          </Paper>
        </Box>

        <Button
          variant="contained"
          size="large"
          href="/auth/salesforce"
          startIcon={<TerminalIcon />}
          sx={{ minWidth: 250 }}
        >
          Continue with Salesforce
        </Button>
      </Paper>

      {/* Title Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Salesforce OAuth Demo
        </Typography>
      </Box>

      {/* Instructions Section */}
      <Paper sx={{ p: 4 }} elevation={2}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Deployment Instructions
        </Typography>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Deploy to Heroku
        </Typography>

        <List sx={{ mb: 3 }}>
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
          <ListItem sx={{ alignItems: 'flex-start' }}>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Configure the following environment variables:"
              secondary={
                <List dense sx={{ pl: 2, pt: 1 }}>
                  <ListItem>
                    <ListItemText 
                      primary="SESSION_SECRET"
                      primaryTypographyProps={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        px: 1,
                        display: 'inline'
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="SF_CLIENT_ID"
                      primaryTypographyProps={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        px: 1,
                        display: 'inline'
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="SF_CLIENT_SECRET"
                      primaryTypographyProps={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        px: 1,
                        display: 'inline'
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="SF_CALLBACK_URL"
                      primaryTypographyProps={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        px: 1,
                        display: 'inline'
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="SF_LOGIN_URL"
                      primaryTypographyProps={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        px: 1,
                        display: 'inline'
                      }}
                    />
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

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<GitHubIcon />}
            component={Link}
            href="https://github.com/yourusername/repo"
            target="_blank"
          >
            View Example Codebase
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default HomePage;