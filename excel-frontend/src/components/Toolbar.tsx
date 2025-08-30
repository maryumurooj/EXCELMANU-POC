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
  Paper,
  Typography,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add as AddIcon,
  ContentCut as TrimIcon,
  TextFields as TextIcon,
  Sort as SortIcon,
  Functions as MathIcon,
  TableChart as PivotIcon,
  Download as ExportIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
      <Paper sx={{ mb: 2, p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Loading toolbar...
        </Typography>
      </Paper>
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

  const getSelectedColumnsText = () => {
    if (selectedCells.columns.length === 0) return "No columns selected";
    return selectedCells.columns
      .map((colIndex) => currentData.headers[colIndex])
      .join(", ");
  };

  const getStatusColor = () => {
    if (selectedCells.columns.length === 0) return "default";
    if (selectedCells.columns.length === 1) return "primary";
    return "success";
  };

  return (
    <>
      {/* Selection Info */}
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 3, 
          p: 3,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InfoIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Current Selection
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip 
            label={`${selectedCells.columns.length} column(s)`}
            color={getStatusColor()}
            size="medium"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {getSelectedColumnsText()}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
          💡 <strong>Tip:</strong> Click on any column header or use the quick selection chips below to select columns for operations.
        </Typography>
      </Paper>

      {/* Operations Accordion */}
      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Data Operations
            </Typography>
            <Chip 
              label="Click to expand" 
              size="small" 
              variant="outlined" 
              color="primary"
              sx={{ ml: 1 }}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
            Select columns first, then choose an operation. Each operation type has specific requirements shown below.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* Text Operations */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                📝 Text Operations
                <Chip label="Text & String Manipulation" size="small" variant="outlined" />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manipulate text data in your columns with various operations.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Tooltip title={canConcatenate ? "Combine multiple columns into one" : "Select 2+ columns to concatenate"}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleConcatenate}
                      disabled={!canConcatenate}
                      sx={{ 
                        minWidth: 160,
                        borderColor: canConcatenate ? 'primary.main' : 'divider',
                        color: canConcatenate ? 'primary.main' : 'text.disabled'
                      }}
                    >
                      Concatenate Columns
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title="Remove extra spaces from column data">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<TrimIcon />}
                      onClick={handleTrimSingle}
                      disabled={!canTrimSingle}
                      sx={{ minWidth: 140 }}
                    >
                      Trim Column
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title="Remove spaces from multiple columns at once">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<TrimIcon />}
                      onClick={handleTrimMultiple}
                      disabled={!canTrimMultiple}
                      sx={{ minWidth: 160 }}
                    >
                      Trim Multiple Columns
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title="Remove all extra spaces from the entire dataset">
                  <span>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<TrimIcon />}
                      onClick={handleTrimAll}
                      disabled={!canTrimAll}
                      sx={{ minWidth: 120 }}
                    >
                      Trim All Data
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title="Remove spaces from specific selected cells only">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<TrimIcon />}
                      onClick={handleTrimCells}
                      disabled={!canTrimCells}
                      sx={{ minWidth: 140 }}
                    >
                      Trim Selected Cells
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            {/* Case Operations */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                🔤 Case Operations
                <Chip label="Text Case Transformation" size="small" variant="outlined" />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Transform text case for better consistency and readability.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Tooltip title={canChangeCase ? "Change text case (UPPER, lower, Title)" : "Select exactly 1 column to change case"}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<TextIcon />}
                      onClick={handleChangeCase}
                      disabled={!canChangeCase}
                      sx={{ minWidth: 160 }}
                    >
                      Change Text Case
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            {/* Sorting */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                🔄 Sorting
                <Chip label="Data Organization" size="small" variant="outlined" />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Organize your data by sorting columns in ascending or descending order.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Tooltip title="Sort data from lowest to highest (A-Z, 1-9)">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<SortIcon />}
                      onClick={() => handleSort(true)}
                      disabled={!canSort}
                      sx={{ minWidth: 140 }}
                    >
                      Sort Ascending ↑
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title="Sort data from highest to lowest (Z-A, 9-1)">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<SortIcon />}
                      onClick={() => handleSort(false)}
                      disabled={!canSort}
                      sx={{ minWidth: 140 }}
                    >
                      Sort Descending ↓
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            {/* Mathematical Operations */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                🧮 Mathematical Operations
                <Chip label="Calculations & Statistics" size="small" variant="outlined" />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Perform mathematical calculations and statistical analysis on numeric columns.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Tooltip title={canSum ? "Calculate sum of numeric values" : "Select at least 1 numeric column"}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<MathIcon />}
                      onClick={handleSum}
                      disabled={!canSum}
                      sx={{ minWidth: 100 }}
                    >
                      Sum
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title={canCalculate ? "Calculate average (mean) of values" : "Select at least 1 numeric column"}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<MathIcon />}
                      onClick={handleAverage}
                      disabled={!canCalculate}
                      sx={{ minWidth: 120 }}
                    >
                      Average
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title={canCalculate ? "Find the smallest value" : "Select at least 1 numeric column"}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<MathIcon />}
                      onClick={handleMin}
                      disabled={!canCalculate}
                      sx={{ minWidth: 100 }}
                    >
                      Minimum
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title={canCalculate ? "Find the largest value" : "Select at least 1 numeric column"}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<MathIcon />}
                      onClick={handleMax}
                      disabled={!canCalculate}
                      sx={{ minWidth: 100 }}
                    >
                      Maximum
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title={canCalculate ? "Count non-empty values" : "Select at least 1 column"}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<MathIcon />}
                      onClick={handleCount}
                      disabled={!canCalculate}
                      sx={{ minWidth: 100 }}
                    >
                      Count
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title={selectedCells.columns.length >= 2 ? "Multiply values across columns" : "Select at least 2 numeric columns"}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<MathIcon />}
                      onClick={handleMultiply}
                      disabled={selectedCells.columns.length < 2}
                      sx={{ minWidth: 140 }}
                    >
                      Multiply
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title={canCalculate ? "Calculate median (middle value)" : "Select at least 1 numeric column"}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<MathIcon />}
                      onClick={handleMedian}
                      disabled={!canCalculate}
                      sx={{ minWidth: 120 }}
                    >
                      Median
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            {/* Advanced Operations */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 Advanced Operations
                <Chip label="Complex Data Analysis" size="small" variant="outlined" />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create pivot tables and perform advanced data analysis operations.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Tooltip title="Create a pivot table to summarize and analyze data">
                  <span>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<PivotIcon />}
                      onClick={handlePivot}
                      disabled={currentData.headers.length < 3}
                      sx={{ minWidth: 180 }}
                    >
                      Create Pivot Table
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Export Section */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ExportIcon />}
          onClick={handleExport}
          sx={{ 
            px: 3,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Export Excel
        </Button>
      </Box>

      {/* Dialogs */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: theme.palette.primary.main,
          color: 'white'
        }}>
          {currentOperation === "concatenate"
            ? "Concatenate Columns"
            : "Change Case"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {currentOperation === "concatenate" && (
            <>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Concatenating columns:</strong>{" "}
                  {selectedCells.columns
                    .map((colIndex) => currentData.headers[colIndex])
                    .join(", ")}
                </Typography>
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
                sx={{ borderRadius: 2 }}
              />
            </>
          )}
          {currentOperation === "changecase" && (
            <>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Changing case for column:</strong>{" "}
                  {currentData.headers[selectedCells.columns[0]] || 'Unknown'}
                </Typography>
              </Alert>
              <FormControl fullWidth margin="dense">
                <InputLabel>Case Type</InputLabel>
                <Select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="upper">UPPERCASE</MenuItem>
                  <MenuItem value="lower">lowercase</MenuItem>
                  <MenuItem value="title">Title Case</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDialogConfirm} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={pivotDialogOpen}
        onClose={() => setPivotDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: theme.palette.secondary.main,
          color: 'white'
        }}>
          Create Pivot Table
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              Create a pivot table to summarize and analyze your data.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                sx={{ borderRadius: 2 }}
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
                sx={{ borderRadius: 2 }}
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
                sx={{ borderRadius: 2 }}
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
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="sum">Sum</MenuItem>
                <MenuItem value="avg">Average</MenuItem>
                <MenuItem value="count">Count</MenuItem>
                <MenuItem value="min">Minimum</MenuItem>
                <MenuItem value="max">Maximum</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setPivotDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePivotConfirm}
            variant="contained"
            color="secondary"
            disabled={
              pivotSettings.rowGroupColumn === pivotSettings.pivotColumn ||
              pivotSettings.rowGroupColumn === pivotSettings.valueColumn ||
              pivotSettings.pivotColumn === pivotSettings.valueColumn
            }
            sx={{ 
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            Create Pivot
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Toolbar;
