import { useState, useEffect, useRef } from "react";
import { doc, getDoc, onSnapshot, writeBatch } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { voterAuth, voterDb } from "../firebase";
import { Config } from "../types";
import { getHubOptionClass, normalizeHubOptions } from "../hubOptions";
import {
  fetchVoterNames,
  isValidSlackUsername,
  normalizeSlackUsername,
} from "../voterNames";
import { Clock3, Loader2, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { FestivalBrand, MatsuriShell } from "./MatsuriShell";

function formatCountdown(endTime: number, now: number) {
  const totalSeconds = Math.max(0, Math.ceil((endTime - now) / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return days > 0 ? `${days} ngày ${clock}` : clock;
}

export function UserVote() {
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [voteError, setVoteError] = useState("");
  const [voterNames, setVoterNames] = useState<Set<string> | null>(null);
  const [voterNamesLoading, setVoterNamesLoading] = useState(true);
  const [voterNamesError, setVoterNamesError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] =
    useState(0);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [user, setUser] = useState<User | null>(voterAuth.currentUser);
  const anonymousSignInPending = useRef(false);

  useEffect(() => {
    let active = true;
    void fetchVoterNames()
      .then((names) => {
        if (active) setVoterNames(names);
      })
      .catch((error) => {
        console.error("Failed to load voter names", error);
        if (active)
          setVoterNamesError("Không thể tải danh sách tên bình chọn.");
      })
      .finally(() => {
        if (active) setVoterNamesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(voterAuth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setSessionError("");
          setSessionLoading(false);
          anonymousSignInPending.current = false;
          return;
        }

        setUser(null);
        if (anonymousSignInPending.current) return;

        anonymousSignInPending.current = true;
        void signInAnonymously(voterAuth).catch((error) => {
          console.error("Failed to initialize browser voting session", error);
          anonymousSignInPending.current = false;
          setSessionError(
            error?.code === "auth/operation-not-allowed"
              ? "Hệ thống chưa bật phiên bình chọn ẩn danh."
              : "Không thể khởi tạo phiên bình chọn trên trình duyệt này.",
          );
          setSessionLoading(false);
        });
      }),
    [],
  );

  useEffect(() => {
    const unsubConfig = onSnapshot(
      doc(voterDb, "config", "main"),
      (docSnap) => {
        setConfig(
          docSnap.exists()
            ? ({
                id: docSnap.id,
                ...docSnap.data(),
                options: normalizeHubOptions(docSnap.data().options || []),
              } as Config)
            : null,
        );
        setLoading(false);
      },
    );

    return () => unsubConfig();
  }, []);

  useEffect(() => {
    if (!config?.endTime) return;

    setNow(Date.now());
    const timerId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= config.endTime!) window.clearInterval(timerId);
    }, 1_000);
    return () => window.clearInterval(timerId);
  }, [config?.endTime]);

  useEffect(() => {
    setSelectedOptions([]);
    setHasVoted(false);
    if (!user) return;

    const fetchMyVote = async () => {
      try {
        const voteDoc = await getDoc(doc(voterDb, "votes", `vote_${user.uid}`));
        if (!voteDoc.exists()) return;

        const data = voteDoc.data();
        setSelectedOptions(
          data.optionIds || (data.optionId ? [data.optionId] : []),
        );
        if (typeof data.username === "string") setUsername(data.username);
        setHasVoted(true);
      } catch (error) {
        console.error("Failed to fetch vote", error);
      }
    };
    void fetchMyVote();
  }, [user]);

  const validateUsername = async (): Promise<string | null> => {
    const normalized = normalizeSlackUsername(username);
    setUsernameError("");
    setVoteError("");

    if (!normalized) {
      setUsernameError("Vui lòng nhập họ và tên của bạn.");
      return null;
    }
    if (!isValidSlackUsername(normalized)) {
      setUsernameError("Tên phải có dạng ho.va.ten, ví dụ nguyen.van.linh-c.");
      return null;
    }
    if (!voterNames) {
      setUsernameError(
        voterNamesError || "Chưa tải được danh sách tên bình chọn.",
      );
      return null;
    }
    if (!voterNames.has(normalized)) {
      setUsernameError(
        "Tên này không có trong danh sách người được bình chọn.",
      );
      return null;
    }

    setUsernameChecking(true);
    try {
      const claim = await getDoc(doc(voterDb, "voter-claims", normalized));
      if (claim.exists()) {
        setUsernameError(`${normalized} đã vote rồi`);
        return null;
      }
      return normalized;
    } catch (error) {
      console.error("Failed to check voter name", error);
      setUsernameError("Không thể kiểm tra tên. Vui lòng thử lại.");
      return null;
    } finally {
      setUsernameChecking(false);
    }
  };

  const selectUsername = (value: string) => {
    setUsername(value);
    setUsernameError("");
    setVoteError("");
    setHighlightedSuggestionIndex(0);
    setSuggestionsOpen(false);
  };

  const toggleOption = (id: string) => {
    if (
      submitting ||
      hasVoted ||
      (config?.endTime && Date.now() > config.endTime)
    )
      return;

    if (selectedOptions.includes(id)) {
      setSelectedOptions(selectedOptions.filter((optionId) => optionId !== id));
    } else if (selectedOptions.length < 3) {
      setSelectedOptions([...selectedOptions, id]);
    }
  };

  const handleVote = async () => {
    if (
      !config?.isActive ||
      !user ||
      submitting ||
      hasVoted ||
      selectedOptions.length !== 3 ||
      (!!config.endTime && Date.now() > config.endTime)
    )
      return;

    setSubmitting(true);
    try {
      const normalizedUsername = await validateUsername();
      if (!normalizedUsername) return;

      const timestamp = Date.now();
      const batch = writeBatch(voterDb);
      batch.set(doc(voterDb, "voter-claims", normalizedUsername), {
        username: normalizedUsername,
        userId: user.uid,
        timestamp,
      });
      batch.set(doc(voterDb, "votes", `vote_${user.uid}`), {
        optionIds: selectedOptions,
        username: normalizedUsername,
        userId: user.uid,
        timestamp,
      });
      await batch.commit();
      setHasVoted(true);
    } catch (error) {
      console.error(error);
      const code = error instanceof Error && "code" in error ? error.code : "";
      if (code === "already-exists" || code === "permission-denied") {
        setUsernameError("Tên này đã vote rồi hoặc poll vừa được đóng.");
      } else {
        setVoteError("Không thể gửi phiếu. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || sessionLoading || voterNamesLoading) {
    return (
      <MatsuriShell contentClassName="matsuri-stage--user">
        <section
          className="festival-card festival-card--user festival-card--compact"
          aria-label="Đang tải"
        >
          <FestivalBrand />
          <div className="festival-loading">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
            <span className="sr-only">Đang tải dữ liệu bình chọn</span>
          </div>
        </section>
      </MatsuriShell>
    );
  }

  if (!user) {
    return (
      <MatsuriShell contentClassName="matsuri-stage--user">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="festival-card festival-card--user festival-card--compact"
          aria-labelledby="session-error-heading"
        >
          <FestivalBrand />
          <span className="festival-eyebrow">Phiên trình duyệt</span>
          <h1 id="session-error-heading" className="festival-title">
            Chưa thể bắt đầu bình chọn
          </h1>
          <p className="festival-copy">
            {sessionError || "Không thể nhận diện trình duyệt hiện tại."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="festival-primary mt-6 w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Thử lại
          </button>
        </motion.section>
      </MatsuriShell>
    );
  }

  if (voterNamesError) {
    return (
      <MatsuriShell contentClassName="matsuri-stage--user">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="festival-card festival-card--user festival-card--compact"
          aria-labelledby="voter-list-error-heading"
        >
          <FestivalBrand />
          <h1 id="voter-list-error-heading" className="festival-title">
            Chưa thể bắt đầu bình chọn
          </h1>
          <p className="festival-alert" role="alert">
            {voterNamesError}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="festival-primary mt-6 w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Thử lại
          </button>
        </motion.section>
      </MatsuriShell>
    );
  }

  if (!config || !config.isActive) {
    return (
      <MatsuriShell contentClassName="matsuri-stage--user">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="festival-card festival-card--user festival-card--compact"
          aria-labelledby="waiting-heading"
        >
          <FestivalBrand />
          <p className="festival-copy">
            Lượt vote chưa được mở hoặc đã kết thúc.
          </p>
        </motion.section>
      </MatsuriShell>
    );
  }

  const isExpired = !!config.endTime && now >= config.endTime;
  const countdown = config.endTime
    ? formatCountdown(config.endTime, now)
    : null;
  const normalizedInputUsername = normalizeSlackUsername(username);
  const voterSuggestions: string[] =
    !hasVoted &&
    normalizedInputUsername.length >= 2 &&
    voterNames !== null &&
    suggestionsOpen &&
    !voterNames.has(normalizedInputUsername)
      ? Array.from<string>(voterNames)
          .filter((name) => name.startsWith(normalizedInputUsername))
          .sort()
          .slice(0, 6)
      : [];

  return (
    <MatsuriShell contentClassName="matsuri-stage--user">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="festival-card festival-card--user festival-card--vote"
        aria-labelledby="vote-heading"
      >
        <FestivalBrand />
        <div className="festival-card__topline">
          <span
            className={`festival-status ${isExpired ? "festival-status--closed" : ""}`}
          >
            {isExpired ? "Đã đóng" : "Đang mở"}
          </span>
          <span
            className={`vote-countdown ${isExpired ? "vote-countdown--expired" : ""}`}
            role="timer"
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {isExpired ? (
              <strong>Hết thời gian</strong>
            ) : countdown ? (
              <>
                <span>Còn</span>
                <strong>{countdown}</strong>
              </>
            ) : (
              <strong>Không giới hạn</strong>
            )}
          </span>
        </div>
        <h1 id="vote-heading" className="festival-title">
          {config.question}
        </h1>

        <div className="festival-field voter-identity-field">
          <label htmlFor="voter-username" className="festival-field__label">
            Tên của bạn
          </label>
          <div className="voter-input-wrap">
            <input
              id="voter-username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setUsernameError("");
                setVoteError("");
                setHighlightedSuggestionIndex(0);
                setSuggestionsOpen(true);
              }}
              onFocus={() => {
                setSuggestionsOpen(true);
                setHighlightedSuggestionIndex(0);
              }}
              onKeyDown={(event) => {
                if (!voterSuggestions.length) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlightedSuggestionIndex(
                    (current) => (current + 1) % voterSuggestions.length,
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlightedSuggestionIndex(
                    (current) =>
                      (current - 1 + voterSuggestions.length) %
                      voterSuggestions.length,
                  );
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  if (highlightedSuggestionIndex >= 0) {
                    selectUsername(
                      voterSuggestions[highlightedSuggestionIndex],
                    );
                  }
                } else if (event.key === "Escape") {
                  setHighlightedSuggestionIndex(-1);
                  setSuggestionsOpen(false);
                }
              }}
              onBlur={() => {
                setSuggestionsOpen(false);
                void validateUsername();
              }}
              placeholder="ho.va.ten"
              autoComplete="username"
              spellCheck={false}
              disabled={hasVoted || submitting}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen && voterSuggestions.length > 0}
              aria-controls={
                suggestionsOpen && voterSuggestions.length > 0
                  ? "voter-username-suggestions"
                  : undefined
              }
              aria-activedescendant={
                suggestionsOpen &&
                voterSuggestions.length > 0 &&
                highlightedSuggestionIndex >= 0
                  ? `voter-suggestion-${highlightedSuggestionIndex}`
                  : undefined
              }
              aria-invalid={Boolean(usernameError)}
              aria-describedby="voter-username-help voter-username-error"
              className="festival-input"
            />
            {voterSuggestions.length > 0 && (
              <div
                id="voter-username-suggestions"
                className="voter-suggestions"
                role="listbox"
                aria-label="Tên hợp lệ"
              >
                {voterSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    id={`voter-suggestion-${index}`}
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === highlightedSuggestionIndex}
                    className={`voter-suggestion${index === highlightedSuggestionIndex ? " voter-suggestion--active" : ""}`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      selectUsername(suggestion);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p id="voter-username-help" className="voter-identity__hint">
            Nhập theo format: ho.va.ten
          </p>
          {usernameError && (
            <p
              id="voter-username-error"
              className="festival-alert"
              role="alert"
            >
              {usernameError}
            </p>
          )}
        </div>

        <div className="vote-progress" aria-live="polite">
          <span id="vote-options-label">Danh sách lựa chọn</span>
          <strong>{selectedOptions.length}/3 đã chọn</strong>
        </div>
        <div
          className="vote-options"
          role="group"
          aria-labelledby="vote-options-label"
        >
          {config.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            const isDisabled =
              submitting ||
              isExpired ||
              hasVoted ||
              (selectedOptions.length >= 3 && !isSelected);
            return (
              <button
                key={option.id}
                type="button"
                disabled={isDisabled}
                aria-pressed={isSelected}
                onClick={() => toggleOption(option.id)}
                className={`vote-option ${getHubOptionClass(option.text)} ${isSelected ? "vote-option--selected" : ""} ${isDisabled && !isSelected ? "vote-option--disabled" : ""}`}
              >
                <span className="vote-option__check" aria-hidden="true" />
                <span className="vote-option__text">{option.text}</span>
              </button>
            );
          })}
        </div>
        <div className="vote-submit-dock">
          <button
            type="button"
            disabled={
              hasVoted ||
              isExpired ||
              selectedOptions.length !== 3 ||
              submitting ||
              usernameChecking ||
              Boolean(usernameError) ||
              !normalizedInputUsername ||
              !voterNames?.has(normalizedInputUsername)
            }
            onClick={handleVote}
            className={`festival-primary vote-submit ${hasVoted ? "festival-primary--success" : selectedOptions.length === 3 && !isExpired ? "" : "festival-primary--muted"}`}
          >
            {hasVoted
              ? "Đã ghi nhận phiếu"
              : isExpired
                ? "Đã đóng bình chọn"
                : submitting
                  ? "Đang gửi..."
                  : `Bình chọn (${selectedOptions.length}/3)`}
          </button>
          {voteError && (
            <p className="festival-alert mt-3" role="alert">
              {voteError}
            </p>
          )}
        </div>
      </motion.section>
    </MatsuriShell>
  );
}
