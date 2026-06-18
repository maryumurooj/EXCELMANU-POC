using ExcelDataManipulator.API.Models;
using OfficeOpenXml;
using ParquetSharp;
using System.Text.RegularExpressions;
using System.Text.Json;
using ParquetSharp;
using ParquetSharp.Schema;
using System.Linq;


namespace ExcelDataManipulator.API.Services
{
    public class SessionService
    {
        private readonly string _dataDirectory;
        private static readonly Dictionary<string, SessionInfo> _activeSessions = new();
        private readonly ILogger<SessionService> _logger;

        public SessionService(IConfiguration configuration, ILogger<SessionService> logger)
        {
            _dataDirectory = configuration.GetValue<string>("DataDirectory") ?? "Data/Sessions";
            _logger = logger;
            Directory.CreateDirectory(_dataDirectory);
        }

        public async Task<string> CreateSessionAsync(IFormFile file)
        {
            var sessionId = Guid.NewGuid().ToString();
            var sessionPath = Path.Combine(_dataDirectory, sessionId);
            Directory.CreateDirectory(sessionPath);

            try
            {
                var excelData = await LoadExcelFileAsync(file);
                var sheetPaths = new Dictionary<string, string>();

                foreach (var sheet in excelData)
                {
                    var parquetPath = Path.Combine(sessionPath, $"{sheet.Key}.parquet");
                    await SaveAsParquetAsync(sheet.Value, parquetPath);
                    sheetPaths[sheet.Key] = parquetPath;
                }

                var sessionInfo = new SessionInfo
                {
                    SessionId = sessionId,
                    CreatedAt = DateTime.UtcNow,
                    LastAccessedAt = DateTime.UtcNow,
                    SheetPaths = sheetPaths,
                    ActiveSheet = sheetPaths.Keys.First()
                };

                _activeSessions[sessionId] = sessionInfo;
                return sessionId;
            }
            catch (Exception ex)
            {
                if (Directory.Exists(sessionPath))
                    Directory.Delete(sessionPath, true);
                throw;
            }
        }

        public SessionInfo? GetSession(string sessionId)
        {
            if (_activeSessions.TryGetValue(sessionId, out var session))
            {
                session.LastAccessedAt = DateTime.UtcNow;
                return session;
            }
            return null;
        }

        public async Task<ExcelDataSummary> GetDataSummaryAsync(string sessionId, string? sheetName = null)
        {
            var session = GetSession(sessionId);
            if (session == null) throw new ArgumentException("Invalid session");

            var activeSheet = sheetName ?? session.ActiveSheet;
            var parquetPath = session.SheetPaths[activeSheet];

            return await GetParquetSummaryAsync(parquetPath, activeSheet, session.SheetPaths.Keys.ToArray());
        }

        public async Task<PartialData> LoadPartialDataAsync(string sessionId, string sheetName, int[] columnIndices)
        {
            var session = GetSession(sessionId);
            if (session == null) throw new ArgumentException("Invalid session");

            if (!session.SheetPaths.ContainsKey(sheetName))
                throw new ArgumentException($"Sheet '{sheetName}' not found");

            var parquetPath = session.SheetPaths[sheetName];
            return await LoadColumnsFromParquetAsync(parquetPath, columnIndices);
        }

        public async Task AppendColumnToParquetAsync(string sessionId, string sheetName, ColumnData column)
        {
            var session = GetSession(sessionId);
            if (session == null) throw new ArgumentException("Invalid session");

            var sessionPath = Path.GetDirectoryName(session.SheetPaths[sheetName]);
            var columnPath = Path.Combine(sessionPath!, $"{sheetName}_col_{column.Index}_{column.Name}.parquet");

            await SaveColumnAsParquetAsync(column, columnPath);
        }

        public async Task UpdateColumnInParquetAsync(string sessionId, string sheetName, ColumnData column)
        {
            var session = GetSession(sessionId);
            if (session == null) throw new ArgumentException("Invalid session");

            var sessionPath = Path.GetDirectoryName(session.SheetPaths[sheetName]);
            var columnPath = Path.Combine(sessionPath!, $"{sheetName}_col_update_{column.Index}_{column.Name}.parquet");

            await SaveColumnAsParquetAsync(column, columnPath);
        }

        public async Task<int> GetNextColumnIndexAsync(string sessionId, string sheetName)
        {
            var summary = await GetDataSummaryAsync(sessionId, sheetName);
            return summary.ColumnCount;
        }

        private async Task<Dictionary<string, ExcelDataModel>> LoadExcelFileAsync(IFormFile file)
        {
            ExcelPackage.License.SetNonCommercialPersonal("Your Name"); // Keep your working license
            var sheetsData = new Dictionary<string, ExcelDataModel>();

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            using var package = new ExcelPackage(stream);

            foreach (var worksheet in package.Workbook.Worksheets)
            {
                var sheetName = worksheet.Name;
                var rowCount = worksheet.Dimension?.Rows ?? 0;
                var colCount = worksheet.Dimension?.Columns ?? 0;

                if (rowCount == 0 || colCount == 0)
                {
                    sheetsData[sheetName] = new ExcelDataModel
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
                    headers[col - 1] = worksheet.Cells[1, col].Text ?? $"Column{col}";
                }

                var data = new string[rowCount - 1][];
                for (int row = 2; row <= rowCount; row++)
                {
                    data[row - 2] = new string[colCount];
                    for (int col = 1; col <= colCount; col++)
                    {
                        data[row - 2][col - 1] = worksheet.Cells[row, col].Text ?? "";
                    }
                }

                sheetsData[sheetName] = new ExcelDataModel
                {
                    Headers = headers,
                    Data = data,
                    RowCount = rowCount - 1,
                    ColumnCount = colCount
                };
            }

            return sheetsData;
        }

        private async Task SaveAsParquetAsync(ExcelDataModel data, string filePath)
        {
            var columns = CreateParquetColumns(data);

            using var fileStream = File.Create(filePath);
            using var parquetWriter = new ParquetFileWriter(fileStream, columns);
            using var rowGroupWriter = parquetWriter.AppendRowGroup();

            for (int colIndex = 0; colIndex < data.ColumnCount; colIndex++)
            {
                var columnData = new string[data.RowCount];
                for (int rowIndex = 0; rowIndex < data.RowCount; rowIndex++)
                {
                    columnData[rowIndex] = data.Data[rowIndex][colIndex] ?? "";
                }

                using var columnWriter = rowGroupWriter.NextColumn().LogicalWriter<string>();
                columnWriter.WriteBatch(columnData);
            }

            parquetWriter.Close();
        }

        private async Task SaveColumnAsParquetAsync(ColumnData column, string filePath)
        {
            var columns = new Column[] { new Column<string>(SanitizeColumnName(column.Name)) };

            using var fileStream = File.Create(filePath);
            using var parquetWriter = new ParquetFileWriter(fileStream, columns);
            using var rowGroupWriter = parquetWriter.AppendRowGroup();

            using var columnWriter = rowGroupWriter.NextColumn().LogicalWriter<string>();
            columnWriter.WriteBatch(column.Values);

            parquetWriter.Close();
        }

        private async Task<ExcelDataSummary> GetParquetSummaryAsync(string parquetPath, string activeSheet, string[] availableSheets)
        {
            using var fileReader = new ParquetFileReader(parquetPath);
            var metadata = fileReader.FileMetaData; 
            var schema = metadata.Schema;

            var headers = new string[schema.NumColumns];
            for (int i = 0; i < schema.NumColumns; i++)
            {
                headers[i] = schema.Column(i).Name;
            }

            return new ExcelDataSummary
            {
                Headers = headers,
                RowCount = (int)metadata.NumRows,
                ColumnCount = schema.NumColumns,
                ActiveSheet = activeSheet,
                AvailableSheets = availableSheets,
                Metadata = new Dictionary<string, object>
                {
                    ["FileSize"] = new FileInfo(parquetPath).Length,
                    ["LastModified"] = File.GetLastWriteTime(parquetPath)
                }
            };
        }

        private async Task<PartialData> LoadColumnsFromParquetAsync(string parquetPath, int[] columnIndices)
        {
            using var fileReader = new ParquetFileReader(parquetPath);
            using var rowGroupReader = fileReader.RowGroup(0);

            var metadata = fileReader.FileMetaData;  // ✅ Get metadata
            var schema = metadata.Schema;            // ✅ Get schema from metadata
            var headers = new string[columnIndices.Length];
            var data = new List<string[]>();

            var columnData = new Dictionary<int, string[]>();

            foreach (var colIndex in columnIndices)
            {
                if (colIndex >= schema.NumColumns) continue;

                headers[Array.IndexOf(columnIndices, colIndex)] = schema.Column(colIndex).Name;

                using var columnReader = rowGroupReader.Column(colIndex).LogicalReader<string>();
                var values = new string[fileReader.FileMetaData.NumRows];
                var valuesRead = columnReader.ReadBatch(values);

                columnData[colIndex] = values.Take(valuesRead).ToArray();
            }

            var rowCount = columnData.Values.FirstOrDefault()?.Length ?? 0;
            for (int rowIndex = 0; rowIndex < rowCount; rowIndex++)
            {
                var row = new string[columnIndices.Length];
                for (int colIndex = 0; colIndex < columnIndices.Length; colIndex++)
                {
                    var originalColIndex = columnIndices[colIndex];
                    row[colIndex] = columnData.ContainsKey(originalColIndex)
                        ? columnData[originalColIndex][rowIndex]
                        : "";
                }
                data.Add(row);
            }

            return new PartialData
            {
                Headers = headers,
                ColumnIndices = columnIndices,
                Data = data.ToArray(),
                RowCount = rowCount
            };
        }

        private Column[] CreateParquetColumns(ExcelDataModel data)
        {
            var columns = new Column[data.ColumnCount];
            for (int i = 0; i < data.ColumnCount; i++)
            {
                columns[i] = new Column<string>(SanitizeColumnName(data.Headers[i]));
            }
            return columns;
        }

        private string SanitizeColumnName(string name)
        {
            var sanitized = Regex.Replace(name, @"[^a-zA-Z0-9_]", "_");
            if (char.IsDigit(sanitized[0]))
            {
                sanitized = "Col_" + sanitized;
            }
            return sanitized;
        }

        public async Task<byte[]> ExportToExcelAsync(string sessionId, bool allSheets = false)
        {
            var session = GetSession(sessionId);
            if (session == null) throw new ArgumentException("Invalid session");

            ExcelPackage.License.SetNonCommercialPersonal("Your Name"); // Keep your working license
            using var package = new ExcelPackage();

            // ✅ Fix: Convert Keys to string[] using ToArray()
            var sheetsToExport = allSheets
                ? session.SheetPaths.Keys.ToArray()
                : new[] { session.ActiveSheet };

            foreach (var sheetName in sheetsToExport)
            {
                var data = await LoadFullSheetDataAsync(sessionId, sheetName);
                var worksheet = package.Workbook.Worksheets.Add(sheetName);

                for (int col = 0; col < data.Headers.Length; col++)
                {
                    worksheet.Cells[1, col + 1].Value = data.Headers[col];
                }

                for (int row = 0; row < data.Data.Length; row++)
                {
                    for (int col = 0; col < data.Data[row].Length; col++)
                    {
                        worksheet.Cells[row + 2, col + 1].Value = data.Data[row][col];
                    }
                }
            }

            return package.GetAsByteArray();
        }

        public async Task<byte[]> ExportToJsonAsync(string sessionId, bool allSheets = false)
        {
            var session = GetSession(sessionId);
            if (session == null) throw new ArgumentException("Invalid session");

            if (allSheets)
            {
                var allSheetsData = new
                {
                    fileName = "exported_all_sheets",
                    exportedAt = DateTime.Now,
                    totalSheets = session.SheetPaths.Count,
                    sheets = await Task.WhenAll(session.SheetPaths.Keys.Select(async sheetName =>
                    {
                        var data = await LoadFullSheetDataAsync(sessionId, sheetName);
                        return new
                        {
                            name = sheetName,
                            headers = data.Headers,
                            data = data.Data,
                            rowCount = data.RowCount,
                            columnCount = data.ColumnCount
                        };
                    }))
                };

                return JsonSerializer.SerializeToUtf8Bytes(allSheetsData, new JsonSerializerOptions
                {
                    WriteIndented = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
            }
            else
            {
                var data = await LoadFullSheetDataAsync(sessionId, session.ActiveSheet);
                var jsonData = new
                {
                    fileName = "exported_current_sheet",
                    exportedAt = DateTime.Now,
                    sheet = new
                    {
                        name = session.ActiveSheet,
                        headers = data.Headers,
                        data = data.Data,
                        rowCount = data.RowCount,
                        columnCount = data.ColumnCount
                    }
                };

                return JsonSerializer.SerializeToUtf8Bytes(jsonData, new JsonSerializerOptions
                {
                    WriteIndented = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
            }
        }

        public async Task<byte[]> ExportToParquetAsync(string sessionId, bool allSheets = false)
        {
            var session = GetSession(sessionId);
            if (session == null) throw new ArgumentException("Invalid session");

            if (allSheets)
            {
                var allData = new List<string[]>();
                var headers = new List<string> { "SheetName" };
                var maxColumns = 0;

                foreach (var sheetName in session.SheetPaths.Keys)
                {
                    var summary = await GetDataSummaryAsync(sessionId, sheetName);
                    maxColumns = Math.Max(maxColumns, summary.ColumnCount);

                    if (headers.Count == 1)
                    {
                        headers.AddRange(summary.Headers);
                    }
                }

                while (headers.Count < maxColumns + 1)
                {
                    headers.Add($"Column_{headers.Count}");
                }

                foreach (var sheetName in session.SheetPaths.Keys)
                {
                    var sheetData = await LoadFullSheetDataAsync(sessionId, sheetName);
                    foreach (var row in sheetData.Data)
                    {
                        var combinedRow = new string[maxColumns + 1];
                        combinedRow[0] = sheetName;

                        for (int i = 0; i < Math.Min(row.Length, maxColumns); i++)
                        {
                            combinedRow[i + 1] = row[i] ?? "";
                        }

                        for (int i = row.Length + 1; i < combinedRow.Length; i++)
                        {
                            combinedRow[i] = "";
                        }

                        allData.Add(combinedRow);
                    }
                }

                using var memoryStream = new MemoryStream();
                var columns = headers.Select(h => new Column<string>(SanitizeColumnName(h))).ToArray();

                using (var parquetWriter = new ParquetFileWriter(memoryStream, columns))
                {
                    using var rowGroupWriter = parquetWriter.AppendRowGroup();

                    for (int colIndex = 0; colIndex < headers.Count; colIndex++)
                    {
                        var columnData = allData.Select(row => row[colIndex] ?? "").ToArray();
                        using var columnWriter = rowGroupWriter.NextColumn().LogicalWriter<string>();
                        columnWriter.WriteBatch(columnData);
                    }

                    parquetWriter.Close();
                }

                return memoryStream.ToArray();
            }
            else
            {
                var parquetPath = session.SheetPaths[session.ActiveSheet];
                return await File.ReadAllBytesAsync(parquetPath);
            }
        }

        private async Task<ExcelDataModel> LoadFullSheetDataAsync(string sessionId, string sheetName)
        {
            var session = GetSession(sessionId);
            if (session == null) throw new ArgumentException("Invalid session");

            var parquetPath = session.SheetPaths[sheetName];

            using var fileReader = new ParquetFileReader(parquetPath);
            using var rowGroupReader = fileReader.RowGroup(0);

            var metadata = fileReader.FileMetaData;  // ✅ Get metadata
            var schema = metadata.Schema;            // ✅ Get schema from metadata
            var headers = new string[schema.NumColumns];
            var data = new List<string[]>();

            var columnData = new Dictionary<int, string[]>();

            for (int colIndex = 0; colIndex < schema.NumColumns; colIndex++)
            {
                headers[colIndex] = schema.Column(colIndex).Name;

                using var columnReader = rowGroupReader.Column(colIndex).LogicalReader<string>();
                var values = new string[fileReader.FileMetaData.NumRows];
                var valuesRead = columnReader.ReadBatch(values);

                columnData[colIndex] = values.Take(valuesRead).ToArray();
            }

            var rowCount = columnData.Values.FirstOrDefault()?.Length ?? 0;
            for (int rowIndex = 0; rowIndex < rowCount; rowIndex++)
            {
                var row = new string[schema.NumColumns];
                for (int colIndex = 0; colIndex < schema.NumColumns; colIndex++)
                {
                    row[colIndex] = columnData[colIndex][rowIndex];
                }
                data.Add(row);
            }

            return new ExcelDataModel
            {
                Headers = headers,
                Data = data.ToArray(),
                RowCount = rowCount,
                ColumnCount = schema.NumColumns
            };
        }

        public void CleanupExpiredSessions(TimeSpan maxAge)
        {
            var expiredSessions = _activeSessions
                .Where(kvp => DateTime.UtcNow - kvp.Value.LastAccessedAt > maxAge)
                .ToList();

            foreach (var (sessionId, sessionInfo) in expiredSessions)
            {
                try
                {
                    var sessionPath = Path.GetDirectoryName(sessionInfo.SheetPaths.Values.First());
                    if (!string.IsNullOrEmpty(sessionPath) && Directory.Exists(sessionPath))
                    {
                        Directory.Delete(sessionPath, true);
                    }

                    _activeSessions.Remove(sessionId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to cleanup session {SessionId}", sessionId);
                }
            }
        }
    }
}
