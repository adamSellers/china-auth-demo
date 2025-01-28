import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Logout as LogoutIcon, Person as PersonIcon } from '@mui/icons-material';

const ProfileCard = ({ title, value }) => (
  <Paper 
    sx={{ 
      p: 2,
      height: '100%',
      bgcolor: 'grey.50',
    }}
  >
    <Typography variant="caption" color="text.secondary" display="block">
      {title}
    </Typography>
    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
      {value}
    </Typography>
  </Paper>
);

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }} elevation={2}>
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h5">
                Welcome, {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            href="/auth/logout"
          >
            Logout
          </Button>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Salesforce Profile
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <ProfileCard 
              title="Organization ID"
              value={user.organization_id}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ProfileCard 
              title="User ID"
              value={user.user_id}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ProfileCard 
              title="Username"
              value={user.preferred_username}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ProfileCard 
              title="Instance URL"
              value={new URL(user.profile).origin}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Access Token
        </Typography>
        
        <Paper 
          sx={{ 
            p: 2,
            bgcolor: 'grey.50',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            wordBreak: 'break-all'
          }}
        >
          {user.accessToken}
        </Paper>
      </Paper>
    </Container>
  );
};

export default Dashboard;