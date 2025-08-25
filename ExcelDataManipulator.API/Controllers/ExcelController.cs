using Microsoft.AspNetCore.Mvc;
using ExcelDataManipulator.API.Models;
using ExcelDataManipulator.API.Services;

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

        [HttpPost("upload")]
        public async Task<ActionResult<ExcelDataModel>> UploadFile(IFormFile file)
        {
            try
            {
                // Add detailed validation
                if (file == null)
                {
                    return BadRequest(new { message = "No file provided" });
                }

                if (file.Length == 0)
                {
                    return BadRequest(new { message = "File is empty" });
                }

                // Check file extension
                var allowedExtensions = new[] { ".xlsx", ".xls" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(new { message = "Invalid file type. Only .xlsx and .xls files are allowed." });
                }

                var data = await _excelService.LoadExcelFile(file);
                return Ok(data);
            }
            catch (Exception ex)
            {
                // Return detailed error information
                return BadRequest(new { message = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpPost("operation")]
        public ActionResult<OperationResponse> PerformOperation([FromBody] OperationRequest request)
        {
            try
            {
                var currentData = _excelService.GetCurrentData();
                ExcelDataModel result = currentData;

                switch (request.Operation.ToLower())
                {
                    case "concatenate":
                        var delimiter = request.Parameters?.GetValueOrDefault("delimiter")?.ToString() ?? "";
                        result = _operationsService.ConcatenateColumns(currentData, request.SelectedColumns!, delimiter);
                        break;
                    case "trim":
                        result = _operationsService.TrimColumn(currentData, request.SelectedColumns![0]);
                        break;
                    case "changecase":
                        var caseType = request.Parameters?.GetValueOrDefault("caseType")?.ToString() ?? "upper";
                        result = _operationsService.ChangeCase(currentData, request.SelectedColumns![0], caseType);
                        break;
                    case "sort":
                        var ascending = (bool)(request.Parameters?.GetValueOrDefault("ascending") ?? true);
                        result = _operationsService.SortByColumn(currentData, request.SelectedColumns![0], ascending);
                        break;
                    case "sum":
                        result = _operationsService.SumColumns(currentData, request.SelectedColumns!);
                        break;
                }

                // ✅ IMPORTANT: Update the service's internal data
                _excelService.UpdateCurrentData(result);

                return Ok(new OperationResponse
                {
                    Success = true,
                    Message = "Operation completed successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
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
    }
}
