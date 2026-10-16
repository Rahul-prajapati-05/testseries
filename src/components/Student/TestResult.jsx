import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  BookOpen,
  Check,
  X,
  Target,
  TrendingUp,
  FileText
} from "lucide-react";

export default function TestResult({ result, onRetake, onBackToDashboard }) {
  const { test, answers, timeSpentSeconds, submittedAt } = result;
  const questions = test.questions || [];

  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "correct" | "incorrect" | "skipped"

  // Calculate detailed scorecard
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;

  const evaluatedQuestions = questions.map((q, idx) => {
    const selectedOption = answers[q.id];
    const isAnswered = selectedOption !== undefined;
    const isCorrect = isAnswered && selectedOption === q.correctOption;
    const isIncorrect = isAnswered && selectedOption !== q.correctOption;
    const isSkipped = !isAnswered;

    if (isCorrect) correctCount++;
    else if (isIncorrect) incorrectCount++;
    else skippedCount++;

    return {
      ...q,
      index: idx,
      selectedOption,
      isAnswered,
      isCorrect,
      isIncorrect,
      isSkipped,
    };
  });

  const positiveMarks = test.positiveMarks || 1;
  const negativeMarks = test.negativeMarks || 0;
  const maxPossibleMarks = questions.length * positiveMarks;

  const rawScore = correctCount * positiveMarks - incorrectCount * negativeMarks;
  const finalScore = Math.max(0, Number(rawScore.toFixed(2)));
  const percentage = maxPossibleMarks > 0 ? ((finalScore / maxPossibleMarks) * 100).toFixed(1) : 0;
  const attemptedCount = correctCount + incorrectCount;
  const accuracy = attemptedCount > 0 ? ((correctCount / attemptedCount) * 100).toFixed(1) : 0;

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const filteredQuestions = evaluatedQuestions.filter((q) => {
    if (activeFilter === "correct") return q.isCorrect;
    if (activeFilter === "incorrect") return q.isIncorrect;
    if (activeFilter === "skipped") return q.isSkipped;
    return true;
  });

  return (
    <div className="result-page">
      {/* Result Hero Header */}
      <div className="result-hero-card">
        <div className="result-header-badge">
          <Award size={18} /> Performance Scorecard & Analysis
        </div>
        <h1 className="result-title">{test.title}</h1>
        <p className="result-sub">
          Submitted on: {new Date(submittedAt).toLocaleString("en-US")} | Subject / Category: {test.category}
        </p>

        {/* Score Highlight Box */}
        <div className="score-summary-grid">
          <div className="score-main-box">
            <span className="score-label">Total Score Achieved</span>
            <div className="score-num-display">
              <span className="score-val">{finalScore}</span>
              <span className="score-max">/ {maxPossibleMarks}</span>
            </div>
            <div className="score-percentage-pill">
              <TrendingUp size={14} /> Percentage: <strong>{percentage}%</strong>
            </div>
          </div>

          <div className="score-stats-grid">
            <div className="stat-card stat-correct">
              <div className="stat-icon-wrapper">
                <CheckCircle2 size={24} className="text-emerald" />
              </div>
              <div className="stat-info">
                <span className="stat-digit">{correctCount}</span>
                <span className="stat-name">Correct Answers</span>
              </div>
            </div>

            <div className="stat-card stat-incorrect">
              <div className="stat-icon-wrapper">
                <XCircle size={24} className="text-rose" />
              </div>
              <div className="stat-info">
                <span className="stat-digit">{incorrectCount}</span>
                <span className="stat-name">Incorrect Answers</span>
              </div>
            </div>

            <div className="stat-card stat-skipped">
              <div className="stat-icon-wrapper">
                <HelpCircle size={24} className="text-amber" />
              </div>
              <div className="stat-info">
                <span className="stat-digit">{skippedCount}</span>
                <span className="stat-name">Skipped / Unattempted</span>
              </div>
            </div>

            <div className="stat-card stat-accuracy">
              <div className="stat-icon-wrapper">
                <Target size={24} className="text-primary" />
              </div>
              <div className="stat-info">
                <span className="stat-digit">{accuracy}%</span>
                <span className="stat-name">Accuracy Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Meta Strip */}
        <div className="result-meta-strip">
          <span>
            <Clock size={16} /> Time Taken: <strong>{formatDuration(timeSpentSeconds)}</strong>
          </span>
          <span>
            Marking Scheme: <strong>+{positiveMarks} / -{negativeMarks}</strong>
          </span>
          <div className="result-top-actions">
            <button type="button" className="btn-retake" onClick={() => onRetake(test)}>
              <RotateCcw size={16} /> Retake Test
            </button>
            <button type="button" className="btn-dashboard" onClick={onBackToDashboard}>
              <BookOpen size={16} /> Test Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Solution / Answer Key Section */}
      <div className="solutions-section">
        <div className="solutions-header">
          <div>
            <h2 className="solutions-title">
              <FileText size={20} className="inline-mr text-primary" />
              Detailed Answer Key & Solutions
            </h2>
            <p className="solutions-sub">
              Review each question's official correct option (A, B, C, D) and comprehensive explanations below.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="solution-filters">
            <button
              type="button"
              className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All Questions ({questions.length})
            </button>
            <button
              type="button"
              className={`filter-btn filter-correct ${activeFilter === "correct" ? "active" : ""}`}
              onClick={() => setActiveFilter("correct")}
            >
              Correct ({correctCount})
            </button>
            <button
              type="button"
              className={`filter-btn filter-wrong ${activeFilter === "incorrect" ? "active" : ""}`}
              onClick={() => setActiveFilter("incorrect")}
            >
              Incorrect ({incorrectCount})
            </button>
            <button
              type="button"
              className={`filter-btn filter-skipped ${activeFilter === "skipped" ? "active" : ""}`}
              onClick={() => setActiveFilter("skipped")}
            >
              Skipped ({skippedCount})
            </button>
          </div>
        </div>

        {/* Questions Solution Cards List */}
        <div className="solutions-list">
          {filteredQuestions.map((q) => {
            const statusLabel = q.isCorrect ? "Correct" : q.isIncorrect ? "Incorrect" : "Skipped";
            const statusClass = q.isCorrect ? "badge-ans-correct" : q.isIncorrect ? "badge-ans-wrong" : "badge-ans-skipped";

            return (
              <div key={q.id} className="solution-card">
                <div className="solution-card-top">
                  <div className="q-badge-box">
                    <span className="sol-qnum">Question {q.index + 1}</span>
                    <span className={`sol-status-pill ${statusClass}`}>{statusLabel}</span>
                  </div>

                  <div className="sol-score-indicator">
                    {q.isCorrect ? (
                      <span className="text-emerald">+{positiveMarks} Marks</span>
                    ) : q.isIncorrect ? (
                      <span className="text-rose">-{negativeMarks} Marks</span>
                    ) : (
                      <span className="text-muted">0 Marks</span>
                    )}
                  </div>
                </div>

                <div className="sol-question-prompt">
                  <p>{q.text}</p>
                </div>

                {/* 4 Options Grid */}
                <div className="sol-options-grid">
                  {q.options.map((optionText, optIdx) => {
                    const isCandidateChoice = q.selectedOption === optIdx;
                    const isOfficialCorrect = q.correctOption === optIdx;

                    let optCardClass = "sol-opt-default";
                    if (isOfficialCorrect) {
                      optCardClass = "sol-opt-correct"; // Green
                    } else if (isCandidateChoice && !isOfficialCorrect) {
                      optCardClass = "sol-opt-wrong"; // Red
                    }

                    return (
                      <div key={optIdx} className={`sol-option-item ${optCardClass}`}>
                        <div className="sol-opt-head">
                          <span className="sol-opt-letter">
                            {String.fromCharCode(65 + optIdx)}
                          </span>

                          <div className="sol-opt-tags">
                            {isOfficialCorrect && (
                              <span className="official-correct-chip">
                                <Check size={14} /> Official Answer
                              </span>
                            )}
                            {isCandidateChoice && !isOfficialCorrect && (
                              <span className="candidate-wrong-chip">
                                <X size={14} /> Your Choice
                              </span>
                            )}
                            {isCandidateChoice && isOfficialCorrect && (
                              <span className="candidate-correct-chip">
                                <Check size={14} /> Your Choice (Correct)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="sol-opt-body">{optionText}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="sol-explanation-box">
                    <div className="exp-header">
                      <strong>💡 Detailed Explanation & Rationale:</strong>
                    </div>
                    <p className="exp-content">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
