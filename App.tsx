
import React, { useState, useEffect } from 'react';
import { AppTab, Transaction, Task, FinancialGoal, TimeBlock, Subscription, Budget, UserProfile } from './types';
import FinanceDashboard from './components/FinanceDashboard';
import TimeManager from './components/TimeManager';
import InsightsDashboard from './components/InsightsDashboard';
import LoginScreen from './components/LoginScreen';
import { LayoutDashboard, Clock, Menu, X, BrainCircuit, CheckCircle2, LogOut, User } from 'lucide-react';

// Mock Data - Cleared for clean state
const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_TASKS: Task[] = [];
const INITIAL_GOALS: FinancialGoal[] = [];
const INITIAL_BUDGETS: Budget[] = [];
const INITIAL_CATEGORIES = [
  'Food 🍜', 
  'Transpo 🚕', 
  'Schoolwork 📚', 
  'Luho 🛒', 
  'Emergency 😭', 
  'Bills 🧾', 
  'Savings 💰', 
  'Health 💊', 
  'Allowance 💸',
  'Salary 💼',
  'Others 📦'
];
const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

// Storage Keys
const USERS_KEY = 'broke-mate-users';
// Legacy key for migration support if needed, but we'll focus on new profiles
const LEGACY_KEY = 'broke-mate-data-v1'; 

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [savedUsers, setSavedUsers] = useState<UserProfile[]>([]);

  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FINANCE);
  
  // App Data State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [goals, setGoals] = useState<FinancialGoal[]>(INITIAL_GOALS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load User List on Mount
  useEffect(() => {
    const usersJson = localStorage.getItem(USERS_KEY);
    if (usersJson) {
      try {
        setSavedUsers(JSON.parse(usersJson));
      } catch (e) {
        console.error("Failed to load users", e);
      }
    }
  }, []);

  // 2. Load User Data when currentUser changes
  useEffect(() => {
    if (!currentUser) return;

    setIsLoaded(false); // Start loading
    const userStorageKey = `broke-mate-data-${currentUser.username.toLowerCase()}`;
    const savedData = localStorage.getItem(userStorageKey);

    if (savedData) {
      // Load existing user data
      try {
        const parsed = JSON.parse(savedData);
        setTransactions(parsed.transactions || INITIAL_TRANSACTIONS);
        setTasks(parsed.tasks || INITIAL_TASKS);
        setGoals(parsed.goals || INITIAL_GOALS);
        setBudgets(parsed.budgets || INITIAL_BUDGETS);
        setSchedule(parsed.schedule || []);
        setCategories(parsed.categories || INITIAL_CATEGORIES);
        setSubscriptions(parsed.subscriptions || INITIAL_SUBSCRIPTIONS);
        if (parsed.isDarkMode !== undefined) setIsDarkMode(parsed.isDarkMode);
      } catch (e) {
        console.error("Failed to load user data", e);
      }
    } else {
      // New user? Check if we should migrate legacy data (Optional feature)
      // For now, let's just initialize defaults
      setTransactions(INITIAL_TRANSACTIONS);
      setTasks(INITIAL_TASKS);
      setGoals(INITIAL_GOALS);
      setBudgets(INITIAL_BUDGETS);
      setSchedule([]);
      setCategories(INITIAL_CATEGORIES);
      setSubscriptions(INITIAL_SUBSCRIPTIONS);
      setIsDarkMode(true);
    }
    
    setIsLoaded(true); // Data is ready
  }, [currentUser]);

  // 3. Save Data on Changes (Only if logged in and loaded)
  useEffect(() => {
    if (!currentUser || !isLoaded) return;

    const userStorageKey = `broke-mate-data-${currentUser.username.toLowerCase()}`;
    const dataToSave = {
      transactions,
      tasks,
      goals,
      budgets,
      schedule,
      categories,
      subscriptions,
      isDarkMode
    };

    localStorage.setItem(userStorageKey, JSON.stringify(dataToSave));
    
    // Notification
    setShowSaveNotification(true);
    const timer = setTimeout(() => setShowSaveNotification(false), 2000);
    return () => clearTimeout(timer);

  }, [transactions, tasks, goals, budgets, schedule, categories, subscriptions, isDarkMode, isLoaded, currentUser]);

  // Theme Effect
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Auth Handlers
  const handleRegister = (newUser: UserProfile) => {
    const updatedUsers = [...savedUsers, newUser];
    setSavedUsers(updatedUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    
    // Auto login
    setCurrentUser(newUser);
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoaded(false);
  };

  // Subscription Automation
  useEffect(() => {
    if (!currentUser || !isLoaded) return;

    const today = new Date().toISOString().split('T')[0];
    let newTransactions: Transaction[] = [];
    let updatedSubscriptions = [...subscriptions];
    let hasChanges = false;

    updatedSubscriptions = updatedSubscriptions.map(sub => {
      if (sub.status === 'active' && sub.nextPaymentDate <= today) {
        hasChanges = true;
        
        newTransactions.push({
          id: `sub-${sub.id}-${Date.now()}`,
          merchant: sub.name,
          amount: sub.amount,
          date: sub.nextPaymentDate,
          category: sub.category,
          type: sub.type,
          recurrence: sub.frequency
        });

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
  }, [subscriptions, isLoaded, currentUser]); 

  // Data Handlers
  const addTransaction = (t: Transaction) => setTransactions(prev => [...prev, t]);
  const removeTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const addGoal = (g: FinancialGoal) => setGoals(prev => [...prev, g]);
  const updateGoal = (updatedGoal: FinancialGoal) => setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  const addBudget = (b: Budget) => setBudgets(prev => { const filtered = prev.filter(item => item.category !== b.category); return [...filtered, b]; });
  const removeBudget = (id: string) => setBudgets(prev => prev.filter(b => b.id !== id));
  const addCategory = (category: string) => { if (!categories.includes(category)) setCategories(prev => [...prev, category]); };
  const removeCategory = (category: string) => setCategories(prev => prev.filter(c => c !== category));
  const addSubscription = (sub: Subscription) => setSubscriptions(prev => [...prev, sub]);
  const updateSubscription = (updatedSub: Subscription) => setSubscriptions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
  const removeSubscription = (id: string) => setSubscriptions(prev => prev.filter(s => s.id !== id));

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

  // --- RENDER LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <LoginScreen 
        savedUsers={savedUsers} 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
      />
    );
  }

  // --- RENDER DASHBOARD ---
  if (!isLoaded) {
    return <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">Loading {currentUser.username}'s Data...</p>
    </div>;
  }

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

        <div className="mt-auto space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
               <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                   {currentUser.username.charAt(0).toUpperCase()}
               </div>
               <div className="overflow-hidden">
                   <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{currentUser.username}</p>
                   <p className="text-xs text-slate-500">Pro Member</p>
               </div>
            </div>
            
            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
            </button>
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
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-slate-900 pt-20 px-4 flex flex-col transition-colors duration-300">
           <div className="space-y-2 flex-1">
             <NavItem tab={AppTab.FINANCE} icon={LayoutDashboard} label="Finance" />
             <NavItem tab={AppTab.TIME} icon={Clock} label="Time" />
             <NavItem tab={AppTab.INSIGHTS} icon={BrainCircuit} label="Insights" />
           </div>
           
           <div className="py-8 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                        {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium dark:text-white">{currentUser.username}</span>
                </div>
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 py-3 rounded-xl text-red-500"
                >
                    <LogOut className="w-4 h-4" /> Logout
                </button>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative pt-16 md:pt-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-white/0 to-white dark:from-indigo-900/20 dark:via-slate-950/0 dark:to-slate-950 pointer-events-none transition-colors duration-300"></div>
        
        {/* Auto-Save Indicator Notification */}
        <div className={`absolute top-20 right-4 md:top-4 md:right-4 z-50 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all duration-300 pointer-events-none ${showSaveNotification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Data Saved
        </div>

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
