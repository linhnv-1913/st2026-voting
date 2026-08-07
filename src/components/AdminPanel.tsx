import { useState, useEffect, type FormEvent } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, writeBatch } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { Config, Vote, Option, VoteAccessLink } from '../types';
import { getHubResultBarClass, normalizeHubOptions } from '../hubOptions';
import { calculateEndTime, DEFAULT_DURATION_MINUTES, isValidDurationMinutes } from '../poll-schedule';
import { normalizeVoteAccessLink, VOTE_ACCESS_CODES, VOTE_ACCESS_COLLECTION } from '../vote-access';
import { ensureVoteAccessLinks, getRemainingVotes } from '../vote-access-service';
import { ExternalLink, Loader2, Plus, Trash2, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { FestivalBrand, MatsuriShell } from './MatsuriShell';
import { TeamBuildingScoreEditor } from './team-building-score-editor';

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

  const handleLogin = async (e: FormEvent) => {
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
    return (
      <MatsuriShell>
        <section className="festival-card" aria-label="Đang tải trang quản trị">
          <FestivalBrand admin />
          <div className="festival-loading">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
            <span className="sr-only">Đang tải trang quản trị</span>
          </div>
        </section>
      </MatsuriShell>
    );
  }

  if (!user) {
    return (
      <MatsuriShell>
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="festival-card"
          aria-labelledby="admin-login-heading"
        >
          <FestivalBrand admin />
          <span className="festival-eyebrow">Khu vực quản trị</span>
          <h1 id="admin-login-heading" className="festival-title">Điều hành bình chọn</h1>
          <p className="festival-copy">Đăng nhập để thiết lập câu hỏi, mở bình chọn và theo dõi kết quả theo thời gian thực.</p>
          <form onSubmit={handleLogin} className="festival-form">
            {loginError && <p className="festival-alert" role="alert">{loginError}</p>}
            <label className="festival-field">
              <span className="festival-field__label">Tài khoản</span>
              <input
                type="text"
                required
                autoComplete="username"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="Nhập tài khoản quản trị"
                className="festival-input"
              />
            </label>
            <label className="festival-field">
              <span className="festival-field__label">Mật khẩu</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="festival-input"
              />
            </label>
            <button type="submit" className="festival-primary">
              Đăng nhập
            </button>
          </form>
        </motion.section>
      </MatsuriShell>
    );
  }

  if (!isAdmin) {
    return (
      <MatsuriShell>
        <section className="festival-card" aria-labelledby="no-access-heading">
          <FestivalBrand admin />
          <span className="festival-eyebrow">Quyền truy cập</span>
          <h1 id="no-access-heading" className="festival-title">Tài khoản chưa có quyền</h1>
          <p className="festival-copy">Bạn đang đăng nhập bằng {user.email}, nhưng tài khoản này chưa được cấp quyền quản trị.</p>
          <hr className="festival-divider" />
          <button type="button" onClick={handleClaimAdmin} className="festival-primary mb-3 w-full">
            Yêu cầu quyền quản trị
          </button>
          <button type="button" onClick={() => signOut(auth)} className="festival-secondary w-full">
            Đăng xuất
          </button>
        </section>
      </MatsuriShell>
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
  const [startTimeInput, setStartTimeInput] = useState('');
  const [durationMinutesInput, setDurationMinutesInput] = useState(String(DEFAULT_DURATION_MINUTES));
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingVotes, setIsResettingVotes] = useState(false);
  const [voteAccessLinks, setVoteAccessLinks] = useState<VoteAccessLink[]>([]);
  const [isSeedingVoteLinks, setIsSeedingVoteLinks] = useState(false);
  const [voteAccessError, setVoteAccessError] = useState('');

  const formatDateTimeLocal = (timestamp: number) => {
    const date = new Date(timestamp);
    const timezoneOffset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config', 'main'), (snap) => {
      if (snap.exists()) {
        const sourceData = snap.data() as Config;
        const data = {
          ...sourceData,
          options: normalizeHubOptions(sourceData.options || []),
          startTime: sourceData.startTime ?? null,
          durationMinutes: sourceData.durationMinutes ?? DEFAULT_DURATION_MINUTES,
        } as Config;
        setConfig(data);
        setQuestion(data.question);
        setOptions(data.options);
        setStartTimeInput(data.startTime != null ? formatDateTimeLocal(data.startTime) : '');
        setDurationMinutesInput(
          data.durationMinutes != null
            ? String(data.durationMinutes)
            : String(DEFAULT_DURATION_MINUTES),
        );
      }
      setLoading(false);
    });

    const unsubVotes = onSnapshot(collection(db, 'votes'), (snap) => {
      const vts: Vote[] = [];
      snap.forEach(d => vts.push({ id: d.id, ...d.data() } as Vote));
      setVotes(vts);
    });
    const unsubVoteAccessLinks = onSnapshot(collection(db, VOTE_ACCESS_COLLECTION), (snap) => {
      setVoteAccessLinks(
        snap.docs
          .map(document => normalizeVoteAccessLink(document.id, document.data()))
          .filter((link): link is VoteAccessLink => link !== null)
          .sort((left, right) => left.id.localeCompare(right.id)),
      );
    }, (error) => {
      console.error('Failed to load vote access links', error);
      setVoteAccessError('Chưa thể tải quota của 16 link vote.');
    });

    return () => {
      unsubConfig();
      unsubVotes();
      unsubVoteAccessLinks();
    };
  }, []);

  const handleSeedVoteLinks = async () => {
    setIsSeedingVoteLinks(true);
    setVoteAccessError('');
    try {
      const createdCount = await ensureVoteAccessLinks(db);
      alert(createdCount > 0
        ? `Đã lưu ${createdCount} mã vote còn thiếu vào DB.`
        : '16 mã vote đã có sẵn trong DB.');
    } catch (error) {
      console.error(error);
      setVoteAccessError('Không thể khởi tạo 16 mã. Hãy kiểm tra quyền admin và Firestore Rules.');
    } finally {
      setIsSeedingVoteLinks(false);
    }
  };

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

      const startTime = startTimeInput ? new Date(startTimeInput).getTime() : null;
      const durationMinutes = durationMinutesInput.trim()
        ? Number(durationMinutesInput)
        : null;
      if (startTimeInput && (startTime === null || Number.isNaN(startTime))) {
        alert('Thời điểm bắt đầu poll không hợp lệ.');
        return;
      }
      if (durationMinutes === null || !isValidDurationMinutes(durationMinutes)) {
        alert('Thời lượng mở vote phải là số phút nguyên dương.');
        return;
      }
      if (isActive && startTime === null) {
        alert('Vui lòng nhập thời điểm bắt đầu poll.');
        return;
      }

      const endTime = startTime === null
        ? config?.endTime ?? null
        : calculateEndTime(startTime, durationMinutes);
      if (isActive && endTime !== null && endTime <= Date.now()) {
        alert('Thời điểm đóng phải ở tương lai khi bắt đầu poll.');
        return;
      }

      await setDoc(doc(db, 'config', 'main'), {
        question: question || 'Untitled Poll',
        options: filteredOptions,
        isActive,
        startTime,
        durationMinutes,
        endTime
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

  const handleResetVotes = async () => {
    if (config?.isActive) {
      alert('Vui lòng dừng poll trước khi xóa và đặt lại quota vote.');
      return;
    }
    if (!window.confirm('Xóa toàn bộ phiếu hiện có? Thao tác này không thể hoàn tác.')) return;

    setIsResettingVotes(true);
    try {
      const [voteSnapshot, claimSnapshot, voteAccessSnapshot] = await Promise.all([
        getDocs(collection(db, 'votes')),
        getDocs(collection(db, 'voter-claims')),
        getDocs(collection(db, VOTE_ACCESS_COLLECTION)),
      ]);
      const documentsToDelete = [
        ...voteSnapshot.docs,
        ...claimSnapshot.docs,
      ];
      for (let index = 0; index < documentsToDelete.length; index += 500) {
        const batch = writeBatch(db);
        documentsToDelete
          .slice(index, index + 500)
          .forEach(document => batch.delete(document.ref));
        await batch.commit();
      }
      for (let index = 0; index < voteAccessSnapshot.docs.length; index += 500) {
        const batch = writeBatch(db);
        voteAccessSnapshot.docs
          .slice(index, index + 500)
          .forEach(document => batch.update(document.ref, { voteCount: 0 }));
        await batch.commit();
      }
    } catch (error) {
      console.error(error);
      alert('Không thể xóa phiếu. Vui lòng thử lại.');
    } finally {
      setIsResettingVotes(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-700" aria-label="Đang tải dữ liệu quản trị" />
      </div>
    );
  }

  // Compute chart data
  const chartData = (config?.options || []).map(opt => {
    const count = votes.filter(v => v.optionIds?.includes(opt.id) || v.optionId === opt.id).length;
    return { name: opt.text, votes: count, id: opt.id };
  });

  const totalVotes = votes.length;
  const hasVotesToReset = votes.length > 0 || voteAccessLinks.some(link => link.voteCount > 0);
  const voteBasePath = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const getVoteAccessUrl = (code: string) => `${window.location.origin}${voteBasePath}${code}`;

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div>
          <FestivalBrand admin />
          <p className="admin-topbar__meta">Cập nhật trực tiếp • {totalVotes} lượt bình chọn</p>
        </div>
        <div className="admin-topbar__actions">
          <Link to="/results" target="_blank" rel="noreferrer" className="admin-results-link">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span>Màn hình kết quả</span>
          </Link>
          <Link to="/final-awards" target="_blank" rel="noreferrer" className="admin-results-link">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span>Trao giải chung cuộc</span>
          </Link>
          <button type="button" onClick={onSignOut} className="admin-signout" aria-label="Đăng xuất">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-grid">
          {/* Settings Panel */}
          <section className="admin-card">
            <h2 className="admin-section-title">Câu hỏi & thiết lập</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Câu hỏi bình chọn</label>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Nhập câu hỏi tại đây..."
                  className="festival-input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Thời điểm bắt đầu vote</label>
                <input
                  type="datetime-local"
                  value={startTimeInput}
                  onChange={event => setStartTimeInput(event.target.value)}
                  className="festival-input"
                />
                <p className="text-xs text-slate-400">Admin chọn thời điểm form bắt đầu nhận phiếu.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Thời lượng mở vote (phút)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={durationMinutesInput}
                  onChange={event => setDurationMinutesInput(event.target.value)}
                  className="festival-input"
                />
                <p className="text-xs text-slate-400">Thời điểm đóng được tính bằng thời điểm bắt đầu cộng số phút này.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Các phương án</label>
                <div className="space-y-3">
                  {options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={e => updateOption(opt.id, e.target.value)}
                        placeholder={`Phương án ${i + 1}`}
                        className="festival-input min-w-0 flex-1"
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
                    <Plus className="w-4 h-4 mr-1" /> Thêm phương án
                  </button>
                )}
              </div>

              <div className="admin-actions pt-6 border-t-2 border-slate-100">
                <button
                  onClick={handleResetVotes}
                  disabled={isSaving || isResettingVotes || !hasVotesToReset}
                  className="px-4 py-3 border-2 border-red-200 bg-red-50 text-red-700 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {isResettingVotes ? 'Đang xóa...' : 'Xóa phiếu'}
                </button>
                {config?.isActive ? (
                  <button
                    onClick={() => handleSaveConfig(false)}
                    disabled={isSaving}
                    className="px-6 py-3 border-2 border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 uppercase tracking-wide"
                  >
                    Dừng poll
                  </button>
                ) : (
                  <button
                    onClick={() => handleSaveConfig(true)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-50 shadow-md shadow-sky-500/30 uppercase tracking-wide"
                  >
                    Bắt đầu poll
                  </button>
                )}
                
                <button
                  onClick={() => handleSaveConfig(config?.isActive || false)}
                  disabled={isSaving}
                  className="px-8 py-3 bg-red-600 text-white rounded-xl text-sm font-black shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors disabled:opacity-50 uppercase tracking-wider"
                >
                  Lưu & công bố
                </button>
              </div>
            </div>
          </section>

          <section className="admin-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="admin-section-title">16 link bình chọn</h2>
                <p className="text-sm text-slate-500">
                  Mỗi link tối đa 10 lượt, tổng công suất là 160 lượt vote.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSeedVoteLinks}
                disabled={isSeedingVoteLinks}
                className="shrink-0 rounded-xl bg-sky-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-colors hover:bg-sky-600 disabled:opacity-50"
              >
                {isSeedingVoteLinks ? 'Đang lưu...' : 'Lưu 16 mã vào DB'}
              </button>
            </div>
            {voteAccessError && <p className="festival-alert mt-4" role="alert">{voteAccessError}</p>}
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {VOTE_ACCESS_CODES.map(code => {
                const accessLink = voteAccessLinks.find(link => link.id === code);
                const used = accessLink?.voteCount ?? 0;
                const max = accessLink?.maxVotes ?? 10;
                return (
                  <a
                    key={code}
                    href={getVoteAccessUrl(code)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:border-sky-300 hover:bg-sky-50"
                  >
                    <span className="block font-mono text-xs font-bold text-slate-700">{code}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {accessLink ? `${used}/${max} lượt đã dùng • còn ${getRemainingVotes(accessLink)}` : 'Chưa có trong DB'}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>

          {/* Results Panel */}
          <div className="admin-results-stack">
            <TeamBuildingScoreEditor />
            <section className="admin-card">
              <h2 className="admin-section-title">Kết quả hiện tại</h2>
              <div className="space-y-5">
                {chartData.map((data) => {
                  const percentage = totalVotes > 0 ? Math.round((data.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={data.id}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700">{data.name || 'Untitled'}</span>
                        <span className="font-black text-slate-900">{percentage}% <span className="text-slate-400 font-medium text-xs ml-1">({data.votes} lượt)</span></span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full results-bar ${getHubResultBarClass(data.name)}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="admin-card admin-stat">
              <div>
                <div className="admin-stat__number">{totalVotes}</div>
                <div className="admin-stat__label">Tổng lượt bình chọn</div>
                <div className={`mt-6 py-1.5 px-4 text-xs font-black rounded-full uppercase tracking-widest shadow-sm ${config?.isActive ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {config?.isActive ? '● Poll đang mở' : 'Poll đã đóng'}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
