export type CheckResult = {
  ok: boolean;
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
  bodySnippet: string;
};

export async function runMonitorCheck(params: {
  url: string;
  method: string;
  expectedStatus: number;
  expectedBody?: string | null;
  timeoutMs?: number;
}): Promise<CheckResult> {
  const timeoutMs = params.timeoutMs ?? 25_000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(params.url, {
      method: params.method || "GET",
      signal: controller.signal,
      headers: { "User-Agent": "UptimeFunk/1.0" },
      redirect: "follow",
    });
    const responseTimeMs = Date.now() - started;
    let bodySnippet = "";
    try {
      const text = await res.text();
      bodySnippet = text.slice(0, 2000);
    } catch {
      bodySnippet = "";
    }
    const statusOk = res.status === params.expectedStatus;
    const bodyOk =
      !params.expectedBody || bodySnippet.includes(params.expectedBody);
    const ok = statusOk && bodyOk;
    let error: string | null = null;
    if (!statusOk) {
      error = `Expected status ${params.expectedStatus}, got ${res.status}`;
    } else if (!bodyOk) {
      error = `Response body did not contain expected substring`;
    }
    return {
      ok,
      statusCode: res.status,
      responseTimeMs,
      error,
      bodySnippet,
    };
  } catch (e) {
    const responseTimeMs = Date.now() - started;
    const err = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      statusCode: null,
      responseTimeMs,
      error: err.includes("aborted") ? "Request timed out" : err,
      bodySnippet: "",
    };
  } finally {
    clearTimeout(t);
  }
}
