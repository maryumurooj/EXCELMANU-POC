import React, { useState, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { Upload } from '@mui/icons-material';
import StreamingExcelService from './Services/StreamingExcelService';
import StreamingToolbar from './components/StreamingToolbar';
import StreamingDataGrid from './components/StreamingDataGrid';

interface ExcelDataSummary {
  headers: string[];
  rowCount: number;
  columnCount: number;
  activeSheet: string;
  availableSheets: string[];
  metadata: Record<string, any>;
}

interface SelectedCells {
  rows: number[];
  columns: number[];
  cells: { row: number; col: number }[];
  selectedColumnFields: string[];
}

interface DeltaResponse {
  operation: string;
  newColumns?: ColumnData[];
  modifiedColumns?: ColumnData[];
  updatedSummary: ExcelDataSummary;
  message: string;
}

interface ColumnData {
  name: string;
  index: number;
  values: string[];
  dataType: string;
}

const App: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExcelDataSummary | null>(null);
  const [selectedCells, setSelectedCells] = useState<SelectedCells>({
    rows: [],
    columns: [],
    cells: [],
    selectedColumnFields: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await StreamingExcelService.uploadFile(file);
      setSessionId(result.sessionId);
      setSummary(result.summary);
      setSelectedCells({
        rows: [],
        columns: [],
        cells: [],
        selectedColumnFields: []
      });
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOperationComplete = useCallback((delta: DeltaResponse) => {
    setSummary(delta.updatedSummary);
    setSelectedCells({
      rows: [],
      columns: [],
      cells: [],
      selectedColumnFields: []
    });
    console.log('Operation completed:', delta.message);
  }, []);

  const handleSelectionChange = useCallback((selection: SelectedCells) => {
    setSelectedCells(selection);
  }, []);

  const clearSession = useCallback(() => {
    StreamingExcelService.clearSession();
    setSessionId(null);
    setSummary(null);
    setSelectedCells({
      rows: [],
      columns: [],
      cells: [],
      selectedColumnFields: []
    });
    setError(null);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        📊 Excel Data Manipulator (Streaming)
      </Typography>

      {/* File Upload Section */}
      {!sessionId && (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upload Excel File
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Supported formats: .xlsx, .xls
          </Typography>
          
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="excel-file-upload"
            type="file"
            onChange={handleFileUpload}
            disabled={loading}
          />
          <label htmlFor="excel-file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={loading ? <CircularProgress size={20} /> : <Upload />}
              disabled={loading}
              size="large"
            >
              {loading ? 'Processing...' : 'Choose Excel File'}
            </Button>
          </label>

          {error && (
            <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Paper>
      )}

      {/* Main Application */}
      {sessionId && summary && (
        <Paper elevation={3} sx={{ p: 2 }}>
          {/* Session Info */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={`Session: ${sessionId.substring(0, 8)}...`} 
                color="primary" 
                size="small" 
              />
              <Chip 
                label={`${summary.rowCount} rows × ${summary.columnCount} cols`} 
                color="secondary" 
                size="small" 
              />
              {summary.availableSheets.length > 1 && (
                <Chip 
                  label={`${summary.availableSheets.length} sheets`} 
                  color="info" 
                  size="small" 
                />
              )}
            </Box>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearSession}
              size="small"
            >
              New File
            </Button>
          </Box>

          {/* Toolbar */}
          <StreamingToolbar
            sessionId={sessionId}
            selectedCells={selectedCells}
            summary={summary}
            onOperationComplete={handleOperationComplete}
          />

          {/* Data Grid */}
          <Box sx={{ mt: 2 }}>
            <StreamingDataGrid
              sessionId={sessionId}
              summary={summary}
              onSelectionChange={handleSelectionChange}
            />
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default App;
