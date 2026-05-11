import React, { useState } from "react";
import { Upload, FileType, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { parseExcelFile, mapJsonToTransactions } from "../lib/excel";
import { detectColumns } from "../lib/gemini";
import { Transaction, AppState } from "../types";
import { toast } from "sonner";
import { motion } from "motion/react";

interface UploadViewProps {
  state: AppState;
  onUpload: (txs: Transaction[]) => void;
}

export default function UploadView({ state, onUpload }: UploadViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mapping, setMapping] = useState<any>(null);
  const [sampleData, setSampleData] = useState<any[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsProcessing(true);
      try {
        const allSheetsData = await parseExcelFile(selectedFile);
        setSampleData(allSheetsData);
        
        // Find the main sheet for AI column detection
        const mainSheetKey = Object.keys(allSheetsData).find(k => 
          k.toLowerCase().includes("receipts & expenses") || k.toLowerCase().includes("receipts and expenses")
        ) || Object.keys(allSheetsData)[0];
        
        const mainSheetData = allSheetsData[mainSheetKey];
        
        toast.info("AI is analyzing column structure...");
        const detectedMapping = await detectColumns(mainSheetData);
        if (detectedMapping) {
          setMapping(detectedMapping);
          toast.success("AI successfully detected columns!");
        } else {
          setMapping(state.columnMapping);
          toast.warning("AI could not detect columns automatically. Using saved settings.");
        }
      } catch (err) {
        toast.error("Failed to parse Excel file.");
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleProcess = () => {
    if (!file || !mapping) return;
    
    try {
      const txs = mapJsonToTransactions(sampleData as any, mapping);
      onUpload(txs);
      setFile(null);
      setMapping(null);
      setSampleData([]);
    } catch (err) {
      toast.error("Error processing transactions.");
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-none shadow-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Upload className="w-6 h-6 text-indigo-600" />
            Upload Financial Data
          </CardTitle>
          <CardDescription>
            Upload your account statement or donation report (Excel).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all ${
              file ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-slate-200 dark:border-zinc-800 hover:border-indigo-400'
            }`}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".xlsx, .xlsm, .xls"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
              {isProcessing ? (
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              ) : file ? (
                <Check className="w-12 h-12 text-green-500" />
              ) : (
                <FileType className="w-12 h-12 text-slate-300" />
              )}
              <div className="text-center">
                <p className="font-medium">{file ? file.name : "Click to select or drag and drop"}</p>
                <p className="text-sm text-slate-500">Excel files only (.xlsx, .xls)</p>
              </div>
            </label>
          </div>

          {file && mapping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Alert className="bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900 text-indigo-800 dark:text-indigo-300">
                <Check className="h-4 w-4" />
                <AlertTitle>Mapping Confirmed</AlertTitle>
                <AlertDescription>
                  The system has identified the columns automatically. Click process to continue.
                </AlertDescription>
              </Alert>
              <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold shadow-lg shadow-indigo-200 dark:shadow-none" onClick={handleProcess}>
                Process & Allocate Transactions
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Column Mapping Preview</CardTitle>
          <CardDescription>
            Verify if the AI detected the columns correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mapping ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm italic">Waiting for file upload...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(mapping).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-500">{key}</Label>
                    <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 text-sm font-medium">
                      {String(val) || <span className="text-amber-500 italic">Not found</span>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 italic mt-4">
                * You can override these mappings in the Admin Panel if detection is incorrect.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
