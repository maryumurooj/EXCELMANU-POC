import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridReadyEvent, 
  CellClickedEvent, 
  SelectionChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
  Column
} from 'ag-grid-community';
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
  
  // ✅ Transform data with unique IDs for better change detection
  const rowData = useMemo(() => {
    return data.data.map((row, index) => {
      const rowObj: Record<string, any> = { 
        id: index, // Unique ID for each row
        rowIndex: index // Keep track of original row index
      };
      row.forEach((cell, colIndex) => {
        rowObj[`col_${colIndex}`] = cell;
      });
      return rowObj;
    });
  }, [data.data]);

  // ✅ FIXED: Renamed getRowNodeId to getRowId
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
        if (params.event?.ctrlKey || params.event?.metaKey) {
          setSelectedColumns(prev => 
            prev.includes(field) 
              ? prev.filter((f: string) => f !== field)
              : [...prev, field]
          );
        } else {
          setSelectedColumns([field]);
        }
      }
    }));
  }, [data.headers, selectedColumns]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  // ✅ Force grid refresh when data changes
  useEffect(() => {
    if (gridApi) {
      // Clear selection when data updates
      setSelectedColumns([]);
      // Refresh the grid to show new data
      gridApi.refreshCells();
    }
  }, [data, gridApi]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    if (!gridApi) return;
    
    const selectedNodes = gridApi.getSelectedNodes();
    const selectedRows = selectedNodes.map((node: any) => node.data.id);
    
    const columnIndices = selectedColumns.map(field => 
      parseInt(field.replace('col_', ''))
    );
    
    // ✅ Always notify parent about current selection state
    onSelectionChange({
      rows: selectedRows,
      columns: columnIndices,
      cells: [],
      selectedColumnFields: selectedColumns
    });
  }, [gridApi, selectedColumns, onSelectionChange]);
  
  // ✅ ADD THIS: Notify parent whenever column selection changes
  useEffect(() => {
    if (gridApi) {
      const selectedNodes = gridApi.getSelectedNodes();
      const selectedRows = selectedNodes.map((node: any) => node.data.id);
      
      const columnIndices = selectedColumns.map(field => 
        parseInt(field.replace('col_', ''))
      );
      
      // Notify parent about column selection changes
      onSelectionChange({
        rows: selectedRows,
        columns: columnIndices,
        cells: [],
        selectedColumnFields: selectedColumns
      });
    }
  }, [selectedColumns, gridApi, onSelectionChange]); // ✅ Trigger when selectedColumns changes
  
  const handleColumnHeaderClick = useCallback((field: string, event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      setSelectedColumns(prev => 
        prev.includes(field) 
          ? prev.filter((f: string) => f !== field)
          : [...prev, field]
      );
    } else {
      setSelectedColumns([field]);
    }
  }, []);

  return (
    <>
      <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <strong>Current Selection:</strong>
        {selectedColumns.length > 0 && (
          <span style={{ marginLeft: '10px' }}>
            Columns: {selectedColumns.map(field => data.headers[parseInt(field.replace('col_', ''))]).join(', ')}
          </span>
        )}
        <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
          💡 <strong>Tip:</strong> Click on any cell in a column to select it. Hold Ctrl+Click to select multiple columns.
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Quick Column Select:</strong>
        {data.headers.map((header, index) => (
          <button
            key={`col_${index}`}
            onClick={(e: any) => handleColumnHeaderClick(`col_${index}`, e)}
            style={{
              margin: '2px',
              padding: '4px 8px',
              backgroundColor: selectedColumns.includes(`col_${index}`) ? '#1976d2' : '#f0f0f0',
              color: selectedColumns.includes(`col_${index}`) ? 'white' : 'black',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {header}
          </button>
        ))}
        <button
          onClick={() => setSelectedColumns([])}
          style={{
            margin: '2px',
            padding: '4px 8px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear Selection
        </button>
      </div>

      <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          getRowId={getRowId} // ✅ FIXED: Changed from getRowNodeId to getRowId
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          rowSelection="multiple"
          suppressRowClickSelection={false}
          enableRangeSelection={true}
          enableCellTextSelection={true}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            editable: true,
          }}
          animateRows={true}
        />
      </div>

      <style>{`
        .selected-column-header {
          background-color: #1976d2 !important;
          color: white !important;
        }
      `}</style>
    </>
  );
};

export default AGDataGrid;
