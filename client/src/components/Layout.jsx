import { Box, Container, Typography, Link } from '@mui/material';

const Layout = ({ children }) => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Main content */}
      <Container 
        fixed
        sx={{ 
          width: '1200px !important',
          flex: 1,
          py: 4
        }}
      >
        {children}
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'grey.100'
        }}
      >
        <Container fixed sx={{ width: '1200px !important' }}>
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 Salesforce OAuth Demo. All rights reserved.
            </Typography>
            <Box>
              <Link href="#" color="inherit" sx={{ mr: 3 }}>
                Privacy Policy
              </Link>
              <Link href="#" color="inherit" sx={{ mr: 3 }}>
                Terms of Service
              </Link>
              <Link href="#" color="inherit">
                Contact
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;