import React, { useRef, useState } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Paper,
  LinearProgress,
  Fade,
  Stack,
  Chip
} from '@mui/material';
import { 
  CloudUpload, 
  Description,
  CheckCircle 
} from '@mui/icons-material';
import axios from 'axios';
import { ExcelData } from '../types/ExcelTypes';

interface FileUploadProps {
  onUpload: (data: ExcelData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
  
    setUploading(true);
    setUploadSuccess(false);
    
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

      if (response.data.data) {
        console.log('✅ Calling onUpload with:', response.data.data);
        onUpload(response.data.data);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }

    } catch (error: any) {
      console.error('❌ Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        textAlign: 'center',
        background: dragOver 
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
          : 'linear-gradient(145deg, #1e293b 0%, #334155 100%)',
        border: dragOver 
          ? '2px dashed #6366f1'
          : '2px dashed rgba(148, 163, 184, 0.3)',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'primary.main',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
        }
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !uploading && fileInputRef.current?.click()}
    >
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {uploading && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0,
            height: 3
          }} 
        />
      )}

      <Fade in={!uploading}>
        <Stack spacing={3} alignItems="center">
          <Box sx={{ 
            p: 2, 
            borderRadius: '50%', 
            background: uploadSuccess 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            boxShadow: uploadSuccess
              ? '0 8px 25px rgba(16, 185, 129, 0.3)'
              : '0 8px 25px rgba(99, 102, 241, 0.3)'
          }}>
            {uploadSuccess ? (
              <CheckCircle sx={{ fontSize: 48, color: 'white' }} />
            ) : (
              <CloudUpload sx={{ fontSize: 48, color: 'white' }} />
            )}
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {uploading ? 'Uploading...' : 
             uploadSuccess ? 'Upload Successful!' :
             'Upload Excel File'}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            {uploading ? 'Processing your file...' :
             'Drag and drop your Excel file here or click to browse. We support .xlsx and .xls formats.'}
          </Typography>

          {!uploading && !uploadSuccess && (
            <Stack direction="row" spacing={1}>
              <Chip 
                icon={<Description />}
                label=".xlsx" 
                size="small" 
                variant="outlined"
                color="primary"
              />
              <Chip 
                icon={<Description />}
                label=".xls" 
                size="small" 
                variant="outlined"
                color="primary"
              />
            </Stack>
          )}

          {!uploading && (
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)',
                },
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
              }}
            >
              Choose File
            </Button>
          )}
        </Stack>
      </Fade>
    </Paper>
  );
};

export default FileUpload;
