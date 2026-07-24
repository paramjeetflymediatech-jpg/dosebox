'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Wand2, Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

let globalState = {
  fileData: [] as any[],
  fileHeaders: [] as string[],
  fileName: '',
  processing: false,
  progress: { current: 0, total: 0 },
  results: { success: [] as any[], error: [] as any[] },
  processComplete: false
};

export default function GenerateAIBulkPage() {
  const [fileData, setFileData] = useState<any[]>(globalState.fileData);
  const [fileHeaders, setFileHeaders] = useState<string[]>(globalState.fileHeaders);
  const [fileName, setFileName] = useState(globalState.fileName);
  
  const [processing, setProcessing] = useState(globalState.processing);
  const [progress, setProgress] = useState(globalState.progress);
  
  const [results, setResults] = useState<{ success: any[], error: any[] }>(globalState.results);
  const [processComplete, setProcessComplete] = useState(globalState.processComplete);

  // Sync state to global when it changes
  React.useEffect(() => { globalState.fileData = fileData; }, [fileData]);
  React.useEffect(() => { globalState.fileHeaders = fileHeaders; }, [fileHeaders]);
  React.useEffect(() => { globalState.fileName = fileName; }, [fileName]);
  React.useEffect(() => { globalState.processing = processing; }, [processing]);
  React.useEffect(() => { globalState.progress = progress; }, [progress]);
  React.useEffect(() => { globalState.results = results; }, [results]);
  React.useEffect(() => { globalState.processComplete = processComplete; }, [processComplete]);

  // If we return to the page while processing is still happening in the background loop
  React.useEffect(() => {
    let interval: any;
    if (globalState.processing) {
      interval = setInterval(() => {
        setProgress(globalState.progress);
        if (!globalState.processing) {
          setProcessing(false);
          setProcessComplete(globalState.processComplete);
          setResults(globalState.results);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessComplete(false);
    setResults({ success: [], error: [] });
    setProgress({ current: 0, total: 0 });

    try {
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      const isCsv = file.name.toLowerCase().endsWith('.csv');

      if (!isExcel && !isCsv) {
        Swal.fire('Error', 'Only CSV and Excel files are supported.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        
        // Read as array of arrays to handle potential title rows at the top
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        
        const parsedData: any[] = [];
        let currentHeaders: string[] = [];

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          const rowStr = row.map(c => String(c ?? '').toLowerCase()).join('\t');
          
          // Detect header row
          if (rowStr.includes('brand name') || (rowStr.includes('name') && rowStr.includes('price'))) {
            currentHeaders = row.map(h => String(h).trim());
            continue;
          }

          // Skip if no headers found yet or row is empty
          if (currentHeaders.length === 0 || row.every(c => !String(c).trim())) continue;

          // Check if it's a valid data row (e.g. has an S.No or a valid name in the right column)
          // Just making sure at least one column has data to map
          const rowObj: any = {};
          currentHeaders.forEach((h, idx) => {
            if (h) rowObj[h] = row[idx];
          });
          
          parsedData.push(rowObj);
        }
        
        if (parsedData.length > 0) {
          setFileHeaders(currentHeaders.filter(Boolean));
          setFileData(parsedData);
        } else {
          Swal.fire('Error', 'The file appears to be empty.', 'error');
          setFileData([]);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to read file.', 'error');
    }
  };

  const getFieldValue = (row: any, possibleKeys: string[]) => {
    for (const key of possibleKeys) {
      const exactMatch = row[key];
      if (exactMatch) return exactMatch;
      
      const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
      if (foundKey && row[foundKey]) return row[foundKey];
    }
    return '';
  };

  const handleGenerate = async () => {
    if (fileData.length === 0) return;
    
    setProcessing(true);
    globalState.processing = true;
    setProgress({ current: 0, total: fileData.length });
    globalState.progress = { current: 0, total: fileData.length };
    
    const successRows: any[] = [];
    const errorRows: any[] = [];

    for (let i = 0; i < fileData.length; i++) {
      const row = fileData[i];
      
      const name = getFieldValue(row, ['BRAND NAME', 'name', 'Brand Name']);
      const genericName = getFieldValue(row, ['COMPOSITION/SALT NAME', 'genericName', 'Generic Name', 'genericname']);
      const manufacturer = getFieldValue(row, ['MARKETED BY', 'manufacturer', 'Manufacturer']);
      const dosage = getFieldValue(row, ['DOSAGE', 'dosage', 'Dosage']);
      
      if (!name || !genericName) {
        errorRows.push({ ...row, _Error: 'Missing Brand Name or Generic Name (Composition)' });
        setProgress(p => ({ ...p, current: i + 1 }));
        continue;
      }

      try {
        const res = await api.post('/admin/medicines/generate-ai', {
          name,
          genericName,
          manufacturer,
          composition: genericName,
          dosage
        });

        if (res.data?.success && res.data?.data?.sections) {
          const generatedData = res.data.data;
          const newRow = { ...row };
          
          generatedData.sections.forEach((sec: any) => {
            newRow[`Section: ${sec.title}`] = sec.content;
          });
          
          successRows.push(newRow);
        } else {
          errorRows.push({ ...row, _Error: res.data?.message || 'Failed to generate valid sections' });
        }
      } catch (err: any) {
        const errMsg = (err?.response?.data?.message || '').toLowerCase();
        const status = err?.response?.status;
        errorRows.push({ ...row, _Error: err?.response?.data?.message || 'API Error during generation' });
        
        if (errMsg.includes('quota') || status === 429 || errMsg.includes('too many requests')) {
          for (let j = i + 1; j < fileData.length; j++) {
            errorRows.push({ ...fileData[j], _Error: 'Execution stopped early due to API Limits (Quota Exceeded)' });
          }
          // Break the main generation loop
          break;
        }
      }
      
      const newProgress = { current: i + 1, total: fileData.length };
      setProgress(newProgress);
      globalState.progress = newProgress;
    }

    setResults({ success: successRows, error: errorRows });
    globalState.results = { success: successRows, error: errorRows };
    
    setProcessComplete(true);
    globalState.processComplete = true;
    
    setProcessing(false);
    globalState.processing = false;
    
    // Auto-import successes directly to catalog
    if (successRows.length > 0) {
      try {
        const worksheet = XLSX.utils.json_to_sheet(successRows);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv' });
        const file = new File([blob], 'auto_import.csv', { type: 'text/csv' });
        const formData = new FormData();
        formData.append('file', file);
        await api.post('/medicines/upload-csv', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (e) {
        console.error('Auto import failed', e);
      }
    }
    
    if (errorRows.length === 0) {
      Swal.fire('Success', 'All rows generated and auto-imported successfully!', 'success');
    } else {
      Swal.fire('Warning', `Generated and auto-imported ${successRows.length} successfully. ${errorRows.length} failed or were skipped due to limits.`, 'warning');
    }
  };

  const downloadExcel = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Wand2 className="w-8 h-8 text-brand-600" /> Generate AI (Bulk)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload an Excel/CSV file to bulk generate dynamic content for medicines using AI.
          </p>
        </div>
        <Link
          href="/dashboard/admin/medicines"
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-sm"
        >
          Go to Medicines Catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upload & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-500" /> Step 1: Upload File
            </h3>
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 mb-4">
              <p className="font-bold mb-1">Required Columns:</p>
              <ul className="list-disc pl-4 text-xs space-y-1">
                <li>BRAND NAME (or name)</li>
                <li>COMPOSITION/SALT NAME (or genericName)</li>
              </ul>
              <p className="mt-2 text-xs opacity-80">This process runs in your browser. Do not close this tab while generating.</p>
            </div>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={processing}
              className="file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 w-full border border-slate-200 rounded-xl p-2 cursor-pointer disabled:opacity-50"
            />
            
            {fileName && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <span className="font-semibold text-slate-700">Selected: </span> 
                <span className="text-slate-600">{fileName}</span>
                <span className="block text-xs text-slate-500 mt-1">({fileData.length} rows detected)</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-brand-500" /> Step 2: Generate Content
            </h3>
            
            <button
              onClick={handleGenerate}
              disabled={processing || fileData.length === 0}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>Generate AI Content</>
              )}
            </button>

            {processing && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm font-semibold text-slate-700">
                  <span>Progress</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-brand-500 h-full transition-all duration-300"
                    style={{ width: `${Math.max(5, (progress.current / progress.total) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results & Export */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm h-full flex flex-col">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" /> Step 3: Export Results
            </h3>
            
            {!processComplete && !processing && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                <FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-semibold text-lg">No Results Yet</p>
                <p className="text-sm">Upload a file and click generate to see results.</p>
              </div>
            )}

            {processing && (
              <div className="flex-1 flex flex-col items-center justify-center text-brand-500 py-12">
                <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-lg animate-pulse">AI is working its magic...</p>
                <p className="text-sm text-slate-500">This may take a while depending on file size.</p>
              </div>
            )}

            {processComplete && (
              <div className="flex-1 flex flex-col justify-center space-y-6">
                
                {/* Success Card */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 text-lg">Successfully Generated</h4>
                      <p className="text-emerald-700 text-sm">{results.success.length} medicines processed</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadExcel(results.success, 'AI_Generated_Success.xlsx')}
                    disabled={results.success.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Download Success File
                  </button>
                </div>

                {/* Error Card */}
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-900 text-lg">Failed to Generate</h4>
                      <p className="text-rose-700 text-sm">{results.error.length} medicines failed</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadExcel(results.error, 'AI_Generated_Errors.xlsx')}
                    disabled={results.error.length === 0}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Download Error File
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-2">
                    <ArrowRight className="w-4 h-4 text-brand-500" /> Next Steps
                  </h5>
                  <p className="text-sm text-slate-600">
                    1. The <strong className="text-emerald-600">Successfully Generated</strong> medicines have already been auto-imported into your catalog as Drafts!<br/>
                    2. Download the Error File, fix any missing data or wait for API limits to reset, and re-upload it here to continue.
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
