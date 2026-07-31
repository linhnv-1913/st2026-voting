import { motion } from 'motion/react';
import { getHubResultBarClass, getHubResultTextClass } from '../hubOptions';

export interface ChartResult {
  id: string;
  text: string;
  voteCount: number;
}

interface ResultsChartProps {
  data: ChartResult[];
  error: string;
  totalVotes: number;
}

export function ResultsChart({ data, error, totalVotes }: ResultsChartProps) {
  const maxVoteCount = Math.max(0, ...data.map(result => result.voteCount));

  return (
    <section className="results-card results-card--chart" aria-labelledby="live-results-heading">
      <h1 id="live-results-heading" className="results-card__title">Kết quả hiện tại</h1>
      {error ? <p className="festival-alert" role="alert">{error}</p> : data.length > 0 ? (
        <div className="results-columns">
          {data.map((result, index) => (
            <div className={`results-column ${getHubResultTextClass(result.text)}`} key={result.id}>
              <strong className="results-column__count">{result.voteCount}<small>lượt</small></strong>
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
  );
}
