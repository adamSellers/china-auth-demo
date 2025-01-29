import { Box, Container, Typography, Link } from '@mui/material';
import { styled } from '@mui/material/styles';

// Create a styled wrapper to handle the layout without relying on body flex
const LayoutWrapper = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh'
});

const Layout = ({ children }) => {
  return (
    <LayoutWrapper>
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
    </LayoutWrapper>
  );
};

export default Layout;