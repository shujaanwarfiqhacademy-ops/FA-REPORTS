import React, { useState, useMemo } from "react";
import { Search, Filter, ArrowUpDown, ChevronDown, Check, X, AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppState, Campus, Transaction, TransactionType } from "../types";

import { Card } from "@/components/ui/card";

interface TransactionsViewProps {
  state: AppState;
  filterCampus: Campus | "Consolidated";
  onUpdate: (transactions: Transaction[]) => void;
}

export default function TransactionsView({ state, filterCampus, onUpdate }: TransactionsViewProps) {
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<TransactionType | "All">("All");

  const accounts = useMemo(() => {
    const set = new Set<string>();
    state.transactions.forEach(t => t.account && set.add(t.account));
    return Array.from(set).sort();
  }, [state.transactions]);

  const filtered = useMemo(() => {
    return state.transactions.filter(t => {
      const matchesSearch = 
        t.description.toLowerCase().includes(search.toLowerCase()) || 
        t.account?.toLowerCase().includes(search.toLowerCase()) ||
        t.bankCashAccount?.toLowerCase().includes(search.toLowerCase()) ||
        t.reference?.toLowerCase().includes(search.toLowerCase());
        
      const matchesCampus = filterCampus === "Consolidated" || t.campus === filterCampus;
      const matchesAccount = selectedAccount === "All" || t.account === selectedAccount;
      const matchesType = selectedType === "All" || t.type === selectedType;
      
      return matchesSearch && matchesCampus && matchesAccount && matchesType;
    });
  }, [state.transactions, search, filterCampus, selectedAccount, selectedType]);

  const handleUpdateCampus = (id: string, newCampus: Campus) => {
    const updated = state.transactions.map(t => t.id === id ? { ...t, campus: newCampus } : t);
    onUpdate(updated);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-end gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
        <div className="space-y-1.5 flex-1 min-w-[300px]">
          <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Search Records</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by description, account, reference..." 
              className="pl-10 h-11 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5 w-48">
          <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Account Head</label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="h-11 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Accounts</SelectItem>
              {accounts.map(acc => <SelectItem key={acc} value={acc}>{acc}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-40">
          <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Type</label>
          <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
            <SelectTrigger className="h-11 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value={TransactionType.INCOME}>Income Only</SelectItem>
              <SelectItem value={TransactionType.EXPENSE}>Expense Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Badge variant="outline" className="h-11 px-6 rounded-xl border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-slate-500 uppercase tracking-tight">
            {filtered.length} Entries Found
          </Badge>
        </div>
      </div>

      {/* Main Container with scrolling */}
      <Card className="flex-1 border-none shadow-2xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden flex flex-col border border-slate-100">
        <div className="flex-1 w-full overflow-auto">
          <Table className="relative min-w-[1000px]">
            <TableHeader className="sticky top-0 z-10 bg-slate-100 dark:bg-zinc-800 shadow-sm">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-32 text-[11px] font-black uppercase text-slate-500 py-5">Date</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-500">Narration / Details</TableHead>
                <TableHead className="w-48 text-[11px] font-black uppercase text-slate-500">Financial Head</TableHead>
                <TableHead className="w-40 text-[11px] font-black uppercase text-slate-500">Source Account</TableHead>
                <TableHead className="w-40 text-[11px] font-black uppercase text-slate-500">Reporting Unit</TableHead>
                <TableHead className="w-36 text-right text-[11px] font-black uppercase text-slate-500 pr-8">Amount (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-96 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300 gap-4">
                       <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-10 h-10 opacity-30" />
                       </div>
                       <p className="text-sm font-bold text-slate-500">No matching financial records found.</p>
                       <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow 
                    key={t.id} 
                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors border-b border-slate-50 dark:border-zinc-800/20 last:border-0 h-20 group"
                  >
                    <TableCell className="font-mono text-[11px] font-bold text-slate-400 px-6">{new Date(t.date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-0.5">
                        <span className="font-bold text-[14px] text-slate-800 dark:text-zinc-100 leading-tight group-hover:text-indigo-600 transition-colors" title={t.description}>
                          {t.description}
                        </span>
                        <div className="flex items-center gap-2">
                           {t.reference && (
                             <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 rounded uppercase tracking-tighter">REF: {t.reference}</span>
                           )}
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit font-black text-[9px] bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 uppercase py-0 px-2 tracking-tight">
                          {t.account}
                        </Badge>
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-amber-600'}`}>
                           {t.type} Entry
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <span className="text-[11px] font-bold text-slate-500 bg-slate-50 dark:bg-zinc-800/50 p-1.5 rounded border border-slate-100 dark:border-zinc-800">
                          {t.bankCashAccount}
                       </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 gap-2 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all border ${
                              t.campus === Campus.UNALLOCATED 
                                ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100' 
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                            }`}
                          >
                            <Building2 className="w-3 h-3" />
                            {t.campus}
                            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                          </Button>
                        } />
                        <DropdownMenuContent className="rounded-xl border-none shadow-2xl w-56 p-2 bg-white dark:bg-zinc-900">
                          <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 tracking-widest">Re-allocate Campus</DropdownMenuLabel>
                          {Object.values(Campus).map(c => (
                            <DropdownMenuItem key={c} onClick={() => handleUpdateCampus(t.id, c)} className="text-[12px] font-bold p-2 my-1 cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800">
                              <div className="flex items-center justify-between w-full">
                                {c}
                                {c === t.campus && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className={`text-right font-mono font-black text-lg pr-8 ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                      {(Number(t.amount) || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
         <div className="flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">Total Inflow</span>
               <span className="font-mono text-emerald-400 font-black">PKR {filtered.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + (Number(t.amount) || 0), 0).toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">Total Outflow</span>
               <span className="font-mono text-red-400 font-black">PKR {filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + (Number(t.amount) || 0), 0).toLocaleString()}</span>
            </div>
         </div>
         <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
            Fiqh Academy Financial Stream
         </div>
      </div>
    </div>
  );
}
