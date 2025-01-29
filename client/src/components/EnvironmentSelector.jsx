// src/components/EnvironmentSelector.jsx
import { Box, Select, MenuItem, Typography } from '@mui/material';
import { ENVIRONMENTS } from '../config/environments';

const EnvironmentSelector = ({ selectedEnvironment, onEnvironmentChange }) => {
  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Select Salesforce Environment:
      </Typography>
      <Select
        value={selectedEnvironment.id}
        onChange={(e) => {
          const env = Object.values(ENVIRONMENTS).find(env => env.id === e.target.value);
          onEnvironmentChange(env);
        }}
        fullWidth
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 1.5 // Add more padding to accommodate taller logos
          }
        }}
      >
        {Object.values(ENVIRONMENTS).map((env) => (
          <MenuItem 
            key={env.id} 
            value={env.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 1.5 // Match the select padding
            }}
          >
            <img 
              src={env.icon} 
              alt={`${env.name} logo`} 
              style={{ 
                width: 90, 
                height: 32,
                objectFit: 'contain'
              }} 
            />
            <span>{env.name}</span>
          </MenuItem>
        ))}
      </Select>

      <Box mt={2}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Login URL:
        </Typography>
        <Box
          sx={{ 
            p: 2, 
            bgcolor: 'grey.50',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}
        >
          {selectedEnvironment.loginUrl}
        </Box>
      </Box>
    </Box>
  );
};

export default EnvironmentSelector;