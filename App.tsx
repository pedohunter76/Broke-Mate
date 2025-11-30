
import React, { useState, useEffect } from 'react';
import { AppTab, Transaction, Task, FinancialGoal, TimeBlock, IncomeSource, Subscription, Budget } from './types';
import FinanceDashboard from './components/FinanceDashboard';
import TimeManager from './components/TimeManager';
import InsightsDashboard from './components/InsightsDashboard';
import { LayoutDashboard, Clock, Menu, X, BrainCircuit } from 'lucide-react';

// Mock Data - Cleared for clean state as requested
const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_TASKS: Task[] = [];

const INITIAL_GOALS: FinancialGoal[] = [];

const INITIAL_BUDGETS: Budget[] = [];

// Updated categories with Fun Emojis and Filipino context
const INITIAL_CATEGORIES = [
  'Food 🍜', 
  'Transpo 🚕', 
  'Schoolwork 📚', 
  'Luho 🛒', 
  'Emergency 😭', 
  'Bills 🧾', 
  'Savings 💰', 
  'Health 💊', 
  'Others 📦'
];

const INITIAL_INCOME_SOURCES: IncomeSource[] = [
  { id: '1', name: 'Main Job', category: 'Salary 💰' }
];

const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FINANCE);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [goals, setGoals] = useState<FinancialGoal[]>(INITIAL_GOALS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(INITIAL_INCOME_SOURCES);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Theme Toggle Effect
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Automated Subscription Processor
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let newTransactions: Transaction[] = [];
    let updatedSubscriptions = [...subscriptions];
    let hasChanges = false;

    // Iterate to find due subscriptions
    updatedSubscriptions = updatedSubscriptions.map(sub => {
      // Check if active and due (or overdue)
      if (sub.status === 'active' && sub.nextPaymentDate <= today) {
        hasChanges = true;
        
        // Generate Transaction
        newTransactions.push({
          id: `sub-${sub.id}-${Date.now()}`,
          merchant: sub.name,
          amount: sub.amount,
          date: sub.nextPaymentDate, // Record on the due date
          category: sub.category,
          type: sub.type,
          recurrence: sub.frequency
        });

        // Calculate next date
        const nextDate = new Date(sub.nextPaymentDate);
        if (sub.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        if (sub.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        if (sub.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        
        return {
          ...sub,
          nextPaymentDate: nextDate.toISOString().split('T')[0]
        };
      }
      return sub;
    });

    if (hasChanges) {
      setTransactions(prev => [...prev, ...newTransactions]);
      setSubscriptions(updatedSubscriptions);
    }
  }, [subscriptions]); 

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addGoal = (g: FinancialGoal) => {
    setGoals(prev => [...prev, g]);
  };

  const updateGoal = (updatedGoal: FinancialGoal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const addBudget = (b: Budget) => {
    setBudgets(prev => {
        // Remove existing budget for same category if exists
        const filtered = prev.filter(item => item.category !== b.category);
        return [...filtered, b];
    });
  };

  const removeBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category]);
    }
  };

  const removeCategory = (category: string) => {
    setCategories(prev => prev.filter(c => c !== category));
  };

  const addIncomeSource = (source: IncomeSource) => {
    setIncomeSources(prev => [...prev, source]);
  };

  const updateIncomeSource = (updatedSource: IncomeSource) => {
    setIncomeSources(prev => prev.map(s => s.id === updatedSource.id ? updatedSource : s));
  };

  const removeIncomeSource = (id: string) => {
    setIncomeSources(prev => prev.filter(s => s.id !== id));
  };

  const addSubscription = (sub: Subscription) => {
    setSubscriptions(prev => [...prev, sub]);
  };

  const updateSubscription = (updatedSub: Subscription) => {
    setSubscriptions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
  };

  const removeSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: AppTab, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === tab 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors duration-300">
        <div className="mb-8 px-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg"></div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-slate-400">Broke Mate</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem tab={AppTab.FINANCE} icon={LayoutDashboard} label="Finance Dashboard" />
          <NavItem tab={AppTab.TIME} icon={Clock} label="Time Management" />
          <NavItem tab={AppTab.INSIGHTS} icon={BrainCircuit} label="Insights & Trends" />
        </nav>

        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
           <p className="text-xs text-slate-500 mb-2">Pro Tip</p>
           <p className="text-sm text-slate-600 dark:text-slate-300">Upload receipts in the Finance tab to auto-log expenses.</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-50 transition-colors duration-300">
        <span className="text-lg font-bold text-slate-900 dark:text-white">Broke Mate</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-slate-900 pt-20 px-4 space-y-4 transition-colors duration-300">
           <NavItem tab={AppTab.FINANCE} icon={LayoutDashboard} label="Finance" />
           <NavItem tab={AppTab.TIME} icon={Clock} label="Time" />
           <NavItem tab={AppTab.INSIGHTS} icon={BrainCircuit} label="Insights" />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative pt-16 md:pt-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-white/0 to-white dark:from-indigo-900/20 dark:via-slate-950/0 dark:to-slate-950 pointer-events-none transition-colors duration-300"></div>
        
        {activeTab === AppTab.FINANCE && (
          <FinanceDashboard 
            transactions={transactions} 
            onAddTransaction={addTransaction}
            onRemoveTransaction={removeTransaction}
            goals={goals}
            onAddGoal={addGoal}
            onUpdateGoal={updateGoal}
            budgets={budgets}
            onAddBudget={addBudget}
            onRemoveBudget={removeBudget}
            categories={categories}
            onAddCategory={addCategory}
            onRemoveCategory={removeCategory}
            incomeSources={incomeSources}
            onAddIncomeSource={addIncomeSource}
            onUpdateIncomeSource={updateIncomeSource}
            onRemoveIncomeSource={removeIncomeSource}
            subscriptions={subscriptions}
            onAddSubscription={addSubscription}
            onUpdateSubscription={updateSubscription}
            onRemoveSubscription={removeSubscription}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        )}
        
        {activeTab === AppTab.TIME && (
          <TimeManager 
            tasks={tasks} 
            setTasks={setTasks} 
            schedule={schedule}
            setSchedule={setSchedule}
          />
        )}

        {activeTab === AppTab.INSIGHTS && (
          <InsightsDashboard transactions={transactions} tasks={tasks} />
        )}
      </main>
    </div>
  );
};

export default App;
