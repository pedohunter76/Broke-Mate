import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ReceiptData, FinancialGoal, Subscription, Budget } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Loader2, Camera, Target, Sparkles, X, Tag, Trash2, Filter, XCircle, Wallet, Repeat, CalendarClock, PieChart as PieChartIcon, Zap, PiggyBank, Sun, Moon, PauseCircle, PlayCircle, Check, DollarSign, TrendingUp, TrendingDown, Settings } from 'lucide-react';
import { analyzeReceipt } from '../services/geminiService';

interface FinanceDashboardProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  onRemoveTransaction?: (id: string) => void;
  goals: FinancialGoal[];
  onAddGoal: (g: FinancialGoal) => void;
  onUpdateGoal: (g: FinancialGoal) => void;
  budgets: Budget[];
  onAddBudget: (b: Budget) => void;
  onRemoveBudget: (id: string) => void;
  categories: string[];
  onAddCategory: (c: string) => void;
  onRemoveCategory: (c: string) => void;
  subscriptions: Subscription[];
  onAddSubscription: (sub: Subscription) => void;
  onUpdateSubscription: (sub: Subscription) => void;
  onRemoveSubscription: (id: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const MICRO_TIPS = [
    "Wag muna milk tea, save ka muna! 🧋",
    "Piso-piso lang, makakaipon din! 💰",
    "Walk na lang pag malapit, exercise pa! 🚶",
    "Bring baon para iwas gastos sa lunch 🍱",
    "Need ba talaga or want lang? 🤔",
    "Small savings add up to big dreams! 🚀"
];

// Specific lists for Quick Tracker
const QUICK_EXPENSE_CATS = ['Food 🍜', 'Transpo 🚕', 'Schoolwork 📚', 'Luho 🛒', 'Emergency 😭', 'Bills 🧾', 'Health 💊', 'Others 📦'];
const QUICK_INCOME_CATS = ['Allowance 💸', 'Gift 🎁', 'Salary 💼'];

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ 
  transactions, 
  onAddTransaction,
  onRemoveTransaction,
  goals, 
  onAddGoal,
  onUpdateGoal,
  budgets,
  onAddBudget,
  onRemoveBudget,
  categories,
  onAddCategory,
  onRemoveCategory,
  subscriptions,
  onAddSubscription,
  onUpdateSubscription,
  onRemoveSubscription,
  isDarkMode,
  onToggleTheme
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isManagingSubscriptions, setIsManagingSubscriptions] = useState(false);
  const [isManagingBudgets, setIsManagingBudgets] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [activeChart, setActiveChart] = useState<'income' | 'expense'>('expense');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Tracker State
  const [quickType, setQuickType] = useState<'expense' | 'income'>('expense');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [quickCategory, setQuickCategory] = useState('');

  // Set default category when type changes
  useEffect(() => {
    if (quickType === 'expense') {
        setQuickCategory(QUICK_EXPENSE_CATS[0]);
    } else {
        setQuickCategory(QUICK_INCOME_CATS[0]);
    }
  }, [quickType]);

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // New Goal Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');

  // Add Funds to Goal State
  const [addingFundsGoalId, setAddingFundsGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  // Budget Management State
  const [newBudgetCategory, setNewBudgetCategory] = useState(categories[0] || 'Food 🍜');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');

  // Category Management State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Subscription Management State
  const [newSubName, setNewSubName] = useState('');
  const [newSubAmount, setNewSubAmount] = useState('');
  const [newSubCategory, setNewSubCategory] = useState(categories[0] || 'Bills 🧾');
  const [newSubType, setNewSubType] = useState<'income' | 'expense'>('expense');
  const [newSubFrequency, setNewSubFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [newSubStartDate, setNewSubStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Manual Transaction Form State
  const [manualTxMerchant, setManualTxMerchant] = useState('');
  const [manualTxAmount, setManualTxAmount] = useState('');
  const [manualTxDate, setManualTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTxCategory, setManualTxCategory] = useState(categories[0] || 'Others 📦');
  const [manualTxType, setManualTxType] = useState<'income' | 'expense'>('expense');
  const [manualTxRecurrence, setManualTxRecurrence] = useState<'none' | 'weekly' | 'monthly' | 'yearly'>('none');

  // Random Tip
  const [currentTip, setCurrentTip] = useState(MICRO_TIPS[0]);

  useEffect(() => {
    setCurrentTip(MICRO_TIPS[Math.floor(Math.random() * MICRO_TIPS.length)]);
  }, [goals.length]); // Refresh tip when goals change

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    const matchesDate = (!filterStartDate || t.date >= filterStartDate) && 
                        (!filterEndDate || t.date <= filterEndDate);
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesDate && matchesCategory && matchesType;
  });

  // Derived metrics based on FILTERED transactions
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Budget Calculations (Current Month)
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const currentMonthExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    t.date.startsWith(currentMonthStr)
  );

  const getSpentByCategory = (cat: string) => {
    return currentMonthExpenses
      .filter(t => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Chart data prep based on FILTERED transactions
  const getCategoryData = (type: 'income' | 'expense') => {
    return filteredTransactions
      .filter(t => t.type === type)
      .reduce((acc, t) => {
        const existing = acc.find(i => i.name === t.category);
        if (existing) {
          existing.value += t.amount;
        } else {
          acc.push({ name: t.category, value: t.amount });
        }
        return acc;
      }, [] as { name: string; value: number }[]);
  };

  const currentChartData = getCategoryData(activeChart);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount) return;

    const amount = parseFloat(quickAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newTx: Transaction = {
        id: Date.now().toString(),
        merchant: quickNote || (quickType === 'income' ? 'Income' : quickCategory.split(' ')[0]), 
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        category: quickCategory,
        type: quickType
    };

    onAddTransaction(newTx);
    setQuickAmount('');
    setQuickNote('');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const result: ReceiptData = await analyzeReceipt(base64Data);
          
          if (result) {
            let txType: 'income' | 'expense' = 'expense';
            let txCategory = result.category || 'Others 📦';

            const newTransaction: Transaction = {
              id: Date.now().toString(),
              merchant: result.merchant || 'Unknown Merchant',
              amount: result.total || 0,
              date: result.date || new Date().toISOString().split('T')[0],
              category: txCategory,
              type: txType
            };
            onAddTransaction(newTransaction);
            alert(`Receipt scanned! Added ${newTransaction.merchant} - ₱${newTransaction.amount} as ${txType.toUpperCase()}`);
          }
        } catch (err) {
            console.error(err);
            alert("Failed to analyze receipt. Please try again.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      setIsScanning(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalAmount || !newGoalDate) return;

    const targetAmount = parseFloat(newGoalAmount);
    
    const newGoal: FinancialGoal = {
        id: Date.now().toString(),
        title: newGoalTitle,
        targetAmount,
        currentAmount: 0,
        deadline: newGoalDate,
    };

    onAddGoal(newGoal);
    setIsAddingGoal(false);
    setNewGoalTitle('');
    setNewGoalAmount('');
    setNewGoalDate('');
  };

  const handleAddFundsToGoal = (amount: number) => {
    if (!addingFundsGoalId) return;
    
    const goal = goals.find(g => g.id === addingFundsGoalId);
    if (goal) {
        onUpdateGoal({
            ...goal,
            currentAmount: goal.currentAmount + amount
        });

        // Add a transaction to reflect this savings as an expense (money set aside)
        onAddTransaction({
            id: `goal-save-${Date.now()}`,
            merchant: `Goal: ${goal.title}`,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            category: 'Savings 💰',
            type: 'expense'
        });

        setAddingFundsGoalId(null);
        setFundAmount('');
    }
  };

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetCategory || !newBudgetAmount) return;

    onAddBudget({
        id: Date.now().toString(),
        category: newBudgetCategory,
        amount: parseFloat(newBudgetAmount)
    });

    setNewBudgetAmount('');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubAmount) return;

    const newSub: Subscription = {
        id: Date.now().toString(),
        name: newSubName,
        amount: parseFloat(newSubAmount),
        category: newSubCategory,
        type: newSubType,
        frequency: newSubFrequency,
        startDate: newSubStartDate,
        nextPaymentDate: newSubStartDate,
        status: 'active'
    };

    onAddSubscription(newSub);
    setNewSubName('');
    setNewSubAmount('');
  };

  const toggleSubscriptionStatus = (sub: Subscription) => {
    onUpdateSubscription({
        ...sub,
        status: sub.status === 'active' ? 'paused' : 'active'
    });
  };

  const handleAddManualTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTxMerchant || !manualTxAmount) return;

    const amount = parseFloat(manualTxAmount);

    const newTx: Transaction = {
      id: Date.now().toString(),
      merchant: manualTxMerchant,
      amount: amount,
      date: manualTxDate,
      category: manualTxCategory,
      type: manualTxType,
      recurrence: manualTxRecurrence === 'none' ? undefined : manualTxRecurrence
    };
    onAddTransaction(newTx);

    // If transaction is recurring, automatically create a subscription
    if (manualTxRecurrence !== 'none') {
        const nextDate = new Date(manualTxDate);
        if (manualTxRecurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        if (manualTxRecurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        if (manualTxRecurrence === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

        const newSub: Subscription = {
            id: `auto-${Date.now()}`,
            name: manualTxMerchant,
            amount: amount,
            category: manualTxCategory,
            type: manualTxType,
            frequency: manualTxRecurrence,
            startDate: manualTxDate,
            nextPaymentDate: nextDate.toISOString().split('T')[0],
            status: 'active'
        };
        onAddSubscription(newSub);
    }

    setIsAddingTransaction(false);
    
    setManualTxMerchant('');
    setManualTxAmount('');
    setManualTxRecurrence('none');
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterCategory('All');
    setFilterType('all');
  };

  const activeFilterCount = [
    filterStartDate, filterEndDate, filterCategory !== 'All', filterType !== 'all'
  ].filter(Boolean).length;

  // Determine displayed categories in Quick Tracker
  const quickTrackerCategories = quickType === 'expense' ? QUICK_EXPENSE_CATS : QUICK_INCOME_CATS;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 relative">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Financial Overview</h1>
          <p className="text-slate-600 dark:text-slate-400">Track your Peso (₱) wealth and spending habits.</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
            <button
                onClick={onToggleTheme}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
           <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${showFilters || activeFilterCount > 0 ? 'bg-indigo-100 dark:bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-indigo-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'}`}
           >
             <Filter className="w-4 h-4" />
             Filters
             {activeFilterCount > 0 && <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
           </button>
           <div className="flex items-center gap-2 overflow-x-auto max-w-[200px] md:max-w-none">
                <button 
                    onClick={() => setIsManagingSubscriptions(true)}
                    className="flex-shrink-0 flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-200 dark:border-slate-700"
                >
                    <CalendarClock className="w-4 h-4" />
                    Subscriptions
                </button>
                <button 
                    onClick={() => setIsManagingBudgets(true)}
                    className="flex-shrink-0 flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-200 dark:border-slate-700"
                >
                    <PieChartIcon className="w-4 h-4" />
                    Budgets
                </button>
                <button 
                    onClick={() => setIsManagingCategories(true)}
                    className="flex-shrink-0 flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors border border-slate-200 dark:border-slate-700"
                >
                    <Tag className="w-4 h-4" />
                    Categories
                </button>
           </div>
           <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Scan
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Quick Daily Tracker */}
      <div className={`border p-6 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden transition-colors ${
          quickType === 'expense' 
          ? 'bg-gradient-to-r from-indigo-50 to-white dark:from-slate-900 dark:to-indigo-900/40 border-indigo-100 dark:border-slate-700' 
          : 'bg-gradient-to-r from-emerald-50 to-white dark:from-slate-900 dark:to-emerald-900/40 border-emerald-100 dark:border-slate-700'
      }`}>
        
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2">
                <Zap className={`w-5 h-5 ${quickType === 'expense' ? 'text-amber-500' : 'text-emerald-500'}`} /> 
                {quickType === 'expense' ? 'Quick Expense Tracker' : 'Quick Income Tracker'}
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setQuickType('expense')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${quickType === 'expense' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Expense
                </button>
                <button 
                    onClick={() => setQuickType('income')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${quickType === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Income
                </button>
            </div>
        </div>
        
        {/* Category Selector Scroll */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-4 custom-scrollbar snap-x">
            {quickTrackerCategories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => setQuickCategory(cat)}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all snap-start ${
                        quickCategory === cat 
                        ? (quickType === 'expense' 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                            : 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105')
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    <span className="text-lg font-bold block mb-1">{cat.split(' ').slice(-1)}</span>
                    <span className="text-xs font-medium">{cat.split(' ').slice(0, -1).join(' ')}</span>
                </button>
            ))}
            
            <button
                onClick={() => setIsManagingCategories(true)}
                className="flex-shrink-0 px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center min-w-[100px]"
            >
                <Settings className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Customize</span>
            </button>
        </div>

        {/* Quick Input Form */}
        <form onSubmit={handleQuickAdd} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₱</span>
                <input 
                    type="number" 
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
            </div>
            <div className="flex-[2] w-full">
                <input 
                    type="text" 
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder={quickType === 'expense' ? "Note (optional, e.g. Lunch)" : "Source (optional, e.g. Freelance)"}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
            </div>
            <button 
                type="submit"
                className={`w-full md:w-auto text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 ${
                    quickType === 'expense' 
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                }`}
            >
                {quickType === 'expense' ? 'Add Expense' : 'Add Income'}
            </button>
        </form>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 shadow-lg">
            <div>
                <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
                <input 
                    type="date" 
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            </div>
            <div>
                <label className="text-xs text-slate-500 mb-1 block">End Date</label>
                <input 
                    type="date" 
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            </div>
            <div>
                <label className="text-xs text-slate-500 mb-1 block">Category</label>
                <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                    <option value="All">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs text-slate-500 mb-1 block">Type</label>
                <div className="flex gap-2">
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                    {activeFilterCount > 0 && (
                        <button 
                            onClick={clearFilters}
                            title="Clear Filters"
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium">Total Balance</h3>
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <span className="text-xl font-bold text-emerald-500">₱</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          <div className="mt-2 text-sm text-emerald-400 flex items-center gap-1">
             <span className="text-slate-400 dark:text-slate-500 text-xs">Based on current selection</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl transition-colors">
           <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium">Filtered Income</h3>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₱{totalIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl transition-colors">
           <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium">Filtered Expenses</h3>
            <div className="p-2 bg-red-500/10 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₱{totalExpense.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Zero State / Onboarding */}
      {transactions.length === 0 && (
        <div className="bg-gradient-to-r from-indigo-100 to-white dark:from-indigo-900/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to your Financial Hub!</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-lg mx-auto">
                Start by tracking your daily expenses above! 🍜
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                    onClick={() => setIsAddingTransaction(true)} 
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-5 h-5" /> Detailed Entry
                </button>
                <button 
                    onClick={() => setIsManagingBudgets(true)} 
                    className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-semibold transition-all border border-slate-200 dark:border-slate-700"
                >
                    <PieChartIcon className="w-5 h-5" /> Set Budget
                </button>
            </div>
        </div>
      )}

      {/* Budget Goals Section */}
      {budgets.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    Monthly Budget Goals
                </h3>
                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {new Date().toLocaleString('default', { month: 'long' })}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map(budget => {
                    const spent = getSpentByCategory(budget.category);
                    const percentage = Math.min((spent / budget.amount) * 100, 100);
                    const isOverBudget = spent > budget.amount;
                    const isNearLimit = !isOverBudget && (spent / budget.amount) > 0.8;
                    
                    let barColor = 'bg-emerald-500';
                    if (isOverBudget) barColor = 'bg-red-500';
                    else if (isNearLimit) barColor = 'bg-amber-500';

                    return (
                        <div key={budget.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-slate-700 dark:text-white">{budget.category}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOverBudget ? 'bg-red-500/20 text-red-600 dark:text-red-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                    {Math.round((spent / budget.amount) * 100)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>₱{spent.toLocaleString()} spent</span>
                                <span>of ₱{budget.amount.toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
              </div>
          </div>
      )}

      {/* Charts Section */}
      {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl min-h-[300px] transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {activeChart === 'expense' ? 'Expense' : 'Income'} Breakdown
                </h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button 
                    onClick={() => setActiveChart('expense')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeChart === 'expense' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Expense
                </button>
                <button 
                    onClick={() => setActiveChart('income')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeChart === 'income' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Income
                </button>
                </div>
            </div>
            
            {currentChartData.length > 0 ? (
                <>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={currentChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke={isDarkMode ? "#0f172a" : "#fff"} 
                            >
                            {currentChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip 
                            contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#fff' : '#0f172a' }}
                            itemStyle={{ color: isDarkMode ? '#fff' : '#0f172a' }}
                            formatter={(value: number) => `₱${value.toLocaleString()}`}
                            />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {currentChartData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-sm text-slate-600 dark:text-slate-300">{entry.name}</span>
                        </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400 dark:text-slate-500">
                    No {activeChart} data for this selection.
                </div>
            )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl min-h-[300px] transition-colors">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Transaction History</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredTransactions.slice().reverse().map((t) => (
                <div key={t.id} className="group relative overflow-hidden rounded-xl bg-red-600 mb-3">
                    {/* Horizontal scroll container for swipe gesture */}
                    <div className="flex w-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        
                        {/* Main Transaction Content */}
                        <div className="min-w-full snap-start bg-slate-50 dark:bg-slate-800 p-4 border-l-4 border-l-transparent hover:border-l-indigo-500 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-white dark:bg-slate-700/50 shadow-sm dark:shadow-none`}>
                                    {/* Display Emoji from category if available, else standard icon */}
                                    {t.category.match(/[\p{Emoji}]/u) ? t.category.split(' ').pop() : (t.type === 'income' ? <Plus className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <DollarSign className="w-5 h-5 text-slate-600 dark:text-slate-300" />)}
                                </div>
                                <div>
                                <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                                    {t.merchant}
                                    {t.recurrence && (
                                        <span title={`Repeats ${t.recurrence}`} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                            <Repeat className="w-2.5 h-2.5" /> {t.recurrence}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-slate-500">{t.category} • {t.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {t.type === 'income' ? '+' : '-'}₱{t.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                                {/* Desktop Hover Delete Button */}
                                {onRemoveTransaction && (
                                    <button 
                                        onClick={() => onRemoveTransaction(t.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 hidden md:block"
                                        title="Delete Entry"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Swipe-to-Delete Action (Snap Target) */}
                        <div className="min-w-[80px] snap-end bg-red-600 flex items-center justify-center">
                            <button 
                                onClick={() => onRemoveTransaction && onRemoveTransaction(t.id)}
                                className="w-full h-full flex items-center justify-center text-white active:bg-red-700 transition-colors"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
                ))}
                {filteredTransactions.length === 0 && (
                <div className="text-center text-slate-500 py-8">No transactions found.</div>
                )}
            </div>
            </div>
        </div>
      )}

      {/* Financial Goals Section */}
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Target className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                    Micro-Saving Goals
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <p className="text-xs text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
                        {currentTip}
                    </p>
                </div>
            </div>
            <button 
                onClick={() => setIsAddingGoal(true)}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700"
            >
                <Plus className="w-4 h-4" /> New Goal
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
                <div key={goal.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col group relative overflow-hidden transition-colors">
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{goal.title}</h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            Due {goal.deadline}
                        </span>
                    </div>
                    
                    <div className="mb-4 relative z-10">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-500 dark:text-slate-400">Progress</span>
                            <span className="text-slate-900 dark:text-white font-medium">
                                {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 mb-1">
                            <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-700 relative" 
                                style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-slate-500">
                            <span>₱{goal.currentAmount.toLocaleString()}</span>
                            <span>₱{goal.targetAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
                        <button 
                            onClick={() => setAddingFundsGoalId(goal.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                            <PiggyBank className="w-4 h-4" /> Save
                        </button>
                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-xs flex items-center justify-center text-center px-2">
                             Remaining: ₱{(goal.targetAmount - goal.currentAmount).toLocaleString()}
                        </div>
                    </div>
                </div>
            ))}
            {goals.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-500">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No financial goals set yet.</p>
                    <p className="text-sm mt-1">Start small: "New Shoes" or "Emergency Fund"</p>
                    <button onClick={() => setIsAddingGoal(true)} className="text-indigo-500 dark:text-indigo-400 hover:underline mt-2 font-medium">Create your first goal</button>
                </div>
            )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add Funds Modal */}
      {addingFundsGoalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 rounded-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto">
                  <button onClick={() => setAddingFundsGoalId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                     <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Add Savings</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Piso-piso lang, makakaipon din! 💰</p>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                      <button onClick={() => handleAddFundsToGoal(20)} className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-500">
                          +₱20
                      </button>
                      <button onClick={() => handleAddFundsToGoal(50)} className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-500">
                          +₱50
                      </button>
                      <button onClick={() => handleAddFundsToGoal(100)} className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-500">
                          +₱100
                      </button>
                  </div>

                  <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                      <input 
                          type="number"
                          placeholder="Custom Amount"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                      />
                  </div>

                  <button 
                      onClick={() => {
                          const val = parseFloat(fundAmount);
                          if (!isNaN(val) && val > 0) handleAddFundsToGoal(val);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20"
                  >
                      Add to Savings
                  </button>
             </div>
          </div>
      )}

      {/* Manual Transaction Modal */}
      {isAddingTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto">
                  <button onClick={() => setIsAddingTransaction(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Detailed Entry</h3>
                  <form onSubmit={handleAddManualTransaction} className="space-y-4">
                      <div>
                          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Type</label>
                          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                              <button type="button" onClick={() => setManualTxType('expense')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${manualTxType === 'expense' ? 'bg-white dark:bg-slate-700 shadow text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>Expense</button>
                              <button type="button" onClick={() => setManualTxType('income')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${manualTxType === 'income' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>Income</button>
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Merchant / Description</label>
                          <input type="text" value={manualTxMerchant} onChange={e => setManualTxMerchant(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base" placeholder="e.g., Jollibee" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Amount</label>
                              <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                                  <input type="number" value={manualTxAmount} onChange={e => setManualTxAmount(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base" placeholder="0.00" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Date</label>
                              <input type="date" value={manualTxDate} onChange={e => setManualTxDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base" />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Category</label>
                          <select value={manualTxCategory} onChange={e => setManualTxCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base">
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Recurrence (Subscription)</label>
                          <select value={manualTxRecurrence} onChange={e => setManualTxRecurrence(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base">
                              <option value="none">One-time</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                          </select>
                      </div>

                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold mt-2 transition-colors">
                          Add Transaction
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Subscription Manager Modal */}
      {isManagingSubscriptions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 rounded-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto">
                  <button onClick={() => setIsManagingSubscriptions(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Subscriptions</h3>
                  
                  {/* List Active Subscriptions */}
                  <div className="space-y-3 mb-8">
                      {subscriptions.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">{sub.name}</p>
                                  <p className="text-xs text-slate-500">{sub.frequency} • ₱{sub.amount}</p>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => toggleSubscriptionStatus(sub)} className={`p-2 rounded-lg ${sub.status === 'active' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                      {sub.status === 'active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                                  </button>
                                  <button onClick={() => onRemoveSubscription(sub.id)} className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                      ))}
                      {subscriptions.length === 0 && <p className="text-center text-slate-400 text-sm">No active subscriptions.</p>}
                  </div>

                  {/* Add New Subscription */}
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Add New</h4>
                  <form onSubmit={handleAddSubscription} className="space-y-3">
                      <div className="flex gap-3">
                          <input type="text" value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="Name (e.g. Netflix)" required className="flex-[2] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base" />
                          <input type="number" value={newSubAmount} onChange={e => setNewSubAmount(e.target.value)} placeholder="Amount" required className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base" />
                      </div>
                      <div className="flex gap-3">
                          <select value={newSubFrequency} onChange={e => setNewSubFrequency(e.target.value as any)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base">
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                          </select>
                          <select value={newSubCategory} onChange={e => setNewSubCategory(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base">
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold mt-2 transition-colors">
                          Save Subscription
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Budget Manager Modal */}
      {isManagingBudgets && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto">
                  <button onClick={() => setIsManagingBudgets(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Monthly Budgets</h3>
                  
                  <div className="space-y-3 mb-6">
                      {budgets.map(b => (
                          <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                              <span className="text-slate-900 dark:text-white font-medium">{b.category}</span>
                              <div className="flex items-center gap-3">
                                  <span className="text-slate-600 dark:text-slate-300">₱{b.amount.toLocaleString()}</span>
                                  <button onClick={() => onRemoveBudget(b.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          </div>
                      ))}
                      {budgets.length === 0 && <p className="text-center text-slate-400 text-sm">No budgets set.</p>}
                  </div>

                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Set New Limit</h4>
                  <form onSubmit={handleSetBudget} className="space-y-3">
                      <select value={newBudgetCategory} onChange={e => setNewBudgetCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base">
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="number" value={newBudgetAmount} onChange={e => setNewBudgetAmount(e.target.value)} placeholder="Limit Amount" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base" />
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold mt-2 transition-colors">
                          Set Budget
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Category Manager Modal */}
      {isManagingCategories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto">
                  <button onClick={() => setIsManagingCategories(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Manage Categories</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                      {categories.map(cat => (
                          <div key={cat} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-700 dark:text-slate-200">{cat}</span>
                              <button onClick={() => onRemoveCategory(cat)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                          </div>
                      ))}
                  </div>

                  <form onSubmit={handleAddCategory} className="flex gap-2">
                      <input 
                          type="text" 
                          value={newCategoryName} 
                          onChange={e => setNewCategoryName(e.target.value)} 
                          placeholder="New Category + Emoji" 
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base"
                      />
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors">
                          Add
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* New Goal Modal */}
      {isAddingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto">
                  <button onClick={() => setIsAddingGoal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create New Goal</h3>
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                      <div>
                          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Goal Name</label>
                          <input type="text" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} placeholder="e.g. New Shoes 👟" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base" />
                      </div>
                      <div>
                          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Target Amount (₱)</label>
                          <input type="number" value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} placeholder="0.00" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base" />
                      </div>
                      <div>
                          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Target Deadline</label>
                          <input type="date" value={newGoalDate} onChange={e => setNewGoalDate(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white text-base" />
                      </div>
                      
                      <button 
                          type="submit" 
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold mt-2 transition-colors flex items-center justify-center gap-2"
                      >
                          <Plus className="w-5 h-5" />
                          Create Goal
                      </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default FinanceDashboard;