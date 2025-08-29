import React, { useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
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
} from "@mui/material";
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
  // ✅ ALL hooks declared FIRST, unconditionally
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

  // ✅ NOW safe to do early return after hooks
  if (!currentData || !currentData.headers) {
    return (
      <Box sx={{ mb: 2, p: 2, textAlign: 'center' }}>
        Loading toolbar...
      </Box>
    );
  }

  // ✅ Your existing functions and logic here
  const executeOperation = async (
    operation: string,
    parameters?: Record<string, any>
  ) => {
    try {
      const currentDataWithEdits = (window as any).getCurrentGridDataWithEdits
        ? (window as any).getCurrentGridDataWithEdits()
        : currentData;

      console.log("🔄 Data with edits before operation:", currentDataWithEdits);

      const request: OperationRequest = {
        operation,
        selectedColumns: selectedCells.columns,
        parameters,
      };

      console.log("🚀 Executing operation:", operation, "on columns:", selectedCells.columns);

      const response = await axios.post(
        "http://localhost:5018/api/excel/operation",
        {
          ...request,
          currentData: currentDataWithEdits,
        }
      );

      console.log("📥 Response:", response.data);

      if (response.data.success) {
        console.log("✅ New data:", response.data.data);
        onDataUpdate(response.data.data);
      }
    } catch (error: any) {
      console.error("❌ Operation failed:", error);
      console.error("Error details:", error.response?.data);
    }
  };

  // Check if operations can be performed based on selection
  const canConcatenate = selectedCells.columns.length >= 2;
  const canTrim = selectedCells.columns.length === 1;
  const canChangeCase = selectedCells.columns.length === 1;
  const canSort = selectedCells.columns.length === 1;
  const canSum = selectedCells.columns.length >= 1;

  const handleConcatenate = () => {
    if (!canConcatenate) {
      alert("Please select at least 2 columns to concatenate");
      return;
    }
    setCurrentOperation("concatenate");
    setDialogOpen(true);
  };

  const handleTrim = () => {
    if (!canTrim) {
      alert("Please select exactly 1 column to trim");
      return;
    }
    executeOperation("trim");
  };

  const handlePivot = () => {
    if (currentData.headers.length < 3) {
      alert("Need at least 3 columns to create a pivot table");
      return;
    }
    setPivotDialogOpen(true);
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

  const handleChangeCase = () => {
    if (!canChangeCase) {
      alert("Please select exactly 1 column to change case");
      return;
    }
    setCurrentOperation("changecase");
    setDialogOpen(true);
  };

  const handleSort = (ascending: boolean) => {
    if (!canSort) {
      alert("Please select exactly 1 column to sort");
      return;
    }
    executeOperation("sort", { ascending });
  };

  const handleSum = () => {
    if (!canSum) {
      alert("Please select at least 1 column to sum");
      return;
    }
    executeOperation("sum");
  };

  const handleDialogConfirm = () => {
    switch (currentOperation) {
      case "concatenate":
        executeOperation("concatenate", { delimiter });
        break;
      case "changecase":
        executeOperation("changecase", { caseType });
        break;
    }
    setDialogOpen(false);
    setDelimiter("");
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

  const canTrimSingle = selectedCells.columns.length === 1;
  const canTrimMultiple = selectedCells.columns.length >= 1;
  const canTrimAll = currentData.data.length > 0;
  const canTrimCells = selectedCells.cells.length > 0;

  const handleTrimSingle = () => {
    if (!canTrimSingle) {
      alert("Please select exactly 1 column to trim");
      return;
    }
    executeOperation("trim");
  };

  const handleTrimMultiple = () => {
    if (!canTrimMultiple) {
      alert("Please select at least 1 column to trim");
      return;
    }
    executeOperation("trimcolumns");
  };

  const handleTrimAll = () => {
    if (window.confirm("This will trim all cells in the table. Continue?")) {
      executeOperation("trimall");
    }
  };

  const handleTrimCells = () => {
    if (!canTrimCells) {
      alert("Please select specific cells to trim");
      return;
    }
    executeOperation("trimcells", {
      cellCoordinates: selectedCells.cells,
    });
  };

  
const canCalculate = selectedCells.columns.length >= 1;

const handleAverage = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to calculate average");
    return;
  }
  executeOperation("average");
};

const handleMin = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to find minimum");
    return;
  }
  executeOperation("min");
};

const handleMax = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to find maximum");
    return;
  }
  executeOperation("max");
};

const handleCount = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to count values");
    return;
  }
  executeOperation("count");
};

const handleMultiply = () => {
  if (selectedCells.columns.length < 2) {
    alert("Please select at least 2 columns to multiply");
    return;
  }
  executeOperation("multiply");
};

const handleMedian = () => {
  if (!canCalculate) {
    alert("Please select at least 1 column to calculate median");
    return;
  }
  executeOperation("median");
};

  return (
    <>
      <Box sx={{ mb: 2 }}>
        {/* Selection Info */}
        <Box sx={{ mb: 2, p: 1, backgroundColor: "#f0f0f0", borderRadius: 1 }}>
          <strong>Selected:</strong>
          {selectedCells.columns.length > 0 ? (
            <>
              <span style={{ marginLeft: "8px" }}>
                {selectedCells.columns.length} column(s) -
                {selectedCells.columns
                  .map((colIndex) => currentData.headers[colIndex])
                  .join(", ")}
              </span>
            </>
          ) : (
            <span style={{ marginLeft: "8px" }}>No columns selected</span>
          )}
        </Box>

        <ButtonGroup variant="outlined" sx={{ mb: 1, mr: 1 }}>
          <Button
            onClick={handleConcatenate}
            disabled={!canConcatenate}
            title={
              canConcatenate
                ? "Concatenate selected columns"
                : "Select 2+ columns"
            }
          >
            Concatenate ({selectedCells.columns.length >= 2 ? "✓" : "✗"})
          </Button>
        </ButtonGroup>

        <ButtonGroup variant="outlined" sx={{ mb: 1, mr: 1 }}>
          <Button
            onClick={handleTrimSingle}
            disabled={!canTrimSingle}
            title="Trim one column"
          >
            Trim Column ({selectedCells.columns.length === 1 ? "✓" : "✗"})
          </Button>
          <Button
            onClick={handleTrimMultiple}
            disabled={!canTrimMultiple}
            title="Trim multiple columns"
          >
            Trim Columns ({selectedCells.columns.length >= 1 ? "✓" : "✗"})
          </Button>
          <Button
            onClick={handleTrimAll}
            disabled={!canTrimAll}
            title="Trim all cells in table"
            color="warning"
          >
            Trim All
          </Button>
          <Button
            onClick={handleTrimCells}
            disabled={!canTrimCells}
            title="Trim selected cells"
          >
            Trim Cells ({selectedCells.cells.length > 0 ? "✓" : "✗"})
          </Button>
        </ButtonGroup>

        <ButtonGroup variant="outlined" sx={{ mb: 1, mr: 1 }}>
          <Button
            onClick={handleChangeCase}
            disabled={!canChangeCase}
            title={
              canChangeCase
                ? "Change case of selected column"
                : "Select exactly 1 column"
            }
          >
            Change Case ({selectedCells.columns.length === 1 ? "✓" : "✗"})
          </Button>
        </ButtonGroup>

        <ButtonGroup variant="outlined" sx={{ mb: 1, mr: 1 }}>
          <Button
            onClick={handlePivot}
            disabled={currentData.headers.length < 3}
            title="Create pivot table"
            color="secondary"
          >
            📊 Create Pivot Table
          </Button>
        </ButtonGroup>

        <ButtonGroup variant="outlined" sx={{ mb: 1, mr: 1 }}>
  <Button
    onClick={handleSum}
    disabled={!canSum}
    title={canSum ? "Sum selected columns" : "Select at least 1 column"}
  >
    Sum ({selectedCells.columns.length >= 1 ? "✓" : "✗"})
  </Button>
  <Button
    onClick={handleAverage}
    disabled={!canCalculate}
    title={canCalculate ? "Average selected columns" : "Select at least 1 column"}
  >
    Average ({canCalculate ? "✓" : "✗"})
  </Button>
  <Button
    onClick={handleMin}
    disabled={!canCalculate}
    title={canCalculate ? "Find minimum" : "Select at least 1 column"}
  >
    Min ({canCalculate ? "✓" : "✗"})
  </Button>
  <Button
    onClick={handleMax}
    disabled={!canCalculate}
    title={canCalculate ? "Find maximum" : "Select at least 1 column"}
  >
    Max ({canCalculate ? "✓" : "✗"})
  </Button>
</ButtonGroup>

<ButtonGroup variant="outlined" sx={{ mb: 1, mr: 1 }}>
  <Button
    onClick={handleCount}
    disabled={!canCalculate}
    title={canCalculate ? "Count non-empty values" : "Select at least 1 column"}
  >
    Count ({canCalculate ? "✓" : "✗"})
  </Button>
  <Button
    onClick={handleMultiply}
    disabled={selectedCells.columns.length < 2}
    title={selectedCells.columns.length >= 2 ? "Multiply selected columns" : "Select at least 2 columns"}
  >
    Multiply ({selectedCells.columns.length >= 2 ? "✓" : "✗"})
  </Button>
  <Button
    onClick={handleMedian}
    disabled={!canCalculate}
    title={canCalculate ? "Calculate median" : "Select at least 1 column"}
  >
    Median ({canCalculate ? "✓" : "✗"})
  </Button>
</ButtonGroup>

        <Button variant="contained" color="primary" onClick={handleExport}>
          Export Excel
        </Button>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {currentOperation === "concatenate"
            ? "Concatenate Columns"
            : "Change Case"}
        </DialogTitle>
        <DialogContent>
          {currentOperation === "concatenate" && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Concatenating columns:{" "}
                {selectedCells.columns
                  .map((colIndex) => currentData.headers[colIndex])
                  .join(", ")}
              </Alert>
              <TextField
                autoFocus
                margin="dense"
                label="Delimiter (leave empty for no delimiter)"
                fullWidth
                variant="outlined"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                placeholder="e.g., -, |, space, etc."
              />
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDialogConfirm} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
};

export default Toolbar;
