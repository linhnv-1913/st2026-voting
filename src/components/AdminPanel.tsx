import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, query } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Config, Vote, Option } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Settings, Plus, Trash2, LogOut, Play, Square } from 'lucide-react';
import { motion } from 'motion/react';

export function AdminPanel() {
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          setIsAdmin(adminDoc.exists());
        } catch (e) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!usernameInput || !passwordInput) {
      setLoginError('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }
    
    // Map admin username to an email format required by Firebase
    const email = usernameInput === 'admin' ? 'admin@matsuri.com' : (usernameInput.includes('@') ? usernameInput : `${usernameInput}@matsuri.com`);
    
    try {
      await signInWithEmailAndPassword(auth, email, passwordInput);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        // Bootstrap the default admin account if it's the very first time
        if (usernameInput === 'admin' && passwordInput === 'Aa@123456') {
          try {
            const cred = await createUserWithEmailAndPassword(auth, email, passwordInput);
            await setDoc(doc(db, 'admins', cred.user.uid), { email });
            return;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              setLoginError('Sai mật khẩu!');
            } else {
              setLoginError('Đăng nhập thất bại: ' + (createErr.message || 'Lỗi không xác định'));
            }
          }
        } else {
          setLoginError('Sai tên đăng nhập hoặc mật khẩu!');
        }
      } else {
        setLoginError('Đăng nhập thất bại: ' + (err.message || 'Lỗi không xác định'));
      }
    }
  };

  const handleClaimAdmin = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'admins', user.uid), { email: user.email });
      setIsAdmin(true);
      alert('Admin claimed successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to claim admin. Only authorized users can claim admin.');
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-gradient-to-b from-sky-400 via-blue-500 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 5deg, white 5deg 10deg)' }}></div>
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-red-600 max-w-sm w-full text-center relative z-10">
          <h2 className="text-3xl font-black mb-6 text-red-700 uppercase tracking-wide">Matsuri Admin</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && <div className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded-lg border border-red-200">{loginError}</div>}
            <input 
              type="text" 
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              placeholder="Username" 
              className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium outline-none focus:border-red-500 focus:bg-white transition-colors"
            />
            <input 
              type="password" 
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="Password" 
              className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium outline-none focus:border-red-500 focus:bg-white transition-colors"
            />
            <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-red-950 font-black py-4 rounded-xl hover:from-amber-300 hover:to-amber-400 transition-colors shadow-lg shadow-amber-500/30 uppercase tracking-wide mt-2">
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-gradient-to-b from-sky-400 via-blue-500 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 5deg, white 5deg 10deg)' }}></div>
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-red-600 max-w-sm w-full text-center relative z-10">
          <h2 className="text-2xl font-black mb-4 text-red-700">Not Authorized</h2>
          <p className="text-slate-600 text-sm mb-6 font-medium">You are signed in as {user.email}, but you are not an admin.</p>
          <button onClick={handleClaimAdmin} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-md shadow-red-600/30 hover:bg-red-700 transition-colors mb-3 uppercase tracking-wide">
            Claim Admin Rights
          </button>
          <button onClick={() => signOut(auth)} className="w-full border-2 border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-wide">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onSignOut={() => signOut(auth)} />;
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<Option[]>([{ id: 'opt_1', text: '' }, { id: 'opt_2', text: '' }]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config', 'main'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Config;
        setConfig(data);
        setQuestion(data.question);
        setOptions(data.options);
      }
      setLoading(false);
    });

    const unsubVotes = onSnapshot(collection(db, 'votes'), (snap) => {
      const vts: Vote[] = [];
      snap.forEach(d => vts.push({ id: d.id, ...d.data() } as Vote));
      setVotes(vts);
    });

    return () => {
      unsubConfig();
      unsubVotes();
    };
  }, []);

  const handleSaveConfig = async (isActive: boolean) => {
    setIsSaving(true);
    try {
      const filteredOptions = options.filter(o => o.text.trim().length > 0);
      if (filteredOptions.length < 2) {
        alert('Please provide at least 2 options.');
        setIsSaving(false);
        return;
      }
      if (filteredOptions.length > 4) {
        alert('Maximum 4 options allowed.');
        setIsSaving(false);
        return;
      }

      await setDoc(doc(db, 'config', 'main'), {
        question: question || 'Untitled Poll',
        options: filteredOptions,
        isActive,
        endTime: null
      });
    } catch (e) {
      console.error(e);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const addOption = () => {
    if (options.length >= 4) return;
    setOptions([...options, { id: `opt_${Date.now()}`, text: '' }]);
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(o => o.id === id ? { ...o, text } : o));
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(o => o.id !== id));
  };

  if (loading) return <div className="flex p-12 items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  // Compute chart data
  const chartData = (config?.options || []).map(opt => {
    const count = votes.filter(v => v.optionId === opt.id).length;
    return { name: opt.text, votes: count, id: opt.id };
  });

  const totalVotes = votes.length;

  return (
    <div className="flex flex-col min-h-screen bg-blue-50 w-full relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 5deg, #0b4b8a 5deg 10deg)' }}></div>
      <header className="h-20 border-b-4 border-amber-400 bg-red-600 px-6 md:px-10 flex items-center justify-between shrink-0 relative z-10 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide uppercase">C3 Matsuri Admin</h1>
          <p className="text-xs text-red-100 font-medium">Real-time updates • {totalVotes} votes recorded</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onSignOut} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <div className="bg-white p-8 rounded-3xl shadow-lg shadow-blue-900/5 border-2 border-slate-100 order-2 lg:order-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-10 opacity-50"></div>
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-900">
              <span className="w-3 h-8 bg-red-600 rounded-full"></span>
              Question & Settings
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Enter your question here..."
                  className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-red-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Options</label>
                <div className="space-y-3">
                  {options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={e => updateOption(opt.id, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 p-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-red-500 focus:bg-white transition-colors"
                      />
                      <button
                        onClick={() => removeOption(opt.id)}
                        disabled={options.length <= 2}
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {options.length < 4 && (
                  <button
                    onClick={addOption}
                    className="mt-3 flex items-center text-sm font-bold text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </button>
                )}
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t-2 border-slate-100">
                {config?.isActive ? (
                  <button
                    onClick={() => handleSaveConfig(false)}
                    disabled={isSaving}
                    className="px-6 py-3 border-2 border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 uppercase tracking-wide"
                  >
                    Stop Poll
                  </button>
                ) : (
                  <button
                    onClick={() => handleSaveConfig(true)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-50 shadow-md shadow-sky-500/30 uppercase tracking-wide"
                  >
                    Start Poll
                  </button>
                )}
                
                <button
                  onClick={() => handleSaveConfig(config?.isActive || false)}
                  disabled={isSaving}
                  className="px-8 py-3 bg-red-600 text-white rounded-xl text-sm font-black shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors disabled:opacity-50 uppercase tracking-wider"
                >
                  Save & Publish
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-6 order-1 lg:order-2">
            <div className="bg-white p-8 rounded-3xl shadow-lg shadow-blue-900/5 border-2 border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -z-10 opacity-50"></div>
              <h3 className="text-sm font-black text-slate-400 mb-6 uppercase tracking-widest">Current Results</h3>
              <div className="space-y-5">
                {chartData.map((data, idx) => {
                  const percentage = totalVotes > 0 ? Math.round((data.votes / totalVotes) * 100) : 0;
                  const barColor = idx === 0 ? 'bg-red-600' : (idx === 1 ? 'bg-sky-500' : (idx === 2 ? 'bg-amber-400' : 'bg-blue-800'));
                  return (
                    <div key={data.id}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700">{data.name || 'Untitled'}</span>
                        <span className="font-black text-slate-900">{percentage}% <span className="text-slate-400 font-medium text-xs ml-1">({data.votes} votes)</span></span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full ${barColor}`} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg shadow-blue-900/5 border-2 border-slate-100 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full -z-10 opacity-50"></div>
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-50 rounded-full -z-10 opacity-50"></div>
              <div className="text-5xl font-black text-slate-900 tracking-tight">{totalVotes}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Total Votes</div>
              <div className={`mt-6 py-1.5 px-4 text-xs font-black rounded-full uppercase tracking-widest shadow-sm ${config?.isActive ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                {config?.isActive ? '● POLL IS LIVE' : 'POLL IS CLOSED'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
