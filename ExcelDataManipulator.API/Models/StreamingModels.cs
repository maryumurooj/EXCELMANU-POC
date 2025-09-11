using System.ComponentModel.DataAnnotations;

namespace ExcelDataManipulator.API.Models
{
    public class SessionInfo
    {
        public string SessionId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastAccessedAt { get; set; }
        public Dictionary<string, string> SheetPaths { get; set; } = new();
        public string ActiveSheet { get; set; } = string.Empty;
        public int TotalSheets => SheetPaths.Count;
    }

    public class OperationCommand
    {
        [Required]
        public string Operation { get; set; } = string.Empty; // ✅ ONLY ONE Operation property
        [Required]
        public string SheetName { get; set; } = string.Empty;
        [Required]
        public int[] ColumnIndices { get; set; } = Array.Empty<int>();
        public Dictionary<string, object>? Parameters { get; set; }
    }

    public class DeltaResponse
    {
        public string Operation { get; set; } = string.Empty;
        public ColumnData[]? NewColumns { get; set; }
        public ColumnData[]? ModifiedColumns { get; set; }
        public ExcelDataSummary UpdatedSummary { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    public class ColumnData
    {
        public string Name { get; set; } = string.Empty;
        public int Index { get; set; }
        public string[] Values { get; set; } = Array.Empty<string>();
        public string DataType { get; set; } = "string";
    }

    public class ExcelDataSummary
    {
        public string[] Headers { get; set; } = Array.Empty<string>();
        public int RowCount { get; set; }
        public int ColumnCount { get; set; }
        public string ActiveSheet { get; set; } = string.Empty;
        public string[] AvailableSheets { get; set; } = Array.Empty<string>();
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class PartialData
    {
        public string[] Headers { get; set; } = Array.Empty<string>();
        public int[] ColumnIndices { get; set; } = Array.Empty<int>();
        public string[][] Data { get; set; } = Array.Empty<string[]>();
        public int RowCount { get; set; }
    }

    public class OperationResult
    {
        public ColumnData[]? NewColumns { get; set; }
        public ColumnData[]? ModifiedColumns { get; set; }
        public OperationType OperationType { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public enum OperationType
    {
        AddColumn,
        ModifyColumn,
        AddRows,
        ModifyRows,
        CreateSheet
    }

    // Keep existing models for backward compatibility (keep ORIGINAL Exceldata.cs as is)
    }
