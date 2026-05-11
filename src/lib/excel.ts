import * as XLSX from "xlsx";
import { Transaction, TransactionType, Campus, CAMPUS_MAP, CampusId } from "../types";

export function parseExcelFile(file: File): Promise<{ [sheetName: string]: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const result: { [sheetName: string]: any[] } = {};
      
      workbook.SheetNames.forEach(name => {
        const worksheet = workbook.Sheets[name];
        result[name] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      });
      
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function mapJsonToTransactions(allSheetsData: { [sheetName: string]: any[] }, mapping: any): Transaction[] {
  console.log("Starting Excel mapping. Available sheets:", Object.keys(allSheetsData));
  
  // Find the relevant sheets
  const mainSheetKey = Object.keys(allSheetsData).find(k => 
    k.toLowerCase().includes("receipts & expenses") || 
    k.toLowerCase().includes("receipts and expenses") || 
    k.toLowerCase().replace(/\s/g, "").includes("receiptsexpenses")
  ) || Object.keys(allSheetsData)[0];
  
  const receiptsSheetKey = Object.keys(allSheetsData).find(k => 
    k.toLowerCase().includes("receipts data") || 
    k.toLowerCase().replace(/\s/g, "").includes("receiptsdata")
  );

  console.log(`Main sheet: "${mainSheetKey}", Receipts sheet: "${receiptsSheetKey || 'N/A'}"`);

  const mainSheetData = allSheetsData[mainSheetKey] || [];
  const receiptsSheetData = receiptsSheetKey ? allSheetsData[receiptsSheetKey] : [];

  if (mainSheetData.length <= 1) {
    console.warn("Main sheet appears to be empty or only contains headers.");
  }

  const mainHeaders = mainSheetData[0] as any[] || [];
  const mainRows = mainSheetData.slice(1);

  const getColIndex = (headers: any[], name: string) => {
    if (!mapping[name]) return -1;
    const target = String(mapping[name]).toLowerCase().trim();
    return headers.findIndex(h => String(h || "").toLowerCase().trim() === target);
  };

  // Indices for Main Sheet
  const indices = {
    date: getColIndex(mainHeaders, "date"),
    description: getColIndex(mainHeaders, "description"),
    account: getColIndex(mainHeaders, "account"),
    bankCashAccount: getColIndex(mainHeaders, "bankCashAccount"),
    debit: getColIndex(mainHeaders, "debit"),
    credit: getColIndex(mainHeaders, "credit"),
    amount: getColIndex(mainHeaders, "amount"),
    reference: getColIndex(mainHeaders, "reference"),
  };

  console.log("Detected column indices:", indices);

  // Build a lookup map from Sheet 2 (Receipts Data)
  const receiptsLookup: { [ref: string]: Campus } = {};
  if (receiptsSheetData.length > 0) {
    const rHeaders = receiptsSheetData[0] as any[];
    const rRows = receiptsSheetData.slice(1);
    
    const rRefIdx = rHeaders.findIndex(h => {
      const s = String(h || "").toLowerCase();
      return s.includes("reference") || s.includes("ref");
    });
    const rCampusIdx = rHeaders.findIndex(h => String(h || "").toLowerCase().includes("campus"));
    
    if (rRefIdx !== -1 && rCampusIdx !== -1) {
      rRows.forEach(row => {
        const ref = String(row[rRefIdx] || "").trim();
        const campusVal = String(row[rCampusIdx] || "").trim();
        if (ref && campusVal) {
          const foundCampus = Object.values(Campus).find(c => 
            c.toLowerCase().includes(campusVal.toLowerCase()) || 
            campusVal.toLowerCase().includes(c.toLowerCase())
          );
          if (foundCampus) receiptsLookup[ref] = foundCampus;
        }
      });
      console.log(`Matched ${Object.keys(receiptsLookup).length} campus mappings from Receipts sheet.`);
    }
  }

  const results: Transaction[] = mainRows.map((row, idx) => {
    const rawDebit = row[indices.debit];
    const rawCredit = row[indices.credit];
    const rawAmount = row[indices.amount];

    let debit = Number(rawDebit || 0);
    if (isNaN(debit)) debit = 0;

    let credit = Number(rawCredit || 0);
    if (isNaN(credit)) credit = 0;

    let amount = 0;
    if (rawAmount !== undefined && rawAmount !== null && rawAmount !== "" && !isNaN(Number(rawAmount))) {
      amount = Number(rawAmount);
    } else {
      amount = credit - debit;
    }
    
    if (isNaN(amount)) amount = 0;

    // Type detection: credit or positive amount usually means income
    const type = (credit > 0 || (amount > 0 && !rawDebit)) ? TransactionType.INCOME : TransactionType.EXPENSE;
    const reference = String(row[indices.reference] || "").trim();
    
    // Match campus from Sheet 2 using reference
    let campus = Campus.UNALLOCATED;
    if (reference && receiptsLookup[reference]) {
      campus = receiptsLookup[reference];
    } else {
       const desc = String(row[indices.description] || "").toLowerCase();
       const bank = String(row[indices.bankCashAccount] || "").toLowerCase();
       
       // Priority 2: Description-based detection
       const foundInDesc = Object.values(Campus).find(c => c !== Campus.UNALLOCATED && desc.includes(c.toLowerCase()));
       if (foundInDesc) {
         campus = foundInDesc;
       } else {
         // Priority 3: Bank/Cash Account mapping
         if (bank.includes("main")) campus = Campus.MAIN;
         else if (bank.includes("johar")) campus = Campus.JOHAR;
         else if (bank.includes("masjid")) campus = Campus.MASJID;
         else if (bank.includes("maktab")) campus = Campus.MAKTAB;
       }
    }

    return {
      id: `${Date.now()}-${idx}`,
      date: row[indices.date] ? (typeof row[indices.date] === 'number' ? new Date((row[indices.date] - (25567 + 1)) * 86400 * 1000).toISOString() : String(row[indices.date])) : new Date().toISOString(),
      description: String(row[indices.description] || "No Description"),
      account: String(row[indices.account] || ""),
      bankCashAccount: String(row[indices.bankCashAccount] || ""),
      debit: type === TransactionType.EXPENSE ? Math.abs(amount) : 0,
      credit: type === TransactionType.INCOME ? Math.abs(amount) : 0,
      amount: Math.abs(amount),
      type,
      campus,
      reference,
    };
  });

  console.log(`Mapping complete. Total transactions: ${results.length}`);
  return results;
}
