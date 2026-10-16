import React, { useState } from "react";
import {
  Clock,
  Award,
  Search,
  Sparkles,
  FileQuestion,
  Play
} from "lucide-react";

export default function TestList({ tests, onStartTest, onGoToAdmin }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...new Set(tests.map((t) => t.category || "General"))];

  const filteredTests = tests.filter((t) => {
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="student-home">
      {/* Hero Banner */}
      <div className="student-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} /> LIVE ONLINE CBT EXAM ENGINE
          </div>
          <h1 className="hero-heading">
            Master Your Preparation with <span>Real Exam Simulation</span>
          </h1>
          <p className="hero-subtext">
            High-yield mock test series based on the latest competitive examination patterns. Complete with live countdown timer and question-by-question solution analysis.
          </p>

          {/* Search & Filter Bar */}
          <div className="hero-search-row">
            <div className="search-input-pill">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search test series, topics, or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="category-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`chip-btn ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="tests-grid-section">
        <div className="section-title-row">
          <div>
            <h2 className="catalog-title">Available Mock Tests ({filteredTests.length})</h2>
            <p className="catalog-subtitle">Select any mock test to assess your readiness and performance</p>
          </div>
          <button
            type="button"
            className="btn-admin-cta"
            onClick={onGoToAdmin}
          >
            + Create New Test in Admin
          </button>
        </div>

        {filteredTests.length === 0 ? (
          <div className="empty-catalog-state">
            <FileQuestion size={48} className="text-muted" />
            <h3>No Tests Found</h3>
            <p>Try searching with different terms or visit the Admin panel to create a new test.</p>
            <button
              type="button"
              className="btn-primary"
              onClick={onGoToAdmin}
            >
              Go to Admin Panel
            </button>
          </div>
        ) : (
          <div className="tests-card-grid">
            {filteredTests.map((test) => {
              const totalMarks = (test.questions?.length || 0) * (test.positiveMarks || 1);
              return (
                <div key={test.id} className="test-catalog-card">
                  <div className="test-card-top">
                    <span className="category-tag">{test.category || "General"}</span>
                    <span className="live-status-pill">Active</span>
                  </div>

                  <h3 className="test-card-title">{test.title}</h3>
                  <p className="test-card-desc">
                    {test.description || "Comprehensive mock test practice based on latest exam syllabus."}
                  </p>

                  <div className="test-card-meta">
                    <div className="meta-stat">
                      <FileQuestion size={16} />
                      <span><strong>{test.questions?.length || 0}</strong> Questions</span>
                    </div>
                    <div className="meta-stat">
                      <Clock size={16} />
                      <span><strong>{test.durationMinutes || 15}</strong> Mins</span>
                    </div>
                    <div className="meta-stat">
                      <Award size={16} />
                      <span><strong>{totalMarks}</strong> Marks</span>
                    </div>
                  </div>

                  <div className="marking-scheme-strip">
                    <span>Correct: <strong>+{test.positiveMarks}</strong></span>
                    <span>Incorrect: <strong>-{test.negativeMarks}</strong></span>
                  </div>

                  <div className="test-card-footer">
                    <button
                      type="button"
                      className="btn-start-test"
                      onClick={() => onStartTest(test)}
                      disabled={!test.questions || test.questions.length === 0}
                    >
                      <Play size={16} fill="currentColor" />
                      <span>
                        {test.questions && test.questions.length > 0
                          ? "Start Test"
                          : "No Questions Available"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
