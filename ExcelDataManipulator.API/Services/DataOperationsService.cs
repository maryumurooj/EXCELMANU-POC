using ExcelDataManipulator.API.Models;

namespace ExcelDataManipulator.API.Services
{
    public class DataOperationsService
    {
        public ExcelDataModel ConcatenateColumns(ExcelDataModel data, int[] columnIndices, string delimiter = "")
        {
            if (columnIndices.Length < 2)
            {
                Console.WriteLine("Not enough columns selected for concatenation");
                return data;
            }

            Console.WriteLine($"✅ Starting concatenation of columns: [{string.Join(", ", columnIndices)}]");
            Console.WriteLine($"✅ Input data: {data.Data.Length} rows, {data.ColumnCount} columns");
            Console.WriteLine($"✅ Delimiter: '{delimiter}'");

            // Create new data array with one additional column
            var newDataList = new List<string[]>();

            for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
            {
                var originalRow = data.Data[rowIndex];

                // Create new row with space for one more column
                var newRow = new string[data.ColumnCount + 1];

                // Copy all existing data
                for (int colIndex = 0; colIndex < originalRow.Length; colIndex++)
                {
                    newRow[colIndex] = originalRow[colIndex] ?? "";
                }

                // Create concatenated value
                var valuesToConcatenate = new List<string>();
                foreach (int colIndex in columnIndices)
                {
                    if (colIndex < originalRow.Length)
                    {
                        valuesToConcatenate.Add(originalRow[colIndex] ?? "");
                    }
                }

                var concatenatedValue = string.Join(delimiter, valuesToConcatenate);
                newRow[data.ColumnCount] = concatenatedValue; // Add as last column

                newDataList.Add(newRow);

                Console.WriteLine($"✅ Row {rowIndex}: Added '{concatenatedValue}'");
            }

            // Create new headers array
            var newHeadersList = new List<string>(data.Headers);
            var columnNames = columnIndices.Select(i => data.Headers[i]).ToArray();
            newHeadersList.Add($"Concat_of_{string.Join("_", columnNames)}");

            var result = new ExcelDataModel
            {
                Headers = newHeadersList.ToArray(),
                Data = newDataList.ToArray(),
                RowCount = newDataList.Count,
                ColumnCount = newHeadersList.Count
            };

            Console.WriteLine($"✅ Result: {result.Data.Length} rows, {result.ColumnCount} columns");
            Console.WriteLine($"✅ New headers: [{string.Join(", ", result.Headers)}]");

            return result;
        }

        // Trim entire column
        public ExcelDataModel TrimColumn(ExcelDataModel data, int columnIndex)
        {
            Console.WriteLine($"✅ Trimming column {columnIndex}");

            var newData = new string[data.Data.Length][];

            for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
            {
                var originalRow = data.Data[rowIndex];
                var newRow = new string[originalRow.Length];

                // Copy all data
                Array.Copy(originalRow, newRow, originalRow.Length);

                // Trim the specific column
                if (columnIndex < newRow.Length)
                {
                    newRow[columnIndex] = (originalRow[columnIndex] ?? "").Trim();
                }

                newData[rowIndex] = newRow;
            }

            return new ExcelDataModel
            {
                Headers = (string[])data.Headers.Clone(),
                Data = newData,
                RowCount = newData.Length,
                ColumnCount = data.ColumnCount
            };
        }

        // Trim multiple columns
        public ExcelDataModel TrimColumns(ExcelDataModel data, int[] columnIndices)
        {
            Console.WriteLine($"✅ Trimming columns: [{string.Join(", ", columnIndices)}]");

            var newData = new string[data.Data.Length][];

            for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
            {
                var originalRow = data.Data[rowIndex];
                var newRow = new string[originalRow.Length];

                Array.Copy(originalRow, newRow, originalRow.Length);

                // Trim selected columns
                foreach (int colIndex in columnIndices)
                {
                    if (colIndex < newRow.Length)
                    {
                        newRow[colIndex] = (originalRow[colIndex] ?? "").Trim();
                    }
                }

                newData[rowIndex] = newRow;
            }

            return new ExcelDataModel
            {
                Headers = (string[])data.Headers.Clone(),
                Data = newData,
                RowCount = newData.Length,
                ColumnCount = data.ColumnCount
            };
        }

        // Trim entire table
        public ExcelDataModel TrimAllCells(ExcelDataModel data)
        {
            Console.WriteLine("✅ Trimming all cells in table");

            var newData = new string[data.Data.Length][];

            for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
            {
                var originalRow = data.Data[rowIndex];
                var newRow = new string[originalRow.Length];

                // Trim every cell in the row
                for (int colIndex = 0; colIndex < originalRow.Length; colIndex++)
                {
                    newRow[colIndex] = (originalRow[colIndex] ?? "").Trim();
                }

                newData[rowIndex] = newRow;
            }

            return new ExcelDataModel
            {
                Headers = (string[])data.Headers.Clone(),
                Data = newData,
                RowCount = newData.Length,
                ColumnCount = data.ColumnCount
            };
        }

        // Trim specific cells (by row and column coordinates)
        public ExcelDataModel TrimSpecificCells(ExcelDataModel data, List<(int row, int col)> cellCoordinates)
        {
            Console.WriteLine($"✅ Trimming {cellCoordinates.Count} specific cells");

            var newData = new string[data.Data.Length][];

            for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
            {
                var originalRow = data.Data[rowIndex];
                var newRow = new string[originalRow.Length];
                Array.Copy(originalRow, newRow, originalRow.Length);
                newData[rowIndex] = newRow;
            }

            // Trim only the specified cells
            foreach (var (row, col) in cellCoordinates)
            {
                if (row < newData.Length && col < newData[row].Length)
                {
                    newData[row][col] = (newData[row][col] ?? "").Trim();
                }
            }

            return new ExcelDataModel
            {
                Headers = (string[])data.Headers.Clone(),
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

        public ExcelDataModel CreatePivotTable(ExcelDataModel data, int rowGroupColumn, int pivotColumn, int valueColumn, string aggregation = "sum")
        {
            Console.WriteLine($"✅ Creating pivot table:");
            Console.WriteLine($"  Row Group: {data.Headers[rowGroupColumn]}");
            Console.WriteLine($"  Pivot By: {data.Headers[pivotColumn]}");
            Console.WriteLine($"  Values: {data.Headers[valueColumn]}");
            Console.WriteLine($"  Aggregation: {aggregation}");


            // ✅ Add debug logging for pivot column data
            Console.WriteLine("🔍 DEBUG: First 5 rows of pivot column data:");
            for (int i = 0; i < Math.Min(5, data.Data.Length); i++)
            {
                Console.WriteLine($"  Row {i}: '{data.Data[i][pivotColumn]}' (length: {data.Data[i][pivotColumn]?.Length ?? 0})");
            }


            // Dictionary to store pivot data: RowKey -> PivotKey -> Values
            var pivotData = new Dictionary<string, Dictionary<string, List<double>>>();

            // Process each row to build pivot structure
            foreach (var row in data.Data)
            {
                var rowKey = row[rowGroupColumn] ?? ""; // Group by this column
                var pivotKey = row[pivotColumn] ?? "";  // Columns will be created for each unique value
                var valueText = row[valueColumn] ?? "0";

                Console.WriteLine($"🔍 Processing: rowKey='{rowKey}', pivotKey='{pivotKey}', value='{valueText}'");

                // Skip rows with empty pivot keys
                if (string.IsNullOrWhiteSpace(pivotKey))
                {
                    Console.WriteLine($"⚠️ Skipping row with empty pivot key");
                    continue;
                }

                // Try to parse value as number (for count aggregation, any value works)
                double value = 1; // Default for count
                if (aggregation != "count" && !double.TryParse(valueText, out value))
                {
                    Console.WriteLine($"⚠️ Could not parse '{valueText}' as number, using 0");
                    value = 0;
                }

                // Initialize nested dictionaries if needed
                if (!pivotData.ContainsKey(rowKey))
                    pivotData[rowKey] = new Dictionary<string, List<double>>();

                if (!pivotData[rowKey].ContainsKey(pivotKey))
                    pivotData[rowKey][pivotKey] = new List<double>();

                // Add value to the list
                pivotData[rowKey][pivotKey].Add(value);
            }

            // Get all unique pivot column values (these become our new columns)
            var pivotKeys = pivotData
                .SelectMany(x => x.Value.Keys)
                .Distinct()
                .Where(k => !string.IsNullOrWhiteSpace(k)) // ✅ Filter out empty keys
                .OrderBy(x => x)
                .ToList();

            Console.WriteLine($"  Found pivot columns: [{string.Join(", ", pivotKeys)}]");
            // ✅ Check if we have any pivot keys
            if (pivotKeys.Count == 0)
            {
                Console.WriteLine("❌ ERROR: No valid pivot column values found!");
                Console.WriteLine("💡 Make sure your pivot column has multiple distinct non-empty values");

                // Return original data instead of empty data
                return data;
            }
            // Create new headers: Row Group + Pivot Columns
            var newHeaders = new List<string> { data.Headers[rowGroupColumn] };
            newHeaders.AddRange(pivotKeys);

            // Create pivot table data
            var newData = new List<string[]>();

            foreach (var rowGroupKey in pivotData.Keys.OrderBy(x => x))
            {
                var newRow = new string[newHeaders.Count];
                newRow[0] = rowGroupKey; // First column is the row group

                // Fill in aggregated values for each pivot column
                for (int i = 0; i < pivotKeys.Count; i++)
                {
                    var pivotKey = pivotKeys[i];

                    if (pivotData[rowGroupKey].ContainsKey(pivotKey))
                    {
                        var values = pivotData[rowGroupKey][pivotKey];

                        double result = aggregation.ToLower() switch
                        {
                            "sum" => values.Sum(),
                            "avg" => values.Average(),
                            "count" => values.Count,
                            "min" => values.Min(),
                            "max" => values.Max(),
                            _ => values.Sum() // Default to sum
                        };

                        newRow[i + 1] = Math.Round(result, 2).ToString();
                    }
                    else
                    {
                        newRow[i + 1] = "0"; // No data for this combination
                    }
                }

                newData.Add(newRow);
            }

            Console.WriteLine($"✅ Pivot table created: {newData.Count} rows, {newHeaders.Count} columns");

            return new ExcelDataModel
            {
                Headers = newHeaders.ToArray(),
                Data = newData.ToArray(),
                RowCount = newData.Count,
                ColumnCount = newHeaders.Count
            };
        }

        public ExcelDataModel AverageColumns(ExcelDataModel data, int[] columnIndices)
        {
            Console.WriteLine($"✅ Calculating average for columns: [{string.Join(", ", columnIndices)}]");

            var aggregationRow = new string[data.Headers.Length];

            // Initialize with empty strings
            for (int i = 0; i < aggregationRow.Length; i++)
            {
                aggregationRow[i] = "";
            }

            // Calculate average for each selected column
            foreach (int colIndex in columnIndices)
            {
                var values = new List<double>();

                // Iterate through all rows in this column
                for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
                {
                    if (double.TryParse(data.Data[rowIndex][colIndex], out double val))
                    {
                        values.Add(val);
                    }
                }

                double average = values.Count > 0 ? values.Average() : 0;
                aggregationRow[colIndex] = $"Avg: {Math.Round(average, 2)}";
            }

            // Add aggregation row to the bottom
            var newData = new List<string[]>(data.Data) { aggregationRow };

            return new ExcelDataModel
            {
                Headers = data.Headers,
                Data = newData.ToArray(),
                RowCount = newData.Count,
                ColumnCount = data.Headers.Length
            };
        }

        public ExcelDataModel MinColumns(ExcelDataModel data, int[] columnIndices)
        {
            Console.WriteLine($"✅ Finding minimum for columns: [{string.Join(", ", columnIndices)}]");

            var aggregationRow = new string[data.Headers.Length];

            for (int i = 0; i < aggregationRow.Length; i++)
            {
                aggregationRow[i] = "";
            }

            foreach (int colIndex in columnIndices)
            {
                var values = new List<double>();

                for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
                {
                    if (double.TryParse(data.Data[rowIndex][colIndex], out double val))
                    {
                        values.Add(val);
                    }
                }

                double minimum = values.Count > 0 ? values.Min() : 0;
                aggregationRow[colIndex] = $"Min: {minimum}";
            }

            var newData = new List<string[]>(data.Data) { aggregationRow };

            return new ExcelDataModel
            {
                Headers = data.Headers,
                Data = newData.ToArray(),
                RowCount = newData.Count,
                ColumnCount = data.Headers.Length
            };
        }

        public ExcelDataModel MaxColumns(ExcelDataModel data, int[] columnIndices)
        {
            Console.WriteLine($"✅ Finding maximum for columns: [{string.Join(", ", columnIndices)}]");

            var aggregationRow = new string[data.Headers.Length];

            for (int i = 0; i < aggregationRow.Length; i++)
            {
                aggregationRow[i] = "";
            }

            foreach (int colIndex in columnIndices)
            {
                var values = new List<double>();

                for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
                {
                    if (double.TryParse(data.Data[rowIndex][colIndex], out double val))
                    {
                        values.Add(val);
                    }
                }

                double maximum = values.Count > 0 ? values.Max() : 0;
                aggregationRow[colIndex] = $"Max: {maximum}";
            }

            var newData = new List<string[]>(data.Data) { aggregationRow };

            return new ExcelDataModel
            {
                Headers = data.Headers,
                Data = newData.ToArray(),
                RowCount = newData.Count,
                ColumnCount = data.Headers.Length
            };
        }

        public ExcelDataModel CountColumns(ExcelDataModel data, int[] columnIndices)
        {
            Console.WriteLine($"✅ Counting non-empty values for columns: [{string.Join(", ", columnIndices)}]");

            var aggregationRow = new string[data.Headers.Length];

            for (int i = 0; i < aggregationRow.Length; i++)
            {
                aggregationRow[i] = "";
            }

            foreach (int colIndex in columnIndices)
            {
                int count = 0;

                for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
                {
                    if (!string.IsNullOrWhiteSpace(data.Data[rowIndex][colIndex]))
                    {
                        count++;
                    }
                }

                aggregationRow[colIndex] = $"Count: {count}";
            }

            var newData = new List<string[]>(data.Data) { aggregationRow };

            return new ExcelDataModel
            {
                Headers = data.Headers,
                Data = newData.ToArray(),
                RowCount = newData.Count,
                ColumnCount = data.Headers.Length
            };
        }

        // Add these methods to DataOperationsService.cs
        
       
        
        public ExcelDataModel MultiplyColumns(ExcelDataModel data, int[] columnIndices)
        {
            Console.WriteLine($"✅ Multiplying columns: [{string.Join(", ", columnIndices)}]");

            var newHeaders = new List<string>(data.Headers) { "Product" };
            var newData = new List<string[]>();

            foreach (var row in data.Data)
            {
                var newRow = new string[row.Length + 1];
                Array.Copy(row, newRow, row.Length);

                double product = 1;
                bool hasValues = false;

                foreach (int colIndex in columnIndices)
                {
                    if (colIndex < row.Length && double.TryParse(row[colIndex], out double val))
                    {
                        product *= val;
                        hasValues = true;
                    }
                }

                newRow[row.Length] = hasValues ? product.ToString() : "0";
                newData.Add(newRow);
            }

            return new ExcelDataModel
            {
                Headers = newHeaders.ToArray(),
                Data = newData.ToArray(),
                RowCount = newData.Count,
                ColumnCount = newHeaders.Count
            };
        }

        public ExcelDataModel MedianColumns(ExcelDataModel data, int[] columnIndices)
        {
            Console.WriteLine($"✅ Calculating median for columns: [{string.Join(", ", columnIndices)}]");

            var newHeaders = new List<string>(data.Headers) { "Median" };
            var newData = new List<string[]>();

            foreach (var row in data.Data)
            {
                var newRow = new string[row.Length + 1];
                Array.Copy(row, newRow, row.Length);

                var values = new List<double>();
                foreach (int colIndex in columnIndices)
                {
                    if (colIndex < row.Length && double.TryParse(row[colIndex], out double val))
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

                newRow[row.Length] = Math.Round(median, 2).ToString();
                newData.Add(newRow);
            }

            return new ExcelDataModel
            {
                Headers = newHeaders.ToArray(),
                Data = newData.ToArray(),
                RowCount = newData.Count,
                ColumnCount = newHeaders.Count
            };
        }

        // Update your existing SumColumns method to follow the same pattern:
        public ExcelDataModel SumColumns(ExcelDataModel data, int[] columnIndices)
        {
            Console.WriteLine($"✅ Calculating sum for columns: [{string.Join(", ", columnIndices)}]");

            var aggregationRow = new string[data.Headers.Length];

            for (int i = 0; i < aggregationRow.Length; i++)
            {
                aggregationRow[i] = "";
            }

            foreach (int colIndex in columnIndices)
            {
                double sum = 0;

                for (int rowIndex = 0; rowIndex < data.Data.Length; rowIndex++)
                {
                    if (double.TryParse(data.Data[rowIndex][colIndex], out double val))
                    {
                        sum += val;
                    }
                }

                aggregationRow[colIndex] = $"Sum: {sum}";
            }

            var newData = new List<string[]>(data.Data) { aggregationRow };

            return new ExcelDataModel
            {
                Headers = data.Headers,
                Data = newData.ToArray(),
                RowCount = newData.Count,
                ColumnCount = data.Headers.Length
            };
        }

    }


}
