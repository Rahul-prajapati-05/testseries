import React, { useState, useRef } from "react";
import {
  PlusCircle,
  FileUp,
  CheckCircle2,
  Trash2,
  Edit3,
  Layers,
  Clock,
  Award,
  ArrowUp,
  ArrowDown,
  Sparkles,
  BookOpen,
  FileText,
  Download,
  Check,
  X,
  ListOrdered,
  Search,
  Share2
} from "lucide-react";
import { extractTextFromPdf, parseQuestionsFromText, getSampleQuestionPaperText } from "../../utils/pdfParser";

export default function AdminPanel({
  tests,
  activeTestId,
  onSelectTest,
  onCreateTest,
  onUpdateTest,
  onDeleteTest,
  onResetDefaults,
  onShareTest,
  showToast,
}) {
  const activeTest = tests.find((t) => t.id === activeTestId) || tests[0];

  // Tab state within Admin: "add-single" | "upload-pdf" | "view-questions"
  const [activeTab, setActiveTab] = useState("add-single");

  // Single Question Form State (Every question has 4 options + 5th field for correct option)
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState(0); // 0 = A, 1 = B, 2 = C, 3 = D (5th field)
  const [explanation, setExplanation] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // PDF Upload & Extraction State
  const [pdfFile, setPdfFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [pdfRawText, setPdfRawText] = useState("");
  const fileInputRef = useRef(null);

  // Create Test Modal State
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newDuration, setNewDuration] = useState(15);
  const [newPositiveMarks, setNewPositiveMarks] = useState(2);
  const [newNegativeMarks, setNewNegativeMarks] = useState(0.5);
  const [newDescription, setNewDescription] = useState("");

  // Search/Filter in Questions
  const [searchTerm, setSearchTerm] = useState("");

  // -------------------------------------------------------------
  // HANDLERS FOR SINGLE QUESTION ADDITION (4 Options + 5th Correct Option)
  // -------------------------------------------------------------
  const handleSaveQuestion = (e) => {
    e.preventDefault();

    if (!questionText.trim()) {
      showToast("Please enter the question statement.", "error");
      return;
    }

    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      showToast("Please fill all 4 answer options (Option A, B, C, D).", "error");
      return;
    }

    const questionPayload = {
      id: editingQuestionId || `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: questionText.trim(),
      options: [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()],
      correctOption: Number(correctOption), // 5th field: selected correct option index (0 to 3)
      explanation: explanation.trim(),
    };

    let updatedQuestions = [];
    if (editingQuestionId) {
      updatedQuestions = activeTest.questions.map((q) =>
        q.id === editingQuestionId ? questionPayload : q
      );
      showToast("Question updated successfully!", "success");
    } else {
      updatedQuestions = [...activeTest.questions, questionPayload];
      showToast("New question added to test successfully!", "success");
    }

    onUpdateTest({
      ...activeTest,
      questions: updatedQuestions,
    });

    // Reset Form
    resetSingleQuestionForm();
  };

  const resetSingleQuestionForm = () => {
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption(0);
    setExplanation("");
    setEditingQuestionId(null);
  };

  const handleEditClick = (q) => {
    setQuestionText(q.text);
    setOptionA(q.options[0] || "");
    setOptionB(q.options[1] || "");
    setOptionC(q.options[2] || "");
    setOptionD(q.options[3] || "");
    setCorrectOption(q.correctOption ?? 0);
    setExplanation(q.explanation || "");
    setEditingQuestionId(q.id);
    setActiveTab("add-single");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleDeleteQuestion = (qId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      const updated = activeTest.questions.filter((q) => q.id !== qId);
      onUpdateTest({
        ...activeTest,
        questions: updated,
      });
      showToast("Question removed from test.", "info");
      if (editingQuestionId === qId) resetSingleQuestionForm();
    }
  };

  const handleMoveQuestion = (index, direction) => {
    const questions = [...activeTest.questions];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;
    onUpdateTest({ ...activeTest, questions });
  };

  // -------------------------------------------------------------
  // HANDLERS FOR PDF UPLOAD & AUTOMATIC EXTRACTION
  // -------------------------------------------------------------
  const handlePdfFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Please select a valid PDF (.pdf) file.", "error");
      return;
    }

    setPdfFile(file);
    await processPdf(file);
  };

  const processPdf = async (file) => {
    setIsExtracting(true);
    try {
      showToast("Extracting questions from PDF, please wait...", "info");
      const rawText = await extractTextFromPdf(file);
      setPdfRawText(rawText);

      const questions = parseQuestionsFromText(rawText);
      if (questions.length === 0) {
        showToast("No structured questions detected in PDF. You can also paste text directly to parse.", "error");
      } else {
        setExtractedQuestions(questions);
        setShowPdfPreviewModal(true);
        showToast(`Success! Extracted ${questions.length} questions from PDF. Please review.`, "success");
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Error reading PDF file.", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle direct text parse in case user pastes raw test paper
  const handleManualTextParse = () => {
    if (!pdfRawText.trim()) {
      showToast("Please enter or paste question text in the box.", "error");
      return;
    }
    const questions = parseQuestionsFromText(pdfRawText);
    if (questions.length === 0) {
      showToast("Could not recognize questions. Please use standard 1. (A) (B) (C) (D) Ans: format.", "error");
    } else {
      setExtractedQuestions(questions);
      setShowPdfPreviewModal(true);
      showToast(`${questions.length} questions successfully parsed!`, "success");
    }
  };

  // Edit in PDF Preview Modal before final import
  const handleExtractedQuestionEdit = (index, field, value) => {
    setExtractedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleExtractedOptionEdit = (qIndex, optIndex, value) => {
    setExtractedQuestions((prev) => {
      const copy = [...prev];
      const newOpts = [...copy[qIndex].options];
      newOpts[optIndex] = value;
      copy[qIndex] = { ...copy[qIndex], options: newOpts };
      return copy;
    });
  };

  const handleExtractedQuestionDelete = (index) => {
    setExtractedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmPdfImport = () => {
    if (extractedQuestions.length === 0) {
      showToast("No questions available to import.", "error");
      return;
    }

    const updatedQuestions = [...activeTest.questions, ...extractedQuestions];
    onUpdateTest({
      ...activeTest,
      questions: updatedQuestions,
    });

    showToast(`Successfully added ${extractedQuestions.length} questions to "${activeTest.title}"!`, "success");
    setShowPdfPreviewModal(false);
    setExtractedQuestions([]);
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setActiveTab("view-questions");
  };

  // Download Sample Questions TXT
  const handleDownloadSample = () => {
    const text = getSampleQuestionPaperText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Sample_Test_Questions_Format.txt";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Sample question format file downloaded.", "info");
  };

  // -------------------------------------------------------------
  // CREATE NEW TEST SERIES
  // -------------------------------------------------------------
  const handleCreateTestSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Please enter a test title.", "error");
      return;
    }

    const newTest = {
      id: `test-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory.trim() || "General",
      durationMinutes: Number(newDuration) || 15,
      positiveMarks: Number(newPositiveMarks) || 1,
      negativeMarks: Number(newNegativeMarks) || 0.25,
      description: newDescription.trim() || "Standard Mock Test Series",
      questions: [],
    };

    onCreateTest(newTest);
    setShowNewTestModal(false);
    setNewTitle("");
    setNewDescription("");
    showToast(`New test "${newTest.title}" created! Now you can add questions.`, "success");
  };

  // Filtered Questions for Search
  const filteredQuestions = (activeTest?.questions || []).filter(
    (q) =>
      q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.options.some((opt) => opt.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-page">
      {/* Top Banner & Test Selector */}
      <div className="admin-top-card">
        <div className="admin-header-row">
          <div>
            <div className="admin-badge-label">
              <Sparkles size={14} /> ADMIN QUESTION CONTROL CENTER
            </div>
            <h1 className="admin-title">Question Bank & Test Management</h1>
            <p className="admin-subtitle">
              Add individual questions with <strong>4 Options (A, B, C, D)</strong> and designate the <strong>5th field as the Correct Option</strong>, or upload questions directly from a <strong>PDF</strong>.
            </p>
          </div>

          <div className="admin-header-actions">
            {activeTest && (
              <button
                type="button"
                className="btn-share-test-header"
                onClick={() => onShareTest(activeTest)}
                title="Send direct test link to students on WhatsApp"
              >
                <Share2 size={16} />
                <span>Share Test Link</span>
              </button>
            )}
            <button
              type="button"
              className="btn-create-test"
              onClick={() => setShowNewTestModal(true)}
            >
              <PlusCircle size={18} />
              <span>Create New Test</span>
            </button>
            <button
              type="button"
              className="btn-outline-small"
              onClick={onResetDefaults}
              title="Reset default sample tests"
            >
              Reset Defaults
            </button>
          </div>
        </div>

        {/* Active Test Selector Bar */}
        <div className="active-test-strip">
          <div className="test-selector-group">
            <label className="test-selector-label">
              <BookOpen size={16} /> Active Test:
            </label>
            <select
              className="test-dropdown"
              value={activeTest?.id || ""}
              onChange={(e) => onSelectTest(e.target.value)}
            >
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.questions?.length || 0} Questions) - {t.category}
                </option>
              ))}
            </select>
          </div>

          {activeTest && (
            <div className="active-test-metrics">
              <span className="metric-pill">
                <ListOrdered size={15} /> <strong>{activeTest.questions.length}</strong> Questions
              </span>
              <span className="metric-pill">
                <Clock size={15} /> <strong>{activeTest.durationMinutes}</strong> Mins
              </span>
              <span className="metric-pill">
                <Award size={15} /> <strong>+{activeTest.positiveMarks} / -{activeTest.negativeMarks}</strong> Marks
              </span>
              {tests.length > 1 && (
                <button
                  type="button"
                  className="btn-delete-test-small"
                  onClick={() => onDeleteTest(activeTest.id)}
                  title="Delete this test series"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Admin Tabs */}
        <div className="admin-tab-nav">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "add-single" ? "active" : ""}`}
            onClick={() => setActiveTab("add-single")}
          >
            <PlusCircle size={18} />
            <span>Add Individual Question (4 Options + 5th Correct)</span>
            {editingQuestionId && <span className="tab-edit-indicator">Editing</span>}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "upload-pdf" ? "active" : ""}`}
            onClick={() => setActiveTab("upload-pdf")}
          >
            <FileUp size={18} />
            <span>Upload Questions via PDF (Auto Parser)</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "view-questions" ? "active" : ""}`}
            onClick={() => setActiveTab("view-questions")}
          >
            <Layers size={18} />
            <span>View Questions List ({activeTest?.questions.length || 0})</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* TAB 1: INDIVIDUAL QUESTION ADDITION (4 Options + 5th Correct Option) */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "add-single" && (
        <div className="admin-section-card">
          <div className="section-header-box">
            <div>
              <h2 className="section-title">
                {editingQuestionId ? "Edit Question" : "Add Individual Question"}
              </h2>
              <p className="section-sub">
                Specify <strong>4 options (Option A, B, C, D)</strong> and designate the <strong>5th field as the official Correct Option</strong>.
              </p>
            </div>
            {editingQuestionId && (
              <button
                type="button"
                className="btn-cancel-edit"
                onClick={resetSingleQuestionForm}
              >
                <X size={16} /> Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveQuestion} className="question-form">
            {/* Question Text Prompt */}
            <div className="form-group">
              <label className="form-label" htmlFor="q-statement">
                <span>1. Question Statement *</span>
                <span className="badge-required">Required</span>
              </label>
              <textarea
                id="q-statement"
                rows={3}
                className="form-textarea"
                placeholder="e.g. Which planet in our solar system is known as the Red Planet?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
              />
            </div>

            {/* 4 Options Fields */}
            <div className="options-container">
              <label className="form-label">
                <span>2. Four Answer Choices (4 Options: A, B, C, D) *</span>
                <span className="form-hint">Enter the text for each of the four options</span>
              </label>

              <div className="options-grid">
                {/* Option A */}
                <div className={`option-input-card ${correctOption === 0 ? "is-selected-correct" : ""}`}>
                  <div className="opt-letter-tag opt-a">A</div>
                  <input
                    type="text"
                    className="form-input opt-field"
                    placeholder="Enter Option A"
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    required
                  />
                </div>

                {/* Option B */}
                <div className={`option-input-card ${correctOption === 1 ? "is-selected-correct" : ""}`}>
                  <div className="opt-letter-tag opt-b">B</div>
                  <input
                    type="text"
                    className="form-input opt-field"
                    placeholder="Enter Option B"
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    required
                  />
                </div>

                {/* Option C */}
                <div className={`option-input-card ${correctOption === 2 ? "is-selected-correct" : ""}`}>
                  <div className="opt-letter-tag opt-c">C</div>
                  <input
                    type="text"
                    className="form-input opt-field"
                    placeholder="Enter Option C"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    required
                  />
                </div>

                {/* Option D */}
                <div className={`option-input-card ${correctOption === 3 ? "is-selected-correct" : ""}`}>
                  <div className="opt-letter-tag opt-d">D</div>
                  <input
                    type="text"
                    className="form-input opt-field"
                    placeholder="Enter Option D"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 5TH FIELD: CORRECT OPTION SELECTOR (Prominent, visual, intuitive) */}
            <div className="correct-option-container">
              <div className="correct-selector-header">
                <div>
                  <label className="form-label-prominent">
                    <CheckCircle2 size={20} className="text-emerald" />
                    <span>5. Select Correct Option (5th Field: Official Answer) *</span>
                  </label>
                  <p className="form-hint">
                    Which choice is the correct answer? Click one of the options below:
                  </p>
                </div>
                <div className="current-correct-badge">
                  Selected Correct Answer: <strong>Option {String.fromCharCode(65 + Number(correctOption))}</strong>
                </div>
              </div>

              <div className="correct-options-selector-grid">
                {[
                  { index: 0, label: "Option A", val: optionA || "Option A" },
                  { index: 1, label: "Option B", val: optionB || "Option B" },
                  { index: 2, label: "Option C", val: optionC || "Option C" },
                  { index: 3, label: "Option D", val: optionD || "Option D" },
                ].map((item) => {
                  const isCorrect = correctOption === item.index;
                  return (
                    <button
                      key={item.index}
                      type="button"
                      className={`correct-option-btn ${isCorrect ? "selected" : ""}`}
                      onClick={() => setCorrectOption(item.index)}
                    >
                      <div className="correct-btn-top">
                        <span className={`circle-badge ${isCorrect ? "badge-checked" : ""}`}>
                          {String.fromCharCode(65 + item.index)}
                        </span>
                        <span className="correct-btn-label">{item.label}</span>
                        {isCorrect && (
                          <span className="check-indicator">
                            <Check size={16} /> Correct
                          </span>
                        )}
                      </div>
                      <div className="correct-btn-preview">
                        {item.val.length > 35 ? item.val.substring(0, 35) + "..." : item.val}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation / Solution Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="q-exp">
                <span>Explanation / Solution Notes (Optional)</span>
                <span className="form-hint">Displayed to the candidate in the detailed answer key after submitting</span>
              </label>
              <textarea
                id="q-exp"
                rows={2}
                className="form-textarea"
                placeholder="e.g. Provide facts, formulas, or rationale for why this answer is correct..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>

            {/* Submit & Reset Buttons */}
            <div className="form-actions-row">
              <button type="submit" className="btn-primary-large">
                <CheckCircle2 size={20} />
                <span>{editingQuestionId ? "Update Question" : "Add Question to Test"}</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={resetSingleQuestionForm}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 2: PDF QUESTION UPLOAD & AUTOMATIC PARSING */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "upload-pdf" && (
        <div className="admin-section-card">
          <div className="section-header-box">
            <div>
              <h2 className="section-title">Upload Questions Directly from PDF</h2>
              <p className="section-sub">
                Upload a PDF question paper. Our smart client-side parser will automatically extract <strong>Questions, 4 Options (A, B, C, D)</strong>, and <strong>Answer Keys</strong>.
              </p>
            </div>
            <button
              type="button"
              className="btn-outline-small"
              onClick={handleDownloadSample}
            >
              <Download size={16} />
              <span>Download Sample Format (.txt)</span>
            </button>
          </div>

          <div className="pdf-upload-container">
            {/* Drag & Drop Upload Zone */}
            <label className={`upload-dropzone ${isExtracting ? "loading" : ""}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={handlePdfFileSelect}
                disabled={isExtracting}
              />
              <div className="dropzone-inner">
                <div className="dropzone-icon-circle">
                  <FileUp size={36} className="text-primary" />
                </div>
                <h3 className="dropzone-title">
                  {pdfFile ? pdfFile.name : "Drag & drop your PDF file here or browse"}
                </h3>
                <p className="dropzone-desc">
                  {pdfFile
                    ? `File size: ${(pdfFile.size / 1024).toFixed(1)} KB`
                    : "Standard .pdf files containing multiple-choice questions with 4 options"}
                </p>
                <div className="btn-browse-file">
                  {isExtracting ? "Parsing PDF in progress..." : "Browse PDF from Computer"}
                </div>
              </div>
            </label>

            {isExtracting && (
              <div className="extracting-spinner-card">
                <div className="pulse-loader" />
                <p>Analyzing PDF pages and extracting questions with 4 options...</p>
              </div>
            )}

            {/* Alternative: Direct Text Paste if user doesn't have PDF file ready */}
            <div className="text-paste-alternative">
              <div className="alt-divider">
                <span>OR paste raw questions text directly to test parser</span>
              </div>
              <textarea
                rows={5}
                className="form-textarea font-mono"
                placeholder={`1. What is the capital of France?\n(A) Berlin\n(B) Paris\n(C) Madrid\n(D) Rome\nAns: B\nExplanation: Paris is the capital and most populous city of France.`}
                value={pdfRawText}
                onChange={(e) => setPdfRawText(e.target.value)}
              />
              <div className="text-paste-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPdfRawText(getSampleQuestionPaperText())}
                >
                  <FileText size={16} /> Fill Demo Questions
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleManualTextParse}
                >
                  <Sparkles size={16} /> Parse Text to Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 3: CURRENT QUESTIONS LIST & MANAGEMENT */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "view-questions" && (
        <div className="admin-section-card">
          <div className="section-header-box">
            <div>
              <h2 className="section-title">
                Questions in "{activeTest?.title}" ({activeTest?.questions.length || 0})
              </h2>
              <p className="section-sub">
                Review, edit, reorder, or delete questions currently included in this test series.
              </p>
            </div>
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search questions or options..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {activeTest?.questions.length === 0 ? (
            <div className="empty-questions-state">
              <BookOpen size={48} className="text-muted" />
              <h3>No questions in this test series yet!</h3>
              <p>Use the 'Add Individual Question' tab or 'Upload Questions via PDF' tab above to populate questions.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveTab("add-single")}
              >
                Add First Question
              </button>
            </div>
          ) : (
            <div className="questions-card-list">
              {filteredQuestions.map((q, idx) => (
                <div key={q.id} className="question-admin-card">
                  <div className="q-card-header">
                    <div className="q-card-title-group">
                      <span className="q-number-pill">Q {idx + 1}</span>
                      <h4 className="q-card-text">{q.text}</h4>
                    </div>
                    <div className="q-card-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleMoveQuestion(idx, -1)}
                        disabled={idx === 0}
                        title="Move Up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleMoveQuestion(idx, 1)}
                        disabled={idx === activeTest.questions.length - 1}
                        title="Move Down"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-edit"
                        onClick={() => handleEditClick(q)}
                        title="Edit Question"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="q-card-options-grid">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctOption === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`q-card-option-item ${isCorrect ? "is-correct-badge-card" : ""}`}
                        >
                          <span className={`opt-tag ${isCorrect ? "opt-tag-correct" : ""}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="opt-text">{opt}</span>
                          {isCorrect && (
                            <span className="correct-tag-chip">
                              <CheckCircle2 size={14} /> Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="q-card-explanation">
                      <strong>💡 Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: INTERACTIVE PDF QUESTION REVIEW & EDIT BEFORE IMPORT */}
      {/* ---------------------------------------------------------------- */}
      {showPdfPreviewModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-large">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <Sparkles size={20} className="text-primary inline-mr" />
                  Review & Edit Extracted Questions ({extractedQuestions.length} Questions)
                </h3>
                <p className="modal-subtitle">
                  Verify or modify question statements, the 4 options (A, B, C, D), or designate the 5th correct answer before importing.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowPdfPreviewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-scrollable">
              {extractedQuestions.map((q, qIdx) => (
                <div key={q.id || qIdx} className="extracted-question-edit-box">
                  <div className="extracted-q-head">
                    <span className="badge-qnum">Question #{qIdx + 1}</span>
                    <button
                      type="button"
                      className="btn-danger-link"
                      onClick={() => handleExtractedQuestionDelete(qIdx)}
                    >
                      <Trash2 size={15} /> Remove Question
                    </button>
                  </div>

                  {/* Question Text */}
                  <textarea
                    rows={2}
                    className="form-textarea mb-3"
                    value={q.text}
                    onChange={(e) => handleExtractedQuestionEdit(qIdx, "text", e.target.value)}
                  />

                  {/* 4 Options Grid */}
                  <div className="extracted-options-grid">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="opt-edit-row">
                        <span className="opt-badge">{String.fromCharCode(65 + oIdx)}</span>
                        <input
                          type="text"
                          className="form-input"
                          value={opt}
                          onChange={(e) => handleExtractedOptionEdit(qIdx, oIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* 5th Field: Correct Option Selector for this question */}
                  <div className="extracted-correct-selector">
                    <span className="correct-sel-label">
                      <CheckCircle2 size={16} className="text-emerald" /> 5. Select Correct Answer:
                    </span>
                    <div className="correct-sel-buttons">
                      {[0, 1, 2, 3].map((optIndex) => (
                        <button
                          key={optIndex}
                          type="button"
                          className={`pill-btn ${q.correctOption === optIndex ? "active" : ""}`}
                          onClick={() => handleExtractedQuestionEdit(qIdx, "correctOption", optIndex)}
                        >
                          Option {String.fromCharCode(65 + optIndex)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPdfPreviewModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmPdfImport}
              >
                <Check size={18} /> Import All {extractedQuestions.length} Questions to Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: CREATE NEW TEST SERIES */}
      {/* ---------------------------------------------------------------- */}
      {showNewTestModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Create New Test Series</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowNewTestModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTestSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Test Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Science & Aptitude Mock Test #1"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Category / Subject</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Science, Mathematics, Reasoning"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration (Minutes) *</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      className="form-input"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Marks per Correct Answer (+Marks)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="form-input"
                      value={newPositiveMarks}
                      onChange={(e) => setNewPositiveMarks(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Negative Marks per Wrong Answer (-Marks)</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      className="form-input"
                      value={newNegativeMarks}
                      onChange={(e) => setNewNegativeMarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Instructions / Description</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Brief description and test guidelines..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewTestModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <PlusCircle size={18} /> Create Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
