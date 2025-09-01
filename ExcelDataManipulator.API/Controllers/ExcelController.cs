using ExcelDataManipulator.API.Models;
using ExcelDataManipulator.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using ParquetSharp;
using System.Text.RegularExpressions;


namespace ExcelDataManipulator.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExcelController : ControllerBase
    {
        private readonly ExcelService _excelService;
        private readonly DataOperationsService _operationsService;


        public ExcelController(ExcelService excelService, DataOperationsService operationsService)
        {
            _excelService = excelService;
            _operationsService = operationsService;
        }

        // ✅ Add this helper method
        private int ParseJsonInt(object? obj, int defaultValue = 0)
        {
            if (obj == null) return defaultValue;

            if (obj is JsonElement jsonElement)
            {
                if (jsonElement.ValueKind == JsonValueKind.Number && jsonElement.TryGetInt32(out int intValue))
                    return intValue;
                else if (jsonElement.ValueKind == JsonValueKind.String && int.TryParse(jsonElement.GetString(), out intValue))
                    return intValue;
            }
            else if (obj is int intVal)
            {
                return intVal;
            }
            else if (obj is string str && int.TryParse(str, out int stringIntValue))
            {
                return stringIntValue;
            }

            return defaultValue;
        }

        private string ParseJsonString(object? obj, string defaultValue = "")
        {
            if (obj == null) return defaultValue;

            if (obj is JsonElement jsonElement)
            {
                if (jsonElement.ValueKind == JsonValueKind.String)
                    return jsonElement.GetString() ?? defaultValue;
            }
            else if (obj is string str)
            {
                return str;
            }

            return obj.ToString() ?? defaultValue;
        }

        [HttpPost("upload")]
        public async Task<ActionResult> UploadFile(IFormFile file)
        {
            try
            {
                if (file == null)
                    return BadRequest(new { message = "No file provided" });
                if (file.Length == 0)
                    return BadRequest(new { message = "File is empty" });

                var allowedExtensions = new[] { ".xlsx", ".xls" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                    return BadRequest(new { message = "Invalid file type. Only .xlsx and .xls files are allowed." });

                var sheetsData = await _excelService.LoadExcelFile(file);
                var sheetNames = _excelService.GetSheetNames();
                var activeSheet = _excelService.GetActiveSheetName();

                return Ok(new
                {
                    message = "File uploaded successfully",
                    sheets = sheetNames,
                    activeSheet = activeSheet,
                    data = _excelService.GetCurrentData()
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("sheets")]
        public ActionResult<List<string>> GetSheets()
        {
            try
            {
                var sheets = _excelService.GetSheetNames();
                return Ok(sheets);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("activesheet")]
        public ActionResult SetActiveSheet([FromBody] string sheetName)
        {
            try
            {
                _excelService.SetActiveSheet(sheetName);
                var sheetData = _excelService.GetSheetData(sheetName);
                return Ok(new { message = $"Active sheet set to {sheetName}", data = sheetData });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("activesheet")]
        public ActionResult<string> GetActiveSheet()
        {
            try
            {
                var activeSheet = _excelService.GetActiveSheetName();
                return Ok(new { activeSheet });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpPost("operation")]
        public ActionResult<OperationResponse> PerformOperation([FromBody] OperationRequest request)
        {
            try
            {
                var currentData = request.CurrentData ?? _excelService.GetCurrentData(); Console.WriteLine($"🔍 BEFORE: {currentData.Data.Length} rows, {currentData.ColumnCount} columns");

                ExcelDataModel result = currentData;

                // ✅ ADD THE ACTUAL OPERATION LOGIC HERE!
                switch (request.Operation.ToLower())
                {
                    
                    case "trim":
                        // Default: trim single column
                        result = _operationsService.TrimColumn(currentData, request.SelectedColumns![0]);
                        break;

                    case "trimcolumns":
                        // Trim multiple selected columns
                        result = _operationsService.TrimColumns(currentData, request.SelectedColumns!);
                        break;

                    case "trimall":
                        // Trim entire table
                        result = _operationsService.TrimAllCells(currentData);
                        break;

                    case "trimcells":
                        // Trim specific cells
                        var cellCoords = request.Parameters?.GetValueOrDefault("cellCoordinates") as List<(int, int)> ?? new List<(int, int)>();
                        result = _operationsService.TrimSpecificCells(currentData, cellCoords);
                        break;


                    case "changecase":
                        var caseType = request.Parameters?.GetValueOrDefault("caseType")?.ToString() ?? "upper";
                        result = _operationsService.ChangeCase(currentData, request.SelectedColumns![0], caseType);
                        break;

                    case "sort":
                        var ascending = (bool)(request.Parameters?.GetValueOrDefault("ascending") ?? true);
                        result = _operationsService.SortByColumn(currentData, request.SelectedColumns![0], ascending);
                        break;

                    case "concatenate":
                        var delimitersJson = request.Parameters?.GetValueOrDefault("delimiters")?.ToString();
                        string[] delimitersArray = null;

                        if (!string.IsNullOrEmpty(delimitersJson))
                        {
                            try
                            {
                                delimitersArray = JsonSerializer.Deserialize<string[]>(delimitersJson);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"⚠️ Failed to parse delimiters: {ex.Message}");
                                delimitersArray = null;
                            }
                        }

                        var concatColumnName = ParseJsonString(request.Parameters?.GetValueOrDefault("newColumnName"), "Concatenated");
                        result = _operationsService.ConcatenateColumns(currentData, request.SelectedColumns!, delimitersArray, concatColumnName);
                        break;

                    case "sum":
                        var sumColumnName = ParseJsonString(request.Parameters?.GetValueOrDefault("newColumnName"), "Sum");
                        result = _operationsService.SumColumns(currentData, request.SelectedColumns!, sumColumnName);
                        break;

                    case "multiply":
                        var multiplyColumnName = ParseJsonString(request.Parameters?.GetValueOrDefault("newColumnName"), "Product");
                        result = _operationsService.MultiplyColumns(currentData, request.SelectedColumns!, multiplyColumnName);
                        break;

                    case "median":
                        var medianColumnName = ParseJsonString(request.Parameters?.GetValueOrDefault("newColumnName"), "Median");
                        result = _operationsService.MedianColumns(currentData, request.SelectedColumns!, medianColumnName);
                        break;


                    case "pivot":
                        var rowGroupCol = ParseJsonInt(request.Parameters?.GetValueOrDefault("rowGroupColumn"), 0);
                        var pivotCol = ParseJsonInt(request.Parameters?.GetValueOrDefault("pivotColumn"), 1);
                        var valueCol = ParseJsonInt(request.Parameters?.GetValueOrDefault("valueColumn"), 2);
                        var aggregation = ParseJsonString(request.Parameters?.GetValueOrDefault("aggregation"), "sum");

                        result = _operationsService.CreatePivotTable(currentData, rowGroupCol, pivotCol, valueCol, aggregation);

                        // ✅ Create new sheet for pivot instead of replacing current data
                        var pivotSheetName = $"Pivot_{currentData.Headers[rowGroupCol]}_{currentData.Headers[pivotCol]}";
                        _excelService.AddNewSheet(pivotSheetName, result);

                        Console.WriteLine($"🔍 CREATED PIVOT SHEET: {pivotSheetName}");

                        // Return the new sheet data
                        result = _excelService.GetCurrentData();
                        break;
                    case "average":
                        result = _operationsService.AverageColumns(currentData, request.SelectedColumns!);
                        break;

                    case "min":
                        result = _operationsService.MinColumns(currentData, request.SelectedColumns!);
                        break;

                    case "max":
                        result = _operationsService.MaxColumns(currentData, request.SelectedColumns!);
                        break;

                    case "count":
                        result = _operationsService.CountColumns(currentData, request.SelectedColumns!);
                        break;

                    default:
                        throw new ArgumentException($"Unknown operation: {request.Operation}");
                }

                _excelService.UpdateCurrentData(result);

                Console.WriteLine($"🔍 RETURNING: {result.Data.Length} rows, {result.ColumnCount} columns");

                return Ok(new OperationResponse
                {
                    Success = true,
                    Message = "Operation completed successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ERROR: {ex.Message}");
                return BadRequest(new OperationResponse
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpGet("export")]
        public ActionResult ExportFile()
        {
            try
            {
                var fileBytes = _excelService.ExportToExcel();
                return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "exported_data.xlsx");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        

[HttpGet("export/json")]
    public async Task<IActionResult> ExportJson()
    {
        try
        {
            var currentData = _excelService.GetCurrentData();

            // Create a structured JSON representation
            var jsonData = new
            {
                fileName = "exported_data",
                exportedAt = DateTime.Now,
                sheets = new[]
                {
                new
                {
                    name = _excelService.GetActiveSheetName(),
                    headers = currentData.Headers,
                    data = currentData.Data,
                    rowCount = currentData.RowCount,
                    columnCount = currentData.ColumnCount
                }
            }
            };

            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            string jsonString = JsonSerializer.Serialize(jsonData, options);
            byte[] jsonBytes = System.Text.Encoding.UTF8.GetBytes(jsonString);

            return File(jsonBytes, "application/json", "exported_data.json");
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("export/parquet")]
    public async Task<IActionResult> ExportParquet()
    {
        try
        {
            var currentData = _excelService.GetCurrentData();

            using var memoryStream = new MemoryStream();
            var columns = CreateParquetColumns(currentData);

            using (var parquetWriter = new ParquetFileWriter(memoryStream, columns))
            {
                using var rowGroupWriter = parquetWriter.AppendRowGroup();

                // Write each column
                for (int columnIndex = 0; columnIndex < currentData.ColumnCount; columnIndex++)
                {
                    var columnData = new string[currentData.RowCount];
                    for (int rowIndex = 0; rowIndex < currentData.RowCount; rowIndex++)
                    {
                        columnData[rowIndex] = currentData.Data[rowIndex][columnIndex] ?? "";
                    }

                    using var columnWriter = rowGroupWriter.NextColumn().LogicalWriter<string>();
                    columnWriter.WriteBatch(columnData);
                }

                parquetWriter.Close();
            }

            return File(memoryStream.ToArray(), "application/octet-stream", "exported_data.parquet");
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Column[] CreateParquetColumns(ExcelDataModel data)
    {
        var columns = new Column[data.ColumnCount];

        for (int i = 0; i < data.ColumnCount; i++)
        {
            // Clean header names for Parquet compatibility (remove spaces, special chars)
            var headerName = Regex.Replace(data.Headers[i], @"[^a-zA-Z0-9_]", "_");

            // Ensure header name doesn't start with number
            if (char.IsDigit(headerName[0]))
            {
                headerName = "Col_" + headerName;
            }

            columns[i] = new Column<string>(headerName);
        }

        return columns;
    }


    }
}
