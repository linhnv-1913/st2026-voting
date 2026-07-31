import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { voterAuth, voterDb } from '../firebase';
import { Config } from '../types';
import { getHubOptionClass, normalizeHubOptions } from '../hubOptions';
import { Clock3, Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { FestivalBrand, MatsuriShell } from './MatsuriShell';

function formatCountdown(endTime: number, now: number) {
  const totalSeconds = Math.max(0, Math.ceil((endTime - now) / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor(totalSeconds % 86_400 / 3_600);
  const minutes = Math.floor(totalSeconds % 3_600 / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');

  return days > 0 ? `${days} ngày ${clock}` : clock;
}

export function UserVote() {
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [user, setUser] = useState<User | null>(voterAuth.currentUser);
  const anonymousSignInPending = useRef(false);

  useEffect(() => onAuthStateChanged(voterAuth, currentUser => {
    if (currentUser) {
      setUser(currentUser);
      setSessionError('');
      setSessionLoading(false);
      anonymousSignInPending.current = false;
      return;
    }

    setUser(null);
    if (anonymousSignInPending.current) return;

    anonymousSignInPending.current = true;
    void signInAnonymously(voterAuth).catch(error => {
      console.error('Failed to initialize browser voting session', error);
      anonymousSignInPending.current = false;
      setSessionError(
        error?.code === 'auth/operation-not-allowed'
          ? 'Hệ thống chưa bật phiên bình chọn ẩn danh.'
          : 'Không thể khởi tạo phiên bình chọn trên trình duyệt này.',
      );
      setSessionLoading(false);
    });
  }), []);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(voterDb, 'config', 'main'), (docSnap) => {
      setConfig(docSnap.exists()
        ? { id: docSnap.id, ...docSnap.data(), options: normalizeHubOptions(docSnap.data().options || []) } as Config
        : null);
      setLoading(false);
    });

    return () => unsubConfig();
  }, []);

  useEffect(() => {
    if (!config?.endTime) return;

    setNow(Date.now());
    const timerId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= config.endTime!) window.clearInterval(timerId);
    }, 1_000);
    return () => window.clearInterval(timerId);
  }, [config?.endTime]);

  useEffect(() => {
    setSelectedOptions([]);
    setHasVoted(false);
    if (!user) return;

    const fetchMyVote = async () => {
      try {
        const voteDoc = await getDoc(doc(voterDb, 'votes', `vote_${user.uid}`));
        if (!voteDoc.exists()) return;

        const data = voteDoc.data();
        setSelectedOptions(data.optionIds || (data.optionId ? [data.optionId] : []));
        setHasVoted(true);
      } catch (error) {
        console.error('Failed to fetch vote', error);
      }
    };
    void fetchMyVote();
  }, [user]);

  const toggleOption = (id: string) => {
    if (submitting || hasVoted || (config?.endTime && Date.now() > config.endTime)) return;

    if (selectedOptions.includes(id)) {
      setSelectedOptions(selectedOptions.filter(optionId => optionId !== id));
    } else if (selectedOptions.length < 3) {
      setSelectedOptions([...selectedOptions, id]);
    }
  };

  const handleVote = async () => {
    if (
      !config?.isActive
      || !user
      || submitting
      || hasVoted
      || selectedOptions.length !== 3
      || (!!config.endTime && Date.now() > config.endTime)
    ) return;

    setSubmitting(true);
    try {
      await setDoc(doc(voterDb, 'votes', `vote_${user.uid}`), {
        optionIds: selectedOptions,
        userId: user.uid,
        timestamp: Date.now(),
      });
      setHasVoted(true);
    } catch (error) {
      console.error(error);
      alert('Không thể gửi phiếu. Poll có thể đã đóng hoặc bạn đã bỏ phiếu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || sessionLoading) {
    return (
      <MatsuriShell contentClassName="matsuri-stage--user">
        <section className="festival-card festival-card--user festival-card--compact" aria-label="Đang tải">
          <FestivalBrand />
          <div className="festival-loading">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
            <span className="sr-only">Đang tải dữ liệu bình chọn</span>
          </div>
        </section>
      </MatsuriShell>
    );
  }

  if (!user) {
    return (
      <MatsuriShell contentClassName="matsuri-stage--user">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="festival-card festival-card--user festival-card--compact"
          aria-labelledby="session-error-heading"
        >
          <FestivalBrand />
          <span className="festival-eyebrow">Phiên trình duyệt</span>
          <h1 id="session-error-heading" className="festival-title">Chưa thể bắt đầu bình chọn</h1>
          <p className="festival-copy">{sessionError || 'Không thể nhận diện trình duyệt hiện tại.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="festival-primary mt-6 w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Thử lại
          </button>
        </motion.section>
      </MatsuriShell>
    );
  }

  if (!config || !config.isActive) {
    return (
      <MatsuriShell contentClassName="matsuri-stage--user">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="festival-card festival-card--user festival-card--compact"
          aria-labelledby="waiting-heading"
        >
          <FestivalBrand />
          <span className="festival-eyebrow">Sân khấu đang chuẩn bị</span>
          <h1 id="waiting-heading" className="festival-title">Matsuri Break</h1>
          <p className="festival-copy">Hiện chưa có lượt bình chọn nào đang mở. Hãy quay lại khi quản trị viên bắt đầu chương trình nhé.</p>
        </motion.section>
      </MatsuriShell>
    );
  }

  const isExpired = !!config.endTime && now >= config.endTime;
  const countdown = config.endTime ? formatCountdown(config.endTime, now) : null;

  return (
    <MatsuriShell contentClassName="matsuri-stage--user">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="festival-card festival-card--user festival-card--vote"
        aria-labelledby="vote-heading"
      >
        <FestivalBrand />
        <div className="festival-card__topline">
          <span className={`festival-status ${isExpired ? 'festival-status--closed' : ''}`}>
            {isExpired ? 'Đã đóng' : 'Đang mở'}
          </span>
          <span className={`vote-countdown ${isExpired ? 'vote-countdown--expired' : ''}`} role="timer">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {isExpired ? (
              <strong>Hết thời gian</strong>
            ) : countdown ? (
              <>
                <span>Còn</span>
                <strong>{countdown}</strong>
              </>
            ) : (
              <strong>Không giới hạn</strong>
            )}
          </span>
        </div>
        <h1 id="vote-heading" className="festival-title">{config.question}</h1>

        <div className="vote-progress" aria-live="polite">
          <span id="vote-options-label">Danh sách lựa chọn</span>
          <strong>{selectedOptions.length}/3 đã chọn</strong>
        </div>
        <div
          className="vote-options"
          role="group"
          aria-labelledby="vote-options-label"
        >
          {config.options.map(option => {
            const isSelected = selectedOptions.includes(option.id);
            const isDisabled = submitting || isExpired || hasVoted || (selectedOptions.length >= 3 && !isSelected);
            return (
              <button
                key={option.id}
                type="button"
                disabled={isDisabled}
                aria-pressed={isSelected}
                onClick={() => toggleOption(option.id)}
                className={`vote-option ${getHubOptionClass(option.text)} ${isSelected ? 'vote-option--selected' : ''} ${isDisabled && !isSelected ? 'vote-option--disabled' : ''}`}
              >
                <span className="vote-option__check" aria-hidden="true" />
                <span className="vote-option__text">{option.text}</span>
              </button>
            );
          })}
        </div>
        <div className="vote-submit-dock">
          <button
            type="button"
            disabled={hasVoted || isExpired || selectedOptions.length !== 3 || submitting}
            onClick={handleVote}
            className={`festival-primary vote-submit ${hasVoted ? 'festival-primary--success' : selectedOptions.length === 3 && !isExpired ? '' : 'festival-primary--muted'}`}
          >
            {hasVoted ? 'Đã ghi nhận phiếu' : isExpired ? 'Đã đóng bình chọn' : submitting ? 'Đang gửi...' : `Bình chọn (${selectedOptions.length}/3)`}
          </button>
        </div>
      </motion.section>
    </MatsuriShell>
  );
}
