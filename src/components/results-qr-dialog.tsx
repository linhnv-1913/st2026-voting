import { useEffect, useRef, type RefObject } from "react";
import { QRCodeSVG } from "qrcode.react";
import { VOTE_ACCESS_CODES } from "../vote-access";
import "./results-qr-dialog.css";

interface ResultsQrDialogProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function ResultsQrDialog({
  open,
  onClose,
  triggerRef,
}: ResultsQrDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }

    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
      requestAnimationFrame(() => triggerRef.current?.focus());
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, triggerRef]);

  const voteBasePath = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const getVoteUrl = (code: string) =>
    `${window.location.origin}${voteBasePath}${code}`;

  return (
    <dialog
      ref={dialogRef}
      className="results-qr-dialog"
      aria-labelledby="results-qr-title"
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <section className="results-qr-dialog__sheet">
        <p className="results-qr-dialog__eyebrow">16 mã QR vào trang bình chọn</p>
        <h2 id="results-qr-title" className="results-qr-dialog__title">
          Mỗi mã nhận tối đa 10 lượt vote
        </h2>
        <div className="results-qr-dialog__grid">
          {VOTE_ACCESS_CODES.map(code => (
            <article key={code} className="results-qr-dialog__item">
              <QRCodeSVG value={getVoteUrl(code)} size={160} includeMargin level="M" />
              <code>{code}</code>
            </article>
          ))}
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          className="results-qr-dialog__close"
          onClick={() => dialogRef.current?.close()}
        >
          Đóng
        </button>
      </section>
    </dialog>
  );
}
