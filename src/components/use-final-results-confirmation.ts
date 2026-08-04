import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
} from "firebase/firestore";
import { db } from "../firebase";
import { normalizeTeamBuildingScores } from "../hubOptions";
import type { Config, TeamBuildingScoreDocument, TeamBuildingScores, Vote } from "../types";
import type { ResultsAccessState } from "./use-results-access";

interface FinalResultsSnapshot {
  votes: Vote[];
  teamScores: TeamBuildingScores;
}

export function useFinalResultsConfirmation(
  accessState: ResultsAccessState,
  config: Config | null,
  isExpired: boolean,
  isReady: boolean,
  configurationError: string,
) {
  const [snapshot, setSnapshot] = useState<FinalResultsSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setSnapshot(null);
    setError("");
    if (accessState !== "allowed" || !isExpired || !config || !isReady || configurationError) {
      return;
    }

    let cancelled = false;
    const gracePeriodMs = 2_000;
    const delayMs = Math.max(0, (config.endTime ?? Date.now()) + gracePeriodMs - Date.now());
    const timerId = window.setTimeout(() => {
      void Promise.all([
        getDocFromServer(doc(db, "config", "main")),
        getDocsFromServer(collection(db, "votes")),
        getDocFromServer(doc(db, "team-building", "scores")),
      ]).then(([configSnapshot, votesSnapshot, teamSnapshot]) => {
        if (cancelled) return;
        if (!configSnapshot.exists()) {
          throw new Error("Poll configuration is missing during finalization");
        }
        const teamData = teamSnapshot.data() as
          | Partial<TeamBuildingScoreDocument>
          | undefined;
        setSnapshot({
          votes: votesSnapshot.docs.map(
            (vote) => ({ id: vote.id, ...vote.data() }) as Vote,
          ),
          teamScores: normalizeTeamBuildingScores(teamData?.scores),
        });
      }).catch((finalizationError) => {
        if (cancelled) return;
        console.error("Failed to finalize results from the server", finalizationError);
        setError("Không thể chốt dữ liệu kết quả từ máy chủ. Vui lòng tải lại trang.");
      });
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [
    accessState,
    config?.endTime,
    config?.id,
    configurationError,
    isExpired,
    isReady,
  ]);

  return { error, snapshot };
}
