
import React, { useState } from 'react';
import { Task, TimeBlock, EnergyLevel } from '../types';
import { prioritizeTasksAI, suggestWorkflow, generateSmartSchedule } from '../services/geminiService';
import { CheckCircle2, Circle, Clock, MoreVertical, Sparkles, Calendar, Plus, CalendarDays, ListTodo, Zap, Ban, Play, BellOff, CalendarRange, Filter, Pencil, X, Save } from 'lucide-react';

interface TimeManagerProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  schedule: TimeBlock[];
  setSchedule: (blocks: TimeBlock[]) => void;
}

const TimeManager: React.FC<TimeManagerProps> = ({ tasks, setTasks, schedule, setSchedule }) => {
  const [activeView, setActiveView] = useState<'list' | 'schedule' | 'calendar'>('list');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowTip, setWorkflowTip] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Task Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  
  // Schedule Config
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('Medium');
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Edit Block State
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editType, setEditType] = useState<TimeBlock['type']>('focus');

  // --- Logic for Task List View ---
  const handlePrioritize = async () => {
    setIsProcessing(true);
    try {
      const prioritized = await prioritizeTasksAI(tasks);
      setTasks(prioritized);
      
      const tip = await suggestWorkflow(prioritized);
      setWorkflowTip(tip);
    } catch (error) {
      console.error(error);
      alert("AI failed to prioritize tasks.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleStatus = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t
    ));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      priority: 'Medium',
      status: 'todo',
      estimatedTime: '1h'
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  // --- Logic for Schedule View ---
  const handleGenerateSchedule = async () => {
    setIsProcessing(true);
    try {
      const newSchedule = await generateSmartSchedule(
        tasks, 
        { start: workStart, end: workEnd, energy: energyLevel }
      );
      setSchedule(newSchedule);
      // Auto switch to calendar view for better visualization if desired, or stay on schedule
      // setActiveView('calendar'); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (block: TimeBlock) => {
    setEditingBlock(block);
    setEditTitle(block.title);
    setEditStartTime(block.startTime);
    setEditEndTime(block.endTime);
    setEditType(block.type);
  };

  const saveBlock = () => {
    if (!editingBlock) return;

    if (editStartTime >= editEndTime) {
        alert("End time must be after start time");
        return;
    }

    const updatedBlocks = schedule.map(b => 
        b.id === editingBlock.id 
            ? { ...b, title: editTitle, startTime: editStartTime, endTime: editEndTime, type: editType }
            : b
    );

    // Re-sort blocks by start time
    updatedBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));

    setSchedule(updatedBlocks);
    setEditingBlock(null);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Low': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-500';
    }
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'focus': return 'bg-indigo-100 dark:bg-indigo-600/20 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-200';
      case 'meeting': return 'bg-amber-100 dark:bg-amber-600/20 border-amber-200 dark:border-amber-500/50 text-amber-700 dark:text-amber-200';
      case 'break': return 'bg-emerald-100 dark:bg-emerald-600/20 border-emerald-200 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-200';
      case 'admin': return 'bg-slate-100 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600/50 text-slate-700 dark:text-slate-300';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const timeToMinutes = (time: string) => {
    if (!time || !time.includes(':')) return 0;
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Filter tasks based on selected status
  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  return (
    <div className={`h-full overflow-y-auto p-4 md:p-8 space-y-8 relative transition-all duration-700 ${isFocusMode ? 'bg-black/90' : ''}`}>
      
      {/* Focus Mode Overlay */}
      {isFocusMode && (
        <div className="absolute top-4 right-4 z-50 animate-pulse flex items-center gap-2 bg-red-900/50 text-red-200 px-3 py-1 rounded-full border border-red-500/30">
          <BellOff className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Focus Mode Active</span>
        </div>
      )}

      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isFocusMode ? 'opacity-20 hover:opacity-100 transition-opacity' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
             {activeView === 'list' && 'Task List'}
             {activeView === 'schedule' && 'Smart Schedule'}
             {activeView === 'calendar' && 'Calendar View'}
             {activeView === 'schedule' && <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded text-white align-middle">Beta</span>}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Optimize your workflow with AI-driven insights.</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
           <button 
             onClick={() => setActiveView('list')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'list' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
           >
             <ListTodo className="w-4 h-4" /> Tasks
           </button>
           <button 
             onClick={() => setActiveView('schedule')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'schedule' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
           >
             <CalendarDays className="w-4 h-4" /> List
           </button>
           <button 
             onClick={() => setActiveView('calendar')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'calendar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
           >
             <CalendarRange className="w-4 h-4" /> Calendar
           </button>
        </div>
      </div>

      {activeView === 'list' && (
        // === LIST VIEW ===
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
             <div className="flex justify-end mb-4">
                <button 
                onClick={handlePrioritize}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                {isProcessing ? <Sparkles className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />}
                AI Auto-Prioritize
                </button>
             </div>

            {/* AI Insight Box */}
            {workflowTip && (
                <div className="bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-xl flex items-start gap-4 mb-8">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h4 className="text-indigo-800 dark:text-indigo-200 font-medium mb-1">Gemini Workflow Suggestion</h4>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{workflowTip}</p>
                </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Task List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Your Tasks</h3>
                        <div className="relative">
                            <Filter className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-xs rounded-lg pl-6 pr-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <option value="all">All Status</option>
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                    </div>
                    <span className="text-sm text-slate-500">{tasks.filter(t => t.status === 'done').length}/{tasks.length} Completed</span>
                </div>

                <div className="flex gap-2 mb-6">
                    <input 
                    type="text" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    placeholder="Add a new task..." 
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button 
                    onClick={addTask}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white p-2 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    >
                    <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-3">
                    {filteredTasks.length === 0 && (
                        <p className="text-center text-slate-500 py-10">
                            {tasks.length === 0 ? "No tasks. Add one or ask AI to help plan!" : "No tasks match current filter."}
                        </p>
                    )}
                    {filteredTasks.map((task) => (
                    <div key={task.id} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl transition-all">
                        <div className="flex items-center gap-4">
                        <button onClick={() => toggleStatus(task.id)} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                            {task.status === 'done' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6" />}
                        </button>
                        <div>
                            <p className={`font-medium ${task.status === 'done' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{task.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className={`px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 capitalize`}>
                                {task.status}
                            </span>
                            {task.dueDate && (
                                <span className="flex items-center gap-1 text-slate-500">
                                <Calendar className="w-3 h-3" /> {task.dueDate}
                                </span>
                            )}
                            </div>
                        </div>
                        </div>
                        <div className="text-slate-500 text-sm flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.estimatedTime}
                        </span>
                        <button className="hover:text-slate-900 dark:hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                        </div>
                    </div>
                    ))}
                </div>
                </div>

                {/* Mini Calendar / Schedule Viz */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl h-fit transition-colors">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Today's Focus</h3>
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-6 py-2">
                    {tasks.filter(t => t.status !== 'done').slice(0, 5).map((task, idx) => (
                    <div key={task.id} className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500"></div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{idx === 0 ? 'Now' : 'Upcoming'}</p>
                        <p className="text-slate-900 dark:text-white font-medium">{task.title}</p>
                    </div>
                    ))}
                    {tasks.filter(t => t.status !== 'done').length === 0 && (
                        <p className="text-slate-500">All caught up! 🎉</p>
                    )}
                </div>
                </div>
            </div>
        </div>
      )}

      {activeView === 'schedule' && (
        // === SCHEDULE LIST VIEW ===
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Configuration Panel */}
            <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl h-fit transition-colors ${isFocusMode ? 'opacity-20 pointer-events-none' : ''}`}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Setup Your Day</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Work Hours</label>
                        <div className="flex items-center gap-2">
                            <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white text-sm w-full focus:outline-none focus:border-indigo-500"/>
                            <span className="text-slate-500">-</span>
                            <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white text-sm w-full focus:outline-none focus:border-indigo-500"/>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Current Energy Level</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Low', 'Medium', 'High'] as const).map(level => (
                                <button
                                    key={level}
                                    onClick={() => setEnergyLevel(level)}
                                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${energyLevel === level 
                                        ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' 
                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <Zap className={`w-3 h-3 ${level === 'High' ? 'fill-current' : ''}`} />
                                        {level}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerateSchedule}
                        disabled={isProcessing}
                        className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {isProcessing ? <Sparkles className="w-5 h-5 animate-spin" /> : <CalendarDays className="w-5 h-5" />}
                        Generate Plan
                    </button>
                </div>
            </div>

            {/* Timeline View */}
            <div className="lg:col-span-3 space-y-6">
                
                {/* Focus Mode Toggle */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isFocusMode ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            <Ban className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-slate-900 dark:text-white font-medium">Focus Mode</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Mutes UI distractions during 'Focus' blocks</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isFocusMode ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${isFocusMode ? 'translate-x-6' : ''}`}></div>
                    </button>
                </div>

                {/* Timeline */}
                <div className={`space-y-4 ${isFocusMode ? 'max-w-xl mx-auto' : ''}`}>
                    {schedule.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                             <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                             <p className="text-slate-500">No schedule generated yet.</p>
                             <p className="text-sm text-slate-600 dark:text-slate-500">Set your hours and energy level to start.</p>
                        </div>
                    )}
                    
                    {schedule.map((block, index) => {
                         const isFocusBlock = block.type === 'focus';
                         const opacityClass = isFocusMode && !isFocusBlock ? 'opacity-30 blur-sm grayscale' : 'opacity-100';
                         const scaleClass = isFocusMode && isFocusBlock ? 'scale-105 ring-2 ring-red-500/50' : '';

                         return (
                            <div key={block.id} className={`flex gap-4 transition-all duration-500 ${opacityClass} ${scaleClass}`}>
                                <div className="w-16 pt-2 text-right text-sm text-slate-500 font-mono">
                                    {block.startTime}
                                </div>
                                <div className={`flex-1 p-4 rounded-xl border border-transparent ${getBlockColor(block.type)} relative group`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-lg">{block.title}</h4>
                                        <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 border border-current px-2 py-0.5 rounded-full">
                                            {block.type}
                                        </span>
                                    </div>
                                    <p className="text-sm opacity-80 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> {block.suggestionReason}
                                    </p>
                                    
                                    <div className="absolute right-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => openEditModal(block)}
                                            className="bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 p-2 rounded-full text-current"
                                            title="Edit Block"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        {block.type === 'focus' && (
                                            <button className="bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 p-2 rounded-full text-current">
                                                <Play className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                         );
                    })}
                </div>
            </div>
        </div>
      )}

      {activeView === 'calendar' && (
        // === CALENDAR VIEW ===
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-300 h-[calc(100%-80px)] flex flex-col transition-colors">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Daily Grid</h3>
                <span className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500/50 rounded-full"></div> Focus
                    <div className="w-3 h-3 bg-amber-500/50 rounded-full"></div> Meeting
                    <div className="w-3 h-3 bg-emerald-500/50 rounded-full"></div> Break
                </span>
            </div>
            
            <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 flex-1 overflow-y-auto custom-scrollbar">
                {/* 24h Grid - 80px height per hour */}
                <div className="relative min-h-[1920px]">
                    {Array.from({ length: 24 }).map((_, hour) => (
                        <div key={hour} className="absolute w-full border-b border-slate-200/50 dark:border-slate-800/30 flex items-start group" style={{ top: hour * 80, height: 80 }}>
                            <span className="w-16 text-right pr-4 text-xs text-slate-400 dark:text-slate-500 font-mono -mt-2.5 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                            <div className="flex-1 border-l border-slate-200/50 dark:border-slate-800/30 h-full"></div>
                        </div>
                    ))}

                    {schedule.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none">
                            <p>Generate a schedule to see it here</p>
                        </div>
                    )}

                    {/* Events */}
                    {schedule.map(block => {
                        const startMin = timeToMinutes(block.startTime);
                        let endMin = timeToMinutes(block.endTime);
                        
                        // Handle overnight blocks (end time next day)
                        if (endMin < startMin) {
                            endMin += 24 * 60;
                        }

                        // Calculate layout: 80px per 60min = 1.333px per min
                        const PIXELS_PER_MIN = 80 / 60;
                        const top = startMin * PIXELS_PER_MIN;
                        const height = Math.max((endMin - startMin) * PIXELS_PER_MIN, 28); // Min height ensures visibility

                        return (
                            <div 
                                key={block.id}
                                onClick={() => openEditModal(block)}
                                className={`absolute left-20 right-4 rounded-lg px-3 py-2 border overflow-hidden transition-all hover:z-10 hover:shadow-lg hover:brightness-110 cursor-pointer ${getBlockColor(block.type)}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                                title="Click to edit"
                            >
                                <div className="flex items-start justify-between gap-2 h-full">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-semibold text-xs truncate">{block.title}</span>
                                            {height > 40 && (
                                                <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 border border-current px-1.5 rounded-sm">
                                                    {block.type}
                                                </span>
                                            )}
                                        </div>
                                        {height > 50 && (
                                            <p className="text-[10px] opacity-70 line-clamp-2 leading-tight">{block.suggestionReason}</p>
                                        )}
                                    </div>
                                    <span className="text-[10px] opacity-90 font-mono bg-black/5 dark:bg-black/20 px-1.5 py-0.5 rounded whitespace-nowrap">
                                        {block.startTime} - {block.endTime}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* Edit Block Modal */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
                <button 
                    onClick={() => setEditingBlock(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Edit Time Block</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Title</label>
                        <input 
                            type="text" 
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Start Time</label>
                            <input 
                                type="time" 
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">End Time</label>
                            <input 
                                type="time" 
                                value={editEndTime}
                                onChange={(e) => setEditEndTime(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Type</label>
                        <select 
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as any)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="focus">Focus Work</option>
                            <option value="meeting">Meeting</option>
                            <option value="break">Break</option>
                            <option value="admin">Admin / Misc</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                        <button 
                            onClick={() => setEditingBlock(null)}
                            className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={saveBlock}
                            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default TimeManager;
