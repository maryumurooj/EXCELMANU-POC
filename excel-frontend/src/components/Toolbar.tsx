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
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add as AddIcon,
  ContentCut as TrimIcon,
  TextFields as TextIcon,
  Sort as SortIcon,
  Functions as MathIcon,
  TableChart as PivotIcon,
  Download as ExportIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  Calculate as CalculateIcon,
  Analytics as AnalyticsIcon,
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
  const [operationsExpanded, setOperationsExpanded] = useState(true);

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

  // Operations data for table view
  const operationsData = [
    {
      category: "Text Operations",
      icon: <TextIcon />,
      operations: [
        {
          name: "Concatenate",
          icon: <AddIcon />,
          handler: handleConcatenate,
          enabled: canConcatenate,
          tooltip: "Combine multiple columns into one",
          requires: "2+ columns"
        },
        {
          name: "Trim",
          icon: <TrimIcon />,
          handler: handleTrimSingle,
          enabled: canTrimSingle,
          tooltip: "Remove extra spaces from column",
          requires: "1 column"
        },
        {
          name: "Trim Multiple",
          icon: <TrimIcon />,
          handler: handleTrimMultiple,
          enabled: canTrimMultiple,
          tooltip: "Remove spaces from multiple columns",
          requires: "1+ columns"
        },
        {
          name: "Trim All",
          icon: <TrimIcon />,
          handler: handleTrimAll,
          enabled: canTrimAll,
          tooltip: "Remove all extra spaces from dataset",
          requires: "any data"
        },
        {
          name: "Trim Cells",
          icon: <TrimIcon />,
          handler: handleTrimCells,
          enabled: canTrimCells,
          tooltip: "Remove spaces from selected cells",
          requires: "selected cells"
        }
      ]
    },
    {
      category: "Case Operations",
      icon: <BoldIcon />,
      operations: [
        {
          name: "Change Case",
          icon: <TextIcon />,
          handler: handleChangeCase,
          enabled: canChangeCase,
          tooltip: "Change text case (UPPER, lower, Title)",
          requires: "1 column"
        }
      ]
    },
    {
      category: "Sorting",
      icon: <SortIcon />,
      operations: [
        {
          name: "Sort ↑",
          icon: <ArrowUpIcon />,
          handler: () => handleSort(true),
          enabled: canSort,
          tooltip: "Sort data ascending (A-Z, 1-9)",
          requires: "1 column"
        },
        {
          name: "Sort ↓",
          icon: <ArrowDownIcon />,
          handler: () => handleSort(false),
          enabled: canSort,
          tooltip: "Sort data descending (Z-A, 9-1)",
          requires: "1 column"
        }
      ]
    },
    {
      category: "Mathematical",
      icon: <CalculateIcon />,
      operations: [
        {
          name: "Sum",
          icon: <MathIcon />,
          handler: handleSum,
          enabled: canSum,
          tooltip: "Calculate sum of numeric values",
          requires: "1+ numeric columns"
        },
        {
          name: "Average",
          icon: <MathIcon />,
          handler: handleAverage,
          enabled: canCalculate,
          tooltip: "Calculate average (mean) of values",
          requires: "1+ numeric columns"
        },
        {
          name: "Min",
          icon: <MathIcon />,
          handler: handleMin,
          enabled: canCalculate,
          tooltip: "Find the smallest value",
          requires: "1+ numeric columns"
        },
        {
          name: "Max",
          icon: <MathIcon />,
          handler: handleMax,
          enabled: canCalculate,
          tooltip: "Find the largest value",
          requires: "1+ numeric columns"
        },
        {
          name: "Count",
          icon: <MathIcon />,
          handler: handleCount,
          enabled: canCalculate,
          tooltip: "Count non-empty values",
          requires: "1+ columns"
        },
        {
          name: "Multiply",
          icon: <MathIcon />,
          handler: handleMultiply,
          enabled: selectedCells.columns.length >= 2,
          tooltip: "Multiply values across columns",
          requires: "2+ numeric columns"
        },
        {
          name: "Median",
          icon: <MathIcon />,
          handler: handleMedian,
          enabled: canCalculate,
          tooltip: "Calculate median (middle value)",
          requires: "1+ numeric columns"
        }
      ]
    },
    {
      category: "Advanced",
      icon: <AnalyticsIcon />,
      operations: [
        {
          name: "Pivot Table",
          icon: <PivotIcon />,
          handler: handlePivot,
          enabled: currentData.headers.length >= 3,
          tooltip: "Create a pivot table to summarize data",
          requires: "3+ columns"
        }
      ]
    }
  ];

  return (
    <>
      {/* Selection Info - Compact */}
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 2, 
          p: 2,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Selection: {selectedCells.columns.length} column(s)
            </Typography>
            <Chip 
              label={getSelectedColumnsText()}
              color={getStatusColor()}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            size="small"
            sx={{ 
              px: 2,
              py: 0.5,
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 1.5,
            }}
          >
            Export
          </Button>
        </Box>
      </Paper>

             {/* Operations Table - Toggleable */}
       <Paper 
         elevation={2} 
         sx={{ 
           mb: 2,
           background: theme.palette.background.paper,
           border: `1px solid ${theme.palette.divider}`,
         }}
       >
         <Box 
           sx={{ 
             p: 2, 
             borderBottom: operationsExpanded ? `1px solid ${theme.palette.divider}` : 'none',
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'space-between',
             '&:hover': {
               backgroundColor: theme.palette.action.hover,
             }
           }}
           onClick={() => setOperationsExpanded(!operationsExpanded)}
         >
           <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
             <AddIcon color="primary" />
             Data Operations
           </Typography>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <Typography variant="caption" color="text.secondary">
               {operationsExpanded ? 'Click to collapse' : 'Click to expand'}
             </Typography>
             <Box 
               sx={{ 
                 transform: operationsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                 transition: 'transform 0.2s ease-in-out',
                 display: 'flex',
                 alignItems: 'center'
               }}
             >
               <ArrowDownIcon fontSize="small" />
             </Box>
           </Box>
         </Box>
         
         {operationsExpanded && (
           <TableContainer>
             <Table size="small">
               <TableHead>
                 <TableRow>
                   <TableCell sx={{ fontWeight: 600, width: '20%' }}>Category</TableCell>
                   <TableCell sx={{ fontWeight: 600, width: '60%' }}>Operations</TableCell>
                   <TableCell sx={{ fontWeight: 600, width: '20%' }}>Requirements</TableCell>
                 </TableRow>
               </TableHead>
               <TableBody>
                 {operationsData.map((category, categoryIndex) => (
                   <TableRow key={categoryIndex} sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}>
                     <TableCell>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         {category.icon}
                         <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           {category.category}
                         </Typography>
                       </Box>
                     </TableCell>
                     <TableCell>
                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                         {category.operations.map((operation, opIndex) => (
                           <Tooltip 
                             key={opIndex} 
                             title={`${operation.tooltip} (Requires: ${operation.requires})`}
                             placement="top"
                           >
                             <span>
                               <Button
                                 variant="outlined"
                                 size="small"
                                 startIcon={operation.icon}
                                 onClick={operation.handler}
                                 disabled={!operation.enabled}
                                 sx={{ 
                                   minWidth: 'auto',
                                   px: 1.5,
                                   py: 0.5,
                                   fontSize: '0.75rem',
                                   borderRadius: 1,
                                   borderColor: operation.enabled ? 'primary.main' : 'divider',
                                   color: operation.enabled ? 'primary.main' : 'text.disabled',
                                   '&:hover': operation.enabled ? {
                                     backgroundColor: 'primary.main',
                                     color: 'white',
                                   } : {}
                                 }}
                               >
                                 {operation.name}
                               </Button>
                             </span>
                           </Tooltip>
                         ))}
                       </Box>
                     </TableCell>
                     <TableCell>
                       <Typography variant="caption" color="text.secondary">
                         {category.operations.map(op => op.requires).join(', ')}
                       </Typography>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </TableContainer>
         )}
       </Paper>

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
