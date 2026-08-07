import type { RefObject } from 'react';
import { QrCode } from 'lucide-react';
import type { CountdownState } from '../countdown';
import { FinalResultsReveal, type FinalRevealResult } from './final-results-reveal';

interface ResultsSummaryProps {
  countdown: CountdownState;
  finalResult: FinalRevealResult | null;
  isLive: boolean;
  onOpenQr: () => void;
  qrTriggerRef: RefObject<HTMLButtonElement | null>;
  totalVotes: number;
}

export function ResultsSummary({
  countdown,
  finalResult,
  isLive,
  onOpenQr,
  qrTriggerRef,
  totalVotes,
}: ResultsSummaryProps) {
  return (
    <section className="results-card results-card--summary results-card--summary-enhanced" aria-label="Tổng lượt bình chọn">
      <div className="results-summary-stack">
        <div className="results-summary-stack__hero">
          <strong className="results-total">{totalVotes}</strong>
          <span className="results-total__label">Tổng lượt bình chọn</span>
          <span className={`results-poll-status ${isLive ? 'results-poll-status--live' : ''}`}>
            {isLive
              ? 'Poll đang mở'
              : countdown.isBeforeStart
                ? 'Poll chưa mở'
                : 'Poll đã đóng'}
          </span>
        </div>

        {countdown.hasDeadline ? (
          <section className={`results-countdown ${countdown.isExpired ? 'results-countdown--expired' : ''}`} aria-label={countdown.label}>
            <p className="results-countdown__label">
              {countdown.isBeforeStart
                ? 'Bắt đầu sau'
                : countdown.isExpired
                  ? 'Đã hết giờ bình chọn'
                  : 'Thời gian còn lại'}
            </p>
            <div className="results-countdown__grid">
              {countdown.parts.map(part => (
                <div key={part.label} className="results-countdown__tile">
                  <strong className="results-countdown__value">{part.value}</strong>
                  <span className="results-countdown__unit">{part.label}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="results-countdown--limitless" aria-label="Không đặt giờ đóng">
            <p className="results-countdown__label">Không giới hạn thời gian</p>
            <span className="results-countdown__hint">Đồng hồ sẽ hiển thị khi quản trị viên đặt thời gian đóng.</span>
          </section>
        )}

        <button ref={qrTriggerRef} type="button" className="results-qr-button" onClick={onOpenQr}>
          <QrCode className="h-5 w-5" aria-hidden="true" />
          Hiển thị mã QR bình chọn
        </button>

        {finalResult && <FinalResultsReveal result={finalResult} />}
      </div>
    </section>
  );
}
