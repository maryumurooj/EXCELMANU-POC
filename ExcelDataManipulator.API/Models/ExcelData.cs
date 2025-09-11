namespace ExcelDataManipulator.API.Models
{
    public class ExcelDataModel
  {
    public string[][] Data { get; set; } = new string[0][];
   public string[] Headers { get; set; } = new string[0];
  public int RowCount { get; set; }
  public int ColumnCount { get; set; }
 }

  public class OperationRequest
  {
    public string Operation { get; set; } = string.Empty;
  public int[]? SelectedRows { get; set; }
       public int[]? SelectedColumns { get; set; }
    public Dictionary<string, object>? Parameters { get; set; }
   public ExcelDataModel? CurrentData { get; set; } // ✅ Add this field

  }

  public class OperationResponse
{
  public bool Success { get; set; }
public string Message { get; set; } = string.Empty;
 public ExcelDataModel? Data { get; set; }
}
}
