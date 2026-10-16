import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "serve-handler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "tests.json");

// Helper to ensure data directory and file exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf-8");
  }
}

function getStoredTests() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading tests.json:", err);
    return [];
  }
}

function saveStoredTests(tests) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tests, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing tests.json:", err);
    return false;
  }
}

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS Headers for cross-origin or local requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  // API Route: GET /api/tests
  if (url.pathname === "/api/tests" && req.method === "GET") {
    const tests = getStoredTests();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(tests));
    return;
  }

  // API Route: POST /api/tests (Save / Update all tests)
  if (url.pathname === "/api/tests" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        let testsToSave = [];
        if (Array.isArray(payload)) {
          testsToSave = payload;
        } else if (payload && Array.isArray(payload.tests)) {
          testsToSave = payload.tests;
        } else if (payload && payload.id) {
          // Single test created or updated
          const current = getStoredTests();
          const idx = current.findIndex((t) => t.id === payload.id);
          if (idx >= 0) {
            current[idx] = payload;
          } else {
            current.unshift(payload);
          }
          testsToSave = current;
        }

        saveStoredTests(testsToSave);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: testsToSave.length, tests: testsToSave }));
      } catch (err) {
        console.error("Invalid JSON in POST /api/tests:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    });
    return;
  }

  // Static site fallback for production React app
  return handler(req, res, {
    public: "dist",
    rewrites: [
      { source: "**", destination: "/index.html" },
    ],
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
