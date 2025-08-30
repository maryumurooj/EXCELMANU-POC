import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar as MuiToolbar,
  Chip,
  Stack
} from '@mui/material';
import { Analytics, TableView } from '@mui/icons-material';
import FileUpload from './components/FileUpload';
import AGDataGrid from './components/AGDataGrid';
import Toolbar from './components/Toolbar';
import { ExcelData } from './types/ExcelTypes';
import axios from 'axios';

const elegantTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Clean blue
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#10b981', // Emerald
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#fafbfc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
      color: '#1f2937',
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 6,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1f2937',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 6,
          marginRight: 8,
          minHeight: 40,
          '&.Mui-selected': {
            backgroundColor: '#eff6ff',
            color: '#2563eb',
          },
        },
      },
    },
  },
});

function App() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [selectedCells, setSelectedCells] = useState<{
    rows: number[];
    columns: number[];
    cells: {row: number, col: number}[];
    selectedColumnFields: string[];
  }>({ rows: [], columns: [], cells: [], selectedColumnFields: [] });
  
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');

  const handleFileUpload = useCallback(async (data: ExcelData) => {
    setExcelData(data);
    
    try {
      const response = await axios.get('http://localhost:5018/api/excel/sheets');
      setSheets(response.data);
      
      const activeResponse = await axios.get('http://localhost:5018/api/excel/activesheet');
      setActiveSheet(activeResponse.data.activeSheet);
    } catch (error) {
      console.error('Error loading sheets:', error);
    }
    
    setSelectedCells({ rows: [], columns: [], cells: [], selectedColumnFields: [] });
  }, []);

  const handleSheetChange = useCallback(async (event: React.SyntheticEvent, newSheet: string) => {
    try {
      const response = await axios.post('http://localhost:5018/api/excel/activesheet', 
        JSON.stringify(newSheet), 
        { headers: { 'Content-Type': 'application/json' }}
      );
      
      setActiveSheet(newSheet);
      setExcelData(response.data.data);
      setSelectedCells({ rows: [], columns: [], cells: [], selectedColumnFields: [] });
    } catch (error) {
      console.error('Error switching sheet:', error);
    }
  }, []);

  const handleDataUpdate = useCallback(async (data: ExcelData) => {
    setExcelData(data);
    
    try {
      const sheetsResponse = await axios.get('http://localhost:5018/api/excel/sheets');
      setSheets(sheetsResponse.data);
      
      const activeResponse = await axios.get('http://localhost:5018/api/excel/activesheet');
      setActiveSheet(activeResponse.data.activeSheet);
    } catch (error) {
      console.error('Error refreshing sheets:', error);
    }
  }, []);

  return (
    <ThemeProvider theme={elegantTheme}>
      <CssBaseline />
      
      {/* Clean Header */}
      <AppBar position="static" elevation={0}>
        <MuiToolbar sx={{ py: 1 }}>
          <Analytics sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Excel Data Studio
          </Typography>
          {excelData && (
            <Stack direction="row" spacing={1}>
              <Chip 
                icon={<TableView />}
                label={`${excelData.data.length} rows`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip 
                label={`${excelData.headers.length} columns`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            </Stack>
          )}
        </MuiToolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Welcome Section */}
        {!excelData && (
          <Box sx={{ 
            textAlign: 'center', 
            mb: 6,
            py: 6,
            backgroundColor: 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Professional Excel Data Studio
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
              Upload your Excel files and transform your data with our intuitive tools. 
              Perform advanced operations, create pivot tables, and export your results seamlessly.
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mb: 4 }}>
          <FileUpload onUpload={handleFileUpload} />
        </Box>

        {excelData && excelData.headers && excelData.headers.length > 0 && (
          <Paper sx={{ p: 0, borderRadius: 2 }}>
            {/* Sheet Tabs */}
            {sheets.length > 1 && (
              <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'grey.200', 
                px: 3,
                pt: 2,
                backgroundColor: 'grey.50'
              }}>
                <Tabs 
                  value={activeSheet} 
                  onChange={handleSheetChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTabs-indicator': {
                      display: 'none',
                    },
                  }}
                >
                  {sheets.map((sheetName) => (
                    <Tab 
                      key={sheetName}
                      label={sheetName} 
                      value={sheetName}
                    />
                  ))}
                </Tabs>
              </Box>
            )}
            
            {/* Toolbar */}
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'grey.200', backgroundColor: 'grey.50' }}>
              <Toolbar 
                selectedCells={selectedCells}
                onDataUpdate={handleDataUpdate}
                currentData={excelData}
              />
            </Box>
            
            {/* Data Grid */}
            <Box sx={{ p: 3 }}>
              <AGDataGrid
                data={excelData}
                onSelectionChange={setSelectedCells}
              />
            </Box>
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
