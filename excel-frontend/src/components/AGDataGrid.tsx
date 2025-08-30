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
import { ExcelData } from '../types/ExcelTypes';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Stack,
  Button,
  Alert
} from '@mui/material';
import { 
  TableView, 
  ViewColumn, 
  Clear,
  Info
} from '@mui/icons-material';

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
  const [cellEdits, setCellEdits] = useState<Map<string, string>>(new Map());

  const getCurrentDataWithEdits = useCallback(() => {
    const editedData = data.data.map((row, rowIndex) => {
      return row.map((cell, colIndex) => {
        const cellKey = `${rowIndex}_col_${colIndex}`;
        return cellEdits.has(cellKey) ? cellEdits.get(cellKey)! : cell;
      });
    });

    return {
      ...data,
      data: editedData
    };
  }, [data, cellEdits]);

  useEffect(() => {
    (window as any).getCurrentGridDataWithEdits = getCurrentDataWithEdits;
  }, [getCurrentDataWithEdits]);
  
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { rowIndex, colDef, newValue } = event;
    if (rowIndex !== null && colDef?.field) {
      const cellKey = `${rowIndex}_${colDef.field}`;
      setCellEdits(prev => {
        const newEdits = new Map(prev);
        newEdits.set(cellKey, newValue);
        return newEdits;
      });
    }
  }, []);

  const rowData = useMemo(() => {
    return data.data.map((row, rowIndex) => {
      const rowObj: Record<string, any> = { 
        id: rowIndex,
        rowIndex: rowIndex
      };
      
      row.forEach((cell, colIndex) => {
        const field = `col_${colIndex}`;
        const cellKey = `${rowIndex}_${field}`;
        rowObj[field] = cellEdits.has(cellKey) ? cellEdits.get(cellKey) : cell;
      });
      
      return rowObj;
    });
  }, [data.data, cellEdits]);

  useEffect(() => {
    setCellEdits(new Map());
  }, [data.headers]);

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
      cellClass: selectedColumns.includes(`col_${index}`) ? 'selected-column-cell' : '',
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
    // Auto-size columns to fit content
    params.api.sizeColumnsToFit();
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

  return (
    <Box>
      {/* Selection Info */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: 'primary.50',
          border: '1px solid',
          borderColor: 'primary.200'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <TableView sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Selected:
          </Typography>
          {selectedColumns.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {selectedColumns.map(field => {
                const headerName = data.headers[parseInt(field.replace('col_', ''))];
                return (
                  <Chip
                    key={field}
                    label={headerName}
                    size="small"
                    color="primary"
                  />
                );
              })}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No columns selected
            </Typography>
          )}
          {selectedColumns.length > 0 && (
            <Button
              onClick={() => setSelectedColumns([])}
              startIcon={<Clear />}
              size="small"
              variant="outlined"
              sx={{ ml: 'auto' }}
            >
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Column Selection */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3,
          backgroundColor: 'grey.50',
          border: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <ViewColumn sx={{ color: 'secondary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Quick Select:
          </Typography>
        </Stack>
        
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {data.headers.map((header, index) => (
            <Button
              key={`col_${index}`}
              onClick={(e: any) => handleColumnHeaderClick(`col_${index}`, e)}
              variant={selectedColumns.includes(`col_${index}`) ? "contained" : "outlined"}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                minWidth: 'auto',
                px: 2,
                py: 0.5,
                mb: 1,
              }}
            >
              {header}
            </Button>
          ))}
        </Stack>

        <Alert 
          severity="info" 
          icon={<Info />}
          sx={{ mt: 2 }}
        >
          <Typography variant="caption">
            Click column headers or use Ctrl+Click to select multiple columns for operations.
          </Typography>
        </Alert>
      </Paper>

      {/* Data Grid - FULL SIZE */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <div 
          className="ag-theme-quartz" 
          style={{ 
            height: '70vh', // Much larger height
            width: '100%',
            minHeight: '600px'
          }}
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
              minWidth: 100,
              flex: 1, // This makes columns flexible
            }}
            animateRows={true}
            undoRedoCellEditing={true}
            undoRedoCellEditingLimit={20}
          />
        </div>
      </Paper>

      <style>{`
        .ag-theme-quartz .selected-column-header {
          background-color: #2563eb !important;
          color: white !important;
        }
        
        .ag-theme-quartz .selected-column-cell {
          background-color: #eff6ff !important;
          border-left: 3px solid #2563eb;
        }

        .ag-theme-quartz .ag-header-cell:hover {
          background-color: #f3f4f6 !important;
        }

        .ag-theme-quartz .ag-row:hover {
          background-color: #f9fafb !important;
        }
      `}</style>
    </Box>
  );
};

export default AGDataGrid;
