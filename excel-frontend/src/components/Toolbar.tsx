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
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
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
  Analytics,
  CallSplit, // ✅ Add this import
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
  // ✅ Add these new properties
  sheets: string[];
  activeSheet: string;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedCells,
  onDataUpdate,
  currentData,
  sheets,      // ✅ Destructure from props
  activeSheet, // ✅ Destructure from props
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

  // Add new state for constant text concatenation
  const [constantText, setConstantText] = useState("");
  const [position, setPosition] = useState<"prefix" | "suffix">("suffix");

  const [newColumnName, setNewColumnName] = useState("");
  const [delimiters, setDelimiters] = useState<string[]>([]);

  // Add new state for split dialog
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitSettings, setSplitSettings] = useState({
    delimiter: ",",
    maxSplits: "",
    columnBaseName: "",
  });
  // Add new state for export menu
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Add new state for export options
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    scope: "current", // "current" or "all"
    format: "excel", // "excel", "json", "parquet"
  });

  const handleExportConfirm = async () => {
    try {
      setExportOptionsOpen(false);
      
      const { scope, format } = exportSettings;
      const exportAllSheets = scope === "all";
      
      console.log(`Exporting ${scope} sheet(s) as ${format}`);
      
      const response = await axios.get(
        `http://localhost:5018/api/excel/export?format=${format}&exportAllSheets=${exportAllSheets}`,
        { responseType: "blob" }
      );
  
      const fileExtension = format === "excel" ? "xlsx" : format;
      const fileName = `export_${scope}_sheet${scope === "all" ? "s" : ""}.${fileExtension}`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      console.log(`✅ Export completed: ${fileName}`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  };
  

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
  const [transformMenuAnchor, setTransformMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [calculateMenuAnchor, setCalculateMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [cleanMenuAnchor, setCleanMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  if (!currentData || !currentData.headers) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
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

  const canConcatenate = selectedCells.columns.length >= 1;
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
    if (selectedCells.columns.length < 1) {
      alert("Please select at least 1 column to concatenate");
      return;
    }

    // Initialize delimiters array (only for multi-column)
    if (selectedCells.columns.length > 1) {
      const delimiterCount = selectedCells.columns.length - 1;
      setDelimiters(new Array(delimiterCount).fill(""));
    } else {
      setDelimiters([]);
    }

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

  const handleSplit = () => {
    if (selectedCells.columns.length !== 1) {
      alert("Please select exactly 1 column to split");
      return;
    }

    // Initialize split settings
    setSplitSettings({
      delimiter: ",",
      maxSplits: "",
      columnBaseName: "",
    });

    setSplitDialogOpen(true);
    handleTransformMenuClose();
  };

  const handleSplitConfirm = () => {
    const maxSplitsNumber = splitSettings.maxSplits
      ? parseInt(splitSettings.maxSplits)
      : null;

    executeOperation("split", {
      delimiter: splitSettings.delimiter,
      maxSplits: maxSplitsNumber,
      columnBaseName:
        splitSettings.columnBaseName ||
        currentData.headers[selectedCells.columns[0]],
    });
    setSplitDialogOpen(false);
  };

  const handleDialogConfirm = () => {
    const customName = newColumnName.trim();

    switch (currentOperation) {
      case "concatenate":
        if (selectedCells.columns.length === 1) {
          // Single column concatenation with constant
          executeOperation("concatenate", {
            constantText: constantText,
            position: position,
            newColumnName: customName || "Concatenated",
          });
        } else {
          // Multi-column concatenation
          executeOperation("concatenate", {
            delimiters: delimiters,
            newColumnName: customName || "Concatenated",
          });
        }
        break;
      case "changecase":
        executeOperation("changecase", { caseType });
        break;
      case "sum":
        executeOperation("sum", {
          newColumnName: customName || "Sum",
        });
        break;
      case "average":
        executeOperation("average", {
          newColumnName: customName || "Average",
        });
        break;
      case "min":
        executeOperation("min", {
          newColumnName: customName || "Minimum",
        });
        break;
      case "max":
        executeOperation("max", {
          newColumnName: customName || "Maximum",
        });
        break;
      case "count":
        executeOperation("count", {
          newColumnName: customName || "Count",
        });
        break;
      case "median":
        executeOperation("median", {
          newColumnName: customName || "Median",
        });
        break;
      case "multiply":
        executeOperation("multiply", {
          newColumnName: customName || "Product",
        });
        break;
    }

    setDialogOpen(false);
    setDelimiter("");
    setNewColumnName(""); // Reset custom name
    setDelimiters([]); // ✅ Reset delimiters array
    setConstantText(""); // ✅ Reset constant text
    setPosition("suffix"); // ✅ Reset position
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
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: "grey.50",
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
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
            <ListItemIcon>
              <Link />
            </ListItemIcon>
            <ListItemText>Concatenate Columns</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={handleSplit}
            disabled={selectedCells.columns.length !== 1}
          >
            <ListItemIcon>
              <CallSplit />
            </ListItemIcon>
            <ListItemText>Split Column</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleChangeCase} disabled={!canChangeCase}>
            <ListItemIcon>
              <TextFields />
            </ListItemIcon>
            <ListItemText>Change Case</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleSort(true)} disabled={!canSort}>
            <ListItemIcon>
              <TrendingUp />
            </ListItemIcon>
            <ListItemText>Sort Ascending</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleSort(false)} disabled={!canSort}>
            <ListItemIcon>
              <TrendingUp style={{ transform: "rotate(180deg)" }} />
            </ListItemIcon>
            <ListItemText>Sort Descending</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handlePivot}
            disabled={currentData.headers.length < 3}
          >
            <ListItemIcon>
              <PivotTableChart />
            </ListItemIcon>
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
            <ListItemIcon>
              <Functions />
            </ListItemIcon>
            <ListItemText>Sum</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleAverage}>
            <ListItemIcon>
              <Analytics />
            </ListItemIcon>
            <ListItemText>Average</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMin}>
            <ListItemIcon>
              <TrendingUp style={{ transform: "rotate(180deg)" }} />
            </ListItemIcon>
            <ListItemText>Minimum</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMax}>
            <ListItemIcon>
              <TrendingUp />
            </ListItemIcon>
            <ListItemText>Maximum</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleCount}>
            <ListItemIcon>
              <Functions />
            </ListItemIcon>
            <ListItemText>Count Values</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMedian}>
            <ListItemIcon>
              <Analytics />
            </ListItemIcon>
            <ListItemText>Median</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleMultiply}
            disabled={selectedCells.columns.length < 2}
          >
            <ListItemIcon>
              <Functions />
            </ListItemIcon>
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
            <ListItemIcon>
              <FormatClear />
            </ListItemIcon>
            <ListItemText>Trim Selected</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleTrimAll}>
            <ListItemIcon>
              <FormatClear />
            </ListItemIcon>
            <ListItemText>Trim All Cells</ListItemText>
          </MenuItem>
        </Menu>

        {/* Export */}
        {/* Export Dropdown */}
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={() => setExportOptionsOpen(true)}
          sx={{ minWidth: 120, ml: "auto" }}
        >
          Export
        </Button>

        {/* Export Options Dialog */}
        <Dialog
        open={exportOptionsOpen}
        onClose={() => setExportOptionsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Options</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Choose what to export and in which format.
          </Alert>

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            What to Export:
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <RadioGroup
              row
              value={exportSettings.scope}
              onChange={(e) => setExportSettings(prev => ({ ...prev, scope: e.target.value }))}
            >
              <FormControlLabel 
                value="current" 
                control={<Radio />} 
                label={`Current Sheet (${activeSheet})`} // ✅ Use activeSheet prop
              />
              <FormControlLabel 
                value="all" 
                control={<Radio />} 
                label={`All Sheets (${sheets.length} sheets)`} // ✅ Use sheets prop
              />
            </RadioGroup>
          </FormControl>

          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Export Format:
          </Typography>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportSettings.format}
              onChange={(e) => setExportSettings(prev => ({ ...prev, format: e.target.value }))}
            >
              <MenuItem value="excel">
                <ListItemIcon><GetApp /></ListItemIcon>
                <ListItemText 
                  primary="Excel (.xlsx)" 
                  secondary={exportSettings.scope === "all" ? "Multi-sheet workbook" : "Single sheet"}
                />
              </MenuItem>
              <MenuItem value="json">
                <ListItemIcon><GetApp /></ListItemIcon>
                <ListItemText 
                  primary="JSON (.json)" 
                  secondary={exportSettings.scope === "all" ? "All sheets in JSON array" : "Single sheet object"}
                />
              </MenuItem>
              <MenuItem value="parquet">
                <ListItemIcon><GetApp /></ListItemIcon>
                <ListItemText 
                  primary="Parquet (.parquet)" 
                  secondary={exportSettings.scope === "all" ? "Combined data with sheet names" : "Single sheet data"}
                />
              </MenuItem>
            </Select>
          </FormControl>

          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Ready to Export:</strong><br/>
            {exportSettings.scope === "current" 
              ? `Current sheet in ${exportSettings.format.toUpperCase()} format`
              : `All ${sheets.length} sheets in ${exportSettings.format.toUpperCase()} format`} {/* ✅ Use sheets prop */}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportOptionsOpen(false)}>Cancel</Button>
          <Button onClick={handleExportConfirm} variant="contained" startIcon={<GetApp />}>
            Export
          </Button>
        </DialogActions>
      </Dialog>

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
          {["concatenate", "sum", "median", "multiply"].includes(
            currentOperation
          ) && (
            <TextField
              margin="dense"
              label="New Column Name"
              fullWidth
              variant="outlined"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder={`Default: ${
                currentOperation === "concatenate"
                  ? "Concatenated"
                  : currentOperation === "sum"
                  ? "Sum"
                  : currentOperation === "average"
                  ? "Average"
                  : currentOperation === "min"
                  ? "Minimum"
                  : currentOperation === "max"
                  ? "Maximum"
                  : currentOperation === "count"
                  ? "Count"
                  : currentOperation === "median"
                  ? "Median"
                  : currentOperation === "multiply"
                  ? "Product"
                  : "Result"
              }`}
              sx={{ mb: 2 }}
            />
          )}

          {currentOperation === "concatenate" && (
            <>
              {/* ✅ Custom column name input */}

              <Alert severity="info" sx={{ mb: 2 }}>
                {selectedCells.columns.length === 1
                  ? `Adding text to column: ${
                      currentData.headers[selectedCells.columns[0]]
                    }`
                  : `Concatenating columns: ${selectedCells.columns
                      .map((colIndex) => currentData.headers[colIndex])
                      .join(", ")}`}
              </Alert>

              {/* ✅ Single column: Constant text input */}
              {selectedCells.columns.length === 1 && (
                <>
                  <TextField
                    margin="dense"
                    label="Text to Add"
                    fullWidth
                    variant="outlined"
                    value={constantText}
                    onChange={(e) => setConstantText(e.target.value)}
                    placeholder="Enter text to add (e.g., -Employee, Mr. , etc.)"
                    sx={{ mb: 2 }}
                  />

                  <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                    <InputLabel>Position</InputLabel>
                    <Select
                      value={position}
                      onChange={(e) =>
                        setPosition(e.target.value as "prefix" | "suffix")
                      }
                    >
                      <MenuItem value="prefix">
                        Before (Prefix): Text + Column
                      </MenuItem>
                      <MenuItem value="suffix">
                        After (Suffix): Column + Text
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {/* ✅ Preview for single column */}
                  {constantText && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <strong>Preview:</strong>{" "}
                      {position === "prefix"
                        ? constantText +
                          currentData.headers[selectedCells.columns[0]]
                        : currentData.headers[selectedCells.columns[0]] +
                          constantText}
                    </Alert>
                  )}
                </>
              )}

              {/* ✅ Multi-column: Your existing delimiter inputs */}
              {selectedCells.columns.length > 1 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Delimiters between columns:
                  </Typography>

                  {selectedCells.columns.slice(0, -1).map((colIndex, index) => (
                    <TextField
                      key={`delimiter-${index}`}
                      margin="dense"
                      label={`Between "${currentData.headers[colIndex]}" and "${
                        currentData.headers[selectedCells.columns[index + 1]]
                      }"`}
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
                  ))}

                  {/* ✅ Preview for multi-column */}
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <strong>Preview:</strong>{" "}
                    {selectedCells.columns
                      .map((colIndex) => currentData.headers[colIndex])
                      .reduce((acc, header, index) => {
                        if (index === 0) return header;
                        const delimiter = delimiters[index - 1] || "";
                        return acc + delimiter + header;
                      }, "")}
                  </Alert>
                </>
              )}
            </>
          )}

          {currentOperation === "changecase" && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Changing case for column:{" "}
                {currentData.headers[selectedCells.columns[0]] || "Unknown"}
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

          {[
            "sum",
            "average",
            "min",
            "max",
            "count",
            "median",
            "multiply",
          ].includes(currentOperation) && (
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

      {/* Split Dialog */}
      <Dialog
        open={splitDialogOpen}
        onClose={() => setSplitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Split Column</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Splitting column:{" "}
            <strong>
              {selectedCells.columns.length === 1
                ? currentData.headers[selectedCells.columns[0]]
                : "None selected"}
            </strong>
          </Alert>

          <TextField
            margin="dense"
            label="Delimiter"
            fullWidth
            variant="outlined"
            value={splitSettings.delimiter}
            onChange={(e) =>
              setSplitSettings((prev) => ({
                ...prev,
                delimiter: e.target.value,
              }))
            }
            placeholder="Enter delimiter (e.g., ,  |  ;  -  space  etc.)"
            sx={{ mb: 2 }}
            helperText="Character(s) to split on. Common delimiters: comma (,), pipe (|), semicolon (;), dash (-), space"
          />

          <TextField
            margin="dense"
            label="Maximum Columns (Optional)"
            fullWidth
            variant="outlined"
            type="number"
            value={splitSettings.maxSplits}
            onChange={(e) =>
              setSplitSettings((prev) => ({
                ...prev,
                maxSplits: e.target.value,
              }))
            }
            placeholder="Leave empty for unlimited"
            sx={{ mb: 2 }}
            helperText="Limit the number of new columns created. Leave empty to create as many as needed."
          />

          <TextField
            margin="dense"
            label="New Column Base Name (Optional)"
            fullWidth
            variant="outlined"
            value={splitSettings.columnBaseName}
            onChange={(e) =>
              setSplitSettings((prev) => ({
                ...prev,
                columnBaseName: e.target.value,
              }))
            }
            placeholder={`Default: ${
              selectedCells.columns.length === 1
                ? currentData.headers[selectedCells.columns[0]]
                : "ColumnName"
            }`}
            sx={{ mb: 2 }}
            helperText="Base name for new columns. Will create: BaseName_Part1, BaseName_Part2, etc."
          />

          {/* Preview */}
          {splitSettings.delimiter && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <strong>Preview:</strong> Will create columns named:{" "}
              {splitSettings.columnBaseName ||
                (selectedCells.columns.length === 1
                  ? currentData.headers[selectedCells.columns[0]]
                  : "Column")}
              _Part1,{" "}
              {splitSettings.columnBaseName ||
                (selectedCells.columns.length === 1
                  ? currentData.headers[selectedCells.columns[0]]
                  : "Column")}
              _Part2, etc.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSplitDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSplitConfirm}
            variant="contained"
            disabled={!splitSettings.delimiter.trim()}
          >
            Split Column
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Toolbar;
