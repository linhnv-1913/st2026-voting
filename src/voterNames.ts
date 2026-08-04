const VOTER_SHEET_QUERY_URL =
  "https://docs.google.com/spreadsheets/d/17TyQVJJYdm8AWhCQhSQlt08nVSkSv1ERdOTDud5x18Y/gviz/tq?gid=1736644070&tq=select%20B";

const slackUsernamePattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export function normalizeSlackUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidSlackUsername(value: string): boolean {
  return value.length <= 128 && slackUsernamePattern.test(value);
}

interface GoogleSheetResponse {
  status?: string;
  table?: {
    rows?: Array<{
      c?: Array<{ v?: unknown } | null>;
    }>;
  };
}

let jsonpRequestId = 0;

function loadSheetJsonp(): Promise<GoogleSheetResponse> {
  return new Promise((resolve, reject) => {
    const callbackName = `__voterSheet_${Date.now()}_${jsonpRequestId++}`;
    const script = document.createElement("script");
    const callbackStore = window as unknown as Record<string, unknown>;
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.remove();
      delete callbackStore[callbackName];
    };
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const timeoutId = window.setTimeout(
      () => finish(() => reject(new Error("Voter list request timed out"))),
      10_000,
    );

    callbackStore[callbackName] = (response: GoogleSheetResponse) =>
      finish(() => resolve(response));
    script.async = true;
    script.src = `${VOTER_SHEET_QUERY_URL}&tqx=out:json;responseHandler:${callbackName}`;
    script.onerror = () =>
      finish(() => reject(new Error("Voter list request failed")));
    document.head.appendChild(script);
  });
}

export async function fetchVoterNames(): Promise<Set<string>> {
  const response = await loadSheetJsonp();
  if (response.status !== "ok" || !response.table?.rows) {
    throw new Error("Voter list response was invalid");
  }

  const rows = response.table.rows;
  const names = rows
    .map((row) => normalizeSlackUsername(String(row.c?.[0]?.v || "")))
    .filter((name) => isValidSlackUsername(name));

  return new Set(names);
}
