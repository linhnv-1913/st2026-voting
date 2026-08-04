import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { getHubResultBarClass, getHubResultTextClass } from '../hubOptions';
import { rankFinalResults, type ResultScoreCandidate } from './results-scoring';

export type ChartResult = ResultScoreCandidate;

interface ResultsChartProps {
  data: ChartResult[];
  error: string;
  isFinal: boolean;
  totalVotes: number;
}

export function ResultsChart({ data, error, isFinal, totalVotes }: ResultsChartProps) {
  const reduceMotion = useReducedMotion();
  const maxVoteCount = Math.max(0, ...data.map(result => result.voteCount));
  const rankedResults = useMemo(() => rankFinalResults(data), [data]);

  return (
    <section
      className={`results-card results-card--chart ${isFinal ? 'results-card--final' : ''}`}
      aria-labelledby="live-results-heading"
    >
      <h1 id="live-results-heading" className="results-card__title">
        {isFinal ? 'Kết quả bình chọn chung cuộc' : 'Kết quả hiện tại'}
      </h1>
      {error ? <p className="festival-alert" role="alert">{error}</p> : data.length > 0 ? (
        <div className="results-columns">
          {data.map((result, index) => {
            const finalResult = rankedResults[index];
            const barHeight = maxVoteCount > 0
              ? (result.voteCount / maxVoteCount) * 100
              : 0;
            const revealDelay = finalResult.rank === null
              ? data.length * 0.12
              : (finalResult.rank - 1) * 0.16;
            const resultLabel = result.text || `Phương án ${index + 1}`;
            const finalAnnouncement = isFinal
              ? finalResult.rank === null
                ? ', chưa có thứ hạng, cộng 0 điểm'
                : `, hạng ${finalResult.rank}, cộng ${finalResult.points} điểm`
              : '';

            return (
              <div className={`results-column ${getHubResultTextClass(result.text)}`} key={result.id}>
                <strong className="results-column__count">{result.voteCount}<small>lượt</small></strong>
                <div className="results-column__track-frame">
                  <div
                    className="results-column__track"
                    role="progressbar"
                    aria-label={`${resultLabel}: ${result.voteCount} lượt${finalAnnouncement}`}
                    aria-valuemin={0}
                    aria-valuemax={Math.max(totalVotes, 1)}
                    aria-valuenow={result.voteCount}
                  >
                    <motion.div
                      initial={reduceMotion ? false : { height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.55, ease: 'easeOut' }}
                      className={`results-bar ${getHubResultBarClass(result.text)}`}
                    />
                  </div>
                  {isFinal && (
                    <div
                      className="results-score-reveal-anchor"
                      style={{ bottom: `calc(${barHeight}% + 10px)` }}
                    >
                      <motion.span
                        key={`${result.id}-${finalResult.points}`}
                        className={`results-score-reveal ${finalResult.points === 0 ? 'results-score-reveal--zero' : ''}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.72 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={reduceMotion
                          ? { duration: 0 }
                          : { delay: revealDelay, duration: 0.46, type: 'spring', bounce: 0.34 }}
                        aria-hidden="true"
                      >
                        +{finalResult.points}<small>điểm</small>
                      </motion.span>
                    </div>
                  )}
                </div>
                <span className="results-column__label">{resultLabel}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="results-empty">Chưa có phương án bình chọn để hiển thị.</p>
      )}
    </section>
  );
}
