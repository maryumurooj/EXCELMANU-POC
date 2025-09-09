using ExcelDataManipulator.API.Models;
using OfficeOpenXml;
using ParquetSharp;
using System.Text.Json;
using System.Text.RegularExpressions;

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


        // Get all sheets data
        public Dictionary<string, ExcelDataModel> GetAllSheetsData()
        {
            return new Dictionary<string, ExcelDataModel>(_sheetsData);
        }

        // Export all sheets to Excel (multi-sheet workbook)
        public byte[] ExportAllSheetsToExcel()
        {
            ExcelPackage.License.SetNonCommercialPersonal("Your Name");

            using var package = new ExcelPackage();

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

        // Export all sheets to JSON
        public byte[] ExportAllSheetsToJson()
        {
            var allSheetsData = new
            {
                fileName = "exported_all_sheets",
                exportedAt = DateTime.Now,
                totalSheets = _sheetNames.Count,
                sheets = _sheetNames.Select(sheetName => new
                {
                    name = sheetName,
                    headers = _sheetsData[sheetName].Headers,
                    data = _sheetsData[sheetName].Data,
                    rowCount = _sheetsData[sheetName].RowCount,
                    columnCount = _sheetsData[sheetName].ColumnCount
                }).ToArray()
            };

            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            string jsonString = JsonSerializer.Serialize(allSheetsData, options);
            return System.Text.Encoding.UTF8.GetBytes(jsonString);
        }

        // Export all sheets to Parquet (multiple files in ZIP or single file with all data)
        public byte[] ExportAllSheetsToParquet()
        {
            // Approach 1: Combine all sheets into one large dataset
            var combinedHeaders = new List<string> { "SheetName" };
            var maxColumnCount = _sheetsData.Values.Max(s => s.ColumnCount);

            // Add headers from the sheet with most columns
            var largestSheet = _sheetsData.Values.OrderByDescending(s => s.ColumnCount).First();
            combinedHeaders.AddRange(largestSheet.Headers);

            // Pad headers to ensure consistent column count
            while (combinedHeaders.Count < maxColumnCount + 1)
            {
                combinedHeaders.Add($"Column_{combinedHeaders.Count}");
            }

            using var memoryStream = new MemoryStream();
            var columns = combinedHeaders.Select((header, index) =>
                new Column<string>(Regex.Replace(header, @"[^a-zA-Z0-9_]", "_"))).ToArray();

            using (var parquetWriter = new ParquetFileWriter(memoryStream, columns))
            {
                using var rowGroupWriter = parquetWriter.AppendRowGroup();

                var allData = new List<string[]>();

                // Combine all sheets data
                foreach (var sheetName in _sheetNames)
                {
                    var sheetData = _sheetsData[sheetName];
                    foreach (var row in sheetData.Data)
                    {
                        var combinedRow = new string[maxColumnCount + 1];
                        combinedRow[0] = sheetName; // First column is sheet name

                        for (int i = 0; i < Math.Min(row.Length, maxColumnCount); i++)
                        {
                            combinedRow[i + 1] = row[i] ?? "";
                        }

                        // Fill remaining columns with empty strings
                        for (int i = row.Length + 1; i < combinedRow.Length; i++)
                        {
                            combinedRow[i] = "";
                        }

                        allData.Add(combinedRow);
                    }
                }

                // Write each column
                for (int columnIndex = 0; columnIndex < combinedHeaders.Count; columnIndex++)
                {
                    var columnData = allData.Select(row => row[columnIndex] ?? "").ToArray();
                    using var columnWriter = rowGroupWriter.NextColumn().LogicalWriter<string>();
                    columnWriter.WriteBatch(columnData);
                }

                parquetWriter.Close();
            }

            return memoryStream.ToArray();
        }

    }
}
