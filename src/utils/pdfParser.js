import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set worker source for pdfjs
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Extracts raw text from an uploaded PDF File
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Reconstruct text items taking layout/newlines into account
      let lastY;
      let pageText = "";
      for (const item of textContent.items) {
        if (!item.str) continue;
        if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += "\n";
        } else if (pageText && !pageText.endsWith(" ") && !item.str.startsWith(" ")) {
          pageText += " ";
        }
        pageText += item.str;
        lastY = item.transform[5];
      }
      fullText += pageText + "\n\n";
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction error:", error);
    throw new Error("Unable to read PDF file. Please ensure the file is a valid, readable text PDF.");
  }
}

/**
 * Smart Question & Option Parser from plain text extracted from PDF
 * Detects Questions, 4 Options (A, B, C, D), and Correct Answer
 * @param {string} rawText
 * @returns {Array<Object>} List of parsed question objects
 */
export function parseQuestionsFromText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  // 1. Check if there is an Answer Key section at the bottom
  const answerKeyMap = extractAnswerKey(rawText);

  // Normalize text lines
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Join lines back with unified newlines
  const text = lines.join("\n");

  // Regex to detect start of a question:
  // e.g.: "Q1.", "Q 1:", "Question 1:", "1.", "1)" at start of a line
  const questionSplitter = /(?:^|\n)(?:(?:Q(?:uestion)?|प्रश्न)?\s*[\.\:\-\)]?\s*(\d+)[\.\:\)\-]|(\d+)[\.\)\-]\s+)/gi;

  const matches = [];
  let match;
  while ((match = questionSplitter.exec(text)) !== null) {
    const qNum = parseInt(match[1] || match[2], 10);
    matches.push({
      index: match.index,
      matchedLength: match[0].length,
      qNum: qNum,
    });
  }

  const rawBlocks = [];
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const startPos = current.index + current.matchedLength;
      const endPos = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const blockText = text.substring(startPos, endPos).trim();
      rawBlocks.push({
        qNum: current.qNum,
        content: blockText,
      });
    }
  } else {
    // If no numbered questions detected, split by double newlines
    const chunks = text.split(/\n\s*\n/);
    chunks.forEach((chunk, i) => {
      if (chunk.trim().length > 10) {
        rawBlocks.push({ qNum: i + 1, content: chunk.trim() });
      }
    });
  }

  // Parse each block into { text, options: [A, B, C, D], correctOption, explanation }
  const parsedQuestions = [];

  rawBlocks.forEach((block, idx) => {
    const parsed = parseSingleQuestionBlock(block.content, block.qNum || idx + 1, answerKeyMap);
    if (parsed) {
      parsedQuestions.push(parsed);
    }
  });

  return parsedQuestions;
}

/**
 * Extracts Answer Key if present at the end of text
 * e.g., "Answer Key: 1-A, 2-B, 3-C" or "1. (A) 2. (B)"
 */
function extractAnswerKey(fullText) {
  const map = {};
  const keyHeaderMatch = /(?:ANSWER\s*KEY|ANSWERS|उत्तर\s*कुंजी)[\s\S]*$/i.exec(fullText);
  if (keyHeaderMatch) {
    const keySection = keyHeaderMatch[0];
    const keyRegex = /(\d+)[\.\:\-\s]+(?:\()?([A-Da-d1-4])(?:\))?/g;
    let m;
    while ((m = keyRegex.exec(keySection)) !== null) {
      const qNum = parseInt(m[1], 10);
      const ansChar = m[2].toUpperCase();
      const optionIndex = convertLetterToIndex(ansChar);
      if (optionIndex !== -1) {
        map[qNum] = optionIndex;
      }
    }
  }
  return map;
}

/**
 * Parses individual question block into question prompt, 4 options, correct answer, and explanation
 */
function parseSingleQuestionBlock(rawBlock, qNum, answerKeyMap = {}) {
  let content = rawBlock;

  // Extract Explanation / Solution if mentioned
  let explanation = "";
  const expMatch = /(?:Explanation|Solution|Notes|हल|विस्तार)[\s\:\-]+([\s\S]*)$/i.exec(content);
  if (expMatch) {
    explanation = expMatch[1].trim();
    content = content.substring(0, expMatch.index).trim();
  }

  // Extract inline Answer if mentioned
  // e.g. "Ans: B", "Answer: (C)", "Correct Option: 2", "Key: A"
  let correctOption = answerKeyMap[qNum] !== undefined ? answerKeyMap[qNum] : 0;
  const ansMatch = /(?:Ans(?:wer)?|Correct(?:\s+Option)?|Key|उत्तर)[\s\:\-\=]+(?:\()?([A-Da-d1-4])(?:\))?/i.exec(content);
  if (ansMatch) {
    const matchedAns = ansMatch[1].toUpperCase();
    const converted = convertLetterToIndex(matchedAns);
    if (converted !== -1) {
      correctOption = converted;
    }
    // Remove answer line from content so it doesn't pollute options
    content = content.replace(ansMatch[0], "").trim();
  }

  // Find Options:
  // Pattern matches:
  // (A) ... (B) ... (C) ... (D) or A. ... B. ... C. ... D. or 1) ... 2) ...
  const optRegex = /(?:^|\n|\s{2,}|\t)(?:\(?([A-Da-d1-4])\)|\b([A-Da-d1-4])[\.\)])\s+/g;
  const optMatches = [];
  let om;

  while ((om = optRegex.exec(content)) !== null) {
    const label = (om[1] || om[2]).toUpperCase();
    optMatches.push({
      index: om.index,
      length: om[0].length,
      label: label,
      optionIndex: convertLetterToIndex(label),
    });
  }

  let questionText = "";
  let options = ["", "", "", ""];

  if (optMatches.length >= 2) {
    // First option starts at optMatches[0].index
    questionText = content.substring(0, optMatches[0].index).trim();

    // Extract each option text
    for (let i = 0; i < optMatches.length; i++) {
      const current = optMatches[i];
      const nextIndex = i + 1 < optMatches.length ? optMatches[i + 1].index : content.length;
      const optText = content.substring(current.index + current.length, nextIndex).trim();

      if (current.optionIndex >= 0 && current.optionIndex < 4) {
        options[current.optionIndex] = optText;
      } else if (i < 4) {
        options[i] = optText;
      }
    }
  } else {
    // Fallback if options couldn't be parsed automatically
    questionText = content.trim();
    options = [
      "Option A (Edit in wizard)",
      "Option B (Edit in wizard)",
      "Option C (Edit in wizard)",
      "Option D (Edit in wizard)",
    ];
  }

  // Ensure 4 non-empty options
  const defaultLabels = ["Option A", "Option B", "Option C", "Option D"];
  for (let i = 0; i < 4; i++) {
    if (!options[i] || !options[i].trim()) {
      options[i] = defaultLabels[i];
    }
  }

  // Clean up question text
  questionText = questionText.replace(/^[\s\d\.\:\-\)]+/, "").trim();
  if (!questionText) {
    questionText = `Question ${qNum}`;
  }

  return {
    id: `pdf-q-${Date.now()}-${qNum}-${Math.random().toString(36).substring(2, 6)}`,
    text: questionText,
    options: options.slice(0, 4), // Exactly 4 options
    correctOption: Math.min(Math.max(correctOption, 0), 3), // 5th field: 0 to 3 (A, B, C, D)
    explanation: explanation || "",
  };
}

function convertLetterToIndex(char) {
  if (char === "A" || char === "1") return 0;
  if (char === "B" || char === "2") return 1;
  if (char === "C" || char === "3") return 2;
  if (char === "D" || char === "4") return 3;
  return -1;
}

/**
 * Creates and downloads a sample formatted test questions text file that users can
 * test with PDF conversion or file upload directly.
 */
export function getSampleQuestionPaperText() {
  return `=== SAMPLE QUESTION PAPER FOR UPLOAD TEST ===

1. Which planet in our Solar System is known as the 'Red Planet'?
(A) Venus
(B) Mars
(C) Jupiter
(D) Saturn
Ans: B
Explanation: Mars is called the Red Planet because iron minerals in the Martian soil oxidize (rust), giving the surface a reddish appearance.

2. Which organelle is famously known as the 'Powerhouse of the Cell'?
(A) Ribosome
(B) Mitochondria
(C) Golgi Apparatus
(D) Lysosome
Ans: B
Explanation: Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions (stored in ATP).

3. What does CPU stand for in computer science?
(A) Central Power Unit
(B) Central Processing Unit
(C) Computer Protocol Utility
(D) Core Processor Utility
Ans: B
Explanation: CPU stands for Central Processing Unit and executes instructions comprising a computer program.

4. Find the next number in the sequence: 5, 11, 23, 47, ?
(A) 92
(B) 94
(C) 95
(D) 96
Ans: C
Explanation: The pattern is (x * 2) + 1: 5*2+1=11, 11*2+1=23, 23*2+1=47, 47*2+1=95.

5. On which day is World Environment Day observed globally?
(A) June 5
(B) April 22
(C) September 16
(D) October 24
Ans: A
Explanation: World Environment Day is celebrated annually on June 5 and is the United Nations' principal vehicle for encouraging worldwide awareness and action for the environment.
`;
}
