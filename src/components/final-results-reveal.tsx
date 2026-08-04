import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export interface RevealCandidate {
  id: string;
  text: string;
  voteCount: number;
}

export interface FinalRevealResult {
  kind: 'winner' | 'tie' | 'zero';
  headline: string;
  detail: string;
}

interface FinalResultsRevealProps {
  result: FinalRevealResult;
}

export function createFinalRevealResult(results: RevealCandidate[]): FinalRevealResult {
  const maxVoteCount = Math.max(0, ...results.map(result => result.voteCount));

  if (maxVoteCount === 0) {
    return {
      kind: 'zero',
      headline: 'Chưa có phiếu bầu nào được ghi nhận',
      detail: 'Không có đội nhận điểm vote trong vòng này.',
    };
  }

  const leaders = results.filter(result => result.voteCount === maxVoteCount);
  if (leaders.length === 1) {
    return {
      kind: 'winner',
      headline: `${leaders[0].text || 'Phương án ẩn danh'} dẫn đầu bình chọn`,
      detail: `${leaders[0].voteCount} lượt chọn — nhận điểm vote hạng 1.`,
    };
  }

  return {
    kind: 'tie',
    headline: `Đồng hạng: ${leaders.map(result => result.text || 'Phương án ẩn danh').join(' / ')}`,
    detail: `${maxVoteCount} lượt chọn cho mỗi phương án dẫn đầu.`,
  };
}

export function FinalResultsReveal({ result }: FinalResultsRevealProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return (
    <motion.section
      className={`results-final-reveal results-final-reveal--${result.kind}`}
      role="status"
      aria-live="polite"
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }}
    >
      <span className="results-final-reveal__eyebrow">Kết quả bình chọn</span>
      <strong className="results-final-reveal__headline">{result.headline}</strong>
      <p className="results-final-reveal__detail">{result.detail}</p>
    </motion.section>
  );
}
