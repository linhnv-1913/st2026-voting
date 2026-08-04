import { motion, useReducedMotion } from 'motion/react';
import { HUB_DEFINITIONS } from '../hubOptions';
import type { FinalLeaderboardEntry } from './results-scoring';
import './final-awards-leaderboard.css';
import './final-awards-decorations.css';
import './final-awards-leaderboard-responsive.css';

interface FinalAwardsLeaderboardProps {
  entries: FinalLeaderboardEntry[] | null;
  error: string;
}

const numberFormatter = new Intl.NumberFormat('vi-VN');

export function FinalAwardsLeaderboard({ entries, error }: FinalAwardsLeaderboardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="final-awards" aria-labelledby="final-awards-heading">
      <p className="sr-only" role="status" aria-live="polite">
        Final awards
      </p>
      <header className="final-awards__header">
        <p>One spirit <span>•</span> One goal</p>
        <h1 id="final-awards-heading">
          <span>C3 MATSURI</span>
          <span>AWARD</span>
        </h1>
      </header>

      {error ? (
        <p className="final-awards__error" role="alert">{error}</p>
      ) : entries ? (
        <ol className="final-awards__podium" aria-label="Bảng xếp hạng tổng điểm">
          {entries.map((entry, index) => {
            const hub = HUB_DEFINITIONS.find((item) => item.id === entry.hubId)!;
            const rank = entry.finalRank;
            const rankClass = rank && rank <= 4 ? `rank-${rank}` : 'unranked';
            const rankLabel = rank ? `Hạng ${rank}` : 'Chưa xếp hạng';

            return (
              <motion.li
                key={entry.hubId}
                className={`final-awards__item final-awards__item--slot-${index + 1}`}
                initial={reduceMotion ? false : { opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : {
                  duration: 0.55,
                  delay: index * 0.11,
                  type: 'spring',
                  bounce: 0.22,
                }}
              >
                <article
                  className={`final-awards__panel final-awards__panel--${rankClass}`}
                  aria-label={`${entry.label}, ${rankLabel}, tổng ${numberFormatter.format(entry.totalScore)} điểm; Team Building ${numberFormatter.format(entry.teamBuildingScore)}, điểm vote ${entry.votePoints}`}
                >
                  <div className="final-awards__medal" aria-hidden="true">
                    <strong>{rank ?? '—'}</strong>
                  </div>
                  <div className="final-awards__artwork">
                    <img
                      src={`${import.meta.env.BASE_URL}${hub.artwork}`}
                      alt={hub.artworkAlt}
                      width="1800"
                      height="1200"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  <div className="final-awards__score-plate">
                    <span>Tổng điểm</span>
                    <strong>{numberFormatter.format(entry.totalScore)}</strong>
                  </div>
                </article>
              </motion.li>
            );
          })}
        </ol>
      ) : (
        <p className="final-awards__error" role="status">Đang tổng hợp điểm chung cuộc...</p>
      )}

      {!error && entries?.some((entry) => entry.finalRank !== null) && (
        <p className="final-awards__ribbon">Chúc mừng các đội đã xuất sắc vượt qua thử thách!</p>
      )}
    </section>
  );
}
