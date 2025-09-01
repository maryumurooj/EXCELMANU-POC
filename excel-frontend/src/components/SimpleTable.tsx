import React from 'react';
import { Box, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { TableChart as TableIcon } from '@mui/icons-material';
import { ExcelData } from '../types/ExcelTypes';

interface SimpleTableProps {
  data: ExcelData;
  maxRows?: number; // Maximum rows to display before switching to grid view
}

const SimpleTable: React.FC<SimpleTableProps> = ({ data, maxRows = 25 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Determine table size class based on data size
  const getTableSizeClass = () => {
    if (data.data.length <= 10) return 'table-lg';
    if (data.data.length <= 25) return 'table-md';
    return 'table-sm';
  };

  // Determine if we should show this table (only for small datasets)
  if (data.data.length > maxRows) {
    return null; // Don't render for large datasets
  }

  return (
    <Box className="table-wrapper">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 2,
          borderRadius: 2,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 2,
          p: 1.5,
          background: 'rgba(25, 118, 210, 0.06)',
          borderRadius: 2,
        }}>
          <TableIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Simple Table View
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {data.data.length} rows × {data.headers.length} columns
          </Typography>
        </Box>
        
        <Box className="table-container">
          <table className={`table-base ${getTableSizeClass()} table-full`}>
            <thead>
              <tr>
                {data.headers.map((header, index) => (
                  <th key={index} style={{ 
                    minWidth: isMobile ? '120px' : '150px',
                    maxWidth: isMobile ? '200px' : '300px'
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} style={{
                      maxWidth: isMobile ? '200px' : '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', textAlign: 'center' }}>
          💡 This view is optimized for datasets with {maxRows} or fewer rows for better readability
        </Typography>
      </Paper>
    </Box>
  );
};

export default SimpleTable;

