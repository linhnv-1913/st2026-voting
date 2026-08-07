import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { getCountdownState } from "../countdown";
import { db } from "../firebase";
import {
  createEmptyTeamBuildingScores,
  normalizeHubOptions,
  normalizeTeamBuildingScores,
} from "../hubOptions";
import type { Config, TeamBuildingScoreDocument, Vote } from "../types";
import type { ResultsAccessState } from "./use-results-access";
import { selectCanonicalHubResults } from "./results-scoring";
import { useFinalResultsConfirmation } from "./use-final-results-confirmation";

export function useResultsData(accessState: ResultsAccessState) {
  const [config, setConfig] = useState<Config | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [teamScores, setTeamScores] = useState(createEmptyTeamBuildingScores);
  const [loaded, setLoaded] = useState({ config: false, votes: false, team: false });
  const [dataError, setDataError] = useState("");
  const [teamScoresError, setTeamScoresError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const closeAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    setConfig(null);
    setVotes([]);
    setTeamScores(createEmptyTeamBuildingScores());
    setLoaded({ config: false, votes: false, team: false });
    setDataError("");
    setTeamScoresError("");
    closeAttemptRef.current = null;
    if (accessState !== "allowed") return;

    const unsubscribeConfig = onSnapshot(
      doc(db, "config", "main"),
      { includeMetadataChanges: true },
      (snapshot) => {
        const data = snapshot.data();
        setConfig(snapshot.exists() ? ({
          id: snapshot.id,
          ...data,
          options: normalizeHubOptions(data?.options || []),
        } as Config) : null);
        if (!snapshot.metadata.fromCache) {
          setLoaded((state) => state.config ? state : { ...state, config: true });
        }
        setNow(Date.now());
      },
      (error) => {
        console.error("Failed to load poll configuration", error);
        setDataError("Không thể tải cấu hình bình chọn.");
        setLoaded((state) => ({ ...state, config: true }));
      },
    );
    const unsubscribeVotes = onSnapshot(
      collection(db, "votes"),
      { includeMetadataChanges: true },
      (snapshot) => {
        setVotes(snapshot.docs.map(
          (vote) => ({ id: vote.id, ...vote.data() }) as Vote,
        ));
        if (!snapshot.metadata.fromCache) {
          setLoaded((state) => state.votes ? state : { ...state, votes: true });
        }
      },
      (error) => {
        console.error("Failed to load vote results", error);
        setDataError("Không thể tải kết quả bình chọn.");
        setLoaded((state) => ({ ...state, votes: true }));
      },
    );
    const unsubscribeTeamScores = onSnapshot(
      doc(db, "team-building", "scores"),
      { includeMetadataChanges: true },
      (snapshot) => {
        const data = snapshot.data() as Partial<TeamBuildingScoreDocument> | undefined;
        setTeamScores(normalizeTeamBuildingScores(data?.scores));
        setTeamScoresError("");
        if (!snapshot.metadata.fromCache) {
          setLoaded((state) => state.team ? state : { ...state, team: true });
        }
      },
      (error) => {
        console.error("Failed to load Team Building scores", error);
        setTeamScoresError("Không thể tải điểm Team Building để tổng hợp kết quả.");
        setLoaded((state) => ({ ...state, team: true }));
      },
    );

    return () => {
      unsubscribeConfig();
      unsubscribeVotes();
      unsubscribeTeamScores();
    };
  }, [accessState]);

  useEffect(() => {
    const startTime = config?.startTime ?? null;
    const endTime = config?.endTime ?? null;
    if (startTime === null && endTime === null) return;
    setNow(Date.now());

    const timerId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      const beforeStart = startTime !== null && currentTime < startTime;
      const beforeEnd = endTime !== null && currentTime < endTime;
      if (!beforeStart && !beforeEnd) window.clearInterval(timerId);
    }, 1_000);
    return () => window.clearInterval(timerId);
  }, [config?.startTime, config?.endTime]);

  const countdown = getCountdownState(config?.endTime, now, config?.startTime);
  const serverReady = Object.values(loaded).every(Boolean);
  const preliminaryChartData = useMemo(() => (config?.options || []).map((option) => ({
    ...option,
    voteCount: votes.filter((vote) =>
      vote.optionIds?.includes(option.id) || vote.optionId === option.id,
    ).length,
  })), [config?.options, votes]);
  const preliminaryCanonicalData = useMemo(
    () => selectCanonicalHubResults(preliminaryChartData),
    [preliminaryChartData],
  );
  const configurationError = loaded.config && !preliminaryCanonicalData
    ? "Cấu hình bình chọn phải có đúng một lựa chọn cho mỗi Hub 1, 2, 4 và 5."
    : "";
  const finalConfirmation = useFinalResultsConfirmation(
    accessState,
    config,
    countdown.isExpired,
    serverReady,
    configurationError,
  );
  const effectiveVotes = finalConfirmation.snapshot?.votes ?? votes;
  const effectiveTeamScores = finalConfirmation.snapshot?.teamScores ?? teamScores;
  const effectiveTeamScoresError = finalConfirmation.snapshot ? "" : teamScoresError;
  const rawChartData = useMemo(() => (config?.options || []).map((option) => ({
    ...option,
    voteCount: effectiveVotes.filter((vote) =>
      vote.optionIds?.includes(option.id) || vote.optionId === option.id,
    ).length,
  })), [config?.options, effectiveVotes]);
  const canonicalChartData = useMemo(
    () => selectCanonicalHubResults(rawChartData),
    [rawChartData],
  );
  const resultsError = dataError || configurationError || finalConfirmation.error;
  const isFinal = countdown.isExpired
    && loaded.config
    && loaded.votes
    && !!finalConfirmation.snapshot
    && !resultsError;

  useEffect(() => {
    if (!config?.isActive || !countdown.isExpired) return;
    const attemptKey = `${config.id}:${config.endTime ?? "none"}`;
    if (closeAttemptRef.current === attemptKey) return;

    closeAttemptRef.current = attemptKey;
    void setDoc(doc(db, "config", "main"), { isActive: false }, { merge: true })
      .catch((error) => {
        console.error("Failed to persist closed poll state", error);
        closeAttemptRef.current = null;
      });
  }, [config, countdown.isExpired]);

  return {
    chartData: canonicalChartData ?? [],
    config,
    countdown,
    dataError: resultsError,
    isFinal,
    isLoading: accessState === "allowed" && !Object.values(loaded).every(Boolean),
    teamScores: effectiveTeamScores,
    teamScoresError: effectiveTeamScoresError,
    totalVotes: effectiveVotes.length,
  };
}
