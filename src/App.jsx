import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import AdminPanel from "./components/Admin/AdminPanel";
import TestList from "./components/Student/TestList";
import ExamRoom from "./components/Student/ExamRoom";
import TestResult from "./components/Student/TestResult";
import HelpModal from "./components/HelpModal";
import {
  INITIAL_TESTS,
  getStoredTests,
  saveStoredTests,
} from "./data/mockData";

export default function App() {
  const [tests, setTests] = useState(() => getStoredTests());
  const [activeTestId, setActiveTestId] = useState(() => tests[0]?.id || "");
  
  // Views: "student" | "admin" | "exam" | "result"
  const [currentView, setCurrentView] = useState("student");
  
  // Exam states
  const [activeExamTest, setActiveExamTest] = useState(null);
  const [examResult, setExamResult] = useState(null);

  // Toast Notification state
  const [toast, setToast] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Auto-save tests to LocalStorage whenever modified
  useEffect(() => {
    saveStoredTests(tests);
  }, [tests]);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Test Series CRUD Handlers
  const handleCreateTest = (newTest) => {
    setTests((prev) => [newTest, ...prev]);
    setActiveTestId(newTest.id);
  };

  const handleUpdateTest = (updatedTest) => {
    setTests((prev) =>
      prev.map((t) => (t.id === updatedTest.id ? updatedTest : t))
    );
  };

  const handleDeleteTest = (testId) => {
    if (tests.length <= 1) {
      showToast("At least one test series must remain.", "error");
      return;
    }
    const remaining = tests.filter((t) => t.id !== testId);
    setTests(remaining);
    setActiveTestId(remaining[0].id);
    showToast("Test series removed successfully.", "info");
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all test series to the default configuration?")) {
      setTests(INITIAL_TESTS);
      setActiveTestId(INITIAL_TESTS[0].id);
      showToast("Default test series restored successfully.", "success");
    }
  };

  // Student Flow Handlers
  const handleStartTest = (test) => {
    setActiveExamTest(test);
    setCurrentView("exam");
  };

  const handleFinishTest = (resultData) => {
    setExamResult(resultData);
    setCurrentView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetake = (test) => {
    setActiveExamTest(test);
    setExamResult(null);
    setCurrentView("exam");
  };

  const handleBackToDashboard = () => {
    setActiveExamTest(null);
    setExamResult(null);
    setCurrentView("student");
  };

  return (
    <div className="pariksha-app-root">
      {/* Navbar is visible except when taking active exam to give full screen focus */}
      {currentView !== "exam" && (
        <Navbar
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          totalTests={tests.length}
          onNewTestClick={() => {
            setCurrentView("admin");
            // The Admin panel will handle opening new test modal or tab
          }}
          onHelpClick={() => setShowHelpModal(true)}
        />
      )}

      {/* Main Content Area */}
      <div className="app-main-content">
        {currentView === "student" && (
          <TestList
            tests={tests}
            onStartTest={handleStartTest}
            onGoToAdmin={() => setCurrentView("admin")}
          />
        )}

        {currentView === "admin" && (
          <AdminPanel
            tests={tests}
            activeTestId={activeTestId}
            onSelectTest={setActiveTestId}
            onCreateTest={handleCreateTest}
            onUpdateTest={handleUpdateTest}
            onDeleteTest={handleDeleteTest}
            onResetDefaults={handleResetDefaults}
            showToast={showToast}
          />
        )}

        {currentView === "exam" && activeExamTest && (
          <ExamRoom
            test={activeExamTest}
            onFinishTest={handleFinishTest}
            onExit={handleBackToDashboard}
          />
        )}

        {currentView === "result" && examResult && (
          <TestResult
            result={examResult}
            onRetake={handleRetake}
            onBackToDashboard={handleBackToDashboard}
          />
        )}
      </div>

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Help & Guide Modal */}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
}
