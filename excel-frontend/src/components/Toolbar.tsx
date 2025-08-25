import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { ExcelData, OperationRequest } from '../types/ExcelTypes';

interface ToolbarProps {
  selectedCells: { 
    rows: number[]; 
    columns: number[]; 
    cells: {row: number, col: number}[];
    selectedColumnFields: string[];
  };
  onDataUpdate: (data: ExcelData) => void;
  currentData: ExcelData;
}

const Toolbar: React.FC<ToolbarProps> = ({ selectedCells, onDataUpdate, currentData }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState('');
  const [delimiter, setDelimiter] = useState('');
  const [caseType, setCaseType] = useState('upper');

  const executeOperation = async (operation: string, parameters?: Record<string, any>) => {
    try {
      const request: OperationRequest = {
        operation,
        selectedColumns: selectedCells.columns, // ✅ Now uses actual selected columns!
        parameters,
      };

      console.log('Executing operation:', operation, 'on columns:', selectedCells.columns);

      const response = await axios.post(
        'http://localhost:5018/api/excel/operation',
        request
      );

      if (response.data.success) {
        onDataUpdate(response.data.data);
      }
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  // Check if operations can be performed based on selection
  const canConcatenate = selectedCells.columns.length >= 2;
  const canTrim = selectedCells.columns.length === 1;
  const canChangeCase = selectedCells.columns.length === 1;
  const canSort = selectedCells.columns.length === 1;
  const canSum = selectedCells.columns.length >= 1;

  const handleConcatenate = () => {
    if (!canConcatenate) {
      alert('Please select at least 2 columns to concatenate');
      return;
    }
    setCurrentOperation('concatenate');
    setDialogOpen(true);
  };

  const handleTrim = () => {
    if (!canTrim) {
      alert('Please select exactly 1 column to trim');
      return;
    }
    executeOperation('trim');
  };

  const handleChangeCase = () => {
    if (!canChangeCase) {
      alert('Please select exactly 1 column to change case');
      return;
    }
    setCurrentOperation('changecase');
    setDialogOpen(true);
  };

  const handleSort = (ascending: boolean) => {
    if (!canSort) {
      alert('Please select exactly 1 column to sort');
      return;
    }
    executeOperation('sort', { ascending });
  };

  const handleSum = () => {
    if (!canSum) {
      alert('Please select at least 1 column to sum');
      return;
    }
    executeOperation('sum');
  };

  const handleDialogConfirm = () => {
    switch (currentOperation) {
      case 'concatenate':
        executeOperation('concatenate', { delimiter });
        break;
      case 'changecase':
        executeOperation('changecase', { caseType });
        break;
    }
    setDialogOpen(false);
    setDelimiter('');
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('http://localhost:5018/api/excel/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'exported_data.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        {/* Selection Info */}
        <Box sx={{ mb: 2, p: 1, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
          <strong>Selected:</strong> 
          {selectedCells.columns.length > 0 ? (
            <>
              <span style={{ marginLeft: '8px' }}>
                {selectedCells.columns.length} column(s) - 
                {selectedCells.columns.map(colIndex => 
                  currentData.headers[colIndex]
                ).join(', ')}
              </span>
            </>
          ) : (
            <span style={{ marginLeft: '8px' }}>No columns selected</span>
          )}
        </Box>

        <ButtonGroup variant="outlined" sx={{ mb: 1, mr: 1 }}>
          <Button 
            onClick={handleConcatenate} 
            disabled={!canConcatenate}
            title={canConcatenate ? 'Concatenate selected columns' : 'Select 2+ columns'}
          >
            Concatenate ({selectedCells.columns.length >= 2 ? '✓' : '✗'})
          </Button>
          <Button 
            onClick={handleTrim} 
            disabled={!canTrim}
            title={canTrim ? 'Trim selected column' : 'Select exactly 1 column'}
          >
            Trim ({selectedCells.columns.length === 1 ? '✓' : '✗'})
          </Button>
          <Button 
            onClick={handleChangeCase} 
            disabled={!canChangeCase}
            title={canChangeCase ? 'Change case of selected column' : 'Select exactly 1 column'}
          >
            Change Case ({selectedCells.columns.length === 1 ? '✓' : '✗'})
          </Button>
        </ButtonGroup>
        
        <ButtonGroup variant="outlined" sx={{ mb: 1, mr: 1 }}>
          <Button 
            onClick={() => handleSort(true)} 
            disabled={!canSort}
            title={canSort ? 'Sort selected column ascending' : 'Select exactly 1 column'}
          >
            Sort Asc ({selectedCells.columns.length === 1 ? '✓' : '✗'})
          </Button>
          <Button 
            onClick={() => handleSort(false)} 
            disabled={!canSort}
            title={canSort ? 'Sort selected column descending' : 'Select exactly 1 column'}
          >
            Sort Desc ({selectedCells.columns.length === 1 ? '✓' : '✗'})
          </Button>
        </ButtonGroup>
        
        <ButtonGroup variant="outlined" sx={{ mb: 1, mr: 1 }}>
          <Button 
            onClick={handleSum} 
            disabled={!canSum}
            title={canSum ? 'Sum selected columns' : 'Select at least 1 column'}
          >
            Sum ({selectedCells.columns.length >= 1 ? '✓' : '✗'})
          </Button>
        </ButtonGroup>
        
        <Button variant="contained" color="primary" onClick={handleExport}>
          Export Excel
        </Button>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {currentOperation === 'concatenate' ? 'Concatenate Columns' : 'Change Case'}
        </DialogTitle>
        <DialogContent>
          {currentOperation === 'concatenate' && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Concatenating columns: {selectedCells.columns.map(colIndex => 
                  currentData.headers[colIndex]
                ).join(', ')}
              </Alert>
              <TextField
                autoFocus
                margin="dense"
                label="Delimiter (leave empty for no delimiter)"
                fullWidth
                variant="outlined"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                placeholder="e.g., -, |, space, etc."
              />
            </>
          )}
          {currentOperation === 'changecase' && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Changing case for column: {currentData.headers[selectedCells.columns[0]]}
              </Alert>
              <FormControl fullWidth margin="dense">
                <InputLabel>Case Type</InputLabel>
                <Select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                >
                  <MenuItem value="upper">UPPERCASE</MenuItem>
                  <MenuItem value="lower">lowercase</MenuItem>
                  <MenuItem value="title">Title Case</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDialogConfirm} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Toolbar;
