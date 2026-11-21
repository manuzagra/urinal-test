// Placeholder so the dev + deploy pipeline can be tested end to end.
// Replaced by the real app (IDEA.md §8). Zero dependencies on purpose.
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 3000);
createServer((req, res) => {
  if (req.url === "/healthz") { res.end("ok"); return; }
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end("<h1>🚽 Urinal Test</h1><p>Setup works. Game coming soon.</p>");
}).listen(port, "0.0.0.0", () => console.log(`listening on :${port}`));
