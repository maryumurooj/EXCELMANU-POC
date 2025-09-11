using ExcelDataManipulator.API.Models;
using ExcelDataManipulator.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace ExcelDataManipulator.API.Controllers
{
    [ApiController]
    [Route("api/excel")]
    public class StreamingExcelController : ControllerBase
    {
        private readonly SessionService _sessionService;
        private readonly StreamingDataOperationsService _streamingOperationsService;
        private readonly ILogger<StreamingExcelController> _logger;

        public StreamingExcelController(
            SessionService sessionService,
            StreamingDataOperationsService streamingOperationsService,
            ILogger<StreamingExcelController> logger)
        {
            _sessionService = sessionService;
            _streamingOperationsService = streamingOperationsService;
            _logger = logger;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file provided" });

                var allowedExtensions = new[] { ".xlsx", ".xls" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                    return BadRequest(new { message = "Invalid file type. Only .xlsx and .xls files are allowed." });

                _logger.LogInformation("Starting file upload: {FileName} ({FileSize} bytes)", file.FileName, file.Length);

                // Create session and save as Parquet
                var sessionId = await _sessionService.CreateSessionAsync(file);
                var summary = await _sessionService.GetDataSummaryAsync(sessionId);

                _logger.LogInformation("File uploaded successfully. Session: {SessionId}", sessionId);

                return Ok(new
                {
                    message = "File uploaded successfully",
                    sessionId = sessionId,
                    summary = summary,
                    uploadedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "File upload failed");
                return BadRequest(new { message = $"Upload failed: {ex.Message}" });
            }
        }

        [HttpPost("sessions/{sessionId}/operations")]
        public async Task<IActionResult> ExecuteOperation(string sessionId, [FromBody] OperationCommand command)
        {
            try
            {
                var session = _sessionService.GetSession(sessionId);
                if (session == null)
                    return BadRequest(new { success = false, message = "Invalid session" });

                // ✅ Fix: Use explicit assignments instead of switch expression
                OperationResult result;

                switch (command.Operation.ToLower())
                {
                    case "concatenate":
                        result = await ExecuteConcatenateOperation(sessionId, command);
                        break;
                    case "split":
                        result = await ExecuteSplitOperation(sessionId, command);
                        break;
                    case "sum":
                        result = await ExecuteSumOperation(sessionId, command);
                        break;
                    case "multiply":
                        result = await ExecuteMultiplyOperation(sessionId, command);
                        break;
                    case "average":
                        result = await ExecuteAverageOperation(sessionId, command);
                        break;
                    case "median":
                        result = await ExecuteMedianOperation(sessionId, command);
                        break;
                    case "trim":
                        result = await ExecuteTrimOperation(sessionId, command);
                        break;
                    case "changecase":
                        result = await ExecuteChangeCaseOperation(sessionId, command);
                        break;
                    default:
                        throw new ArgumentException($"Unknown operation: {command.Operation}");
                }

                var updatedSummary = await _sessionService.GetDataSummaryAsync(sessionId, command.SheetName);

                return Ok(new
                {
                    success = true,
                    sessionId = sessionId,
                    delta = new DeltaResponse
                    {
                        Operation = command.Operation,
                        NewColumns = result.NewColumns,
                        ModifiedColumns = result.ModifiedColumns,
                        UpdatedSummary = updatedSummary,
                        Message = result.Message
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Operation {Operation} failed for session {SessionId}", command.Operation, sessionId);
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("sessions/{sessionId}/summary")]
        public async Task<IActionResult> GetDataSummary(string sessionId, string? sheetName = null)
        {
            try
            {
                var summary = await _sessionService.GetDataSummaryAsync(sessionId, sheetName);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get summary for session {SessionId}", sessionId);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("sessions/{sessionId}/export")]
        public async Task<IActionResult> ExportData(string sessionId, string format = "excel", bool allSheets = false)
        {
            try
            {
                var session = _sessionService.GetSession(sessionId);
                if (session == null) return BadRequest("Invalid session");

                _logger.LogInformation("Exporting data for session {SessionId} in {Format} format", sessionId, format);

                byte[] fileBytes;
                string fileName;
                string contentType;

                switch (format.ToLower())
                {
                    case "excel":
                        fileBytes = await _sessionService.ExportToExcelAsync(sessionId, allSheets);
                        fileName = $"export_{(allSheets ? "all_sheets" : "current_sheet")}.xlsx";
                        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                        break;

                    case "json":
                        fileBytes = await _sessionService.ExportToJsonAsync(sessionId, allSheets);
                        fileName = $"export_{(allSheets ? "all_sheets" : "current_sheet")}.json";
                        contentType = "application/json";
                        break;

                    case "parquet":
                        fileBytes = await _sessionService.ExportToParquetAsync(sessionId, allSheets);
                        fileName = $"export_{(allSheets ? "all_sheets" : "current_sheet")}.parquet";
                        contentType = "application/octet-stream";
                        break;

                    default:
                        return BadRequest(new { message = "Supported formats: excel, json, parquet" });
                }

                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Export failed for session {SessionId}", sessionId);
                return BadRequest(new { message = ex.Message });
            }
        }

        private async Task<OperationResult> ExecuteMedianOperation(string sessionId, OperationCommand command)
        {
            var newColumnName = command.Parameters?.GetValueOrDefault("newColumnName")?.ToString() ?? "Median";
            return await _streamingOperationsService.MedianColumnsAsync(sessionId, command.SheetName, command.ColumnIndices, newColumnName);
        }

        private async Task<OperationResult> ExecuteConcatenateOperation(string sessionId, OperationCommand command)
        {
            var delimitersArray = command.Parameters?.ContainsKey("delimiters") == true
                ? JsonSerializer.Deserialize<string[]>(command.Parameters["delimiters"].ToString()!)
                : null;

            var newColumnName = command.Parameters?.GetValueOrDefault("newColumnName")?.ToString() ?? "Concatenated";
            var constantText = command.Parameters?.GetValueOrDefault("constantText")?.ToString();
            var position = command.Parameters?.GetValueOrDefault("position")?.ToString() ?? "suffix";

            return await _streamingOperationsService.ConcatenateColumnsAsync(
                sessionId,
                command.SheetName,
                command.ColumnIndices,
                delimitersArray,
                newColumnName,
                constantText,
                position
            );
        }

        private async Task<OperationResult> ExecuteSplitOperation(string sessionId, OperationCommand command)
        {
            var delimiter = command.Parameters?.GetValueOrDefault("delimiter")?.ToString() ?? ",";
            var maxSplitsParam = command.Parameters?.GetValueOrDefault("maxSplits")?.ToString();
            int? maxSplits = null;
            if (!string.IsNullOrEmpty(maxSplitsParam) && int.TryParse(maxSplitsParam, out int parsedMaxSplits))
            {
                maxSplits = parsedMaxSplits;
            }
            var columnBaseName = command.Parameters?.GetValueOrDefault("columnBaseName")?.ToString();

            if (command.ColumnIndices.Length != 1)
            {
                throw new ArgumentException("Please select exactly one column to split");
            }

            return await _streamingOperationsService.SplitColumnByDelimiterAsync(
                sessionId,
                command.SheetName,
                command.ColumnIndices[0],
                delimiter,
                maxSplits,
                columnBaseName
            );
        }

        private async Task<OperationResult> ExecuteSumOperation(string sessionId, OperationCommand command)
        {
            var newColumnName = command.Parameters?.GetValueOrDefault("newColumnName")?.ToString() ?? "Sum";
            return await _streamingOperationsService.SumColumnsAsync(sessionId, command.SheetName, command.ColumnIndices, newColumnName);
        }

        private async Task<OperationResult> ExecuteMultiplyOperation(string sessionId, OperationCommand command)
        {
            var newColumnName = command.Parameters?.GetValueOrDefault("newColumnName")?.ToString() ?? "Product";
            return await _streamingOperationsService.MultiplyColumnsAsync(sessionId, command.SheetName, command.ColumnIndices, newColumnName);
        }

        private async Task<OperationResult> ExecuteAverageOperation(string sessionId, OperationCommand command)
        {
            var newColumnName = command.Parameters?.GetValueOrDefault("newColumnName")?.ToString() ?? "Average";
            return await _streamingOperationsService.AverageColumnsAsync(sessionId, command.SheetName, command.ColumnIndices, newColumnName);
        }

        private async Task<OperationResult> ExecuteTrimOperation(string sessionId, OperationCommand command)
        {
            if (command.ColumnIndices.Length != 1)
            {
                throw new ArgumentException("Please select exactly one column to trim");
            }

            return await _streamingOperationsService.TrimColumnAsync(sessionId, command.SheetName, command.ColumnIndices[0]);
        }

        private async Task<OperationResult> ExecuteChangeCaseOperation(string sessionId, OperationCommand command)
        {
            var caseType = command.Parameters?.GetValueOrDefault("caseType")?.ToString() ?? "upper";

            if (command.ColumnIndices.Length != 1)
            {
                throw new ArgumentException("Please select exactly one column to change case");
            }

            return await _streamingOperationsService.ChangeCaseAsync(sessionId, command.SheetName, command.ColumnIndices[0], caseType);
        }

        [HttpDelete("sessions/{sessionId}")]
        public IActionResult CleanupSession(string sessionId)
        {
            try
            {
                // Manual session cleanup if needed
                _sessionService.CleanupExpiredSessions(TimeSpan.Zero);
                return Ok(new { message = "Session cleanup completed" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
