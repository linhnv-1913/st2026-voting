import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { ExternalLink, Loader2, Radio } from 'lucide-react';
import { auth, db } from '../firebase';
import { getCountdownState } from '../countdown';
import type { Config, Vote } from '../types';
import { normalizeHubOptions } from '../hubOptions';
import { createFinalRevealResult } from './final-results-reveal';
import { FestivalBrand } from './MatsuriShell';
import { ResultsChart } from './results-chart';
import { ResultsQrDialog } from './results-qr-dialog';
import { ResultsSummary } from './results-summary';
import './results-experience.css';

type AccessState = 'checking' | 'allowed' | 'denied';

export function ResultsDisplay() {
  const [accessState, setAccessState] = useState<AccessState>('checking');
  const [config, setConfig] = useState<Config | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [votesLoaded, setVotesLoaded] = useState(false);
  const [dataError, setDataError] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const closeAttemptRef = useRef<string | null>(null);
  const qrTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => auth.onAuthStateChanged(async currentUser => {
    if (!currentUser) {
      setAccessState('denied');
      return;
    }

    try {
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      setAccessState(adminDoc.exists() ? 'allowed' : 'denied');
    } catch (error) {
      console.error('Failed to verify admin access', error);
      setAccessState('denied');
    }
  }), []);

  useEffect(() => {
    if (accessState !== 'allowed') return;

    const unsubscribeConfig = onSnapshot(
      doc(db, 'config', 'main'),
      snapshot => {
        const data = snapshot.data();
        setConfig(snapshot.exists()
          ? { id: snapshot.id, ...data, options: normalizeHubOptions(data?.options || []) } as Config
          : null);
        setConfigLoaded(true);
        setNow(Date.now());
      },
      error => {
        console.error('Failed to load poll configuration', error);
        setDataError('Không thể tải cấu hình bình chọn.');
        setConfigLoaded(true);
      },
    );

    const unsubscribeVotes = onSnapshot(
      collection(db, 'votes'),
      snapshot => {
        setVotes(snapshot.docs.map(vote => ({ id: vote.id, ...vote.data() } as Vote)));
        setVotesLoaded(true);
      },
      error => {
        console.error('Failed to load vote results', error);
        setDataError('Không thể tải kết quả bình chọn.');
        setVotesLoaded(true);
      },
    );

    return () => {
      unsubscribeConfig();
      unsubscribeVotes();
    };
  }, [accessState]);

  useEffect(() => {
    if (!config?.endTime) return;

    setNow(Date.now());
    if (config.endTime <= Date.now()) return;

    const timerId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= config.endTime!) window.clearInterval(timerId);
    }, 1_000);

    return () => window.clearInterval(timerId);
  }, [config?.endTime]);

  const countdown = getCountdownState(config?.endTime, now);
  const chartData = useMemo(() => (config?.options || []).map(option => ({
    ...option,
    voteCount: votes.filter(vote => vote.optionIds?.includes(option.id) || vote.optionId === option.id).length,
  })), [config?.options, votes]);
  const finalResult = useMemo(() => (
    countdown.isExpired && configLoaded && votesLoaded
      ? createFinalRevealResult(chartData)
      : null
  ), [chartData, configLoaded, countdown.isExpired, votesLoaded]);

  useEffect(() => {
    if (!config?.isActive || !countdown.isExpired) return;

    const attemptKey = `${config.id}:${config.endTime ?? 'none'}`;
    if (closeAttemptRef.current === attemptKey) return;

    closeAttemptRef.current = attemptKey;
    void setDoc(doc(db, 'config', 'main'), { isActive: false }, { merge: true }).catch(error => {
      console.error('Failed to persist closed poll state', error);
      closeAttemptRef.current = null;
    });
  }, [config, countdown.isExpired]);

  if (accessState === 'checking' || accessState === 'allowed' && (!configLoaded || !votesLoaded)) {
    return (
      <main className="results-screen results-screen--centered">
        <div className="results-loading">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          <span>Đang tải kết quả trực tiếp...</span>
        </div>
      </main>
    );
  }

  if (accessState === 'denied') {
    return (
      <main className="results-screen results-screen--centered">
        <section className="results-access-card">
          <FestivalBrand admin />
          <span className="festival-eyebrow">Màn hình kết quả</span>
          <h1 className="festival-title">Cần quyền quản trị</h1>
          <p className="festival-copy">Hãy đăng nhập trang quản trị trước khi mở màn hình kết quả độc lập.</p>
          <Link to="/admin" className="festival-primary results-access-card__action">Đi đến trang quản trị</Link>
        </section>
      </main>
    );
  }

  const totalVotes = votes.length;
  const isLive = !!config?.isActive && !countdown.isExpired;

  return (
    <main className="results-screen">
      <header className="results-screen__header">
        <div>
          <FestivalBrand />
          <p className="results-screen__live-note">
            <Radio className="h-4 w-4" aria-hidden="true" />
            Dữ liệu cập nhật tự động
          </p>
        </div>
        <Link to="/admin" className="results-screen__admin-link">
          <span>Quản trị</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <div className="results-screen__content" aria-live="polite">
        <ResultsChart data={chartData} error={dataError} totalVotes={totalVotes} />
        <ResultsSummary
          countdown={countdown}
          finalResult={finalResult}
          isLive={isLive}
          onOpenQr={() => setQrOpen(true)}
          qrTriggerRef={qrTriggerRef}
          totalVotes={totalVotes}
        />
      </div>

      <ResultsQrDialog open={qrOpen} onClose={() => setQrOpen(false)} triggerRef={qrTriggerRef} />
    </main>
  );
}
