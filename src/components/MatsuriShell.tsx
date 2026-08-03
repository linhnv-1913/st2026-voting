import type { ReactNode } from "react";

type MatsuriShellProps = {
  children: ReactNode;
  contentClassName?: string;
};

export function FestivalBrand({ admin = false }: { admin?: boolean }) {
  return (
    <div className="festival-brand">
      <span className="festival-brand__seal" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}cevc3-front.png`} alt="" />
      </span>
      <span className="festival-brand__copy">
        <strong>{admin ? "Matsuri Admin" : "C3 Matsuri"}</strong>
        <small>One Spirit • One Goal</small>
      </span>
    </div>
  );
}

export function MatsuriShell({
  children,
  contentClassName = "",
}: MatsuriShellProps) {
  return (
    <main className="matsuri-shell">
      <div className="matsuri-shell__visual" aria-hidden="true" />
      <div className="matsuri-shell__veil" aria-hidden="true" />
      <div className={`matsuri-stage ${contentClassName}`}>
        <aside className="matsuri-intro" aria-label="C3 Matsuri">
          <span className="matsuri-intro__eyebrow">CEVC3 • Sun*</span>
          <span className="matsuri-intro__title"> - </span>
          <strong>One Spirit • One Goal</strong>
        </aside>
        {children}
      </div>
      <div className="matsuri-shell__waves" aria-hidden="true" />
    </main>
  );
}
