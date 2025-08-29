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
          getRowId={getRowId}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          onCellValueChanged={onCellValueChanged} // ✅ Add this handler
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
          // ✅ Enable undo/redo for better UX
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={20}
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
