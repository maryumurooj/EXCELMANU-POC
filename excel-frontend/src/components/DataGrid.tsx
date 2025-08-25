import React from 'react';
import { DataGrid as MuiDataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { ExcelData } from '../types/ExcelTypes';

interface DataGridProps {
  data: ExcelData;
  onSelectionChange: (selection: { rows: number[]; columns: number[] }) => void;
}

const DataGrid: React.FC<DataGridProps> = ({ data, onSelectionChange }) => {
  const columns: GridColDef[] = data.headers.map((header, index) => ({
    field: `col_${index}`,
    headerName: header,
    width: 150,
    editable: true,
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

  return (
    <div style={{ height: 600, width: '100%' }}>
      <MuiDataGrid
        rows={rows}
        columns={columns}
        checkboxSelection
        onRowSelectionModelChange={handleSelectionModelChange}
        sx={{
          '& .MuiDataGrid-cell:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
          },
        }}
      />
    </div>
  );
};

export default DataGrid;
