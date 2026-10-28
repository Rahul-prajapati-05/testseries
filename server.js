import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "serve-handler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "tests.json");

const DEFAULT_TESTS = [
  {
    id: "test-1792172104880",
    title: "ssc",
    category: "General",
    durationMinutes: 1,
    positiveMarks: 4,
    negativeMarks: 1,
    description: "Standard Mock Test Series",
    questions: [
      {
        id: "q-1792172283681-bxud",
        text: "एक वस्तु का क्रय मूल्य ₹500 है और विक्रय मूल्य ₹600 है। लाभ प्रतिशत कितना है?",
        options: ["10", "20", "30", "40"],
        correctOption: 1,
        explanation: "क्रय मूल्य = ₹500, विक्रय मूल्य = ₹600। लाभ = 600 - 500 = ₹100। लाभ प्रतिशत = (100 / 500) × 100 = 20%."
      }
    ]
  },
  {
    id: "test-cgl-gk-01",
    title: "General Awareness & Science Mock Championship 2026",
    category: "General Knowledge",
    durationMinutes: 15,
    positiveMarks: 2,
    negativeMarks: 0.5,
    description: "Comprehensive practice test covering General Science, World Geography, Indian Polity, and History.",
    questions: [
      {
        id: "q-101",
        text: "Which of the following metals remains in liquid state at normal room temperature?",
        options: ["Sodium", "Mercury", "Potassium", "Bromine"],
        correctOption: 1,
        explanation: "Mercury (Hg) is the only metal that is liquid at standard room temperature. Bromine is a liquid at room temperature, but it is a non-metal."
      },
      {
        id: "q-102",
        text: "Which layer of the Earth's atmosphere is home to almost all weather phenomena like clouds and rain?",
        options: ["Stratosphere", "Troposphere", "Mesosphere", "Thermosphere"],
        correctOption: 1,
        explanation: "The troposphere is the lowest atmospheric layer containing roughly 75% of the atmosphere's mass and almost all weather events."
      },
      {
        id: "q-103",
        text: "Which cell organelle is widely known as the 'Powerhouse of the Cell'?",
        options: ["Ribosome", "Mitochondria", "Golgi Apparatus", "Lysosome"],
        correctOption: 1,
        explanation: "Mitochondria produce cellular energy in the form of ATP through aerobic respiration."
      },
      {
        id: "q-104",
        text: "What is the primary function of the Central Processing Unit (CPU) in a computer?",
        options: [
          "To provide permanent secondary storage",
          "To execute instructions and perform calculations",
          "To display high-resolution graphics only",
          "To supply electrical power to components"
        ],
        correctOption: 1,
        explanation: "The CPU is the central brain of a computer system that fetches, decodes, and executes program instructions."
      },
      {
        id: "q-105",
        text: "On which date is International Yoga Day celebrated globally every year?",
        options: ["June 5", "June 21", "August 15", "December 1"],
        correctOption: 1,
        explanation: "International Yoga Day is observed worldwide annually on June 21."
      }
    ]
  },
  {
    id: "test-reasoning-02",
    title: "Logical Reasoning & Mental Ability Speed Test",
    category: "Reasoning",
    durationMinutes: 10,
    positiveMarks: 1,
    negativeMarks: 0.25,
    description: "Speed test testing Coding-Decoding, Number Series, Analogies, and Deductive Reasoning.",
    questions: [
      {
        id: "q-201",
        text: "Find the missing number in the given sequence: 2, 6, 12, 20, 30, ?",
        options: ["40", "42", "44", "46"],
        correctOption: 1,
        explanation: "Pattern: The differences between consecutive numbers increase by 2: +4, +6, +8, +10, so +12 -> 42."
      },
      {
        id: "q-202",
        text: "In a certain code language, if 'CAT' is coded as '3120', how will 'DOG' be coded?",
        options: ["4157", "4147", "4158", "3157"],
        correctOption: 0,
        explanation: "Each letter is represented by its alphabetical rank: C=3, A=1, T=20 -> 3120. D=4, O=15, G=7 -> 4157."
      },
      {
        id: "q-203",
        text: "Select the odd one out from the given four options:",
        options: ["Carrot", "Potato", "Ginger", "Tomato"],
        correctOption: 3,
        explanation: "Tomato grows above ground and is botanically a fruit, while the others grow underground."
      },
      {
        id: "q-204",
        text: "Pointing to a photograph, Rohit said, 'She is the only daughter of my grandfather's only son.' How is Rohit related to the girl?",
        options: ["Father", "Brother", "Cousin", "Uncle"],
        correctOption: 1,
        explanation: "Rohit's grandfather's only son is Rohit's father. The only daughter of his father is his sister."
      }
    ]
  },
  {
    id: "test-computer-03",
    title: "Computer Science & IT Fundamentals Test",
    category: "Computer Science",
    durationMinutes: 12,
    positiveMarks: 1,
    negativeMarks: 0.25,
    description: "Core test covering Computer Memory, Operating Systems, Networking, and Web Technologies.",
    questions: [
      {
        id: "q-301",
        text: "Which of the following computer memories is volatile in nature?",
        options: ["ROM", "RAM", "Hard Disk Drive", "Flash USB Drive"],
        correctOption: 1,
        explanation: "RAM is volatile memory; it loses all stored data when the system is powered off."
      },
      {
        id: "q-302",
        text: "What does HTML stand for in web development?",
        options: [
          "High Text Markup Language",
          "Hyper Text Markup Language",
          "Hyperlink and Text Management Language",
          "Home Tool Markup Language"
        ],
        correctOption: 1,
        explanation: "HTML stands for 'Hyper Text Markup Language'."
      },
      {
        id: "q-303",
        text: "How many Megabytes (MB) make up exactly 1 Gigabyte (GB) in standard binary computing?",
        options: ["1000 MB", "1024 MB", "1048 MB", "512 MB"],
        correctOption: 1,
        explanation: "1 Gigabyte (GB) = 1024 Megabytes (MB)."
      }
    ]
  }
];

// Helper to ensure data directory and file exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let shouldSeed = false;
  if (!fs.existsSync(DATA_FILE)) {
    shouldSeed = true;
  } else {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf-8").trim();
      if (!raw || raw === "[]" || raw === "") {
        shouldSeed = true;
      }
    } catch {
      shouldSeed = true;
    }
  }
  if (shouldSeed) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_TESTS, null, 2), "utf-8");
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
