import React, { useRef } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import axios from 'axios';
import { ExcelData } from '../types/ExcelTypes';

interface FileUploadProps {
  onUpload: (data: ExcelData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    // Add file validation on frontend
    const allowedTypes = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
      alert('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      console.log('Uploading file:', file.name, 'Size:', file.size);
      
      const response = await axios.post<ExcelData>(
        'http://localhost:5018/api/excel/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      onUpload(response.data);
    } catch (error: any) {
      console.error('Upload failed:', error);
      console.error('Full error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      // Extract the detailed error message from your backend
      let errorMessage = 'Unknown error occurred';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.title) {
          errorMessage = error.response.data.title;
        }
      }
      
      console.error('Extracted error message:', errorMessage);
      alert(`Failed to upload file: ${errorMessage}`);
    }
  };
  

  return (
    <Box textAlign="center">
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <Button
        variant="contained"
        startIcon={<CloudUpload />}
        onClick={() => fileInputRef.current?.click()}
        size="large"
      >
        Upload Excel File
      </Button>
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
        Supported formats: .xlsx, .xls
      </Typography>
    </Box>
  );
};

export default FileUpload;
