# Excel Data Manipulator - Enhanced Frontend

A modern, professional-grade React application for Excel data manipulation and analysis with an enhanced UI/UX design.

## ✨ Features

- **Modern UI Design**: Professional, production-ready interface with Material-UI components
- **Drag & Drop File Upload**: Intuitive Excel file upload with visual feedback
- **Advanced Data Grid**: AG Grid with enhanced styling, pagination, and editing capabilities
- **Comprehensive Operations**: Text manipulation, mathematical calculations, pivot tables, and more
- **Responsive Design**: Mobile-friendly and adaptive layouts
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Real-time Updates**: Live data manipulation with immediate visual feedback

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- .NET 9.0 SDK (for backend API)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd EXCELMANU-POC
   ```

2. **Install frontend dependencies**:
   ```bash
   cd excel-frontend
   npm install
   ```

3. **Start the backend API** (in a separate terminal):
   ```bash
   cd ExcelDataManipulator.API
   dotnet run
   ```
   
   The API will start on `http://localhost:5018`

4. **Start the frontend application**:
   ```bash
   cd excel-frontend
   npm start
   ```
   
   The application will open in your browser at `http://localhost:3000`

## 🎯 Usage

### 1. Upload Excel File
- Drag and drop an Excel file (.xlsx or .xls) onto the upload area
- Or click the upload area to browse and select a file
- Supported formats: .xlsx, .xls (maximum file size: 50MB)

### 2. Navigate Sheets
- If your Excel file has multiple sheets, use the sheet tabs to switch between them
- Each sheet maintains its own data and operations

### 3. Select Columns
- Click on any cell in a column to select it
- Hold Ctrl+Click to select multiple columns
- Use the quick column selection chips for faster selection

### 4. Perform Operations
The application provides several categories of operations:

#### Text Operations
- **Concatenate**: Combine multiple columns with custom delimiters
- **Trim**: Remove whitespace from column data
- **Change Case**: Convert text to UPPERCASE, lowercase, or Title Case

#### Mathematical Operations
- **Sum**: Calculate sum of numeric columns
- **Average**: Calculate mean of numeric columns
- **Min/Max**: Find minimum and maximum values
- **Count**: Count non-empty values
- **Multiply**: Multiply values across columns
- **Median**: Calculate median value

#### Advanced Operations
- **Pivot Tables**: Create summary tables with aggregation functions
- **Sorting**: Sort data in ascending or descending order

### 5. Export Results
- Click the "Export Excel" button to download the processed data
- The exported file will include all changes and operations performed

## 🛠️ Technical Details

### Frontend Stack
- **React 19**: Latest React with hooks and modern patterns
- **TypeScript**: Type-safe development
- **Material-UI (MUI)**: Professional component library
- **AG Grid**: Advanced data grid with editing capabilities
- **Axios**: HTTP client for API communication

### Key Components
- **App.tsx**: Main application with theme and layout
- **FileUpload.tsx**: Enhanced file upload with drag & drop
- **Toolbar.tsx**: Organized operations interface with accordion layout
- **AGDataGrid.tsx**: Professional data grid with custom styling

### Design System
- **Color Palette**: Professional blue-based theme with consistent spacing
- **Typography**: Inter font family for modern readability
- **Components**: Consistent Material-UI components with custom styling
- **Responsiveness**: Mobile-first design with breakpoint-based layouts

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (not recommended)
npm run eject
```

### Project Structure
```
excel-frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── AGDataGrid.tsx    # Data grid component
│   │   ├── FileUpload.tsx    # File upload component
│   │   └── Toolbar.tsx       # Operations toolbar
│   ├── types/             # TypeScript type definitions
│   │   └── ExcelTypes.ts     # Excel data interfaces
│   ├── App.tsx            # Main application component
│   ├── index.tsx          # Application entry point
│   └── index.css          # Global styles and utilities
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

### Customization

#### Theme Colors
Modify the theme in `App.tsx`:
```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',    // Primary blue
      light: '#42a5f5',   // Light blue
      dark: '#1565c0',    // Dark blue
    },
    secondary: {
      main: '#9c27b0',    // Secondary purple
    },
    // ... more colors
  },
});
```

#### Component Styling
Use Material-UI's `sx` prop for component-specific styling:
```typescript
<Button
  sx={{
    borderRadius: 2,
    px: 3,
    py: 1.5,
    fontWeight: 600,
  }}
>
  Custom Button
</Button>
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interactions
- Optimized for both desktop and mobile use

## ♿ Accessibility Features

- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences
- Focus indicators

## 🚀 Performance Optimizations

- Lazy loading of components
- Optimized re-renders with React hooks
- Efficient AG Grid configuration
- Minimal bundle size
- Optimized assets and fonts

## 🔒 Security Considerations

- File type validation
- File size limits
- Secure API communication
- Input sanitization
- XSS protection

## 📊 API Integration

The frontend communicates with the .NET backend API:
- **Base URL**: `http://localhost:5018`
- **Endpoints**: 
  - `POST /api/excel/upload` - File upload
  - `GET /api/excel/sheets` - Get sheet names
  - `POST /api/excel/operation` - Perform data operations
  - `GET /api/excel/export` - Export data

## 🐛 Troubleshooting

### Common Issues

1. **Backend not running**
   - Ensure the .NET API is running on port 5018
   - Check console for connection errors

2. **File upload fails**
   - Verify file format (.xlsx or .xls)
   - Check file size (max 50MB)
   - Ensure backend is accessible

3. **Grid not displaying**
   - Check browser console for errors
   - Verify data structure from API
   - Clear browser cache if needed

### Debug Mode

Enable debug logging in the browser console:
```typescript
// Add to any component for debugging
console.log('Debug info:', data);
```

## 📈 Future Enhancements

- Dark mode support
- Advanced filtering and search
- Data visualization charts
- Batch operations
- User preferences and settings
- Multi-language support
- Cloud storage integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs
3. Create an issue in the repository
4. Contact the development team

---

**Built with ❤️ using React, TypeScript, and Material-UI**
