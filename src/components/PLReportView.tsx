import React, { useState, useMemo } from "react";
import { Download, Building2, Calendar, Printer, FileSpreadsheet, FileText as FilePdf, ChevronRight, ChevronDown, ListTree, ListCollapse } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AppState, Campus, PLReport, PLSection } from "../types";
import { generatePLReport } from "../lib/accounting";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";

interface PLReportViewProps {
  state: AppState;
  filterCampus: Campus | "Consolidated";
}

export default function PLReportView({ state, filterCampus }: PLReportViewProps) {
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const report = useMemo(() => {
    return generatePLReport(state.transactions, filterCampus, startDate, endDate);
  }, [state.transactions, filterCampus, startDate, endDate]);

  const toggleSection = (title: string) => {
    const next = new Set(expandedSections);
    if (next.has(title)) next.delete(title);
    else next.add(title);
    setExpandedSections(next);
  };

  const expandAll = () => {
    const all = [
      ...Object.values(report.income).filter(v => typeof v !== 'number').map((s: any) => s.title),
      ...Object.values(report.expenses).filter(v => typeof v !== 'number').map((s: any) => s.title)
    ];
    setExpandedSections(new Set(all));
  };

  const collapseAll = () => setExpandedSections(new Set());

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    const headerColor = [33, 37, 41];
    
    doc.setFontSize(22);
    doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.text("Fiqh Academy", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("Profit and Loss Statement", 105, 28, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`For the period from ${startDate} to ${endDate}`, 105, 35, { align: "center" });
    doc.text(`Campus: ${filterCampus}`, 105, 40, { align: "center" });
    doc.text("Accrual basis", 105, 45, { align: "center" });

    const tableData: any[] = [];
    
    const addSection = (section: PLSection) => {
      const isExpanded = expandedSections.has(section.title);
      tableData.push([{ content: section.title, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }, isExpanded ? '' : (Number(section.subtotal) || 0).toLocaleString()]);
      
      if (isExpanded) {
        section.items.forEach(item => {
          tableData.push([`  ${item.name}`, (Number(item.amount) || 0).toLocaleString()]);
        });
        tableData.push([{ content: `Total — ${section.title}`, styles: { fontStyle: 'bold' } }, (Number(section.subtotal) || 0).toLocaleString()]);
      }
      tableData.push(['', '']);
    };

    tableData.push([{ content: 'Income', styles: { fontStyle: 'bold', fontSize: 12 } }, '']);
    Object.values(report.income).forEach(sec => {
       if (typeof sec === 'object' && sec !== null) addSection(sec as PLSection);
    });
    tableData.push([{ content: 'Total — Income', styles: { fontStyle: 'bold', fontSize: 11, textColor: [0, 128, 0] } }, report.income.total.toLocaleString()]);
    tableData.push(['', '']);

    tableData.push([{ content: 'Less: Expenses', styles: { fontStyle: 'bold', fontSize: 12 } }, '']);
    Object.values(report.expenses).forEach(sec => {
        if (typeof sec === 'object' && sec !== null) addSection(sec as PLSection);
    });
    tableData.push([{ content: 'Total — Expenses', styles: { fontStyle: 'bold', fontSize: 11, textColor: [200, 0, 0] } }, report.expenses.total.toLocaleString()]);
    tableData.push(['', '']);

    tableData.push([{ content: 'Net profit (loss)', styles: { fontStyle: 'bold', fontSize: 14, fillColor: [33, 37, 41], textColor: [255, 255, 255] } }, { content: report.netProfitLoss.toLocaleString(), styles: { fontStyle: 'bold', fontSize: 14, fillColor: [33, 37, 41], textColor: [255, 255, 255] } }]);

    autoTable(doc, {
      startY: 55,
      body: tableData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 1: { halign: 'right' } }
    });

    doc.save(`Fiqh_Academy_PL_${filterCampus}.pdf`);
  };

  const exportExcel = () => {
    const data: any[] = [
      ["Fiqh Academy"],
      ["Profit and Loss Statement"],
      [`For the period from ${startDate} to ${endDate}`],
      [`Campus: ${filterCampus}`],
      ["Accrual basis"],
      [""],
      ["Income"],
    ];

    const addSectionToExcel = (section: PLSection) => {
      const isExpanded = expandedSections.has(section.title);
      if (isExpanded) {
        data.push([section.title, ""]);
        section.items.forEach(item => data.push([`  ${item.name}`, item.amount]));
        data.push([`Total — ${section.title}`, section.subtotal]);
      } else {
        data.push([section.title, section.subtotal]);
      }
      data.push(["", ""]);
    };

    Object.values(report.income).forEach(sec => { if (typeof sec === 'object' && sec !== null) addSectionToExcel(sec as PLSection); });
    data.push(["Total — Income", report.income.total]);
    data.push(["", ""]);
    data.push(["Less: Expenses", ""]);
    Object.values(report.expenses).forEach(sec => { if (typeof sec === 'object' && sec !== null) addSectionToExcel(sec as PLSection); });
    data.push(["Total — Expenses", report.expenses.total]);
    data.push(["", ""]);
    data.push(["Net profit (loss)", report.netProfitLoss]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "P&L Statement");
    XLSX.writeFile(wb, `Fiqh_Academy_PL_${filterCampus}.xlsx`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-6xl mx-auto">
      {/* Controls - Fixed at Top */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 print:hidden z-10 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 ml-1 block">Campus Selection Controlled Internationally</span>
            <div className="flex items-center gap-2 px-3 h-11 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-slate-600">
               <Building2 className="w-4 h-4 text-emerald-500" />
               {filterCampus} Unit
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Period From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="h-11 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none text-sm outline-none w-36" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="h-11 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none text-sm outline-none w-36" />
          </div>

          <div className="flex items-center gap-2 pt-5">
             <Button variant="ghost" size="sm" className="h-11 rounded-xl gap-2 font-bold text-xs" onClick={expandAll}>
                <ListTree className="w-4 h-4" /> Expand
             </Button>
             <Button variant="ghost" size="sm" className="h-11 rounded-xl gap-2 font-bold text-xs" onClick={collapseAll}>
                <ListCollapse className="w-4 h-4" /> Collapse
             </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11 rounded-xl gap-2 font-bold border-slate-200" onClick={exportExcel}>
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
          </Button>
          <Button variant="outline" className="h-11 rounded-xl gap-2 font-bold border-slate-200" onClick={exportPDF}>
            <FilePdf className="w-4 h-4 text-red-600" /> PDF
          </Button>
          <Button className="h-11 rounded-xl gap-2 bg-slate-900 text-white px-6 font-bold" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-zinc-950/50 rounded-xl border border-slate-100 dark:border-zinc-800 p-4 scroll-smooth">
        <Card className="border-none shadow-2xl bg-white dark:bg-zinc-900 print:shadow-none print:m-0 max-w-4xl mx-auto overflow-hidden rounded-sm border border-slate-200">
          <CardContent className="p-12 md:p-20 space-y-12">
            {/* Document Header - Sticky? Maybe just inside the card */}
            <div className="text-center space-y-2 pb-10 border-b border-slate-100 dark:border-zinc-800">
              <h1 className="text-4xl font-serif font-black tracking-tighter text-slate-900 dark:text-white uppercase">Fiqh Academy</h1>
              <h2 className="text-xl font-sans font-bold text-slate-600 dark:text-slate-400 tracking-[0.2em] uppercase">Profit and Loss Statement</h2>
              <p className="text-[12px] font-sans font-medium text-slate-500 italic">
                For the period from {new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} to {new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <div className="pt-4 flex flex-col items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accrual basis</span>
                <span className="text-[10px] font-bold text-slate-300">{report.reportDate}</span>
              </div>
            </div>

            <div className="space-y-12 font-serif text-slate-900 dark:text-slate-100">
              {/* Income */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold border-b-2 border-slate-900 dark:border-white pb-2 flex justify-between items-center bg-slate-50 dark:bg-zinc-800 p-3 sticky top-0 z-[5]">
                  <span>Income</span>
                  <span className="text-sm font-mono font-bold">Total (PKR)</span>
                </h3>
                
                <div className="space-y-4 pl-2">
                  {Object.values(report.income).map((sec: any) => {
                    if (typeof sec !== 'object' || sec === null) return null;
                    const section = sec as PLSection;
                    return (
                      <PLSectionSection 
                        key={section.title} 
                        section={section} 
                        isExpanded={expandedSections.has(section.title)}
                        onToggle={() => toggleSection(section.title)}
                      />
                    );
                  })}
                  
                  <div className="flex justify-between items-center py-4 border-t-2 border-slate-900 dark:border-white mt-8 font-black">
                    <span className="font-bold text-[13px] uppercase tracking-wider">Total — Income</span>
                    <span className="font-mono text-xl underline decoration-double decoration-2 underline-offset-4">
                      PKR {(Number(report.income.total) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold border-b-2 border-slate-900 dark:border-white pb-2 flex justify-between items-center bg-slate-50 dark:bg-zinc-800 p-3 sticky top-0 z-[5]">
                  <span>Less: Expenses</span>
                  <span className="text-sm font-mono font-bold">Total (PKR)</span>
                </h3>
                
                <div className="space-y-4 pl-2">
                  {Object.values(report.expenses).map((sec: any) => {
                    if (typeof sec !== 'object' || sec === null) return null;
                    const section = sec as PLSection;
                    return (
                      <PLSectionSection 
                        key={section.title} 
                        section={section} 
                        isExpanded={expandedSections.has(section.title)}
                        onToggle={() => toggleSection(section.title)}
                      />
                    );
                  })}

                  <div className="flex justify-between items-center py-4 border-t-2 border-slate-900 dark:border-white mt-8 font-black">
                    <span className="font-bold text-[13px] uppercase tracking-wider">Total — Expenses</span>
                    <span className="font-mono text-xl underline decoration-double decoration-2 underline-offset-4">
                      PKR {(Number(report.expenses.total) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net profit (loss) */}
              <div className="pt-10 sticky bottom-0 z-10 bg-white dark:bg-zinc-900 pb-4">
                <div className={`flex justify-between items-center p-8 rounded shadow-2xl transition-all ${report.netProfitLoss >= 0 ? 'bg-slate-900 text-white' : 'bg-red-900 text-white'}`}>
                  <span className="text-sm font-black uppercase tracking-[0.5em] italic">Net profit (loss)</span>
                  <span className="text-5xl font-black font-mono tracking-tighter decoration-double underline underline-offset-8">
                    PKR {(Number(report.netProfitLoss) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-40 grid grid-cols-2 gap-32 pt-10 px-4">
               <div className="border-t-2 border-slate-900 dark:border-zinc-700 text-center pt-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-zinc-400">Finance Manager</span>
               </div>
               <div className="border-t-2 border-slate-900 dark:border-zinc-700 text-center pt-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-zinc-400">Principal</span>
               </div>
            </div>
            
            <div className="pt-20 text-center opacity-30 text-[10px] font-bold uppercase tracking-[0.4em]">
              Proprietary Report — Fiqh Academy Strategic Finance
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PLSectionSection({ section, isExpanded, onToggle }: { section: PLSection; isExpanded: boolean; onToggle: () => void; key?: string }) {
  return (
    <div className="group border-b border-slate-100 dark:border-zinc-800 pb-2">
      <div 
        className="flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors p-2 rounded"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
           <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
           </div>
           <h4 className="text-[14px] font-bold text-slate-800 dark:text-zinc-200">{section.title}</h4>
        </div>
        {!isExpanded && (
           <span className="font-mono font-bold text-sm">{(Number(section.subtotal) || 0).toLocaleString()}</span>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pl-9 pr-2 py-3 border-l-2 border-slate-100 dark:border-zinc-800 ml-4">
              {section.items.length > 0 ? (
                section.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[13px] py-1 border-b border-slate-50 dark:border-zinc-800/10 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 px-2 rounded">
                    <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                    <span className="font-mono font-medium text-slate-500">{(Number(item.amount) || 0).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-xs py-1 italic opacity-40 px-2">
                  <span>-</span>
                  <span className="font-mono">-</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-slate-900 dark:border-zinc-800 pt-3 mt-4">
                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Total — {section.title}</span>
                <span className="font-mono font-black text-[15px] border-b border-slate-900 dark:border-zinc-100">{(Number(section.subtotal) || 0).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
