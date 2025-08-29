export interface ExcelData {
    headers: string[];
    data: string[][];
    rowCount: number;
    columnCount: number;
  }
  
  export interface OperationRequest {
    operation: string;
    selectedRows?: number[];
    selectedColumns?: number[];
    parameters?: Record<string, any>;
    currentData?: ExcelData; // ✅ Add this line
  }
  
  export interface OperationResponse {
    success: boolean;
    message: string;
    data?: ExcelData;
  }
  
  // Enhanced selection interface
  export interface CellSelection {
    rows: number[];
    columns: number[];
    cells: {row: number, col: number}[];
    selectedColumnFields: string[]; // Added this
  }
  