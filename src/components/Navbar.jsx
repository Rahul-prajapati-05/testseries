import React from "react";
import { BookOpen, ShieldCheck, UserCheck, HelpCircle, PlusCircle, Cloud, CloudOff, Share2 } from "lucide-react";

export default function Navbar({
  currentView,
  onViewChange,
  isServerSynced,
  onNewTestClick,
  onHelpClick,
  onShareWebsiteClick
}) {
  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => onViewChange("student")} role="button" tabIndex={0}>
          <div className="logo-icon-badge">
            <BookOpen size={22} className="logo-icon" />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Pariksha<span>Pro</span>
              <span className="brand-tag">Exam Engine</span>
            </div>
            <span className="brand-subtitle">Smart Test Series & Question Bank Platform</span>
          </div>
        </div>

        {/* View Switcher & Action Tabs */}
        <div className="header-actions">
          {/* Cloud Sync Status Indicator */}
          <div
            className={`sync-status-indicator ${isServerSynced ? "synced" : "local-only"}`}
            title={isServerSynced ? "Server Cloud Database Connected (Changes sync to all students)" : "Local Storage Mode"}
          >
            {isServerSynced ? <Cloud size={15} /> : <CloudOff size={15} />}
            <span className="hidden-sm">{isServerSynced ? "Cloud Synced" : "Local Mode"}</span>
          </div>

          <div className="view-toggle-pill">
            <button
              type="button"
              className={`toggle-tab ${currentView === "student" ? "active" : ""}`}
              onClick={() => onViewChange("student")}
            >
              <UserCheck size={17} />
              <span>Student / Test Portal</span>
            </button>
            <button
              type="button"
              className={`toggle-tab ${currentView === "admin" ? "active" : ""}`}
              onClick={() => onViewChange("admin")}
            >
              <ShieldCheck size={17} />
              <span>Admin Panel</span>
              <span className="admin-badge">Management</span>
            </button>
          </div>

          {currentView === "admin" && (
            <button
              type="button"
              className="btn-create-test-header"
              onClick={onNewTestClick}
            >
              <PlusCircle size={16} />
              <span>Create New Test</span>
            </button>
          )}

          <button
            type="button"
            className="btn-share-header"
            onClick={onShareWebsiteClick}
            title="Share website link with all tests (WhatsApp & Direct Link)"
          >
            <Share2 size={16} />
            <span>Share Website</span>
          </button>

          <button
            type="button"
            className="btn-help-icon"
            onClick={onHelpClick}
            title="User Guide & Help"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
