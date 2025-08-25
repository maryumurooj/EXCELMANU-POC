import React, { useState, useCallback } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import FileUpload from './components/FileUpload';
import AGDataGrid from './components/AGDataGrid';
import Toolbar from './components/Toolbar';
import { ExcelData } from './types/ExcelTypes';

function App() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [selectedCells, setSelectedCells] = useState<{
    rows: number[];
    columns: number[];
    cells: {row: number, col: number}[];
    selectedColumnFields: string[];
  }>({ rows: [], columns: [], cells: [], selectedColumnFields: [] });

  const handleFileUpload = useCallback((data: ExcelData) => {
    setExcelData(data);
    setSelectedCells({ rows: [], columns: [], cells: [], selectedColumnFields: [] });
  }, []);

  const handleDataUpdate = useCallback((data: ExcelData) => {
    setExcelData(data);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Excel Data Manipulator
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FileUpload onUpload={handleFileUpload} />
      </Box>

      {excelData && (
        <Paper elevation={3} sx={{ p: 2 }}>
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
