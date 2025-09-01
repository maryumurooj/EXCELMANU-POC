import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Typography,
  Stack,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Chip
} from "@mui/material";
import {
  Transform,
  Calculate,
  Tune,
  GetApp,
  ArrowDropDown,
  Link,
  FormatClear,
  TextFields,
  PivotTableChart,
  Functions,
  TrendingUp,
  Analytics
} from "@mui/icons-material";
import axios from "axios";
import { ExcelData, OperationRequest } from "../types/ExcelTypes";

interface ToolbarProps {
  selectedCells: {
    rows: number[];
    columns: number[];
    cells: { row: number; col: number }[];
    selectedColumnFields: string[];
  };
  onDataUpdate: (data: ExcelData) => void;
  currentData: ExcelData;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedCells,
  onDataUpdate,
  currentData,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState("");
  const [delimiter, setDelimiter] = useState("");
  const [caseType, setCaseType] = useState("upper");
  const [pivotDialogOpen, setPivotDialogOpen] = useState(false);
  const [pivotSettings, setPivotSettings] = useState({
    rowGroupColumn: 0,
    pivotColumn: 1,
    valueColumn: 2,
    aggregation: "sum",
  });

  const [newColumnName, setNewColumnName] = useState("");
  const [delimiters, setDelimiters] = useState<string[]>([]);

// Add new state for export menu
const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

// Export menu handlers
const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
  setExportMenuAnchor(event.currentTarget);
};

const handleExportMenuClose = () => {
  setExportMenuAnchor(null);
};

// Export handlers
const handleExportExcel = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5018/api/excel/export",
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "exported_data.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    handleExportMenuClose();
  } catch (error) {
    console.error("Excel export failed:", error);
  }
};

const handleExportJson = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5018/api/excel/export/json",
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "exported_data.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
    handleExportMenuClose();
  } catch (error) {
    console.error("JSON export failed:", error);
  }
};

const handleExportParquet = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5018/api/excel/export/parquet",
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "exported_data.parquet");
    document.body.appendChild(link);
    link.click();
    link.remove();
    handleExportMenuClose();
  } catch (error) {
    console.error("Parquet export failed:", error);
  }
};

  // Menu states
  const [transformMenuAnchor, setTransformMenuAnchor] = useState<null | HTMLElement>(null);
  const [calculateMenuAnchor, setCalculateMenuAnchor] = useState<null | HTMLElement>(null);
  const [cleanMenuAnchor, setCleanMenuAnchor] = useState<null | HTMLElement>(null);

  if (!currentData || !currentData.headers) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading toolbar...</Typography>
      </Box>
    );
  }

  const executeOperation = async (
    operation: string,
    parameters?: Record<string, any>
  ) => {
    try {
      const currentDataWithEdits = (window as any).getCurrentGridDataWithEdits
        ? (window as any).getCurrentGridDataWithEdits()
        : currentData;

      const request: OperationRequest = {
        operation,
        selectedColumns: selectedCells.columns,
        parameters,
      };

      const response = await axios.post(
        "http://localhost:5018/api/excel/operation",
        {
          ...request,
          currentData: currentDataWithEdits,
        }
      );

      if (response.data.success) {
        onDataUpdate(response.data.data);
      }
    } catch (error: any) {
      console.error("❌ Operation failed:", error);
    }
  };

  const canConcatenate = selectedCells.columns.length >= 2;
  const canTrim = selectedCells.columns.length >= 1;
  const canChangeCase = selectedCells.columns.length === 1;
  const canSort = selectedCells.columns.length === 1;
  const canCalculate = selectedCells.columns.length >= 1;

  // Transform Operations
  const handleTransformMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTransformMenuAnchor(event.currentTarget);
  };

  const handleTransformMenuClose = () => {
    setTransformMenuAnchor(null);
  };

  // Calculate Operations
  const handleCalculateMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCalculateMenuAnchor(event.currentTarget);
  };

  const handleCalculateMenuClose = () => {
    setCalculateMenuAnchor(null);
  };

  // Clean Operations
  const handleCleanMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCleanMenuAnchor(event.currentTarget);
  };

  const handleCleanMenuClose = () => {
    setCleanMenuAnchor(null);
  };

  // Operation handlers
  const handleConcatenate = () => {
    if (!canConcatenate) {
      alert("Please select at least 2 columns to concatenate");
      return;
    }
    
    // Initialize delimiters array with empty strings (one less than columns selected)
    const delimiterCount = selectedCells.columns.length - 1;
    setDelimiters(new Array(delimiterCount).fill(""));
    
    setCurrentOperation("concatenate");
    setDialogOpen(true);
    handleTransformMenuClose();
  };

  const handleChangeCase = () => {
    if (!canChangeCase) {
      alert("Please select exactly 1 column to change case");
      return;
    }
    setCurrentOperation("changecase");
    setDialogOpen(true);
    handleTransformMenuClose();
  };

  const handlePivot = () => {
    if (currentData.headers.length < 3) {
      alert("Need at least 3 columns to create a pivot table");
      return;
    }
    setPivotDialogOpen(true);
    handleTransformMenuClose();
  };

  const handleSort = (ascending: boolean) => {
    if (!canSort) {
      alert("Please select exactly 1 column to sort");
      return;
    }
    executeOperation("sort", { ascending });
    handleTransformMenuClose();
  };

  // Clean operations
  const handleTrim = () => {
    if (!canTrim) {
      alert("Please select at least 1 column to trim");
      return;
    }
    executeOperation("trim");
    handleCleanMenuClose();
  };

  const handleTrimAll = () => {
    if (window.confirm("This will trim all cells in the table. Continue?")) {
      executeOperation("trimall");
    }
    handleCleanMenuClose();
  };

// Calculate operations - update to open dialogs for custom naming
const handleSum = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to sum");
    return;
  }
  setCurrentOperation("sum");
  setDialogOpen(true);
  handleCalculateMenuClose();
};

const handleAverage = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to calculate average");
    return;
  }
  setCurrentOperation("average");
  setDialogOpen(true);
  handleCalculateMenuClose();
};

const handleMin = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to find minimum");
    return;
  }
  setCurrentOperation("min");
  setDialogOpen(true);
  handleCalculateMenuClose();
};

const handleMax = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to find maximum");
    return;
  }
  setCurrentOperation("max");
  setDialogOpen(true);
  handleCalculateMenuClose();
};

const handleCount = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to count values");
    return;
  }
  setCurrentOperation("count");
  setDialogOpen(true);
  handleCalculateMenuClose();
};

const handleMedian = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to calculate median");
    return;
  }
  setCurrentOperation("median");
  setDialogOpen(true);
  handleCalculateMenuClose();
};

const handleMultiply = () => {
  if (selectedCells.columns.length < 2) {
    alert("Please select at least 2 columns to multiply");
    return;
  }
  setCurrentOperation("multiply");
  setDialogOpen(true);
  handleCalculateMenuClose();
};


const handleDialogConfirm = () => {
  const customName = newColumnName.trim();
  
  switch (currentOperation) {
    case "concatenate":
      executeOperation("concatenate", { 
        delimiters: delimiters, // ✅ Pass delimiters array
        newColumnName: customName || "Concatenated"
      });
      break;
    case "changecase":
      executeOperation("changecase", { caseType });
      break;
    case "sum":
      executeOperation("sum", {
        newColumnName: customName || "Sum"
      });
      break;
    case "average":
      executeOperation("average", {
        newColumnName: customName || "Average"
      });
      break;
    case "min":
      executeOperation("min", {
        newColumnName: customName || "Minimum"
      });
      break;
    case "max":
      executeOperation("max", {
        newColumnName: customName || "Maximum"
      });
      break;
    case "count":
      executeOperation("count", {
        newColumnName: customName || "Count"
      });
      break;
    case "median":
      executeOperation("median", {
        newColumnName: customName || "Median"
      });
      break;
    case "multiply":
      executeOperation("multiply", {
        newColumnName: customName || "Product"
      });
      break;
  }
  
  setDialogOpen(false);
  setDelimiter("");
  setNewColumnName(""); // Reset custom name
  setDelimiters([]); // ✅ Reset delimiters array
};


  const handlePivotConfirm = () => {
    executeOperation("pivot", {
      rowGroupColumn: pivotSettings.rowGroupColumn,
      pivotColumn: pivotSettings.pivotColumn,
      valueColumn: pivotSettings.valueColumn,
      aggregation: pivotSettings.aggregation,
    });
    setPivotDialogOpen(false);
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5018/api/excel/export",
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "exported_data.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <Box>
      {/* Selection Info */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Selection:
          </Typography>
          {selectedCells.columns.length > 0 ? (
            <Chip 
              label={`${selectedCells.columns.length} column(s) selected`}
              color="primary"
              size="small"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No columns selected
            </Typography>
          )}
        </Stack>
      </Paper>

      {/* Main Toolbar */}
      <Stack direction="row" spacing={2} flexWrap="wrap">
        
        {/* Transform Operations */}
        <Button
          variant="contained"
          startIcon={<Transform />}
          endIcon={<ArrowDropDown />}
          onClick={handleTransformMenuOpen}
          sx={{ minWidth: 140 }}
        >
          Transform
        </Button>
        <Menu
          anchorEl={transformMenuAnchor}
          open={Boolean(transformMenuAnchor)}
          onClose={handleTransformMenuClose}
        >
          <MenuItem onClick={handleConcatenate} disabled={!canConcatenate}>
            <ListItemIcon><Link /></ListItemIcon>
            <ListItemText>Concatenate Columns</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleChangeCase} disabled={!canChangeCase}>
            <ListItemIcon><TextFields /></ListItemIcon>
            <ListItemText>Change Case</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleSort(true)} disabled={!canSort}>
            <ListItemIcon><TrendingUp /></ListItemIcon>
            <ListItemText>Sort Ascending</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleSort(false)} disabled={!canSort}>
            <ListItemIcon><TrendingUp style={{ transform: 'rotate(180deg)' }} /></ListItemIcon>
            <ListItemText>Sort Descending</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handlePivot} disabled={currentData.headers.length < 3}>
            <ListItemIcon><PivotTableChart /></ListItemIcon>
            <ListItemText>Create Pivot Table</ListItemText>
          </MenuItem>
        </Menu>

        {/* Calculate Operations */}
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Calculate />}
          endIcon={<ArrowDropDown />}
          onClick={handleCalculateMenuOpen}
          disabled={!canCalculate}
          sx={{ minWidth: 140 }}
        >
          Calculate
        </Button>
        <Menu
          anchorEl={calculateMenuAnchor}
          open={Boolean(calculateMenuAnchor)}
          onClose={handleCalculateMenuClose}
        >
          <MenuItem onClick={handleSum}>
            <ListItemIcon><Functions /></ListItemIcon>
            <ListItemText>Sum</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleAverage}>
            <ListItemIcon><Analytics /></ListItemIcon>
            <ListItemText>Average</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMin}>
            <ListItemIcon><TrendingUp style={{ transform: 'rotate(180deg)' }} /></ListItemIcon>
            <ListItemText>Minimum</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMax}>
            <ListItemIcon><TrendingUp /></ListItemIcon>
            <ListItemText>Maximum</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleCount}>
            <ListItemIcon><Functions /></ListItemIcon>
            <ListItemText>Count Values</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMedian}>
            <ListItemIcon><Analytics /></ListItemIcon>
            <ListItemText>Median</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMultiply} disabled={selectedCells.columns.length < 2}>
            <ListItemIcon><Functions /></ListItemIcon>
            <ListItemText>Multiply Columns</ListItemText>
          </MenuItem>
        </Menu>

        {/* Clean Operations */}
        <Button
          variant="outlined"
          startIcon={<Tune />}
          endIcon={<ArrowDropDown />}
          onClick={handleCleanMenuOpen}
          sx={{ minWidth: 120 }}
        >
          Clean
        </Button>
        <Menu
          anchorEl={cleanMenuAnchor}
          open={Boolean(cleanMenuAnchor)}
          onClose={handleCleanMenuClose}
        >
          <MenuItem onClick={handleTrim} disabled={!canTrim}>
            <ListItemIcon><FormatClear /></ListItemIcon>
            <ListItemText>Trim Selected</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleTrimAll}>
            <ListItemIcon><FormatClear /></ListItemIcon>
            <ListItemText>Trim All Cells</ListItemText>
          </MenuItem>
        </Menu>

        {/* Export */}
{/* Export Dropdown */}
<Button
  variant="outlined"
  startIcon={<GetApp />}
  endIcon={<ArrowDropDown />}
  onClick={handleExportMenuOpen}
  sx={{ minWidth: 120, ml: 'auto' }}
>
  Export
</Button>
<Menu
  anchorEl={exportMenuAnchor}
  open={Boolean(exportMenuAnchor)}
  onClose={handleExportMenuClose}
>
  <MenuItem onClick={handleExportExcel}>
    <ListItemIcon><GetApp /></ListItemIcon>
    <ListItemText>Export as Excel (.xlsx)</ListItemText>
  </MenuItem>
  <MenuItem onClick={handleExportJson}>
    <ListItemIcon><GetApp /></ListItemIcon>
    <ListItemText>Export as JSON (.json)</ListItemText>
  </MenuItem>
  <MenuItem onClick={handleExportParquet}>
    <ListItemIcon><GetApp /></ListItemIcon>
    <ListItemText>Export as Parquet (.parquet)</ListItemText>
  </MenuItem>
</Menu>

      </Stack>

      {/* Dialogs remain the same... */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
  <DialogTitle>
    {currentOperation === "concatenate" && "Concatenate Columns"}
    {currentOperation === "changecase" && "Change Case"}
    {currentOperation === "sum" && "Sum Columns"}
    {currentOperation === "average" && "Average Columns"}
    {currentOperation === "min" && "Find Minimum"}
    {currentOperation === "max" && "Find Maximum"}
    {currentOperation === "count" && "Count Values"}
    {currentOperation === "median" && "Calculate Median"}
    {currentOperation === "multiply" && "Multiply Columns"}
  </DialogTitle>
  <DialogContent>
    {/* ✅ Add custom column name input for operations that create new columns */}
    {["concatenate", "sum", "average", "min", "max", "count", "median", "multiply"].includes(currentOperation) && (
      <TextField
        margin="dense"
        label="New Column Name"
        fullWidth
        variant="outlined"
        value={newColumnName}
        onChange={(e) => setNewColumnName(e.target.value)}
        placeholder={`Default: ${
          currentOperation === "concatenate" ? "Concatenated" :
          currentOperation === "sum" ? "Sum" :
          currentOperation === "average" ? "Average" :
          currentOperation === "min" ? "Minimum" :
          currentOperation === "max" ? "Maximum" :
          currentOperation === "count" ? "Count" :
          currentOperation === "median" ? "Median" :
          currentOperation === "multiply" ? "Product" : "Result"
        }`}
        sx={{ mb: 2 }}
      />
    )}

{currentOperation === "concatenate" && (
  <>
    {/* ✅ Custom column name input */}
   
   

    <Alert severity="info" sx={{ mb: 2 }}>
      Concatenating columns:{" "}
      {selectedCells.columns
        .map((colIndex) => currentData.headers[colIndex])
        .join(", ")}
    </Alert>

    {/* ✅ Multiple delimiter inputs - FIXED */}
    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
      Delimiters between columns:
    </Typography>
    
    {selectedCells.columns.length > 1 && 
      selectedCells.columns.slice(0, -1).map((colIndex, index) => (
        <TextField
          key={`delimiter-${index}`}
          margin="dense"
          label={`Between "${currentData.headers[colIndex]}" and "${currentData.headers[selectedCells.columns[index + 1]]}"`}
          fullWidth
          variant="outlined"
          value={delimiters[index] || ""}
          onChange={(e) => {
            const newDelimiters = [...delimiters];
            newDelimiters[index] = e.target.value;
            setDelimiters(newDelimiters);
          }}
          placeholder="Enter delimiter (e.g., -, /, |, space, etc.)"
          sx={{ mb: 1 }}
        />
      ))
    }
    
    {/* ✅ Preview of result */}
    <Alert severity="success" sx={{ mt: 2 }}>
      <strong>Preview:</strong> {selectedCells.columns
        .map((colIndex) => currentData.headers[colIndex])
        .reduce((acc, header, index) => {
          if (index === 0) return header;
          const delimiter = delimiters[index - 1] || "";
          return acc + delimiter + header;
        }, "")}
    </Alert>
  </>
)}


    {currentOperation === "changecase" && (
      <>
        <Alert severity="info" sx={{ mb: 2 }}>
          Changing case for column:{" "}
          {currentData.headers[selectedCells.columns[0]] || 'Unknown'}
        </Alert>
        <FormControl fullWidth margin="dense">
          <InputLabel>Case Type</InputLabel>
          <Select
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
          >
            <MenuItem value="upper">UPPERCASE</MenuItem>
            <MenuItem value="lower">lowercase</MenuItem>
            <MenuItem value="title">Title Case</MenuItem>
          </Select>
        </FormControl>
      </>
    )}

    {["sum", "average", "min", "max", "count", "median", "multiply"].includes(currentOperation) && (
      <Alert severity="info" sx={{ mb: 2 }}>
        Calculating {currentOperation} for columns:{" "}
        {selectedCells.columns
          .map((colIndex) => currentData.headers[colIndex])
          .join(", ")}
      </Alert>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
    <Button onClick={handleDialogConfirm} variant="contained">
      Apply
    </Button>
  </DialogActions>
</Dialog>


      {/* Pivot Dialog remains the same... */}
      <Dialog
        open={pivotDialogOpen}
        onClose={() => setPivotDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Pivot Table</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Create a pivot table to summarize and analyze your data.
          </Alert>

          <FormControl fullWidth margin="dense">
            <InputLabel>Row Group By</InputLabel>
            <Select
              value={pivotSettings.rowGroupColumn}
              onChange={(e) =>
                setPivotSettings((prev) => ({
                  ...prev,
                  rowGroupColumn: Number(e.target.value),
                }))
              }
            >
              {currentData.headers.map((header, index) => (
                <MenuItem key={index} value={index}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Pivot By (Columns)</InputLabel>
            <Select
              value={pivotSettings.pivotColumn}
              onChange={(e) =>
                setPivotSettings((prev) => ({
                  ...prev,
                  pivotColumn: Number(e.target.value),
                }))
              }
            >
              {currentData.headers.map((header, index) => (
                <MenuItem key={index} value={index}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Values (Aggregate)</InputLabel>
            <Select
              value={pivotSettings.valueColumn}
              onChange={(e) =>
                setPivotSettings((prev) => ({
                  ...prev,
                  valueColumn: Number(e.target.value),
                }))
              }
            >
              {currentData.headers.map((header, index) => (
                <MenuItem key={index} value={index}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Aggregation Function</InputLabel>
            <Select
              value={pivotSettings.aggregation}
              onChange={(e) =>
                setPivotSettings((prev) => ({
                  ...prev,
                  aggregation: e.target.value,
                }))
              }
            >
              <MenuItem value="sum">Sum</MenuItem>
              <MenuItem value="avg">Average</MenuItem>
              <MenuItem value="count">Count</MenuItem>
              <MenuItem value="min">Minimum</MenuItem>
              <MenuItem value="max">Maximum</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPivotDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePivotConfirm}
            variant="contained"
            disabled={
              pivotSettings.rowGroupColumn === pivotSettings.pivotColumn ||
              pivotSettings.rowGroupColumn === pivotSettings.valueColumn ||
              pivotSettings.pivotColumn === pivotSettings.valueColumn
            }
          >
            Create Pivot
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Toolbar;
