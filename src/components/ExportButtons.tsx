'use client';
import { useState } from 'react';

export default function ExportButtons() {
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  async function handleExport(format: 'xlsx' | 'csv') {
    const setLoading = format === 'xlsx' ? setExportingXlsx : setExportingCsv;
    setLoading(true);

    try {
      // Create a temporary anchor to trigger the download
      const link = document.createElement('a');
      link.href = `/api/export?format=${format}`;
      link.download = `registrations.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Brief timeout to show loading state
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (err) {
      console.error(`Export ${format} failed:`, err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="export-buttons">
      <button
        className="btn-export btn-export-xlsx"
        onClick={() => handleExport('xlsx')}
        disabled={exportingXlsx}
      >
        {exportingXlsx ? (
          <>
            <svg className="btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export XLSX
          </>
        )}
      </button>

      <button
        className="btn-export btn-export-csv"
        onClick={() => handleExport('csv')}
        disabled={exportingCsv}
      >
        {exportingCsv ? (
          <>
            <svg className="btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </>
        )}
      </button>
    </div>
  );
}
