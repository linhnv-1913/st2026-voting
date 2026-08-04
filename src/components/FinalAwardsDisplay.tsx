import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { FinalAwardsLeaderboard } from "./final-awards-leaderboard";
import { FestivalBrand } from "./MatsuriShell";
import { createFinalLeaderboard } from "./results-scoring";
import { useResultsAccess } from "./use-results-access";
import { useResultsData } from "./use-results-data";
import "./results-experience.css";

export function FinalAwardsDisplay() {
  const accessState = useResultsAccess();
  const {
    chartData,
    dataError,
    isFinal,
    isLoading,
    teamScores,
    teamScoresError,
  } = useResultsData(accessState);
  const entries = useMemo(
    () => isFinal && !teamScoresError
      ? createFinalLeaderboard(chartData, teamScores)
      : null,
    [chartData, isFinal, teamScores, teamScoresError],
  );
  const error = dataError || teamScoresError || (
    isFinal && !entries
      ? "Cấu hình bình chọn chưa đủ bốn Hub hợp lệ để trao giải."
      : ""
  );

  if (accessState === "checking" || isLoading) {
    return (
      <main className="results-screen results-screen--centered">
        <div className="results-loading">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          <span>Đang chuẩn bị màn hình trao giải...</span>
        </div>
      </main>
    );
  }

  if (accessState === "denied") {
    return (
      <main className="results-screen results-screen--centered">
        <section className="results-access-card">
          <FestivalBrand admin />
          <span className="festival-eyebrow">Màn hình trao giải</span>
          <h1 className="festival-title">Cần quyền quản trị</h1>
          <p className="festival-copy">
            Hãy đăng nhập trang quản trị trước khi mở màn hình trao giải.
          </p>
          <Link to="/admin" className="festival-primary results-access-card__action">
            Đi đến trang quản trị
          </Link>
        </section>
      </main>
    );
  }

  if (error || !isFinal) {
    return (
      <main className="results-screen results-screen--centered">
        <section className="results-access-card">
          <FestivalBrand admin />
          <span className="festival-eyebrow">Màn hình trao giải</span>
          <h1 className="festival-title">
            {error ? "Chưa thể tổng hợp kết quả" : "Chưa đến thời điểm trao giải"}
          </h1>
          <p className="festival-copy">
            {error || "Màn hình này sẽ hiển thị sau khi poll đóng và dữ liệu được chốt từ Firestore."}
          </p>
          <Link to="/results" className="festival-primary results-access-card__action">
            Quay lại kết quả bình chọn
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="results-screen results-screen--awards">
      <FinalAwardsLeaderboard entries={entries} error={error} />
    </main>
  );
}
