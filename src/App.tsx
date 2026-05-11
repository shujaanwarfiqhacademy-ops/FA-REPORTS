/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Upload, 
  TrendingUp, 
  DollarSign, 
  Building2,
  Bell,
  Search,
  Menu,
  ChevronRight,
  Download,
  AlertTriangle,
  LogOut,
  Moon,
  Sun,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { Transaction, Campus, PLReport, AppState } from "./types";
import { generatePLReport, allocateCampuses } from "./lib/accounting";

// Placeholder components to be implemented in separate files or below
import DashboardView from "./components/DashboardView";
import PLReportView from "./components/PLReportView";
import TransactionsView from "./components/TransactionsView";
import UploadView from "./components/UploadView";
import AdminView from "./components/AdminView";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(false);
  const [globalCampus, setGlobalCampus] = useState<Campus | "Consolidated">("Consolidated");
  const [state, setState] = useState<AppState>({
    transactions: [],
    mappings: [],
    columnMapping: {
      date: "Date",
      description: "Transaction",
      account: "Account",
      bankCashAccount: "Bank or Cash Account",
      debit: "Debit",
      credit: "Credit",
      amount: "Amount",
      reference: "Reference No",
      campus: "Campus"
    },
    lastUpdate: new Date().toISOString()
  });

  useEffect(() => {
    const saved = localStorage.getItem("fiqh_academy_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: ensure columnMapping exists
        if (!parsed.columnMapping) {
          parsed.columnMapping = {
            date: "Date",
            description: "Transaction",
            account: "Account",
            bankCashAccount: "Bank or Cash Account",
            debit: "Debit",
            credit: "Credit",
            amount: "Amount",
            reference: "Reference No",
            campus: "Campus"
          };
        }
        setState(parsed);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  const saveState = (newState: Partial<AppState>) => {
    const updated = { ...state, ...newState, lastUpdate: new Date().toISOString() };
    setState(updated);
    localStorage.setItem("fiqh_academy_state", JSON.stringify(updated));
  };

  const addTransactions = (newTransactions: Transaction[]) => {
    const combined = [...state.transactions, ...newTransactions];
    const allocated = allocateCampuses(combined);
    saveState({ transactions: allocated });
    toast.success(`${newTransactions.length} transactions processed and allocated.`);
  };

  const resetData = () => {
    if (window.confirm("Are you sure you want to delete all financial data? This cannot be undone.")) {
      const initialState: AppState = {
        transactions: [],
        mappings: [],
        columnMapping: state.columnMapping,
        lastUpdate: new Date().toISOString()
      };
      setState(initialState);
      localStorage.setItem("fiqh_academy_state", JSON.stringify(initialState));
      toast.info("All financial data has been removed.");
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex font-sans overflow-hidden`}>
      <Toaster position="top-right" />
      
      {/* Sidebar Navigation */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-white flex-shrink-0">F</div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col leading-none">
              <span className="font-bold text-lg tracking-tight">FIQH Academy</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Finance Intelligence</span>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {isSidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold px-3 py-2">Overview</div>}
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} isOpen={isSidebarOpen} />
          <NavItem icon={<Upload size={18} />} label="AI Data Processor" active={activeTab === "upload"} onClick={() => setActiveTab("upload")} isOpen={isSidebarOpen} />
          
          <div className="pt-4">
            {isSidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold px-3 py-2">Reporting</div>}
            <NavItem icon={<FileText size={18} />} label="P&L Statement" active={activeTab === "reports"} onClick={() => setActiveTab("reports")} isOpen={isSidebarOpen} />
            <NavItem icon={<Users size={18} />} label="Transactions" active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")} isOpen={isSidebarOpen} />
          </div>

          <div className="pt-4">
            {isSidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold px-3 py-2">System</div>}
            <NavItem icon={<Settings size={18} />} label="Admin Panel" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} isOpen={isSidebarOpen} />
          </div>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          {isSidebarOpen ? (
            <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 mb-4">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI Engine Active
              </div>
              <div className="text-[10px] text-slate-400">Last sync: Just now</div>
            </div>
          ) : (
             <div className="flex justify-center mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
             </div>
          )}
          
          <Button variant="ghost" size="icon" className="w-full justify-start gap-3 px-2 text-slate-400 hover:text-white" onClick={() => setDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            {isSidebarOpen && <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </Button>
          
          <Separator className="my-2 bg-slate-800" />
          
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">SA</div>
            {isSidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate">Shuja Anwar</span>
                <span className="text-[10px] text-slate-500 truncate">Super Admin</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-500 hover:bg-slate-100">
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3 px-3 py-1 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-100 dark:border-zinc-700">
               <Building2 className="w-4 h-4 text-emerald-500" />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Campus:</span>
               <Select value={globalCampus} onValueChange={(val) => setGlobalCampus(val as any)}>
                 <SelectTrigger className="w-[180px] h-8 bg-transparent border-none shadow-none font-bold text-xs">
                   <SelectValue placeholder="Consolidated" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Consolidated">All (Consolidated)</SelectItem>
                   {Object.values(Campus).map((c) => (
                     <SelectItem key={c} value={c}>{c}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Global search..." className="pl-9 h-9 bg-slate-100/50 dark:bg-zinc-800/50 border-none rounded-md text-xs" />
            </div>

            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold text-xs gap-2" onClick={resetData}>
              <AlertTriangle className="w-4 h-4" />
              Remove Previous Data
            </Button>

            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 rounded-md text-xs font-bold flex items-center gap-2 transition-all shadow-sm" onClick={() => setActiveTab("upload")}>
              <Upload className="w-3.5 h-3.5" />
              Upload Data
            </Button>
          </div>
        </header>

        {/* Viewport content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto space-y-8"
              >
                {activeTab === "dashboard" && <DashboardView state={state} filterCampus={globalCampus} />}
                {activeTab === "reports" && <PLReportView state={state} filterCampus={globalCampus} />}
                {activeTab === "transactions" && <TransactionsView state={state} filterCampus={globalCampus} onUpdate={(txs) => saveState({ transactions: txs })} />}
                {activeTab === "upload" && <UploadView state={state} onUpload={addTransactions} />}
                {activeTab === "settings" && <AdminView state={state} onUpdate={saveState} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, isOpen }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-all duration-200 ${
        active 
          ? "bg-slate-800 px-3 py-2 rounded text-sm text-emerald-400 font-medium border-l-2 border-emerald-500" 
          : "text-slate-300 hover:bg-slate-800 text-sm hover:text-white"
      }`}
    >
      <div className={`${active ? 'text-emerald-400' : 'text-slate-500'} flex-shrink-0`}>{icon}</div>
      {isOpen && (
        <span className="truncate">
          {label}
        </span>
      )}
    </button>
  );
}

