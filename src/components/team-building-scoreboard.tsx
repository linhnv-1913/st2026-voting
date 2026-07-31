import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, Radio, TriangleAlert } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { db } from '../firebase';
import {
  createEmptyTeamBuildingScores,
  HUB_DEFINITIONS,
  normalizeTeamBuildingScores,
} from '../hubOptions';
import type { TeamBuildingScoreDocument, TeamBuildingScores } from '../types';
import { FestivalBrand, MatsuriShell } from './MatsuriShell';
import './team-building-scoreboard.css';

type ScoreboardStatus = 'loading' | 'ready' | 'error';

type ScoreboardState = {
  status: ScoreboardStatus;
  scores: TeamBuildingScores;
  message: string;
};

const INITIAL_STATE: ScoreboardState = {
  status: 'loading',
  scores: createEmptyTeamBuildingScores(),
  message: '',
};

export function TeamBuildingScoreboard() {
  const [state, setState] = useState(INITIAL_STATE);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'team-building', 'scores'),
      snapshot => {
        if (!snapshot.exists()) {
          setState({
            status: 'ready',
            scores: createEmptyTeamBuildingScores(),
            message: '',
          });
          return;
        }

        const data = snapshot.data() as Partial<TeamBuildingScoreDocument> | undefined;
        setState({
          status: 'ready',
          scores: normalizeTeamBuildingScores(data?.scores),
          message: '',
        });
      },
      error => {
        console.error('Failed to subscribe to team building scoreboard', error);
        setState(current => ({
          ...current,
          status: 'error',
          message: 'Không thể đồng bộ bảng điểm lúc này. Vui lòng thử lại sau.',
        }));
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const isLoading = state.status === 'loading';
  const isError = state.status === 'error';

  return (
    <MatsuriShell contentClassName="team-building-scoreboard-stage">
      <section
        className="festival-card team-building-scoreboard"
        aria-labelledby="team-building-scoreboard-heading"
      >
        <header className="team-building-scoreboard__header">
          <div>
            <FestivalBrand />
            <span className="festival-eyebrow">Bảng điểm Team building</span>
            <h1
              id="team-building-scoreboard-heading"
              className="festival-title team-building-scoreboard__title"
            >
              Bảng điểm các Hub theo thời gian thực
            </h1>
            <p className="festival-copy team-building-scoreboard__copy">
              Màn hình công khai dành cho sân khấu và khu vực trình chiếu.
            </p>
          </div>
          <p className="team-building-scoreboard__live-note">
            <Radio className="h-4 w-4" aria-hidden="true" />
            Tự động cập nhật khi có điểm mới
          </p>
        </header>

        <div
          className={`team-building-scoreboard__status ${isError ? 'team-building-scoreboard__status--error' : ''}`}
          role={isError ? 'alert' : 'status'}
          aria-live="polite"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>Đang đồng bộ bảng điểm...</span>
            </>
          ) : isError ? (
            <>
              <TriangleAlert className="h-5 w-5" aria-hidden="true" />
              <span>{state.message}</span>
            </>
          ) : (
            <>
              <Radio className="h-5 w-5" aria-hidden="true" />
              <span>Bảng điểm đang kết nối ổn định.</span>
            </>
          )}
        </div>

        <div className="team-building-scoreboard__grid" aria-live="polite">
          {HUB_DEFINITIONS.map((hub, index) => {
            const value = state.scores[hub.id];

            return (
              <motion.article
                key={hub.id}
                className={`team-building-scoreboard__tile team-building-scoreboard__tile--${hub.id}`}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.42, delay: index * 0.06 }}
              >
                <span className="team-building-scoreboard__label">{hub.label}</span>
                <strong className="team-building-scoreboard__value">
                  <motion.span
                    key={`${hub.id}-${value}`}
                    className="team-building-scoreboard__value-text"
                    initial={reduceMotion ? false : { opacity: 0.3, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: 'easeOut' }}
                  >
                    {value.toLocaleString('vi-VN')}
                  </motion.span>
                </strong>
                <span className="team-building-scoreboard__meta">Tổng điểm Hub {hub.number}</span>
              </motion.article>
            );
          })}
        </div>
      </section>
    </MatsuriShell>
  );
}
