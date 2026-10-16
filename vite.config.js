import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const DATA_FILE = path.resolve(process.cwd(), "data", "tests.json");

function apiMiddleware() {
  return {
    name: "api-tests-middleware",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/tests") {
          if (req.method === "GET") {
            try {
              if (!fs.existsSync(DATA_FILE)) {
                fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
                fs.writeFileSync(DATA_FILE, "[]", "utf-8");
              }
              const data = fs.readFileSync(DATA_FILE, "utf-8");
              res.setHeader("Content-Type", "application/json");
              res.end(data);
              return;
            } catch (err) {
              res.setHeader("Content-Type", "application/json");
              res.end("[]");
              return;
            }
          }

          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              try {
                const parsed = JSON.parse(body);
                fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
                fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), "utf-8");
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiMiddleware()],
});
