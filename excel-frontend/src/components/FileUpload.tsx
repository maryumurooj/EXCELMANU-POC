import React, { useRef, useState } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Paper, 
  Fade, 
  Grow,
  useTheme,
  useMediaQuery,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';
import { ExcelData } from '../types/ExcelTypes';

interface FileUploadProps {
  onUpload: (data: ExcelData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    setSelectedFile(file);
    setUploading(true);
    setUploadStatus('idle');
    setStatusMessage('');
  
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      console.log('Uploading file:', file.name, 'Size:', file.size);
  
      const response = await axios.post(
        'http://localhost:5018/api/excel/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      // ✅ Add detailed logging
      console.log('📦 Full upload response:', response);
      console.log('📊 Response data:', response.data);
      console.log('🔍 Response data structure:', {
        hasMessage: !!response.data.message,
        hasSheets: !!response.data.sheets,
        hasActiveSheet: !!response.data.activeSheet,
        hasData: !!response.data.data,
        dataType: typeof response.data.data
      });
  
      // ✅ Handle new multi-sheet response format
      if (response.data.data) {
        console.log('✅ Calling onUpload with:', response.data.data);
        setUploadStatus('success');
        setStatusMessage('File uploaded successfully!');
        onUpload(response.data.data);
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setUploadStatus('idle');
          setStatusMessage('');
        }, 3000);
      } else {
        console.error('❌ No data found in response:', response.data);
        setUploadStatus('error');
        setStatusMessage('Upload failed: No data received');
      }
  
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      console.error('Error response:', error.response?.data);
      setUploadStatus('error');
      setStatusMessage(`Upload failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'xlsx' || extension === 'xls' ? <FileIcon /> : <FileIcon />;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Upload Area - Compact */}
      <Paper
        elevation={dragActive ? 6 : 3}
        sx={{
          p: { xs: 2, md: 3 },
          textAlign: 'center',
          cursor: 'pointer',
          border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
          backgroundColor: dragActive 
            ? theme.palette.primary.light + '08' 
            : theme.palette.background.paper,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.light + '04',
            transform: 'translateY(-1px)',
          },
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 80%, ${theme.palette.primary.light}08 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, ${theme.palette.secondary.light}08 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Upload Content - Compact */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Grow in={!uploading} timeout={500}>
            <Box>
              <CloudUploadIcon 
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '3rem' }, 
                  color: dragActive ? 'primary.main' : 'primary.light',
                  mb: 1.5,
                  transition: 'all 0.3s ease-in-out',
                  transform: dragActive ? 'scale(1.1)' : 'scale(1)',
                }} 
              />
              
              <Typography 
                variant={isMobile ? 'h6' : 'h5'} 
                component="h2" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 1
                }}
              >
                {dragActive ? 'Drop your Excel file here' : 'Upload Excel File'}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 2,
                  maxWidth: 400,
                  mx: 'auto'
                }}
              >
                {dragActive 
                  ? 'Release to upload your file'
                  : 'Drag and drop your Excel file here, or click to browse'
                }
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip 
                  label=".xlsx" 
                  variant="outlined" 
                  color="primary"
                  size="small"
                  sx={{
                    transition: 'color 0.3s, background 0.3s, border 0.3s',
                    color: 'black',
                    borderWidth: 1.5,
                    borderColor: 'primary.main',
                    fontWeight: 600,
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                    fontSize: '0.75rem',
                    '&:hover': {
                      color: '#fff',
                      backgroundColor: 'primary.main',
                      borderColor: 'primary.main',
                    }
                  }}
                />
                <Chip 
                  label=".xls" 
                  variant="outlined" 
                  color="primary"
                  size="small"
                  sx={{
                    transition: 'color 0.3s, background 0.3s, border 0.3s',
                    color: 'black',
                    borderWidth: 1.5,
                    borderColor: 'primary.main',
                    fontWeight: 600,
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                    fontSize: '0.75rem',
                    '&:hover': {
                      color: '#fff',
                      backgroundColor: 'primary.main',
                      borderColor: 'primary.main',
                    }
                  }}
                />
              </Box>
            </Box>
          </Grow>

          {/* Uploading State - Compact */}
          <Fade in={uploading} timeout={300}>
            <Box sx={{ display: uploading ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress size={50} sx={{ mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Uploading...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we process your file
              </Typography>
            </Box>
          </Fade>
        </Box>
      </Paper>

      {/* Hidden File Input */}
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Selected File Info - Compact */}
      {selectedFile && (
        <Grow in={!!selectedFile} timeout={500}>
          <Paper 
            elevation={1} 
            sx={{ 
              mt: 1.5, 
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              background: theme.palette.background.paper,
            }}
          >
            {getFileIcon(selectedFile.name)}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
          </Paper>
        </Grow>
      )}

      {/* Status Messages - Compact */}
      {uploadStatus !== 'idle' && (
        <Fade in={true} timeout={300}>
          <Box sx={{ mt: 1.5 }}>
            <Alert 
              severity={uploadStatus === 'success' ? 'success' : 'error'}
              icon={uploadStatus === 'success' ? <CheckIcon /> : <ErrorIcon />}
              sx={{ 
                borderRadius: 1.5,
                '& .MuiAlert-message': {
                  fontWeight: 500
                }
              }}
            >
              {statusMessage}
            </Alert>
          </Box>
        </Fade>
      )}

      {/* Help Text - Compact */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
          Supported formats: .xlsx, .xls • Maximum file size: 50MB
        </Typography>
      </Box>
    </Box>
  );
};

export default FileUpload;
