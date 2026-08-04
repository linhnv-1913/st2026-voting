import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { createFinalRevealResult } from "./final-results-reveal";
import { FestivalBrand } from "./MatsuriShell";
import { ResultsChart } from "./results-chart";
import { ResultsQrDialog } from "./results-qr-dialog";
import { ResultsSummary } from "./results-summary";
import { useResultsAccess } from "./use-results-access";
import { useResultsData } from "./use-results-data";
import "./results-experience.css";

export function ResultsDisplay() {
  const accessState = useResultsAccess();
  const {
    chartData,
    config,
    countdown,
    dataError,
    isFinal,
    isLoading,
    totalVotes,
  } = useResultsData(accessState);
  const [qrOpen, setQrOpen] = useState(false);
  const qrTriggerRef = useRef<HTMLButtonElement>(null);
  const finalResult = useMemo(
    () => isFinal ? createFinalRevealResult(chartData) : null,
    [chartData, isFinal],
  );

  if (accessState === "checking" || isLoading) {
    return (
      <main className="results-screen results-screen--centered">
        <div className="results-loading">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          <span>Đang tải kết quả trực tiếp...</span>
        </div>
      </main>
    );
  }

  if (accessState === "denied") {
    return (
      <main className="results-screen results-screen--centered">
        <section className="results-access-card">
          <FestivalBrand admin />
          <span className="festival-eyebrow">Màn hình kết quả</span>
          <h1 className="festival-title">Cần quyền quản trị</h1>
          <p className="festival-copy">
            Hãy đăng nhập trang quản trị trước khi mở màn hình kết quả độc lập.
          </p>
          <Link to="/admin" className="festival-primary results-access-card__action">
            Đi đến trang quản trị
          </Link>
        </section>
      </main>
    );
  }

  const isLive = !!config?.isActive && !countdown.isExpired;

  return (
    <main className="results-screen">
      <header className="results-screen__header">
        <FestivalBrand />
      </header>
      <div className="results-screen__content" aria-live="polite">
        <ResultsChart
          data={chartData}
          error={dataError}
          isFinal={isFinal}
          totalVotes={totalVotes}
        />
        <ResultsSummary
          countdown={countdown}
          finalResult={finalResult}
          isLive={isLive}
          onOpenQr={() => setQrOpen(true)}
          qrTriggerRef={qrTriggerRef}
          totalVotes={totalVotes}
        />
      </div>
      <ResultsQrDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        triggerRef={qrTriggerRef}
      />
    </main>
  );
}
