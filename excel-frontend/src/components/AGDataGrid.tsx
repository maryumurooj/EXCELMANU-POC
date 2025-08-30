import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridReadyEvent, 
  CellClickedEvent, 
  SelectionChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
  Column,
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
  Tooltip
} from '@mui/material';
import { 
  TableChart as TableIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon
} from '@mui/icons-material';
import { ExcelData } from '../types/ExcelTypes';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

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
  const [cellEdits, setCellEdits] = useState<Map<string, string>>(new Map()); // ✅ Track edits
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  // ✅ Expose function via window (simple approach)
  useEffect(() => {
    (window as any).getCurrentGridDataWithEdits = getCurrentDataWithEdits;
  }, [getCurrentDataWithEdits]);

  
  // ✅ Handle cell value changes
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { rowIndex, colDef, newValue } = event;
    if (rowIndex !== null && colDef?.field) {
      const cellKey = `${rowIndex}_${colDef.field}`;
      setCellEdits(prev => {
        const newEdits = new Map(prev);
        newEdits.set(cellKey, newValue);
        return newEdits;
      });
      console.log(`✏️ Cell edited: Row ${rowIndex}, Column ${colDef.field}, New value: "${newValue}"`);
    }
  }, []);

  // ✅ Apply cell edits to row data
  const rowData = useMemo(() => {
    return data.data.map((row, rowIndex) => {
      const rowObj: Record<string, any> = { 
        id: rowIndex,
        rowIndex: rowIndex
      };
      
      row.forEach((cell, colIndex) => {
        const field = `col_${colIndex}`;
        const cellKey = `${rowIndex}_${field}`;
        
        // ✅ Use edited value if exists, otherwise use original
        rowObj[field] = cellEdits.has(cellKey) ? cellEdits.get(cellKey) : cell;
      });
      
      return rowObj;
    });
  }, [data.data, cellEdits]); // ✅ Depend on both data and edits

  // ✅ Clear edits when new file is uploaded (optional)
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
      width: 150,
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
      checkboxSelection: index === 0,
      headerCheckboxSelection: index === 0,
      headerClass: selectedColumns.includes(`col_${index}`) ? 'selected-column-header' : '',
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

  return (
    <Box sx={{ width: '100%' }}>
      {/* Grid Header */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 2,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
              sx={{ borderRadius: 2 }}
            >
              Clear Selection
            </Button>
          )}
        </Box>

        {/* Selection Info */}
        <Fade in={selectedColumns.length > 0} timeout={300}>
          <Box sx={{ 
            display: selectedColumns.length > 0 ? 'flex' : 'none',
            alignItems: 'center', 
            gap: 1,
            p: 1.5,
            backgroundColor: theme.palette.primary.light + '08',
            borderRadius: 2,
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

      {/* Quick Column Select */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 2,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TipIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Quick Column Selection
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {data.headers.map((header, index) => (
            <Tooltip key={`col_${index}`} title={`Click to select column: ${header}`}>
              <Chip
                label={header}
                onClick={(e: any) => handleColumnHeaderClick(`col_${index}`, e)}
                color={selectedColumns.includes(`col_${index}`) ? 'primary' : 'default'}
                variant={selectedColumns.includes(`col_${index}`) ? 'filled' : 'outlined'}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2,
                  }
                }}
              />
            </Tooltip>
          ))}
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          💡 <strong>Tip:</strong> Click on any cell in a column to select it. Hold Ctrl+Click to select multiple columns.
        </Typography>
      </Paper>

      {/* Data Grid */}
      <Paper 
        elevation={3} 
        sx={{ 
          overflow: 'hidden',
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          height: 'calc(100vh - 400px)', // Full screen height
          minHeight: '600px',
        }}
      >
        <div 
          className="ag-theme-quartz" 
          style={{ 
            height: '100%', 
            width: '100%',
            '--ag-header-height': '48px',
            '--ag-row-height': '40px',
            '--ag-header-background-color': theme.palette.primary.main,
            '--ag-header-foreground-color': 'white',
            '--ag-header-cell-hover-background-color': theme.palette.primary.dark,
            '--ag-row-hover-color': theme.palette.primary.light + '10',
            '--ag-selected-row-background-color': theme.palette.primary.light + '20',
            '--ag-font-family': theme.typography.fontFamily,
            '--ag-font-size': '14px',
            '--ag-border-color': theme.palette.divider,
          } as React.CSSProperties}
        >
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
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              editable: true,
              minWidth: 120,
              maxWidth: 300,
            }}
            animateRows={true}
            undoRedoCellEditing={true}
            undoRedoCellEditingLimit={20}
            pagination={true}
            paginationPageSize={100}
            paginationPageSizeSelector={[50, 100, 200, 500]}
            suppressPaginationPanel={false}
            rowBuffer={50}
            suppressAnimationFrame={false}
            suppressColumnVirtualisation={false}
            suppressRowVirtualisation={false}
          />
        </div>
      </Paper>

      {/* Edits Info */}
      {cellEdits.size > 0 && (
        <Grow in={cellEdits.size > 0} timeout={500}>
          <Alert 
            severity="info" 
            sx={{ 
              mt: 2, 
              borderRadius: 2,
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
        .ag-theme-quartz .ag-header-cell {
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
        }
        
        .ag-theme-quartz .ag-header-cell-resize::after {
          background-color: ${theme.palette.primary.main};
        }
        
        .ag-theme-quartz .ag-cell {
          padding: 8px 12px;
          border-right: 1px solid ${theme.palette.divider};
          border-bottom: 1px solid ${theme.palette.divider};
        }
        
        .ag-theme-quartz .ag-cell:focus {
          outline: 2px solid ${theme.palette.primary.main};
          outline-offset: -2px;
        }
        
        .ag-theme-quartz .ag-row-selected {
          background-color: ${theme.palette.primary.light + '15'} !important;
        }
        
        .ag-theme-quartz .ag-row-hover {
          background-color: ${theme.palette.primary.light + '08'} !important;
        }
        
        .selected-column-header {
          background-color: ${theme.palette.primary.main} !important;
          color: white !important;
        }
        
        .ag-theme-quartz .ag-paging-panel {
          background-color: ${theme.palette.background.paper};
          border-top: 1px solid ${theme.palette.divider};
          padding: 12px;
        }
        
        .ag-theme-quartz .ag-paging-button {
          border-radius: 4px;
          margin: 0 2px;
        }
        
        .ag-theme-quartz .ag-paging-button.ag-current {
          background-color: ${theme.palette.primary.main};
          color: white;
        }
      `}</style>
    </Box>
  );
};

export default AGDataGrid;
