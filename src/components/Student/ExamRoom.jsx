import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock,
  CheckCircle2,
  Bookmark,
  RotateCcw,
  ArrowLeft,
  Send,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";

export default function ExamRoom({ test, onFinishTest, onExit }) {
  const questions = test.questions || [];
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  // Answers state: { [qId]: selectedOptionIndex (0 to 3) }
  const [answers, setAnswers] = useState({});
  // Status flags: { [qId]: "answered" | "not_answered" | "marked" | "answered_marked" | "not_visited" }
  const [statusMap, setStatusMap] = useState(() => {
    const init = {};
    questions.forEach((q, idx) => {
      init[q.id] = idx === 0 ? "not_answered" : "not_visited";
    });
    return init;
  });

  // Timer in seconds
  const totalSeconds = (test.durationMinutes || 15) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);

  const timerRef = useRef(null);

  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const timeSpentSeconds = totalSeconds - timeLeft;
    onFinishTest({
      test,
      answers,
      timeSpentSeconds,
      submittedAt: new Date().toISOString(),
    });
  }, [test, answers, totalSeconds, timeLeft, onFinishTest]);

  const handleAutoSubmit = useCallback(() => {
    alert("Time has expired! Your test is being submitted automatically.");
    submitExam();
  }, [submitExam]);

  // Timer Countdown Effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleAutoSubmit]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentIndex];
  const currentSelectedOption = currentQuestion ? answers[currentQuestion.id] : undefined;

  // Question selection handler
  const handleOptionSelect = (optionIndex) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  // Clear Response for current question
  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });

    setStatusMap((prev) => ({
      ...prev,
      [currentQuestion.id]: "not_answered",
    }));
  };

  // Save & Next
  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    const hasAnswer = answers[currentQuestion.id] !== undefined;

    setStatusMap((prev) => ({
      ...prev,
      [currentQuestion.id]: hasAnswer ? "answered" : "not_answered",
    }));

    if (currentIndex < totalQuestions - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  // Mark for Review & Next
  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    const hasAnswer = answers[currentQuestion.id] !== undefined;

    setStatusMap((prev) => ({
      ...prev,
      [currentQuestion.id]: hasAnswer ? "answered_marked" : "marked",
    }));

    if (currentIndex < totalQuestions - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  // Previous
  const handlePrevious = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  // Navigate to Question by index
  const goToQuestion = (targetIndex) => {
    const targetQ = questions[targetIndex];
    if (!targetQ) return;

    setStatusMap((prev) => {
      if (prev[targetQ.id] === "not_visited") {
        return { ...prev, [targetQ.id]: "not_answered" };
      }
      return prev;
    });

    setCurrentIndex(targetIndex);
    setShowPaletteMobile(false);
  };

  // Calculate statistics for submit modal
  const getStats = () => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredMarked = 0;
    let notVisited = 0;

    questions.forEach((q) => {
      const st = statusMap[q.id] || "not_visited";
      if (st === "answered") answered++;
      else if (st === "not_answered") notAnswered++;
      else if (st === "marked") marked++;
      else if (st === "answered_marked") answeredMarked++;
      else notVisited++;
    });

    return {
      answered: answered + answeredMarked,
      unattempted: notAnswered + notVisited + marked,
      marked: marked + answeredMarked,
      total: totalQuestions,
    };
  };

  const stats = getStats();
  const isTimeCritical = timeLeft < 180; // less than 3 minutes

  if (!currentQuestion) {
    return (
      <div className="exam-container">
        <div className="empty-state-box">
          <p>No questions available in this test.</p>
          <button type="button" className="btn-secondary" onClick={onExit}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-app">
      {/* Exam Header */}
      <header className="exam-header">
        <div className="exam-header-left">
          <button type="button" className="btn-exit-exam" onClick={onExit} title="Exit Test">
            <ArrowLeft size={18} />
            <span className="hidden-sm">Test Catalog</span>
          </button>
          <div className="exam-test-info">
            <h2 className="exam-title">{test.title}</h2>
            <span className="exam-tag">{test.category}</span>
          </div>
        </div>

        <div className="exam-header-right">
          {/* Timer Display */}
          <div className={`exam-timer-pill ${isTimeCritical ? "timer-warning" : ""}`}>
            <Clock size={18} className="timer-icon" />
            <div className="timer-text-group">
              <span className="timer-label">Time Remaining:</span>
              <span className="timer-digits">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-submit-exam"
            onClick={() => setShowSubmitModal(true)}
          >
            <Send size={16} />
            <span>Submit Test</span>
          </button>

          <button
            type="button"
            className="btn-mobile-palette-toggle"
            onClick={() => setShowPaletteMobile(!showPaletteMobile)}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Main Exam Body: Split View (Question Left + Palette Right) */}
      <div className="exam-body">
        {/* Left: Active Question Area */}
        <main className="exam-main-panel">
          <div className="question-header-strip">
            <div className="q-badge-info">
              <span className="q-number-big">Question {currentIndex + 1}</span>
              <span className="q-total-small">of {totalQuestions}</span>
            </div>

            <div className="q-marks-tag">
              <span className="marks-pos">+{test.positiveMarks} Marks</span>
              <span className="marks-neg">-{test.negativeMarks} Marks</span>
            </div>
          </div>

          {/* Question Text */}
          <div className="question-text-container">
            <p className="question-prompt-text">{currentQuestion.text}</p>
          </div>

          {/* 4 Options Radio Cards */}
          <div className="options-selection-container">
            <div className="options-list">
              {currentQuestion.options.map((opt, optIndex) => {
                const isSelected = currentSelectedOption === optIndex;
                const letter = String.fromCharCode(65 + optIndex);
                return (
                  <button
                    key={optIndex}
                    type="button"
                    className={`exam-option-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleOptionSelect(optIndex)}
                  >
                    <div className={`opt-indicator ${isSelected ? "indicator-checked" : ""}`}>
                      {letter}
                    </div>
                    <div className="opt-content-text">{opt}</div>
                    {isSelected && (
                      <div className="opt-selected-check">
                        <CheckCircle2 size={20} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls Footer */}
          <footer className="exam-action-footer">
            <div className="footer-left-buttons">
              <button
                type="button"
                className="btn-exam-action btn-mark-review"
                onClick={handleMarkForReview}
              >
                <Bookmark size={16} />
                <span>Mark for Review & Next</span>
              </button>

              <button
                type="button"
                className="btn-exam-action btn-clear-resp"
                onClick={handleClearResponse}
                disabled={currentSelectedOption === undefined}
              >
                <RotateCcw size={16} />
                <span>Clear Selection</span>
              </button>
            </div>

            <div className="footer-right-buttons">
              <button
                type="button"
                className="btn-exam-nav btn-prev"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={18} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                className="btn-exam-nav btn-save-next"
                onClick={handleSaveAndNext}
              >
                <span>Save & Next</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </footer>
        </main>

        {/* Right: Question Navigation Palette */}
        <aside className={`exam-palette-sidebar ${showPaletteMobile ? "open" : ""}`}>
          <div className="palette-header">
            <h3 className="palette-title">Question Palette</h3>
            <button
              type="button"
              className="btn-close-sidebar"
              onClick={() => setShowPaletteMobile(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Legend Guide */}
          <div className="palette-legend-grid">
            <div className="legend-item">
              <span className="legend-circle bg-answered">
                {stats.answered}
              </span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-circle bg-not-answered">
                {totalQuestions - stats.answered}
              </span>
              <span>Not Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-circle bg-marked">{stats.marked}</span>
              <span>Marked for Review</span>
            </div>
            <div className="legend-item">
              <span className="legend-circle bg-not-visited">
                {questions.filter((q) => statusMap[q.id] === "not_visited").length}
              </span>
              <span>Not Visited</span>
            </div>
          </div>

          {/* Palette Number Buttons Grid */}
          <div className="palette-buttons-scroll">
            <div className="palette-buttons-grid">
              {questions.map((q, qIndex) => {
                const st = statusMap[q.id] || "not_visited";
                const isCurrent = currentIndex === qIndex;
                const hasAnswer = answers[q.id] !== undefined;

                let statusClass = "pal-not-visited";
                if (st === "answered" || hasAnswer) statusClass = "pal-answered";
                else if (st === "not_answered") statusClass = "pal-not-answered";
                else if (st === "marked") statusClass = "pal-marked";
                else if (st === "answered_marked") statusClass = "pal-answered-marked";

                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`palette-num-btn ${statusClass} ${isCurrent ? "current-active" : ""}`}
                    onClick={() => goToQuestion(qIndex)}
                  >
                    {qIndex + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Footer Submit */}
          <div className="palette-sidebar-footer">
            <button
              type="button"
              className="btn-submit-sidebar"
              onClick={() => setShowSubmitModal(true)}
            >
              <Send size={16} /> Submit Complete Test
            </button>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">
                <AlertTriangle size={20} className="text-amber-500 inline-mr" />
                Submit Test Confirmation
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowSubmitModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="confirm-note">
                Are you sure you want to submit your test? Once submitted, you cannot change your responses.
              </p>

              <div className="submit-summary-table">
                <div className="summary-row">
                  <span>Total Questions:</span>
                  <strong>{totalQuestions}</strong>
                </div>
                <div className="summary-row text-emerald">
                  <span>Attempted Questions:</span>
                  <strong>{stats.answered}</strong>
                </div>
                <div className="summary-row text-rose">
                  <span>Unattempted Questions:</span>
                  <strong>{totalQuestions - stats.answered}</strong>
                </div>
                <div className="summary-row text-purple">
                  <span>Marked for Review:</span>
                  <strong>{stats.marked}</strong>
                </div>
                <div className="summary-row">
                  <span>Time Left:</span>
                  <strong>{formatTime(timeLeft)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSubmitModal(false)}
              >
                Resume Test
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={submitExam}
              >
                <CheckCircle2 size={18} /> Confirm & Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
