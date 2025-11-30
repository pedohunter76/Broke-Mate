
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { UserPlus, LogIn, Lock, User, Check, X, ShieldCheck, Wallet } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
  savedUsers: UserProfile[];
  onRegister: (user: UserProfile) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, savedUsers, onRegister }) => {
  const [view, setView] = useState<'list' | 'login' | 'register'>('list');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Login State
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');

  // Register State
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    if (savedUsers.length === 0) {
      setView('register');
    } else {
      setView('list');
    }
  }, [savedUsers]);

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setError('');
    setPinInput('');
    setView('login');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser.pin && pinInput !== selectedUser.pin) {
      setError('Incorrect PIN');
      return;
    }

    onLogin(selectedUser);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError('Username is required');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    
    // Check duplicates
    if (savedUsers.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
        setError('Username already exists');
        return;
    }

    const newUser: UserProfile = {
      id: Date.now().toString(),
      username: newUsername.trim(),
      pin: newPin || undefined,
      createdAt: new Date().toISOString()
    };

    onRegister(newUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
             <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-1">Broke Mate</h1>
          <p className="text-slate-400 text-sm">Secure Progress Saver</p>
        </div>

        {/* --- VIEW: LIST USERS --- */}
        {view === 'list' && (
          <div className="space-y-4">
            <h2 className="text-center text-slate-300 font-medium mb-4">Who is using Broke Mate?</h2>
            <div className="grid grid-cols-2 gap-4">
              {savedUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 transition-all p-4 rounded-xl flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 bg-slate-700 group-hover:bg-indigo-500/20 rounded-full flex items-center justify-center transition-colors">
                    <User className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                  </div>
                  <span className="font-medium truncate w-full text-center">{user.username}</span>
                </button>
              ))}
              
              <button
                onClick={() => {
                    setError('');
                    setNewUsername('');
                    setNewPin('');
                    setConfirmPin('');
                    setView('register');
                }}
                className="bg-slate-800/50 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-500 transition-all p-4 rounded-xl flex flex-col items-center gap-2 group text-slate-500 hover:text-slate-300"
              >
                <div className="w-12 h-12 border-2 border-dashed border-slate-700 group-hover:border-slate-500 rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Add Profile</span>
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW: LOGIN --- */}
        {view === 'login' && selectedUser && (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="text-center">
               <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                   <User className="w-10 h-10 text-indigo-400" />
               </div>
               <h2 className="text-xl font-bold">{selectedUser.username}</h2>
               {selectedUser.pin ? <p className="text-xs text-slate-400">Enter PIN to unlock</p> : <p className="text-xs text-emerald-400">No PIN required</p>}
            </div>

            {selectedUser.pin && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">PIN Code</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="password" 
                            inputMode="numeric"
                            value={pinInput}
                            onChange={(e) => {
                                setPinInput(e.target.value);
                                setError('');
                            }}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-center tracking-widest font-bold text-lg"
                            placeholder="••••"
                            autoFocus
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> {error}
                </div>
            )}

            <div className="flex gap-3">
                <button 
                    type="button" 
                    onClick={() => {
                        setView('list');
                        setPinInput('');
                        setError('');
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-semibold transition-colors"
                >
                    Switch User
                </button>
                <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <LogIn className="w-4 h-4" /> Login
                </button>
            </div>
          </form>
        )}

        {/* --- VIEW: REGISTER --- */}
        {view === 'register' && (
           <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Create New Profile</h2>
                <p className="text-slate-400 text-sm">Your data will be securely saved to this profile.</p>
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        value={newUsername}
                        onChange={(e) => {
                            setNewUsername(e.target.value);
                            setError('');
                        }}
                        className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all"
                        placeholder="e.g. Juan"
                        required
                    />
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
                      <span>Secure PIN (Optional)</span>
                      {newPin && <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="password" 
                            inputMode="numeric"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all"
                            placeholder="PIN"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="password" 
                            inputMode="numeric"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all"
                            placeholder="Confirm"
                        />
                      </div>
                  </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {savedUsers.length > 0 && (
                    <button 
                        type="button" 
                        onClick={() => setView('list')}
                        className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-semibold transition-colors"
                    >
                        Back
                    </button>
                )}
                <button 
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Check className="w-4 h-4" /> Create Profile
                </button>
              </div>
           </form>
        )}

      </div>
      <p className="absolute bottom-4 text-slate-600 text-xs">Data stored locally on device</p>
    </div>
  );
};

export default LoginScreen;
