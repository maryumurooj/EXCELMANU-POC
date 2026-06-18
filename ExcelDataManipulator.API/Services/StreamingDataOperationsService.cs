using ExcelDataManipulator.API.Models;
using System.Text;

namespace ExcelDataManipulator.API.Services
{
    public class StreamingDataOperationsService
    {
        private readonly SessionService _sessionService;
        private readonly ILogger<StreamingDataOperationsService> _logger;

        public StreamingDataOperationsService(SessionService sessionService, ILogger<StreamingDataOperationsService> logger)
        {
            _sessionService = sessionService;
            _logger = logger;
        }

        public async Task<OperationResult> ConcatenateColumnsAsync(string sessionId, string sheetName, int[] columnIndices, string[] delimiters = null, string newColumnName = "Concatenated", string constantText = null, string position = "suffix")
        {
            if (columnIndices.Length == 1 && !string.IsNullOrEmpty(constantText))
            {
                return await ConcatenateWithConstantAsync(sessionId, sheetName, columnIndices[0], constantText, position, newColumnName);
            }

            if (columnIndices.Length < 2)
            {
                throw new ArgumentException("Not enough columns selected for concatenation");
            }

            var partialData = await _sessionService.LoadPartialDataAsync(sessionId, sheetName, columnIndices);
            var newColumnData = new string[partialData.RowCount];

            for (int rowIndex = 0; rowIndex < partialData.RowCount; rowIndex++)
            {
                var stringBuilder = new StringBuilder();

                for (int i = 0; i < columnIndices.Length; i++)
                {
                    var localColIndex = Array.IndexOf(partialData.ColumnIndices, columnIndices[i]);
                    if (localColIndex >= 0)
                    {
                        string cellValue = partialData.Data[rowIndex][localColIndex] ?? "";
                        stringBuilder.Append(cellValue);
                    }

                    if (i < columnIndices.Length - 1)
                    {
                        string delimiter = "";
                        if (delimiters != null && i < delimiters.Length)
                        {
                            delimiter = delimiters[i] ?? "";
                        }
                        stringBuilder.Append(delimiter);
                    }
                }

                newColumnData[rowIndex] = stringBuilder.ToString();
            }

            var newColumn = new ColumnData
            {
                Name = string.IsNullOrWhiteSpace(newColumnName) ? "Concatenated" : newColumnName,
                Values = newColumnData,
                Index = await _sessionService.GetNextColumnIndexAsync(sessionId, sheetName)
            };

            await _sessionService.AppendColumnToParquetAsync(sessionId, sheetName, newColumn);

            return new OperationResult
            {
                NewColumns = new[] { newColumn },
                ModifiedColumns = null,
                OperationType = OperationType.AddColumn,
                Message = $"Successfully concatenated {columnIndices.Length} columns"
            };
        }

        private async Task<OperationResult> ConcatenateWithConstantAsync(string sessionId, string sheetName, int columnIndex, string constantText, string position, string newColumnName)
        {
            var partialData = await _sessionService.LoadPartialDataAsync(sessionId, sheetName, new[] { columnIndex });
            var newColumnData = new string[partialData.RowCount];

            for (int rowIndex = 0; rowIndex < partialData.RowCount; rowIndex++)
            {
                string originalValue = partialData.Data[rowIndex][0] ?? "";
                newColumnData[rowIndex] = position.ToLower() == "prefix"
                    ? constantText + originalValue
                    : originalValue + constantText;
            }

            var newColumn = new ColumnData
            {
                Name = string.IsNullOrWhiteSpace(newColumnName) ? "Concatenated" : newColumnName,
                Values = newColumnData,
                Index = await _sessionService.GetNextColumnIndexAsync(sessionId, sheetName)
            };

            await _sessionService.AppendColumnToParquetAsync(sessionId, sheetName, newColumn);

            return new OperationResult
            {
                NewColumns = new[] { newColumn },
                ModifiedColumns = null,
                OperationType = OperationType.AddColumn,
                Message = "Successfully concatenated column with constant text"
            };
        }

        public async Task<OperationResult> SplitColumnByDelimiterAsync(string sessionId, string sheetName, int columnIndex, string delimiter, int? maxSplits = null, string columnBaseName = null)
        {
            var partialData = await _sessionService.LoadPartialDataAsync(sessionId, sheetName, new[] { columnIndex });
            var sourceColumnName = partialData.Headers[0];
            var baseNameForNewColumns = string.IsNullOrWhiteSpace(columnBaseName) ? sourceColumnName : columnBaseName;

            int maxPartsFound = 0;
            var allSplitData = new List<string[]>();

            foreach (var row in partialData.Data)
            {
                string cellValue = row[0] ?? "";
                string[] splitParts = cellValue.Split(new string[] { delimiter }, StringSplitOptions.None);
                allSplitData.Add(splitParts);
                maxPartsFound = Math.Max(maxPartsFound, splitParts.Length);
            }

            int numberOfNewColumns = maxSplits.HasValue
                ? Math.Min(maxPartsFound, maxSplits.Value)
                : maxPartsFound;

            var newColumns = new List<ColumnData>();
            var nextColumnIndex = await _sessionService.GetNextColumnIndexAsync(sessionId, sheetName);

            for (int colIndex = 0; colIndex < numberOfNewColumns; colIndex++)
            {
                var columnData = new string[partialData.RowCount];

                for (int rowIndex = 0; rowIndex < partialData.RowCount; rowIndex++)
                {
                    string[] splitParts = allSplitData[rowIndex];
                    columnData[rowIndex] = colIndex < splitParts.Length
                        ? (splitParts[colIndex] ?? "")
                        : "";
                }

                var newColumn = new ColumnData
                {
                    Name = $"{baseNameForNewColumns}_Part{colIndex + 1}",
                    Values = columnData,
                    Index = nextColumnIndex + colIndex
                };

                newColumns.Add(newColumn);
            }

            foreach (var column in newColumns)
            {
                await _sessionService.AppendColumnToParquetAsync(sessionId, sheetName, column);
            }

            return new OperationResult
            {
                NewColumns = newColumns.ToArray(),
                ModifiedColumns = null,
                OperationType = OperationType.AddColumn,
                Message = $"Successfully split column into {numberOfNewColumns} new columns"
            };
        }

        public async Task<OperationResult> SumColumnsAsync(string sessionId, string sheetName, int[] columnIndices, string newColumnName = "Sum")
        {
            var partialData = await _sessionService.LoadPartialDataAsync(sessionId, sheetName, columnIndices);
            var newColumnData = new string[partialData.RowCount];

            for (int rowIndex = 0; rowIndex < partialData.RowCount; rowIndex++)
            {
                double sum = 0;
                for (int colIndex = 0; colIndex < partialData.Data[rowIndex].Length; colIndex++)
                {
                    if (double.TryParse(partialData.Data[rowIndex][colIndex], out double val))
                    {
                        sum += val;
                    }
                }
                newColumnData[rowIndex] = sum.ToString();
            }

            var newColumn = new ColumnData
            {
                Name = string.IsNullOrWhiteSpace(newColumnName) ? "Sum" : newColumnName,
                Values = newColumnData,
                Index = await _sessionService.GetNextColumnIndexAsync(sessionId, sheetName)
            };

            await _sessionService.AppendColumnToParquetAsync(sessionId, sheetName, newColumn);

            return new OperationResult
            {
                NewColumns = new[] { newColumn },
                ModifiedColumns = null,
                OperationType = OperationType.AddColumn,
                Message = "Successfully calculated sum"
            };
        }

        public async Task<OperationResult> MultiplyColumnsAsync(string sessionId, string sheetName, int[] columnIndices, string newColumnName = "Product")
        {
            var partialData = await _sessionService.LoadPartialDataAsync(sessionId, sheetName, columnIndices);
            var newColumnData = new string[partialData.RowCount];

            for (int rowIndex = 0; rowIndex < partialData.RowCount; rowIndex++)
            {
                double product = 1;
                bool hasValues = false;

                for (int colIndex = 0; colIndex < partialData.Data[rowIndex].Length; colIndex++)
                {
                    if (double.TryParse(partialData.Data[rowIndex][colIndex], out double val))
                    {
                        product *= val;
                        hasValues = true;
                    }
                }
                newColumnData[rowIndex] = hasValues ? product.ToString() : "0";
            }

            var newColumn = new ColumnData
            {
                Name = string.IsNullOrWhiteSpace(newColumnName) ? "Product" : newColumnName,
                Values = newColumnData,
                Index = await _sessionService.GetNextColumnIndexAsync(sessionId, sheetName)
            };

            await _sessionService.AppendColumnToParquetAsync(sessionId, sheetName, newColumn);

            return new OperationResult
            {
                NewColumns = new[] { newColumn },
                ModifiedColumns = null,
                OperationType = OperationType.AddColumn,
                Message = "Successfully calculated product"
            };
        }

        public async Task<OperationResult> AverageColumnsAsync(string sessionId, string sheetName, int[] columnIndices, string newColumnName = "Average")
        {
            var partialData = await _sessionService.LoadPartialDataAsync(sessionId, sheetName, columnIndices);
            var newColumnData = new string[partialData.RowCount];

            for (int rowIndex = 0; rowIndex < partialData.RowCount; rowIndex++)
            {
                var values = new List<double>();
                for (int colIndex = 0; colIndex < partialData.Data[rowIndex].Length; colIndex++)
                {
                    if (double.TryParse(partialData.Data[rowIndex][colIndex], out double val))
                    {
                        values.Add(val);
                    }
                }
                double average = values.Count > 0 ? values.Average() : 0;
                newColumnData[rowIndex] = Math.Round(average, 2).ToString();
            }

            var newColumn = new ColumnData
            {
                Name = string.IsNullOrWhiteSpace(newColumnName) ? "Average" : newColumnName,
                Values = newColumnData,
                Index = await _sessionService.GetNextColumnIndexAsync(sessionId, sheetName)
            };

            await _sessionService.AppendColumnToParquetAsync(sessionId, sheetName, newColumn);

            return new OperationResult
            {
                NewColumns = new[] { newColumn },
                ModifiedColumns = null,
                OperationType = OperationType.AddColumn,
                Message = "Successfully calculated average"
            };
        }

        public async Task<OperationResult> MedianColumnsAsync(string sessionId, string sheetName, int[] columnIndices, string newColumnName = "Median")
        {
            var partialData = await _sessionService.LoadPartialDataAsync(sessionId, sheetName, columnIndices);
            var newColumnData = new string[partialData.RowCount];

            for (int rowIndex = 0; rowIndex < partialData.RowCount; rowIndex++)
            {
                var values = new List<double>();
                foreach (int colIndex in columnIndices)
                {
                    var localColIndex = Array.IndexOf(partialData.ColumnIndices, colIndex);
                    if (localColIndex >= 0 && double.TryParse(partialData.Data[rowIndex][localColIndex], out double val))
                    {
                        values.Add(val);
                    }
                }

                double median = 0;
                if (values.Count > 0)
                {
                    values.Sort();
                    int middle = values.Count / 2;
                    if (values.Count % 2 == 0)
                        median = (values[middle - 1] + values[middle]) / 2.0;
                    else
                        median = values[middle];
                }

                newColumnData[rowIndex] = Math.Round(median, 2).ToString();
            }

            var newColumn = new ColumnData
            {
                Name = string.IsNullOrWhiteSpace(newColumnName) ? "Median" : newColumnName,
                Values = newColumnData,
                Index = await _sessionService.GetNextColumnIndexAsync(sessionId, sheetName)
            };

            await _sessionService.AppendColumnToParquetAsync(sessionId, sheetName, newColumn);

            return new OperationResult
            {
                NewColumns = new[] { newColumn },
                ModifiedColumns = null,
                OperationType = OperationType.AddColumn,
                Message = "Successfully calculated median"
            };
        }

        public async Task<OperationResult> TrimColumnAsync(string sessionId, string sheetName, int columnIndex)
        {
            var partialData = await _sessionService.LoadPartialDataAsync(sessionId, sheetName, new[] { columnIndex });
            var trimmedData = new string[partialData.RowCount];

            for (int rowIndex = 0; rowIndex < partialData.RowCount; rowIndex++)
            {
                trimmedData[rowIndex] = (partialData.Data[rowIndex][0] ?? "").Trim();
            }

            var modifiedColumn = new ColumnData
            {
                Name = partialData.Headers[0],
                Values = trimmedData,
                Index = columnIndex
            };

            await _sessionService.UpdateColumnInParquetAsync(sessionId, sheetName, modifiedColumn);

            return new OperationResult
            {
                NewColumns = null,
                ModifiedColumns = new[] { modifiedColumn },
                OperationType = OperationType.ModifyColumn,
                Message = "Successfully trimmed column"
            };
        }

        public async Task<OperationResult> ChangeCaseAsync(string sessionId, string sheetName, int columnIndex, string caseType)
        {
            var partialData = await _sessionService.LoadPartialDataAsync(sessionId, sheetName, new[] { columnIndex });
            var casedData = new string[partialData.RowCount];

            for (int rowIndex = 0; rowIndex < partialData.RowCount; rowIndex++)
            {
                var originalValue = partialData.Data[rowIndex][0] ?? "";
                casedData[rowIndex] = caseType.ToLower() switch
                {
                    "upper" => originalValue.ToUpper(),
                    "lower" => originalValue.ToLower(),
                    "title" => System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(originalValue.ToLower()),
                    _ => originalValue
                };
            }

            var modifiedColumn = new ColumnData
            {
                Name = partialData.Headers[0],
                Values = casedData,
                Index = columnIndex
            };

            await _sessionService.UpdateColumnInParquetAsync(sessionId, sheetName, modifiedColumn);

            return new OperationResult
            {
                NewColumns = null,
                ModifiedColumns = new[] { modifiedColumn },
                OperationType = OperationType.ModifyColumn,
                Message = $"Successfully changed case to {caseType}"
            };
        }
    }
}
