export function logRequest(method: string, path: string, status: number, durationMs: number) {
  console.log(JSON.stringify({
    type: "request",
    method,
    path,
    status,
    durationMs,
    timestamp: new Date().toISOString(),
  }));
}
