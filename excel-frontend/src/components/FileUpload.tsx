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
        onUpload(response.data.data);
      } else {
        console.error('❌ No data found in response:', response.data);
      }
  
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      console.error('Error response:', error.response?.data);
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
