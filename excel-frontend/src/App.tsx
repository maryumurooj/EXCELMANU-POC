import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  CssBaseline,
  ThemeProvider,
  createTheme,
  useMediaQuery
} from '@mui/material';
import { 
  TableChart as TableIcon,
  Description as FileIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import FileUpload from './components/FileUpload';
import AGDataGrid from './components/AGDataGrid';
import Toolbar from './components/Toolbar';
import { ExcelData } from './types/ExcelTypes';
import axios from 'axios';

// Create a professional theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.02),0px 1px 1px 0px rgba(0,0,0,0.04),0px 1px 3px 0px rgba(0,0,0,0.08)',
    '0px 3px 1px -2px rgba(0,0,0,0.02),0px 2px 2px 0px rgba(0,0,0,0.04),0px 1px 5px 0px rgba(0,0,0,0.08)',
    '0px 3px 3px -2px rgba(0,0,0,0.02),0px 3px 4px 0px rgba(0,0,0,0.04),0px 1px 8px 0px rgba(0,0,0,0.08)',
    '0px 2px 4px -1px rgba(0,0,0,0.02),0px 4px 5px 0px rgba(0,0,0,0.04),0px 1px 10px 0px rgba(0,0,0,0.08)',
    '0px 3px 5px -1px rgba(0,0,0,0.02),0px 5px 8px 0px rgba(0,0,0,0.04),0px 1px 14px 0px rgba(0,0,0,0.08)',
    '0px 3px 5px -1px rgba(0,0,0,0.02),0px 6px 10px 0px rgba(0,0,0,0.04),0px 1px 18px 0px rgba(0,0,0,0.08)',
    '0px 4px 5px -2px rgba(0,0,0,0.02),0px 7px 10px 1px rgba(0,0,0,0.04),0px 2px 16px 1px rgba(0,0,0,0.08)',
    '0px 5px 5px -3px rgba(0,0,0,0.02),0px 8px 10px 1px rgba(0,0,0,0.04),0px 3px 14px 2px rgba(0,0,0,0.08)',
    '0px 5px 6px -3px rgba(0,0,0,0.02),0px 9px 12px 1px rgba(0,0,0,0.04),0px 3px 16px 2px rgba(0,0,0,0.08)',
    '0px 6px 6px -3px rgba(0,0,0,0.02),0px 10px 14px 1px rgba(0,0,0,0.04),0px 4px 18px 3px rgba(0,0,0,0.08)',
    '0px 6px 7px -4px rgba(0,0,0,0.02),0px 11px 15px 1px rgba(0,0,0,0.04),0px 4px 20px 3px rgba(0,0,0,0.08)',
    '0px 7px 8px -4px rgba(0,0,0,0.02),0px 12px 17px 2px rgba(0,0,0,0.04),0px 5px 22px 4px rgba(0,0,0,0.08)',
    '0px 7px 8px -4px rgba(0,0,0,0.02),0px 13px 19px 2px rgba(0,0,0,0.04),0px 5px 24px 4px rgba(0,0,0,0.08)',
    '0px 7px 9px -4px rgba(0,0,0,0.02),0px 14px 21px 2px rgba(0,0,0,0.04),0px 5px 26px 4px rgba(0,0,0,0.08)',
    '0px 8px 9px -5px rgba(0,0,0,0.02),0px 15px 22px 2px rgba(0,0,0,0.04),0px 6px 28px 5px rgba(0,0,0,0.08)',
    '0px 8px 10px -5px rgba(0,0,0,0.02),0px 16px 24px 2px rgba(0,0,0,0.04),0px 6px 30px 5px rgba(0,0,0,0.08)',
    '0px 8px 11px -5px rgba(0,0,0,0.02),0px 17px 26px 2px rgba(0,0,0,0.04),0px 6px 32px 5px rgba(0,0,0,0.08)',
    '0px 9px 11px -5px rgba(0,0,0,0.02),0px 18px 28px 2px rgba(0,0,0,0.04),0px 7px 34px 6px rgba(0,0,0,0.08)',
    '0px 9px 12px -6px rgba(0,0,0,0.02),0px 19px 29px 2px rgba(0,0,0,0.04),0px 7px 36px 6px rgba(0,0,0,0.08)',
    '0px 10px 13px -6px rgba(0,0,0,0.02),0px 20px 31px 3px rgba(0,0,0,0.04),0px 8px 38px 7px rgba(0,0,0,0.08)',
    '0px 10px 13px -6px rgba(0,0,0,0.02),0px 21px 33px 3px rgba(0,0,0,0.04),0px 8px 40px 7px rgba(0,0,0,0.08)',
    '0px 10px 14px -6px rgba(0,0,0,0.02),0px 22px 35px 3px rgba(0,0,0,0.04),0px 8px 42px 7px rgba(0,0,0,0.08)',
    '0px 11px 14px -7px rgba(0,0,0,0.02),0px 23px 36px 3px rgba(0,0,0,0.04),0px 9px 44px 8px rgba(0,0,0,0.08)',
    '0px 11px 15px -7px rgba(0,0,0,0.02),0px 24px 38px 3px rgba(0,0,0,0.04),0px 9px 46px 8px rgba(0,0,0,0.08)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: { xs: 1.5, md: 2 }
      }}>
        <Container maxWidth="xl">
          {/* Header Section - Compact */}
          <Box sx={{ 
            textAlign: 'center', 
            mb: { xs: 2, md: 3 },
            color: 'white'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mb: 1.5,
              gap: 1.5
            }}>
              <TableIcon sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
              <Typography 
                variant={isMobile ? 'h4' : 'h3'} 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Excel Data Manipulator
              </Typography>
            </Box>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.95,
                fontWeight: 400,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                mb: 1.5,
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.5
              }}
            >
              Upload your Excel files to perform advanced data operations including text manipulation, 
              mathematical calculations, pivot tables, and more.
            </Typography>
          </Box>
          
          {/* File Upload Section */}
          <Box sx={{ mb: { xs: 2, md: 3 } }}>
            <FileUpload onUpload={handleFileUpload} />
          </Box>

          {/* Data Display Section - Centered */}
          {excelData && excelData.headers && excelData.headers.length > 0 && (
            <Paper 
              elevation={6} 
              sx={{ 
                p: { xs: 2, md: 3 },
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                mx: 'auto',
                maxWidth: '100%'
              }}
            >
              {/* Sheet Tabs - Compact */}
              {sheets.length > 1 && (
                <Box sx={{ 
                  borderBottom: 2, 
                  borderColor: 'primary.main', 
                  mb: 2.5,
                  background: 'rgba(25, 118, 210, 0.06)',
                  borderRadius: 2,
                  p: 1
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                    📊 Available Sheets ({sheets.length})
                  </Typography>
                  <Tabs 
                    value={activeSheet} 
                    onChange={handleSheetChange}
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                    sx={{
                      '& .MuiTab-root': {
                        minWidth: { xs: 100, md: 140 },
                        mx: 0.5,
                      },
                      '& .MuiTabs-indicator': {
                        height: 3,
                        borderRadius: 1.5,
                      }
                    }}
                  >
                    {sheets.map((sheetName) => (
                      <Tab 
                        key={sheetName}
                        label={
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5 
                          }}>
                            <FileIcon sx={{ fontSize: 14 }} />
                            {sheetName}
                          </Box>
                        }
                        value={sheetName}
                        sx={{ 
                          fontWeight: activeSheet === sheetName ? 700 : 500,
                          color: activeSheet === sheetName ? 'primary.main' : 'text.secondary',
                          '&.Mui-selected': {
                            color: 'primary.main',
                          }
                        }}
                      />
                    ))}
                  </Tabs>
                </Box>
              )}
              
              {/* Toolbar */}
              <Box sx={{ mb: 2.5 }}>
                <Toolbar 
                  selectedCells={selectedCells}
                  onDataUpdate={handleDataUpdate}
                  currentData={excelData}
                />
              </Box>
              
              {/* Data Grid - Centered */}
              <Box sx={{ mt: 2.5 }}>
                <AGDataGrid
                  data={excelData}
                  onSelectionChange={setSelectedCells}
                />
              </Box>
            </Paper>
          )}

          {/* Empty State - Compact */}
          {!excelData && (
            <Paper 
              elevation={4} 
              sx={{ 
                p: { xs: 3, md: 6 }, 
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                mx: 'auto',
                maxWidth: 800
              }}
            >
              <AnalyticsIcon sx={{ fontSize: { xs: '3rem', md: '4rem' }, color: 'primary.main', mb: 2.5 }} />
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Ready to Process Your Excel Data
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 2.5, fontSize: '1rem' }}>
                Upload an Excel file to get started with data manipulation, analysis, and transformation. 
                Our tool supports multiple sheets, pivot tables, and advanced calculations.
              </Typography>
              
              {/* Feature Highlights - Compact */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
                gap: 2, 
                mt: 3,
                textAlign: 'left'
              }}>
                <Box sx={{ p: 1.5, background: 'rgba(25, 118, 210, 0.05)', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                    📝 Text Operations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Concatenate columns, trim whitespace, change text case, and more text manipulation features.
                  </Typography>
                </Box>
                
                <Box sx={{ p: 1.5, background: 'rgba(156, 39, 176, 0.05)', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main', mb: 0.5 }}>
                    🧮 Mathematical Functions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sum, average, min/max, count, multiply, and median calculations on your data.
                  </Typography>
                </Box>
                
                <Box sx={{ p: 1.5, background: 'rgba(76, 175, 80, 0.05)', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main', mb: 0.5 }}>
                    📊 Advanced Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create pivot tables, sort data, and perform complex data transformations.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
