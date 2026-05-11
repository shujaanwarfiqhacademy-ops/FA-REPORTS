import { useState } from "react";
import { Plus, Trash2, Key, ListFilter, Save, History } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.tsx";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";
import { Badge } from "./ui/badge.tsx";
import { Separator } from "./ui/separator.tsx";
import { AppState } from "../types";
import { toast } from "sonner";

interface AdminViewProps {
  state: AppState;
  onUpdate: (newState: Partial<AppState>) => void;
}

export default function AdminView({ state, onUpdate }: AdminViewProps) {
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const handleAddMapping = () => {
    if (!newKeyword || !newCategory) return;
    const updatedMappings = [...state.mappings, { keyword: newKeyword, category: newCategory, subCategory: "" }];
    onUpdate({ mappings: updatedMappings });
    setNewKeyword("");
    setNewCategory("");
    toast.success("Mapping rule added.");
  };

  const handleRemoveMapping = (idx: number) => {
    const updatedMappings = [...state.mappings];
    updatedMappings.splice(idx, 1);
    onUpdate({ mappings: updatedMappings });
    toast.info("Mapping rule removed.");
  };

  const clearData = () => {
    if (confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
      onUpdate({ transactions: [] });
      toast.error("All data cleared.");
    }
  };

  const handleUpdateColumnMapping = (key: string, value: string) => {
    const updatedMapping = { ...state.columnMapping, [key]: value };
    onUpdate({ columnMapping: updatedMapping });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Chart of Accounts Mapping</CardTitle>
              <CardDescription>Rules for automatic transaction categorization.</CardDescription>
            </div>
            <ListFilter className="w-5 h-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Input 
                placeholder="Keyword (e.g. Electricity)" 
                className="h-11 bg-slate-50 dark:bg-zinc-800 border-none"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
              <Input 
                placeholder="Category (e.g. Utilities)" 
                className="h-11 bg-slate-50 dark:bg-zinc-800 border-none"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <Button className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700" onClick={handleAddMapping}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold">Keyword</TableHead>
                    <TableHead className="font-bold">Target Category</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.mappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-slate-400 italic">
                        No custom mapping rules defined. AI will use defaults.
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.mappings.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{m.keyword}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-none">
                            {m.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => handleRemoveMapping(idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Upload Column Matching</CardTitle>
              <CardDescription>Specify the exact column names in your Excel files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(state.columnMapping).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-500">{key}</Label>
                  <Input 
                    value={val} 
                    onChange={(e) => handleUpdateColumnMapping(key, e.target.value)}
                    className="h-9 bg-slate-50 dark:bg-zinc-800 border-none text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg font-bold">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Last Update</span>
                <span className="font-medium">{new Date(state.lastUpdate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Transactions</span>
                <Badge variant="secondary" className="font-mono">{state.transactions.length}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm border-t pt-4 border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500">Database Size</span>
                <span className="font-medium font-mono">~{(JSON.stringify(state).length / 1024).toFixed(2)} KB</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button className="w-full justify-start gap-3 bg-indigo-600 hover:bg-indigo-700 h-11">
                  <History className="w-4 h-4" />
                  View Audit Logs
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-11 border-slate-200" onClick={() => toast.info("Exporting data backup...")}>
                  <Save className="w-4 h-4" />
                  Backup Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-300">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Danger Zone</CardTitle>
              <CardDescription className="text-red-700/60 dark:text-red-400/60">Destructive actions for developers and admins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="destructive" className="w-full h-11 gap-2" onClick={clearData}>
                <Trash2 className="w-4 h-4" />
                Flush All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


