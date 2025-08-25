using ExcelDataManipulator.API.Models;

namespace ExcelDataManipulator.API.Services
{
    public class DataOperationsService
    {
        public ExcelDataModel ConcatenateColumns(ExcelDataModel data, int[] columnIndices, string delimiter = "")
        {
            if (columnIndices.Length < 2) return data;

            var newData = data.Data.Select(row =>
            {
                var newRow = row.ToList();
                var concatenated = string.Join(delimiter, columnIndices.Select(i => row[i]));
                newRow.Add(concatenated);
                return newRow.ToArray();
            }).ToArray();

            var newHeaders = data.Headers.ToList();
            newHeaders.Add($"Concat_{string.Join("_", columnIndices)}");

            return new ExcelDataModel
            {
                Headers = newHeaders.ToArray(),
                Data = newData,
                RowCount = newData.Length,
                ColumnCount = newHeaders.Count
            };
        }

        public ExcelDataModel TrimColumn(ExcelDataModel data, int columnIndex)
        {
            var newData = data.Data.Select(row =>
            {
                var newRow = (string[])row.Clone();
                newRow[columnIndex] = newRow[columnIndex].Trim();
                return newRow;
            }).ToArray();

            return new ExcelDataModel
            {
                Headers = data.Headers,
                Data = newData,
                RowCount = newData.Length,
                ColumnCount = data.ColumnCount
            };
        }

        public ExcelDataModel ChangeCase(ExcelDataModel data, int columnIndex, string caseType)
        {
            var newData = data.Data.Select(row =>
            {
                var newRow = (string[])row.Clone();
                newRow[columnIndex] = caseType.ToLower() switch
                {
                    "upper" => newRow[columnIndex].ToUpper(),
                    "lower" => newRow[columnIndex].ToLower(),
                    "title" => System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(newRow[columnIndex].ToLower()),
                    _ => newRow[columnIndex]
                };
                return newRow;
            }).ToArray();

            return new ExcelDataModel
            {
                Headers = data.Headers,
                Data = newData,
                RowCount = newData.Length,
                ColumnCount = data.ColumnCount
            };
        }

        public ExcelDataModel SortByColumn(ExcelDataModel data, int columnIndex, bool ascending = true)
        {
            var indexedData = data.Data.Select((row, index) => new { Row = row, OriginalIndex = index }).ToArray();

            var sortedData = ascending
                ? indexedData.OrderBy(x => x.Row[columnIndex]).Select(x => x.Row).ToArray()
                : indexedData.OrderByDescending(x => x.Row[columnIndex]).Select(x => x.Row).ToArray();

            return new ExcelDataModel
            {
                Headers = data.Headers,
                Data = sortedData,
                RowCount = sortedData.Length,
                ColumnCount = data.ColumnCount
            };
        }

        public ExcelDataModel SumColumns(ExcelDataModel data, int[] columnIndices)
        {
            var newData = data.Data.Select(row =>
            {
                var newRow = row.ToList();
                var sum = columnIndices.Sum(i =>
                {
                    if (double.TryParse(row[i], out double val))
                        return val;
                    return 0;
                });
                newRow.Add(sum.ToString());
                return newRow.ToArray();
            }).ToArray();

            var newHeaders = data.Headers.ToList();
            newHeaders.Add($"Sum_{string.Join("_", columnIndices)}");

            return new ExcelDataModel
            {
                Headers = newHeaders.ToArray(),
                Data = newData,
                RowCount = newData.Length,
                ColumnCount = newHeaders.Count
            };
        }
    }
}
