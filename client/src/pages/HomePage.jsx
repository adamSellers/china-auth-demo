import { useState } from 'react';
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
} from '@mui/icons-material';
import EnvironmentSelector from '../components/EnvironmentSelector';
import { DEFAULT_ENVIRONMENT } from '../config/environments';

const HomePage = () => {
  const { user, loading } = useAuth();
  const [selectedEnvironment, setSelectedEnvironment] = useState(DEFAULT_ENVIRONMENT);

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

  const handleLogin = () => {
    // Store the selected environment in sessionStorage
    sessionStorage.setItem('selectedEnvironment', JSON.stringify(selectedEnvironment));
    window.location.href = `/auth/salesforce?env=${selectedEnvironment.id}`;
  };

  return (
    <Box sx={{ py: 4 }}>
      {/* Title Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Salesforce OAuth Demo
        </Typography>
      </Box>

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

        <EnvironmentSelector
          selectedEnvironment={selectedEnvironment}
          onEnvironmentChange={setSelectedEnvironment}
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleLogin}
          startIcon={
            <img 
              src={selectedEnvironment.icon} 
              alt="" 
              style={{ 
                width: 72,
                height: 24,
                objectFit: 'contain'
              }} 
            />
          }
          sx={{ minWidth: 250 }}
        >
          Continue with {selectedEnvironment.name}
        </Button>
      </Paper>

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
                      slotProps={{
                        primary: { 
                          sx: { 
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            px: 1,
                            display: 'inline'
                          }
                        }
                      }}
                      primary="SESSION_SECRET"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      slotProps={{
                        primary: { 
                          sx: { 
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            px: 1,
                            display: 'inline'
                          }
                        }
                      }}
                      primary="SF_CLIENT_ID"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      slotProps={{
                        primary: { 
                          sx: { 
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            px: 1,
                            display: 'inline'
                          }
                        }
                      }}
                      primary="SF_CLIENT_SECRET"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      slotProps={{
                        primary: { 
                          sx: { 
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            px: 1,
                            display: 'inline'
                          }
                        }
                      }}
                      primary="SF_CALLBACK_URL"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      slotProps={{
                        primary: { 
                          sx: { 
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            px: 1,
                            display: 'inline'
                          }
                        }
                      }}
                      primary="SF_LOGIN_URL"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      slotProps={{
                        primary: { 
                          sx: { 
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            px: 1,
                            display: 'inline'
                          }
                        }
                      }}
                      primary="SFOA_CLIENT_ID"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      slotProps={{
                        primary: { 
                          sx: { 
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            px: 1,
                            display: 'inline'
                          }
                        }
                      }}
                      primary="SFOA_CLIENT_SECRET"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      slotProps={{
                        primary: { 
                          sx: { 
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            px: 1,
                            display: 'inline'
                          }
                        }
                      }}
                      primary="SFOA_CALLBACK_URL"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      slotProps={{
                        primary: { 
                          sx: { 
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            px: 1,
                            display: 'inline'
                          }
                        }
                      }}
                      primary="SFOA_LOGIN_URL"
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