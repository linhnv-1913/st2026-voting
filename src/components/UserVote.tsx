import { useEffect, useRef, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { Clock3, Loader2, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { voterAuth, voterDb } from "../firebase";
import { getPollPhase } from "../countdown";
import { getHubOptionClass, normalizeHubOptions } from "../hubOptions";
import {
  isVoteAccessCode,
  getVoteDocumentId,
  normalizeVoteAccessLink,
  VOTE_ACCESS_COLLECTION,
} from "../vote-access";
import { submitVoteForAccessCode, VoteAccessError } from "../vote-access-service";
import { Config, VoteAccessLink } from "../types";
import { useParams } from "react-router-dom";
import { FestivalBrand, MatsuriShell } from "./MatsuriShell";

function formatCountdown(targetTime: number, now: number) {
  const totalSeconds = Math.max(0, Math.ceil((targetTime - now) / 1000));
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
  const { accessCode } = useParams<{ accessCode: string }>();
  const [config, setConfig] = useState<Config | null>(null);
  const [accessLink, setAccessLink] = useState<VoteAccessLink | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accessLinkLoading, setAccessLinkLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [user, setUser] = useState<User | null>(voterAuth.currentUser);
  const anonymousSignInPending = useRef(false);

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
    setAccessLink(null);
    setAccessLinkLoading(true);
    if (!isVoteAccessCode(accessCode)) {
      setAccessLinkLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(voterDb, VOTE_ACCESS_COLLECTION, accessCode),
      (snapshot) => {
        setAccessLink(
          snapshot.exists()
            ? normalizeVoteAccessLink(accessCode, snapshot.data())
            : null,
        );
        setAccessLinkLoading(false);
      },
      (error) => {
        console.error("Failed to load vote access link", error);
        setAccessLink(null);
        setAccessLinkLoading(false);
        setVoteError("Không thể kiểm tra mã bình chọn. Vui lòng thử lại.");
      },
    );

    return () => unsubscribe();
  }, [accessCode]);

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

  useEffect(() => {
    setSelectedOptions([]);
    setHasVoted(false);
    setVoteError("");
    if (!user || !isVoteAccessCode(accessCode)) return;

    const fetchMyVote = async () => {
      try {
        const voteDoc = await getDoc(
          doc(voterDb, "votes", getVoteDocumentId(user.uid, accessCode)),
        );
        if (!voteDoc.exists()) return;

        const data = voteDoc.data();
        setSelectedOptions(
          data.optionIds || (data.optionId ? [data.optionId] : []),
        );
        setHasVoted(true);
      } catch (error) {
        console.error("Failed to fetch vote", error);
      }
    };
    void fetchMyVote();
  }, [accessCode, user]);

  const pollPhase = getPollPhase(
    config?.isActive,
    config?.startTime,
    config?.endTime,
    now,
  );
  const isExpired = pollPhase === "closed";
  const isScheduled = pollPhase === "scheduled";
  const countdownTarget = isScheduled
    ? config?.startTime
    : config?.endTime;
  const countdown =
    countdownTarget != null ? formatCountdown(countdownTarget, now) : null;

  const toggleOption = (id: string) => {
    if (submitting || hasVoted || pollPhase !== "open") return;

    if (selectedOptions.includes(id)) {
      setSelectedOptions(selectedOptions.filter((optionId) => optionId !== id));
    } else if (selectedOptions.length < 3) {
      setSelectedOptions([...selectedOptions, id]);
    }
  };

  const handleVote = async () => {
    if (
      pollPhase !== "open" ||
      !user ||
      !accessLink ||
      accessLink.voteCount >= accessLink.maxVotes ||
      submitting ||
      hasVoted ||
      selectedOptions.length !== 3
    ) {
      return;
    }

    setSubmitting(true);
    try {
      if (!accessLink || !isVoteAccessCode(accessCode)) return;
      await submitVoteForAccessCode(
        voterDb,
        accessCode,
        user.uid,
        selectedOptions,
      );
      setHasVoted(true);
    } catch (error) {
      console.error(error);
      if (error instanceof VoteAccessError) {
        const message = {
          "access-link-full": "Mã này đã đủ 10 lượt vote.",
          "access-link-inactive": "Mã bình chọn này hiện không hoạt động.",
          "access-link-not-found": "Mã bình chọn không hợp lệ hoặc chưa được khởi tạo.",
          "already-voted": "Trình duyệt này đã vote bằng mã này rồi.",
        }[error.code];
        setVoteError(message);
      } else if (error instanceof Error && "code" in error && error.code === "permission-denied") {
        setVoteError("Phiếu đã được ghi nhận hoặc lượt vote vừa đóng.");
      } else {
        setVoteError("Không thể gửi phiếu. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || sessionLoading || accessLinkLoading) {
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

  if (!isVoteAccessCode(accessCode) || !accessLink) {
    return (
      <MatsuriShell contentClassName="matsuri-stage--user">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="festival-card festival-card--user festival-card--compact"
          aria-labelledby="invalid-link-heading"
        >
          <FestivalBrand />
          <span className="festival-eyebrow">Link bình chọn</span>
          <h1 id="invalid-link-heading" className="festival-title">
            Mã bình chọn không hợp lệ
          </h1>
          <p className="festival-copy">
            Vui lòng mở đúng link được ban tổ chức cung cấp.
          </p>
        </motion.section>
      </MatsuriShell>
    );
  }

  if (!config || pollPhase === "inactive" || isScheduled) {
    return (
      <MatsuriShell contentClassName="matsuri-stage--user">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="festival-card festival-card--user festival-card--compact"
          aria-labelledby="waiting-heading"
        >
          <FestivalBrand />
          <h1 id="waiting-heading" className="festival-title">
            {isScheduled ? "Bình chọn sắp mở" : "Bình chọn chưa mở"}
          </h1>
          <p className="festival-copy">
            {isScheduled && countdown
              ? `Form sẽ mở sau ${countdown}.`
              : "Lượt vote chưa được mở hoặc đã kết thúc."}
          </p>
        </motion.section>
      </MatsuriShell>
    );
  }

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

        <div className="vote-progress" aria-live="polite">
          <span id="vote-options-label">Danh sách lựa chọn</span>
          <strong>{selectedOptions.length}/3 đã chọn</strong>
        </div>
        <div className="vote-progress" aria-live="polite">
          <span>Mã {accessCode}</span>
          <strong>
            {accessLink.voteCount}/{accessLink.maxVotes} lượt đã dùng
          </strong>
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
              accessLink.voteCount >= accessLink.maxVotes ||
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
              accessLink.voteCount >= accessLink.maxVotes ||
              selectedOptions.length !== 3 ||
              submitting
            }
            onClick={handleVote}
            className={`festival-primary vote-submit ${hasVoted ? "festival-primary--success" : selectedOptions.length === 3 && !isExpired ? "" : "festival-primary--muted"}`}
          >
            {hasVoted
              ? "Đã ghi nhận phiếu"
              : accessLink.voteCount >= accessLink.maxVotes
                ? `Mã đã đủ ${accessLink.maxVotes} lượt vote`
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
