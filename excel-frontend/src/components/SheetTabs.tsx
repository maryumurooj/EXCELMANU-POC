import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

interface SheetTabsProps {
  sheets: string[];
  activeSheet: string;
  onSheetChange: (sheetName: string) => void;
}

const SheetTabs: React.FC<SheetTabsProps> = ({ sheets, activeSheet, onSheetChange }) => {
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    onSheetChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs 
        value={activeSheet} 
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Excel sheets"
      >
        {sheets.map((sheetName) => (
          <Tab 
            key={sheetName}
            label={sheetName} 
            value={sheetName}
            sx={{ 
              minWidth: 120,
              textTransform: 'none',
              fontWeight: activeSheet === sheetName ? 'bold' : 'normal'
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default SheetTabs;
