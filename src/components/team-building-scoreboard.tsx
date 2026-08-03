import { useEffect, useState, type CSSProperties } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Loader2, TriangleAlert } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { db } from "../firebase";
import {
  createEmptyTeamBuildingScores,
  HUB_DEFINITIONS,
  normalizeTeamBuildingScores,
} from "../hubOptions";
import type { TeamBuildingScoreDocument, TeamBuildingScores } from "../types";
import { FestivalBrand, MatsuriShell } from "./MatsuriShell";
import "./team-building-scoreboard.css";

type ScoreboardStatus = "loading" | "ready" | "error";

type ScoreboardState = {
  status: ScoreboardStatus;
  scores: TeamBuildingScores;
  message: string;
};

const INITIAL_STATE: ScoreboardState = {
  status: "loading",
  scores: createEmptyTeamBuildingScores(),
  message: "",
};

export function TeamBuildingScoreboard() {
  const [state, setState] = useState(INITIAL_STATE);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "team-building", "scores"),
      (snapshot) => {
        if (!snapshot.exists()) {
          setState({
            status: "ready",
            scores: createEmptyTeamBuildingScores(),
            message: "",
          });
          return;
        }

        const data = snapshot.data() as
          | Partial<TeamBuildingScoreDocument>
          | undefined;
        setState({
          status: "ready",
          scores: normalizeTeamBuildingScores(data?.scores),
          message: "",
        });
      },
      (error) => {
        console.error("Failed to subscribe to team building scoreboard", error);
        setState((current) => ({
          ...current,
          status: "error",
          message: "Không thể đồng bộ bảng điểm lúc này. Vui lòng thử lại sau.",
        }));
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const isLoading = state.status === "loading";
  const isError = state.status === "error";

  return (
    <MatsuriShell contentClassName="team-building-scoreboard-stage">
      <section
        className="festival-card team-building-scoreboard"
        aria-labelledby="scoreboard-heading"
      >
        <header className="team-building-scoreboard__header">
          <div>
            <FestivalBrand />
          </div>
        </header>

        {(isLoading || isError) && (
          <div
            className={`team-building-scoreboard__status ${isError ? "team-building-scoreboard__status--error" : ""}`}
            role={isError ? "alert" : "status"}
            aria-live="polite"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>Đang đồng bộ bảng điểm...</span>
              </>
            ) : (
              <>
                <TriangleAlert className="h-5 w-5" aria-hidden="true" />
                <span>{state.message}</span>
              </>
            )}
          </div>
        )}

        <div className="team-building-scoreboard__grid">
          {HUB_DEFINITIONS.map((hub, index) => {
            const value = state.scores[hub.id];
            const formattedValue = value.toLocaleString("vi-VN");
            const scoreStyle = {
              "--score-length": formattedValue.length,
            } as CSSProperties;

            return (
              <motion.article
                key={hub.id}
                className={`team-building-scoreboard__tile team-building-scoreboard__tile--${hub.id}`}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.42, delay: index * 0.06 }
                }
              >
                <span className="team-building-scoreboard__label">
                  {hub.label}
                </span>
                <strong className="team-building-scoreboard__value">
                  <motion.span
                    key={`${hub.id}-${value}`}
                    className="team-building-scoreboard__value-text"
                    style={scoreStyle}
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0.3, y: 10, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.32, ease: "easeOut" }
                    }
                  >
                    {formattedValue}
                  </motion.span>
                </strong>
              </motion.article>
            );
          })}
        </div>
      </section>
    </MatsuriShell>
  );
}
