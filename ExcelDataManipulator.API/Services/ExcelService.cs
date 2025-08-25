using OfficeOpenXml;
using ExcelDataManipulator.API.Models;

namespace ExcelDataManipulator.API.Services
{
    public class ExcelService
    {
        private ExcelDataModel _currentData = new();

        public async Task<ExcelDataModel> LoadExcelFile(IFormFile file)
        {
            ExcelPackage.License.SetNonCommercialPersonal("Your Name");

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);

            using var package = new ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets[0];

            var rowCount = worksheet.Dimension.Rows;
            var colCount = worksheet.Dimension.Columns;

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

            _currentData = new ExcelDataModel
            {
                Headers = headers,
                Data = data,
                RowCount = rowCount - 1,
                ColumnCount = colCount
            };

            return _currentData;
        }

        public ExcelDataModel GetCurrentData() => _currentData;

        // ✅ ADD THIS METHOD - Update internal data after operations
        public void UpdateCurrentData(ExcelDataModel newData)
        {
            _currentData = newData;
        }

        public byte[] ExportToExcel()
        {
            ExcelPackage.License.SetNonCommercialPersonal("Your Name");

            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Sheet1");

            // Add headers
            for (int col = 0; col < _currentData.Headers.Length; col++)
            {
                worksheet.Cells[1, col + 1].Value = _currentData.Headers[col];
            }

            // Add data
            for (int row = 0; row < _currentData.Data.Length; row++)
            {
                for (int col = 0; col < _currentData.Data[row].Length; col++)
                {
                    worksheet.Cells[row + 2, col + 1].Value = _currentData.Data[row][col];
                }
            }

            return package.GetAsByteArray();
        }
    }
}
