using OfficeOpenXml;
using ExcelDataManipulator.API.Models;

namespace ExcelDataManipulator.API.Services
{
    public class ExcelService
    {
        private ExcelDataModel _currentData = new();
        private Dictionary<string, ExcelDataModel> _sheetsData = new(); // ✅ Store all sheets
        private List<string> _sheetNames = new(); // ✅ Track sheet names
        private string _activeSheetName = ""; // ✅ Current active sheet

        public async Task<Dictionary<string, ExcelDataModel>> LoadExcelFile(IFormFile file)
        {
            ExcelPackage.License.SetNonCommercialPersonal("Your Name"); // Keep your working license

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);

            using var package = new ExcelPackage(stream);

            _sheetsData.Clear();
            _sheetNames.Clear();

            // ✅ Load ALL worksheets from the Excel file
            foreach (var worksheet in package.Workbook.Worksheets)
            {
                var sheetName = worksheet.Name;
                _sheetNames.Add(sheetName);

                var rowCount = worksheet.Dimension?.Rows ?? 0;
                var colCount = worksheet.Dimension?.Columns ?? 0;

                if (rowCount == 0 || colCount == 0)
                {
                    // Handle empty sheets
                    _sheetsData[sheetName] = new ExcelDataModel
                    {
                        Headers = new string[] { "Empty" },
                        Data = new string[0][],
                        RowCount = 0,
                        ColumnCount = 1
                    };
                    continue;
                }

                var headers = new string[colCount];
                for (int col = 1; col <= colCount; col++)
                {
                    headers[col - 1] = worksheet.Cells[1, col].Text;
                }

                var data = new string[rowCount - 1][];
                for (int row = 2; row <= rowCount; row++)
                {
                    data[row - 2] = new string[colCount];
                    for (int col = 1; col <= colCount; col++)
                    {
                        data[row - 2][col - 1] = worksheet.Cells[row, col].Text;
                    }
                }

                _sheetsData[sheetName] = new ExcelDataModel
                {
                    Headers = headers,
                    Data = data,
                    RowCount = rowCount - 1,
                    ColumnCount = colCount
                };

                Console.WriteLine($"✅ Loaded sheet '{sheetName}': {rowCount - 1} rows, {colCount} columns");
            }

            // Set first sheet as active
            _activeSheetName = _sheetNames.FirstOrDefault() ?? "";
            _currentData = _sheetsData.ContainsKey(_activeSheetName) ? _sheetsData[_activeSheetName] : new ExcelDataModel();

            return _sheetsData;
        }

        // ✅ Multi-sheet methods
        public List<string> GetSheetNames() => new List<string>(_sheetNames);

        public string GetActiveSheetName() => _activeSheetName;

        public void SetActiveSheet(string sheetName)
        {
            if (_sheetsData.ContainsKey(sheetName))
            {
                _activeSheetName = sheetName;
                _currentData = _sheetsData[sheetName];
                Console.WriteLine($"✅ Active sheet changed to: {sheetName}");
            }
        }

        public ExcelDataModel GetSheetData(string sheetName)
        {
            return _sheetsData.ContainsKey(sheetName) ? _sheetsData[sheetName] : new ExcelDataModel();
        }

        // ✅ Add new sheet (for pivot tables)
        public void AddNewSheet(string sheetName, ExcelDataModel data)
        {
            var uniqueName = GetUniqueSheetName(sheetName);
            _sheetsData[uniqueName] = data;
            _sheetNames.Add(uniqueName);
            _activeSheetName = uniqueName; // Switch to new sheet
            _currentData = data;
            Console.WriteLine($"✅ Added new sheet '{uniqueName}'");
        }

        private string GetUniqueSheetName(string baseName)
        {
            var name = baseName;
            var counter = 1;
            while (_sheetsData.ContainsKey(name))
            {
                name = $"{baseName} ({counter})";
                counter++;
            }
            return name;
        }

        public ExcelDataModel GetCurrentData() => _currentData;

        public void UpdateCurrentData(ExcelDataModel newData)
        {
            _currentData = newData;
            if (!string.IsNullOrEmpty(_activeSheetName))
            {
                _sheetsData[_activeSheetName] = newData; // ✅ Update in sheets dictionary
            }
        }

        public byte[] ExportToExcel()
        {
            ExcelPackage.License.SetNonCommercialPersonal("Your Name"); // Keep your working license

            using var package = new ExcelPackage();

            // ✅ Export all sheets
            foreach (var sheetName in _sheetNames)
            {
                var sheetData = _sheetsData[sheetName];
                var worksheet = package.Workbook.Worksheets.Add(sheetName);

                // Add headers
                for (int col = 0; col < sheetData.Headers.Length; col++)
                {
                    worksheet.Cells[1, col + 1].Value = sheetData.Headers[col];
                }

                // Add data
                for (int row = 0; row < sheetData.Data.Length; row++)
                {
                    for (int col = 0; col < sheetData.Data[row].Length; col++)
                    {
                        worksheet.Cells[row + 2, col + 1].Value = sheetData.Data[row][col];
                    }
                }
            }

            return package.GetAsByteArray();
        }
    }
}
