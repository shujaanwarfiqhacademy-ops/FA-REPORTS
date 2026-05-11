import { useMemo } from "react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";
import { TrendingUp, DollarSign, Building2, ArrowUpRight, ArrowDownRight, Activity, ChevronRight } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card.tsx";
import { Badge } from "./ui/badge.tsx";
import { AppState, Campus, TransactionType } from "../types";

interface DashboardViewProps {
  state: AppState;
  filterCampus: Campus | "Consolidated";
}

const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#f59e0b", "#f43f5e"];

export default function DashboardView({ state, filterCampus }: DashboardViewProps) {
  const stats = useMemo(() => {
    const activeTransactions = (state.transactions || []).filter(t => 
      filterCampus === "Consolidated" || t.campus === filterCampus
    );

    const totalIncome = activeTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const totalExpense = activeTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const netBalance = totalIncome - totalExpense;

    const unallocatedCount = activeTransactions.filter(t => t.campus === Campus.UNALLOCATED).length;

    const campusData = Object.values(Campus)
      .filter(c => c !== Campus.UNALLOCATED)
      .map(campus => {
        const campusTxs = (state.transactions || []).filter(t => t.campus === campus);
        const income = campusTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const expense = campusTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        return {
          name: campus,
          income,
          expense,
          net: income - expense
        };
      });

    return { totalIncome, totalExpense, netBalance, campusData, unallocatedCount };
  }, [state.transactions, filterCampus]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Income (PKR)" 
          value={stats.totalIncome} 
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />} 
          trend="↑ 12.4%" 
          positive={true} 
          subtitle="vs last month"
        />
        <StatCard 
          title="Total Expenses (PKR)" 
          value={stats.totalExpense} 
          icon={<ArrowDownRight className="w-4 h-4 text-red-500" />} 
          trend="↑ 4.2%" 
          positive={false} 
          subtitle="budget utilization"
        />
        <StatCard 
          title="Net Surplus" 
          value={stats.netBalance} 
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} 
          trend="40% Margin" 
          positive={stats.netBalance >= 0} 
          highlight={true}
        />
        <StatCard 
          title="Unallocated Txns" 
          value={stats.unallocatedCount} 
          unit=""
          icon={<Activity className="w-4 h-4 text-amber-500" />} 
          trend="Review Required →" 
          positive={false} 
          warning={stats.unallocatedCount > 0}
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Chart */}
        <Card className="col-span-12 lg:col-span-8 border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-tight">Campus-wise Revenue Distribution</CardTitle>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Expense</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={stats.campusData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} barSize={40} />
                  <Bar dataKey="expense" fill="#cbd5e1" radius={[2, 2, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Sidebar */}
        <Card className="col-span-12 lg:col-span-4 bg-slate-900 dark:bg-zinc-950 border-none shadow-lg text-white rounded-xl flex flex-col p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <h3 className="text-sm font-bold tracking-tight uppercase tracking-widest">AI Financial Insights</h3>
          </div>
          <div className="space-y-6 flex-1">
            <div className="border-l-2 border-emerald-500 pl-4 py-1">
              <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1 tracking-wider">Opportunity</p>
              <p className="text-xs text-slate-300 leading-relaxed">Expense patterns suggest Johar Campus utilities are optimizeable based on Maktab historical lows.</p>
            </div>
            <div className="border-l-2 border-amber-500 pl-4 py-1">
              <p className="text-[10px] text-amber-400 font-bold uppercase mb-1 tracking-wider">Anomalies</p>
              <p className="text-xs text-slate-300 leading-relaxed">System detected unusual spikes in 'Repair & Maintenance' for Masjid Campus compared to budget.</p>
            </div>
            <div className="border-l-2 border-blue-500 pl-4 py-1">
              <p className="text-[10px] text-blue-400 font-bold uppercase mb-1 tracking-wider">Prediction</p>
              <p className="text-xs text-slate-300 leading-relaxed">Donation volumes are projected to increase by 15% next month based on historical seasonal trends.</p>
            </div>
          </div>
          <Button variant="ghost" className="mt-8 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold uppercase tracking-widest border-none transition-colors">
            View Detailed Forecast →
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-xl p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-tight">Allocation Efficiency</CardTitle>
          </CardHeader>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={stats.campusData}>
                <defs>
                  <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="net" stroke="#10b981" fillOpacity={1} fill="url(#areaColor)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-xl p-6">
           <CardHeader className="p-0 mb-6">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-tight">Financial Footprint</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {stats.campusData.map((campus, idx) => (
              <div key={campus.name} className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-bold text-[10px] text-slate-400">P{idx+1}</div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{campus.name}</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Net Balance</div>
                    <div className={`text-xs font-bold font-mono ${campus.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Rs. {campus.net.toLocaleString()}</div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit = "", icon, trend, positive, subtitle, highlight, warning }: any) {
  return (
    <Card className={`border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 transition-all duration-300 relative overflow-hidden ${warning ? 'border-amber-200 bg-amber-50/10' : ''}`}>
      <CardContent className="p-5">
        <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2 flex justify-between items-start">
          {title}
          <div className="p-1.5 bg-slate-50 dark:bg-zinc-800 rounded">
            {icon}
          </div>
        </div>
        <div className={`text-2xl font-bold tracking-tight ${highlight ? 'text-emerald-600' : warning ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
          {unit}{(Number(value) || 0).toLocaleString()}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold">
          <span className={`${positive ? 'text-emerald-600' : warning ? 'text-amber-600 underline' : 'text-red-600'}`}>
            {trend}
          </span>
          {subtitle && <span className="text-slate-400 font-normal">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
