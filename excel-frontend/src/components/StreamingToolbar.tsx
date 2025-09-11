import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Transform,
  GetApp,
  Link,
  CallSplit,
  TextFields,
  Functions,
  ArrowDropDown
} from '@mui/icons-material';
import StreamingExcelService from '../Services/StreamingExcelService';

interface StreamingToolbarProps {
  sessionId: string;
  selectedCells: {
    rows: number[];
    columns: number[];
    cells: { row: number; col: number }[];
    selectedColumnFields: string[];
  };
  summary: {
    headers: string[];
    rowCount: number;
    columnCount: number;
    activeSheet: string;
    availableSheets: string[];
    metadata: Record<string, any>;
  };
  onOperationComplete: (delta: any) => void;
}

const StreamingToolbar: React.FC<StreamingToolbarProps> = ({
  sessionId,
  selectedCells,
  summary,
  onOperationComplete
}) => {
  const [transformMenuAnchor, setTransformMenuAnchor] = useState<null | HTMLElement>(null);
  const [mathMenuAnchor, setMathMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState('');
  
  // Form states
  const [newColumnName, setNewColumnName] = useState('');
  const [delimiters, setDelimiters] = useState<string[]>([]);
  const [constantText, setConstantText] = useState('');
  const [position, setPosition] = useState<'prefix' | 'suffix'>('suffix');
  const [caseType, setCaseType] = useState('upper');
  const [splitSettings, setSplitSettings] = useState({
    delimiter: ',',
    maxSplits: '',
    columnBaseName: ''
  });
  const [exportSettings, setExportSettings] = useState({
    scope: 'current',
    format: 'excel'
  });

  const handleTransformMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTransformMenuAnchor(event.currentTarget);
  };

  const handleMathMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMathMenuAnchor(event.currentTarget);
  };

  const handleConcatenate = () => {
    if (selectedCells.columns.length < 1) {
      alert('Please select at least 1 column to concatenate');
      return;
    }
    
    if (selectedCells.columns.length > 1) {
      const delimiterCount = selectedCells.columns.length - 1;
      setDelimiters(new Array(delimiterCount).fill(''));
    } else {
      setDelimiters([]);
    }
    
    setCurrentOperation('concatenate');
    setDialogOpen(true);
    setTransformMenuAnchor(null);
  };

  const handleSplit = () => {
    if (selectedCells.columns.length !== 1) {
      alert('Please select exactly 1 column to split');
      return;
    }
    
    setSplitSettings({
      delimiter: ',',
      maxSplits: '',
      columnBaseName: ''
    });
    
    setCurrentOperation('split');
    setDialogOpen(true);
    setTransformMenuAnchor(null);
  };

  const handleMathOperation = (operation: string) => {
    if (selectedCells.columns.length < 1) {
      alert(`Please select at least 1 column for ${operation}`);
      return;
    }
    
    setCurrentOperation(operation);
    setDialogOpen(true);
    setMathMenuAnchor(null);
  };

  const handleChangeCase = () => {
    if (selectedCells.columns.length !== 1) {
      alert('Please select exactly 1 column to change case');
      return;
    }
    
    setCurrentOperation('changecase');
    setDialogOpen(true);
    setTransformMenuAnchor(null);
  };

  const handleDialogConfirm = async () => {
    try {
      const customName = newColumnName.trim();
      let command: any = {
        operation: currentOperation,
        sheetName: summary.activeSheet,
        columnIndices: selectedCells.columns,
        parameters: {}
      };

      switch (currentOperation) {
        case 'concatenate':
          if (selectedCells.columns.length === 1) {
            command.parameters = {
              constantText: constantText,
              position: position,
              newColumnName: customName || 'Concatenated'
            };
          } else {
            command.parameters = {
              delimiters: delimiters,
              newColumnName: customName || 'Concatenated'
            };
          }
          break;

        case 'split':
          command.parameters = {
            delimiter: splitSettings.delimiter,
            maxSplits: splitSettings.maxSplits ? parseInt(splitSettings.maxSplits) : null,
            columnBaseName: splitSettings.columnBaseName || summary.headers[selectedCells.columns[0]]
          };
          break;

        case 'sum':
        case 'multiply':
        case 'average':
        case 'median':
          command.parameters = {
            newColumnName: customName || currentOperation.charAt(0).toUpperCase() + currentOperation.slice(1)
          };
          break;

        case 'changecase':
          command.parameters = {
            caseType: caseType
          };
          break;

        default:
          break;
      }

      const delta = await StreamingExcelService.executeOperation(command);
      onOperationComplete(delta);
      
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      alert(`Operation failed: ${error.message}`);
    }
  };

  const resetForm = () => {
    setNewColumnName('');
    setDelimiters([]);
    setConstantText('');
    setPosition('suffix');
    setCaseType('upper');
    setSplitSettings({ delimiter: ',', maxSplits: '', columnBaseName: '' });
  };

  const handleExportConfirm = async () => {
    try {
      setExportOptionsOpen(false);
      const { scope, format } = exportSettings;
      const exportAllSheets = scope === 'all';
      
      await StreamingExcelService.exportData(
        format as 'excel' | 'json' | 'parquet',
        exportAllSheets
      );
    } catch (error: any) {
      alert(`Export failed: ${error.message}`);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
      {/* Transform Operations */}
      <Button
        variant="outlined"
        startIcon={<Transform />}
        endIcon={<ArrowDropDown />}
        onClick={handleTransformMenuOpen}
      >
        Transform
      </Button>

      <Menu
        anchorEl={transformMenuAnchor}
        open={Boolean(transformMenuAnchor)}
        onClose={() => setTransformMenuAnchor(null)}
      >
        <MenuItem onClick={handleConcatenate} disabled={selectedCells.columns.length < 1}>
          <ListItemIcon><Link /></ListItemIcon>
          <ListItemText>Concatenate Columns</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleSplit} disabled={selectedCells.columns.length !== 1}>
          <ListItemIcon><CallSplit /></ListItemIcon>
          <ListItemText>Split Column</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleChangeCase} disabled={selectedCells.columns.length !== 1}>
          <ListItemIcon><TextFields /></ListItemIcon>
          <ListItemText>Change Case</ListItemText>
        </MenuItem>
      </Menu>

      {/* Math Operations */}
      <Button
        variant="outlined"
        startIcon={<Functions />}
        endIcon={<ArrowDropDown />}
        onClick={handleMathMenuOpen}
      >
        Calculate
      </Button>

      <Menu
        anchorEl={mathMenuAnchor}
        open={Boolean(mathMenuAnchor)}
        onClose={() => setMathMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleMathOperation('sum')} disabled={selectedCells.columns.length < 1}>
          <ListItemText>Sum</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMathOperation('multiply')} disabled={selectedCells.columns.length < 1}>
          <ListItemText>Multiply</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMathOperation('average')} disabled={selectedCells.columns.length < 1}>
          <ListItemText>Average</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMathOperation('median')} disabled={selectedCells.columns.length < 1}>
          <ListItemText>Median</ListItemText>
        </MenuItem>
      </Menu>

      {/* Export */}
      <Button
        variant="outlined"
        startIcon={<GetApp />}
        onClick={() => setExportOptionsOpen(true)}
        sx={{ ml: 'auto' }}
      >
        Export
      </Button>

      {/* Operation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentOperation === 'concatenate' && 'Concatenate Columns'}
          {currentOperation === 'split' && 'Split Column'}
          {currentOperation === 'changecase' && 'Change Case'}
          {['sum', 'multiply', 'average', 'median'].includes(currentOperation) && 
            `Calculate ${currentOperation.charAt(0).toUpperCase() + currentOperation.slice(1)}`}
        </DialogTitle>
        
        <DialogContent>
          {/* New Column Name Input */}
          {['concatenate', 'sum', 'multiply', 'average', 'median'].includes(currentOperation) && (
            <TextField
              margin="dense"
              label="New Column Name"
              fullWidth
              variant="outlined"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder={`Default: ${
                currentOperation === 'concatenate' ? 'Concatenated' :
                currentOperation === 'sum' ? 'Sum' :
                currentOperation === 'multiply' ? 'Product' :
                currentOperation === 'average' ? 'Average' :
                currentOperation === 'median' ? 'Median' : 'Result'
              }`}
              sx={{ mb: 2 }}
            />
          )}

          {/* Concatenate Options */}
          {currentOperation === 'concatenate' && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                {selectedCells.columns.length === 1 
                  ? `Adding text to column: ${summary.headers[selectedCells.columns[0]]}`
                  : `Concatenating columns: ${selectedCells.columns.map(i => summary.headers[i]).join(', ')}`
                }
              </Alert>

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
                      onChange={(e) => setPosition(e.target.value as 'prefix' | 'suffix')}
                    >
                      <MenuItem value="prefix">Before (Prefix): Text + Column</MenuItem>
                      <MenuItem value="suffix">After (Suffix): Column + Text</MenuItem>
                    </Select>
                  </FormControl>

                  {constantText && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <strong>Preview:</strong> {position === 'prefix' 
                        ? constantText + summary.headers[selectedCells.columns[0]]
                        : summary.headers[selectedCells.columns[0]] + constantText
                      }
                    </Alert>
                  )}
                </>
              )}

              {selectedCells.columns.length > 1 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Delimiters between columns:
                  </Typography>
                  
                  {selectedCells.columns.slice(0, -1).map((colIndex, index) => (
                    <TextField
                      key={`delimiter-${index}`}
                      margin="dense"
                      label={`Between "${summary.headers[colIndex]}" and "${summary.headers[selectedCells.columns[index + 1]]}"`}
                      fullWidth
                      variant="outlined"
                      value={delimiters[index] || ''}
                      onChange={(e) => {
                        const newDelimiters = [...delimiters];
                        newDelimiters[index] = e.target.value;
                        setDelimiters(newDelimiters);
                      }}
                      placeholder="Enter delimiter (e.g., -, /, |, space, etc.)"
                      sx={{ mb: 1 }}
                    />
                  ))}
                  
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <strong>Preview:</strong> {selectedCells.columns
                      .map(colIndex => summary.headers[colIndex])
                      .reduce((acc, header, index) => {
                        if (index === 0) return header;
                        const delimiter = delimiters[index - 1] || '';
                        return acc + delimiter + header;
                      }, '')}
                  </Alert>
                </>
              )}
            </>
          )}

          {/* Split Options */}
          {currentOperation === 'split' && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Splitting column: <strong>{selectedCells.columns.length === 1 ? summary.headers[selectedCells.columns[0]] : 'None selected'}</strong>
              </Alert>

              <TextField
                margin="dense"
                label="Delimiter"
                fullWidth
                variant="outlined"
                value={splitSettings.delimiter}
                onChange={(e) => setSplitSettings(prev => ({ ...prev, delimiter: e.target.value }))}
                placeholder="Enter delimiter (e.g., ,  |  ;  -  space  etc.)"
                sx={{ mb: 2 }}
              />

              <TextField
                margin="dense"
                label="Maximum Columns (Optional)"
                fullWidth
                variant="outlined"
                type="number"
                value={splitSettings.maxSplits}
                onChange={(e) => setSplitSettings(prev => ({ ...prev, maxSplits: e.target.value }))}
                placeholder="Leave empty for unlimited"
                sx={{ mb: 2 }}
              />

              <TextField
                margin="dense"
                label="New Column Base Name (Optional)"
                fullWidth
                variant="outlined"
                value={splitSettings.columnBaseName}
                onChange={(e) => setSplitSettings(prev => ({ ...prev, columnBaseName: e.target.value }))}
                placeholder={`Default: ${selectedCells.columns.length === 1 ? summary.headers[selectedCells.columns[0]] : 'ColumnName'}`}
                sx={{ mb: 2 }}
              />
            </>
          )}

          {/* Change Case Options */}
          {currentOperation === 'changecase' && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Changing case for column: {summary.headers[selectedCells.columns[0]] || 'Unknown'}
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

          {/* Math Operations Info */}
          {['sum', 'multiply', 'average', 'median'].includes(currentOperation) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Calculating {currentOperation} for columns: {selectedCells.columns.map(i => summary.headers[i]).join(', ')}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDialogConfirm} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOptionsOpen} onClose={() => setExportOptionsOpen(false)} maxWidth="sm" fullWidth>
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
                label={`Current Sheet (${summary.activeSheet})`}
              />
              <FormControlLabel 
                value="all" 
                control={<Radio />} 
                label={`All Sheets (${summary.availableSheets.length} sheets)`}
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
                <ListItemText 
                  primary="Excel (.xlsx)" 
                  secondary={exportSettings.scope === "all" ? "Multi-sheet workbook" : "Single sheet"}
                />
              </MenuItem>
              <MenuItem value="json">
                <ListItemText 
                  primary="JSON (.json)" 
                  secondary={exportSettings.scope === "all" ? "All sheets in JSON array" : "Single sheet object"}
                />
              </MenuItem>
              <MenuItem value="parquet">
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
              : `All ${summary.availableSheets.length} sheets in ${exportSettings.format.toUpperCase()} format`}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportOptionsOpen(false)}>Cancel</Button>
          <Button onClick={handleExportConfirm} variant="contained" startIcon={<GetApp />}>
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StreamingToolbar;
