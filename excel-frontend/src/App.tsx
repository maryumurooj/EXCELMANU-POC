import React, { useState, useCallback } from 'react';
import { Box, Container, Typography, Paper, Tabs, Tab } from '@mui/material';
import FileUpload from './components/FileUpload';
import AGDataGrid from './components/AGDataGrid';
import Toolbar from './components/Toolbar';
import { ExcelData } from './types/ExcelTypes';
import axios from 'axios';

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Excel Data Manipulator
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FileUpload onUpload={handleFileUpload} />
      </Box>

      {/* ✅ Safe checking: only render when data exists and has headers */}
      {excelData && excelData.headers && excelData.headers.length > 0 && (
        <Paper elevation={3} sx={{ p: 2 }}>
          {/* ✅ Sheet Tabs */}
          {sheets.length > 1 && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeSheet} 
                onChange={handleSheetChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {sheets.map((sheetName) => (
                  <Tab 
                    key={sheetName}
                    label={sheetName} 
                    value={sheetName}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: activeSheet === sheetName ? 'bold' : 'normal'
                    }}
                  />
                ))}
              </Tabs>
            </Box>
          )}
          
          <Toolbar 
            selectedCells={selectedCells}
            onDataUpdate={handleDataUpdate}
            currentData={excelData}
          />
          
          <Box sx={{ mt: 2 }}>
            <AGDataGrid
              data={excelData}
              onSelectionChange={setSelectedCells}
            />
          </Box>
        </Paper>
      )}
    </Container>
  );
}


export default App;
