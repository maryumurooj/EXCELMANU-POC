import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridReadyEvent, 
  SelectionChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
  CellValueChangedEvent 
} from 'ag-grid-community';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Button, 
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Alert,
  IconButton,
  Tooltip,
  Container
} from '@mui/material';
import { 
  TableChart as TableIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon
} from '@mui/icons-material';
import { ExcelData } from '../types/ExcelTypes';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

interface AGDataGridProps {
  data: ExcelData;
  onSelectionChange: (selection: { 
    rows: number[]; 
    columns: number[]; 
    cells: {row: number, col: number}[];
    selectedColumnFields: string[];
  }) => void;
}

const AGDataGrid: React.FC<AGDataGridProps> = ({ data, onSelectionChange }) => {
  const [gridApi, setGridApi] = useState<any>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [cellEdits, setCellEdits] = useState<Map<string, string>>(new Map()); // Track edits
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Calculate optimal grid height based on data size
  const getGridHeight = useCallback(() => {
    const rowCount = data.data.length;
    const columnCount = data.headers.length;
    
    // Always use viewport-based height to ensure full space utilization
    // This ensures the grid takes up the full available space regardless of data size
    return 'calc(100vh - 400px)'; // Adjusted to account for all UI elements
  }, [data.data.length]);

  const getCurrentDataWithEdits = useCallback(() => {
    const editedData = data.data.map((row, rowIndex) => {
      return row.map((cell, colIndex) => {
        const cellKey = `${rowIndex}_col_${colIndex}`;
        // Return edited value if exists, otherwise original
        return cellEdits.has(cellKey) ? cellEdits.get(cellKey)! : cell;
      });
    });

    return {
      ...data,
      data: editedData
    };
  }, [data, cellEdits]);

  // Expose function via window (simple approach)
  useEffect(() => {
    (window as any).getCurrentGridDataWithEdits = getCurrentDataWithEdits;
  }, [getCurrentDataWithEdits]);

  
  // Handle cell value changes
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { rowIndex, colDef, newValue } = event;
    if (rowIndex !== null && colDef?.field) {
      const cellKey = `${rowIndex}_${colDef.field}`;
      setCellEdits(prev => {
        const newEdits = new Map(prev);
        newEdits.set(cellKey, newValue);
        return newEdits;
      });
      console.log(` Cell edited: Row ${rowIndex}, Column ${colDef.field}, New value: "${newValue}"`);
    }
  }, []);

  // Apply cell edits to row data
  const rowData = useMemo(() => {
    return data.data.map((row, rowIndex) => {
      const rowObj: Record<string, any> = { 
        id: rowIndex,
        rowIndex: rowIndex
      };
      
      row.forEach((cell, colIndex) => {
        const field = `col_${colIndex}`;
        const cellKey = `${rowIndex}_${field}`;
        
        // Use edited value if exists, otherwise use original
        rowObj[field] = cellEdits.has(cellKey) ? cellEdits.get(cellKey) : cell;
      });
      
      return rowObj;
    });
  }, [data.data, cellEdits]); // Depend on both data and edits

  // Clear edits when new file is uploaded (optional)
  useEffect(() => {
    setCellEdits(new Map());
  }, [data.headers]); // Clear when headers change (new file)

  const getRowId = useCallback((params: any) => {
    return params.data.id;
  }, []);


  const columnDefs = useMemo((): ColDef[] => {
    return data.headers.map((header, index) => ({
      field: `col_${index}`,
      headerName: header,
      width: 180, // Increased default width for better readability
      minWidth: 120,
      maxWidth: 400, // Increased max width
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
      checkboxSelection: index === 0,
      headerCheckboxSelection: index === 0,
      headerClass: selectedColumns.includes(`col_${index}`) ? 'selected-column-header' : '',
      cellStyle: {
        padding: '16px 20px',
        fontSize: '16px',
        lineHeight: '1.4',
        whiteSpace: 'normal', // Allow text wrapping
        wordBreak: 'break-word', // Break long words
        verticalAlign: 'middle',
      },
      onCellClicked: (params: any) => {
        const field = params.colDef.field;
        let newSelectedColumns: string[];
        
        if (params.event?.ctrlKey || params.event?.metaKey) {
          newSelectedColumns = selectedColumns.includes(field) 
            ? selectedColumns.filter((f: string) => f !== field)
            : [...selectedColumns, field];
        } else {
          newSelectedColumns = [field];
        }
        
        setSelectedColumns(newSelectedColumns);
        
        const columnIndices = newSelectedColumns.map(field => 
          parseInt(field.replace('col_', ''))
        );
        
        onSelectionChange({
          rows: [],
          columns: columnIndices,
          cells: [],
          selectedColumnFields: newSelectedColumns
        });
      }
    }));
  }, [data.headers, selectedColumns, onSelectionChange]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    if (!gridApi) return;
    
    const selectedNodes = gridApi.getSelectedNodes();
    const selectedRows = selectedNodes.map((node: any) => node.data.id);
    
    const columnIndices = selectedColumns.map(field => 
      parseInt(field.replace('col_', ''))
    );
    
    onSelectionChange({
      rows: selectedRows,
      columns: columnIndices,
      cells: [],
      selectedColumnFields: selectedColumns
    });
  }, [gridApi, selectedColumns, onSelectionChange]);

  const handleColumnHeaderClick = useCallback((field: string, event: MouseEvent) => {
    let newSelectedColumns: string[];
    
    if (event.ctrlKey || event.metaKey) {
      newSelectedColumns = selectedColumns.includes(field) 
        ? selectedColumns.filter((f: string) => f !== field)
        : [...selectedColumns, field];
    } else {
      newSelectedColumns = [field];
    }
    
    setSelectedColumns(newSelectedColumns);
    
    const columnIndices = newSelectedColumns.map(field => 
      parseInt(field.replace('col_', ''))
    );
    
    onSelectionChange({
      rows: [],
      columns: columnIndices,
      cells: [],
      selectedColumnFields: newSelectedColumns
    });
  }, [selectedColumns, onSelectionChange]);

  const clearSelection = () => {
    setSelectedColumns([]);
    onSelectionChange({
      rows: [],
      columns: [],
      cells: [],
      selectedColumnFields: []
    });
  };

  // Determine if we should show pagination based on data size
  const shouldShowPagination = data.data.length > 50; // Increased threshold for better UX
  const pageSize = data.data.length <= 25 ? data.data.length : 50; // Show all data for smaller datasets

  return (
    <Container maxWidth="xl" sx={{ px: { xs: 1, md: 2 } }}>
      {/* Grid Header - Compact */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 2,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Data Grid
            </Typography>
            <Chip 
              label={`${data.rowCount} rows × ${data.columnCount} columns`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
          
          {selectedColumns.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={clearSelection}
              size="small"
              sx={{ borderRadius: 1.5 }}
            >
              Clear Selection
            </Button>
          )}
        </Box>

        {/* Selection Info - Compact */}
        <Fade in={selectedColumns.length > 0} timeout={300}>
          <Box sx={{ 
            display: selectedColumns.length > 0 ? 'flex' : 'none',
            alignItems: 'center', 
            gap: 1,
            p: 1,
            backgroundColor: theme.palette.primary.light + '08',
            borderRadius: 1.5,
            border: `1px solid ${theme.palette.primary.light + '20'}`,
          }}>
            <InfoIcon color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              <strong>Selected:</strong> {selectedColumns.length} column(s)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedColumns.map(field => data.headers[parseInt(field.replace('col_', ''))]).join(', ')}
            </Typography>
          </Box>
        </Fade>
      </Paper>

      {/* Quick Column Select - Compact */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 2,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TipIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Quick Column Selection
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {data.headers.map((header, index) => (
            <Tooltip key={`col_${index}`} title={`Click to select column: ${header}`}>
              <Chip
                label={header}
                onClick={(e: any) => handleColumnHeaderClick(`col_${index}`, e)}
                color={selectedColumns.includes(`col_${index}`) ? 'primary' : 'default'}
                variant={selectedColumns.includes(`col_${index}`) ? 'filled' : 'outlined'}
                size="small"
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  fontSize: '0.75rem',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 1,
                  }
                }}
              />
            </Tooltip>
          ))}
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          <strong>Tip:</strong> Click on any cell in a column to select it. Hold Ctrl+Click to select multiple columns.
        </Typography>
      </Paper>

             {/* Data Grid - Full Space Utilization */}
       <div className="ag-theme-alpine ag-data-grid-container" style={{ width: '100%', height: getGridHeight() }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          getRowId={getRowId}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          onCellValueChanged={onCellValueChanged}
          rowSelection="multiple"
          suppressRowClickSelection={false}
          enableRangeSelection={true}
          enableCellTextSelection={true}
          className="ag-data-grid"
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            editable: true,
            minWidth: 120,
            maxWidth: 400,
            autoHeight: true,
            cellStyle: {
              padding: '16px 20px',
              fontSize: '16px',
              lineHeight: '1.4',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              verticalAlign: 'middle',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
          animateRows={true}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={20}
          pagination={shouldShowPagination}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={shouldShowPagination ? [25, 50, 100, 200] : undefined}
          suppressPaginationPanel={!shouldShowPagination}
          rowBuffer={20}
          suppressAnimationFrame={false}
          suppressColumnVirtualisation={false}
          suppressRowVirtualisation={false}
          domLayout="normal"
          headerHeight={100}
        />
      </div>

      {/* Edits Info - Compact */}
      {cellEdits.size > 0 && (
        <Grow in={cellEdits.size > 0} timeout={500}>
          <Alert 
            severity="info" 
            sx={{ 
              mt: 2, 
              borderRadius: 1.5,
              '& .MuiAlert-message': {
                fontWeight: 500
              }
            }}
          >
            <Typography variant="body2">
              <strong>Note:</strong> {cellEdits.size} cell(s) have been edited. 
              Changes will be included when performing operations.
            </Typography>
          </Alert>
        </Grow>
      )}

      {/* Custom Styles */}
      <style>{`
        .ag-theme-alpine .ag-header-cell {
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 14px;
          padding: 16px 20px;
          border-right: 1px solid ${theme.palette.divider};
          border-bottom: 1px solid ${theme.palette.divider};
        }
        
        .ag-theme-alpine .ag-header-cell-label {
          white-space: normal !important;
          line-height: 1.2;
        }

        .ag-theme-alpine .ag-header-cell-resize::after {
          background-color: ${theme.palette.primary.main};
        }
        
        .ag-theme-alpine .ag-cell {
          padding: 16px 20px !important;
          border-right: 1px solid ${theme.palette.divider} !important;
          border-bottom: 1px solid ${theme.palette.divider} !important;
          font-size: 16px !important;
          line-height: 1.4 !important;
          white-space: normal !important;
          word-break: break-word !important;
          vertical-align: middle !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        
        .ag-theme-alpine .ag-cell:focus {
          outline: 2px solid ${theme.palette.primary.main} !important;
          outline-offset: -2px !important;
        }
        
        .ag-theme-alpine .ag-row-selected {
          background-color: ${theme.palette.primary.light + '15'} !important;
        }
        
        .ag-theme-alpine .ag-row-hover {
          background-color: ${theme.palette.primary.light + '08'} !important;
        }
        
        .selected-column-header {
          background-color: ${theme.palette.primary.main} !important;
          color: white !important;
        }
        
        .ag-theme-alpine .ag-paging-panel {
          background-color: ${theme.palette.background.paper} !important;
          border-top: 1px solid ${theme.palette.divider} !important;
          padding: 16px 20px !important;
          font-size: 16px !important;
        }
        
        .ag-theme-alpine .ag-paging-button {
          border-radius: 4px !important;
          margin: 0 2px !important;
          padding: 4px 8px !important;
        }
        
        .ag-theme-alpine .ag-paging-button.ag-current {
          background-color: ${theme.palette.primary.main} !important;
          color: white !important;
        }
        
        .ag-theme-alpine .ag-paging-page-summary-panel {
          font-size: 16px !important;
        }
        
        .ag-theme-alpine .ag-paging-page-size-select {
          font-size: 16px !important;
        }
      `}</style>
    </Container>
  );
};

export default AGDataGrid;
