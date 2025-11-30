
import React, { useState, useEffect } from 'react';
import { Transaction, Task, InsightResult } from '../types';
import { generateCrossFunctionalInsights } from '../services/geminiService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend } from 'recharts';
import { Sparkles, BrainCircuit, TrendingUp, Clock, Wallet, Loader2 } from 'lucide-react';

interface InsightsDashboardProps {
  transactions: Transaction[];
  tasks: Task[];
}

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ transactions, tasks }) => {
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Prepare Chart Data: Group by Date
  const chartDataMap = new Map<string, { date: string; spending: number; tasks: number }>();

  // 1. Process Transactions (Expenses only)
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const current = chartDataMap.get(t.date) || { date: t.date, spending: 0, tasks: 0 };
    current.spending += t.amount;
    chartDataMap.set(t.date, current);
  });

  // 2. Process Tasks 
  tasks.forEach(t => {
    if (t.dueDate) {
        const dateKey = t.dueDate.split('T')[0]; 
        const current = chartDataMap.get(dateKey) || { date: dateKey, spending: 0, tasks: 0 };
        current.tasks += 1;
        chartDataMap.set(dateKey, current);
    }
  });

  // Convert to array and sort by date
  const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const recentChartData = chartData.slice(-10);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    try {
      const result = await generateCrossFunctionalInsights(transactions, tasks);
      setInsights(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalTasks = tasks.length;
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const avgCostPerTask = totalTasks ? (totalExpense / totalTasks).toFixed(2) : '0';

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-fuchsia-500" />
            Cross-Functional Insights
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Discover hidden patterns between your time and money.</p>
        </div>
        <button 
          onClick={handleGenerateInsights}
          disabled={isLoading}
          className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {insights ? 'Refresh Analysis' : 'Analyze Patterns'}
        </button>
      </div>

      {/* AI Analysis Section */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="md:col-span-3 bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-xl relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit className="w-32 h-32 text-slate-900 dark:text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Analysis Summary</h3>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed max-w-4xl">{insights.summary}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl transition-colors">
             <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-fuchsia-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Correlations Found</h3>
             </div>
             <ul className="space-y-3">
                {insights.correlations.map((c, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-fuchsia-500 font-bold">•</span>
                        {c}
                    </li>
                ))}
             </ul>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl border-l-4 border-l-emerald-500 transition-colors">
             <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Actionable Recommendation</h3>
             </div>
             <p className="text-slate-600 dark:text-slate-300 text-lg">{insights.recommendation}</p>
          </div>
        </div>
      )}

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl min-h-[400px] transition-colors">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Work Load vs. Daily Spending</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={recentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
                <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                />
                <YAxis yAxisId="left" stroke="#f472b6" label={{ value: 'Spending (₱)', angle: -90, position: 'insideLeft', fill: '#f472b6' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#818cf8" label={{ value: 'Tasks', angle: 90, position: 'insideRight', fill: '#818cf8' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--tooltip-bg, #1e293b)', 
                    borderColor: 'var(--tooltip-border, #334155)', 
                    color: 'var(--tooltip-text, #fff)' 
                  }}
                  itemStyle={{ color: 'var(--tooltip-text, #fff)' }}
                  wrapperClassName="dark-tooltip"
                />
                <Legend />
                <Bar yAxisId="left" dataKey="spending" name="Spending (₱)" fill="#f472b6" barSize={20} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="tasks" name="Tasks Due" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats Side Panel */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl transition-colors">
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Avg. Expense per Task</h3>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">₱{avgCostPerTask}</span>
                    <span className="text-xs text-slate-500 mb-1">context metric</span>
                </div>
                <div className="mt-4 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-1/2 opacity-50"></div>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    A rough metric of how much you spend relative to your workload volume.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl transition-colors">
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Data Points Analyzed</h3>
                <div className="flex flex-col gap-3 mt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Wallet className="w-4 h-4 text-emerald-500" />
                            <span>Transactions</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{transactions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>Tasks Logged</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{tasks.length}</span>
                    </div>
                </div>
            </div>
            
            {!insights && (
                 <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/20 p-6 rounded-2xl text-center transition-colors">
                    <Sparkles className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mx-auto mb-3" />
                    <p className="text-indigo-700 dark:text-indigo-200 font-medium">Unlock AI Insights</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tap the analyze button to let Gemini find patterns in your data.</p>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard;
