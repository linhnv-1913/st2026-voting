import { useEffect, useRef, type RefObject } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './results-qr-dialog.css';

const RESULTS_QR_URL = 'https://sal.vn/c3-voting';

interface ResultsQrDialogProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function ResultsQrDialog({ open, onClose, triggerRef }: ResultsQrDialogProps) {
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

    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose, triggerRef]);

  return (
    <dialog
      ref={dialogRef}
      className="results-qr-dialog"
      aria-labelledby="results-qr-title"
      onClick={event => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <section className="results-qr-dialog__sheet">
        <p className="results-qr-dialog__eyebrow">Mã QR vào trang bình chọn</p>
        <h2 id="results-qr-title" className="results-qr-dialog__title">https://sal.vn/c3-voting</h2>
        <div className="results-qr-dialog__code">
          <QRCodeSVG value={RESULTS_QR_URL} size={224} includeMargin level="M" />
        </div>
        <p className="results-qr-dialog__hint">
          Quét mã hoặc mở đường dẫn này trên thiết bị khán giả để vào trang bình chọn.
        </p>
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
