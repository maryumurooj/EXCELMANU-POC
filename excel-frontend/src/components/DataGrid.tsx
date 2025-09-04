import React, { useEffect, useRef } from 'react';
import { DataGrid as MuiDataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { ExcelData } from '../types/ExcelTypes';
import './DataGrid.css';

interface DataGridProps {
  data: ExcelData;
  onSelectionChange: (selection: { rows: number[]; columns: string[] }) => void;
}

const DataGrid: React.FC<DataGridProps> = ({ data, onSelectionChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate column width to ensure full width utilization
  const calculateColumnWidth = () => {
    const minWidth = 200;
    const maxWidth = 800;
    const columnCount = data.headers.length;
    
    if (columnCount === 0) return minWidth;
    
    // For small tables, use larger columns to fill space
    if (columnCount <= 3) {
      return Math.max(minWidth, 400); // Force larger columns for small tables
    }
    
    // For larger tables, use reasonable column widths
    return Math.max(minWidth, Math.min(maxWidth, 300));
  };

  const columnWidth = calculateColumnWidth();

  const columns: GridColDef[] = data.headers.map((header, index) => ({
    field: `col_${index}`,
    headerName: header,
    width: columnWidth,
    minWidth: 150,
    maxWidth: 800,
    editable: true,
    flex: 1, // Make columns flexible
  }));

  const rows = data.data.map((row, index) => {
    const rowObj: Record<string, any> = { id: index };
    row.forEach((cell, colIndex) => {
      rowObj[`col_${colIndex}`] = cell;
    });
    return rowObj;
  });

  const handleSelectionModelChange = (selectionModel: GridRowSelectionModel) => {
    onSelectionChange({
        rows: selectionModel as unknown as number[],
        columns: [], // For simplicity, we'll handle column selection separately
    });
  };

  // Force the grid to expand to full width after render
  useEffect(() => {
    if (containerRef.current) {
      const forceFullWidth = () => {
        const container = containerRef.current;
        if (container) {
          // Force container to use full width
          container.style.width = '100%';
          container.style.minWidth = '100%';
          
          // Find and force the DataGrid to expand
          const dataGrid = container.querySelector('.MuiDataGrid-root');
          if (dataGrid) {
            (dataGrid as HTMLElement).style.width = '100%';
            (dataGrid as HTMLElement).style.minWidth = '100%';
            
            // Force internal elements to expand
            const main = dataGrid.querySelector('.MuiDataGrid-main');
            if (main) {
              (main as HTMLElement).style.width = '100%';
              (main as HTMLElement).style.minWidth = '100%';
            }
            
            const virtualScroller = dataGrid.querySelector('.MuiDataGrid-virtualScroller');
            if (virtualScroller) {
              (virtualScroller as HTMLElement).style.width = '100%';
              (virtualScroller as HTMLElement).style.minWidth = '100%';
            }
          }
        }
      };

      // Force width on mount and after a short delay
      forceFullWidth();
      setTimeout(forceFullWidth, 100);
      setTimeout(forceFullWidth, 500);
    }
  }, [data]);

  return (
    <div 
      ref={containerRef}
      className="data-grid-container" 
      style={{ 
        width: '100%', 
        minWidth: '100%',
        display: 'block'
      }}
    >
      <MuiDataGrid
        rows={rows}
        columns={columns}
        checkboxSelection
        onRowSelectionModelChange={handleSelectionModelChange}
        autoHeight={false}
        density="comfortable" // Use comfortable density for better spacing
        disableRowSelectionOnClick={false}
        getRowHeight={() => 60} // Increased row height for better readability
        sx={(theme) => ({
          width: '100%',
          minWidth: '100%',
          '& .MuiDataGrid-root': {
            width: '100% !important',
            minWidth: '100% !important',
          },
          '& .MuiDataGrid-main': {
            width: '100% !important',
            minWidth: '100% !important',
          },
          '& .MuiDataGrid-virtualScroller': {
            width: '100% !important',
            minWidth: '100% !important',
          },
          '& .MuiDataGrid-columnHeaders': {
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backgroundColor: theme.palette.primary.dark,
            color: theme.palette.getContrastText(theme.palette.primary.dark),
            boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
          },
          '& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitle, & .MuiDataGrid-columnHeaderDraggableContainer': {
            color: theme.palette.getContrastText(theme.palette.primary.dark) + ' !important',
          },
          '& .MuiDataGrid-columnHeader': {
            flex: 1,
            minWidth: 0,
            width: 'auto !important',
          },
          '& .MuiDataGrid-cell': {
            flex: 1,
            minWidth: 0,
            width: 'auto !important',
            backgroundColor: theme.palette.grey[100], // Stronger light background for visibility
          },
          '& .MuiDataGrid-row': {
            width: '100% !important',
            minWidth: '100% !important',
          },
        })}
      />
    </div>
  );
};

export default DataGrid;
