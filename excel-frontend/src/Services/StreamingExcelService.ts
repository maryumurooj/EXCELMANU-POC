import axios from 'axios';

interface OperationCommand {
  operation: string;
  sheetName: string;
  columnIndices: number[];
  parameters?: Record<string, any>;
}

interface DeltaResponse {
  operation: string;
  newColumns?: ColumnData[];
  modifiedColumns?: ColumnData[];
  updatedSummary: ExcelDataSummary;
  message: string;
}

interface ColumnData {
  name: string;
  index: number;
  values: string[];
  dataType: string;
}

interface ExcelDataSummary {
  headers: string[];
  rowCount: number;
  columnCount: number;
  activeSheet: string;
  availableSheets: string[];
  metadata: Record<string, any>;
}

class StreamingExcelService {
  private sessionId: string | null = null;
  private baseUrl = 'https://localhost:7217/api/excel';

  async uploadFile(file: File): Promise<{sessionId: string, summary: ExcelDataSummary}> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${this.baseUrl}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    this.sessionId = response.data.sessionId;
    return {
      sessionId: response.data.sessionId,
      summary: response.data.summary
    };
  }

  async executeOperation(command: OperationCommand): Promise<DeltaResponse> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await axios.post(
      `${this.baseUrl}/sessions/${this.sessionId}/operations`,
      command
    );

    return response.data.delta;
  }

  async getDataSummary(sheetName?: string): Promise<ExcelDataSummary> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await axios.get(
      `${this.baseUrl}/sessions/${this.sessionId}/summary${sheetName ? `?sheetName=${sheetName}` : ''}`
    );

    return response.data;
  }

  async exportData(format: 'excel' | 'json' | 'parquet', allSheets = false): Promise<void> {
    if (!this.sessionId) throw new Error('No active session');

    const response = await axios.get(
      `${this.baseUrl}/sessions/${this.sessionId}/export?format=${format}&allSheets=${allSheets}`,
      { responseType: 'blob' }
    );

    // Download file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from response headers or create default
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `export_${allSheets ? 'all_sheets' : 'current_sheet'}.${format === 'excel' ? 'xlsx' : format}`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  clearSession(): void {
    this.sessionId = null;
  }
}

export default new StreamingExcelService();
