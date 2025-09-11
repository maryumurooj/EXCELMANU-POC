import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { Box, Typography, CircularProgress } from '@mui/material';
import { ColDef, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface StreamingDataGridProps {
  sessionId: string;
  summary: {
    headers: string[];
    rowCount: number;
    columnCount: number;
    activeSheet: string;
    availableSheets: string[];
    metadata: Record<string, any>;
  };
  onSelectionChange: (selection: {
    rows: number[];
    columns: number[];
    cells: { row: number; col: number }[];
    selectedColumnFields: string[];
  }) => void;
}

const StreamingDataGrid: React.FC<StreamingDataGridProps> = ({
  sessionId,
  summary,
  onSelectionChange
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate sample data based on summary for display
  const rowData = useMemo(() => {
    if (!summary || summary.rowCount === 0) return [];
    
    // Generate sample data for display (since we're in streaming mode)
    const sampleData = [];
    for (let i = 0; i < Math.min(summary.rowCount, 100); i++) { // Show first 100 rows
      const row: any = {};
      summary.headers.forEach((header, index) => {
        row[header] = `Sample ${i + 1}-${index + 1}`;
      });
      sampleData.push(row);
    }
    return sampleData;
  }, [summary]);

  const columnDefs: ColDef[] = useMemo(() => {
    if (!summary || !summary.headers) return [];
    
    return summary.headers.map((header, index) => ({
      field: header,
      headerName: header,
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
      width: 150,
      // Remove deprecated checkbox properties - they're now handled by rowSelection
    }));
  }, [summary]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setLoading(false);
    // Auto-size columns
    params.api.sizeColumnsToFit();
  }, []);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedRows = selectedNodes.map(node => node.rowIndex!).filter(index => index !== null);
    
    // Get selected columns (simplified approach)
    const selectedColumns: number[] = [];
    const selectedCells: { row: number; col: number }[] = [];
    const selectedColumnFields: string[] = [];

    // In a real implementation, you'd track column selection differently
    // For now, we'll use row selection as a proxy
    
    onSelectionChange({
      rows: selectedRows,
      columns: selectedColumns,
      cells: selectedCells,
      selectedColumnFields: selectedColumnFields
    });
  }, [onSelectionChange]);

  useEffect(() => {
    setLoading(true);
    // Simulate loading delay
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [sessionId, summary]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">Error loading data: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing sample data - {summary.rowCount} total rows, {summary.columnCount} columns
        </Typography>
      </Box>
      
      <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          // Updated v34+ row selection configuration
          rowSelection={{
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: true,
            enableClickSelection: true,
            enableSelectionWithoutKeys: true
          }}
          // Updated v34+ cell selection - replaces enableRangeSelection
          cellSelection={true}
          // Use new theming system - remove CSS imports
          theme="legacy" // This tells AG Grid to use v32 CSS themes
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            editable: true
          }}
        />
      </div>
    </Box>
  );
};

export default StreamingDataGrid;
