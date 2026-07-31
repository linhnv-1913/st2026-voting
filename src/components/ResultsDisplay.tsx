import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ExternalLink, Loader2, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import type { Config, Vote } from '../types';
import { getHubResultBarClass, getHubResultTextClass, normalizeHubOptions } from '../hubOptions';
import { FestivalBrand } from './MatsuriShell';

type AccessState = 'checking' | 'allowed' | 'denied';

export function ResultsDisplay() {
  const [accessState, setAccessState] = useState<AccessState>('checking');
  const [config, setConfig] = useState<Config | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

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
        setConfig(snapshot.exists()
          ? { id: snapshot.id, ...snapshot.data(), options: normalizeHubOptions(snapshot.data().options || []) } as Config
          : null);
        setDataLoading(false);
      },
      error => {
        console.error('Failed to load poll configuration', error);
        setDataError('Không thể tải cấu hình bình chọn.');
        setDataLoading(false);
      },
    );

    const unsubscribeVotes = onSnapshot(
      collection(db, 'votes'),
      snapshot => {
        setVotes(snapshot.docs.map(vote => ({ id: vote.id, ...vote.data() } as Vote)));
        setDataLoading(false);
      },
      error => {
        console.error('Failed to load vote results', error);
        setDataError('Không thể tải kết quả bình chọn.');
        setDataLoading(false);
      },
    );

    return () => {
      unsubscribeConfig();
      unsubscribeVotes();
    };
  }, [accessState]);

  if (accessState === 'checking' || dataLoading && accessState === 'allowed') {
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
          <Link to="/admin" className="festival-primary results-access-card__action">
            Đi đến trang quản trị
          </Link>
        </section>
      </main>
    );
  }

  const totalVotes = votes.length;
  const isExpired = !!config?.endTime && Date.now() > config.endTime;
  const isLive = !!config?.isActive && !isExpired;
  const chartData = (config?.options || []).map(option => {
    const voteCount = votes.filter(vote => vote.optionIds?.includes(option.id) || vote.optionId === option.id).length;
    return { ...option, voteCount };
  });
  const maxVoteCount = Math.max(0, ...chartData.map(result => result.voteCount));

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
        <section className="results-card results-card--chart" aria-labelledby="live-results-heading">
          <h1 id="live-results-heading" className="results-card__title">Kết quả hiện tại</h1>

          {dataError ? (
            <p className="festival-alert" role="alert">{dataError}</p>
          ) : chartData.length > 0 ? (
            <div className="results-columns">
              {chartData.map((result, index) => (
                <div className={`results-column ${getHubResultTextClass(result.text)}`} key={result.id}>
                  <strong className="results-column__count">
                    {result.voteCount}
                    <small>lượt</small>
                  </strong>
                  <div
                    className="results-column__track"
                    role="progressbar"
                    aria-label={`${result.text}: ${result.voteCount} lượt`}
                    aria-valuemin={0}
                    aria-valuemax={Math.max(totalVotes, 1)}
                    aria-valuenow={result.voteCount}
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${maxVoteCount > 0 ? (result.voteCount / maxVoteCount) * 100 : 0}%` }}
                      transition={{ duration: 0.55, ease: 'easeOut' }}
                      className={`results-bar ${getHubResultBarClass(result.text)}`}
                    />
                  </div>
                  <span className="results-column__label">{result.text || `Phương án ${index + 1}`}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="results-empty">Chưa có phương án bình chọn để hiển thị.</p>
          )}
        </section>

        <section className="results-card results-card--summary" aria-label="Tổng lượt bình chọn">
          <strong className="results-total">{totalVotes}</strong>
          <span className="results-total__label">Tổng lượt bình chọn</span>
          <span className={`results-poll-status ${isLive ? 'results-poll-status--live' : ''}`}>
            {isLive ? '● Poll đang mở' : 'Poll đã đóng'}
          </span>
        </section>
      </div>
    </main>
  );
}
