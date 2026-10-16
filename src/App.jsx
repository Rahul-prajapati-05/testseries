import { useState, useEffect, useCallback } from "react";
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
  const [isServerSynced, setIsServerSynced] = useState(false);
  
  // Views: "student" | "admin" | "exam" | "result"
  const [currentView, setCurrentView] = useState("student");
  
  // Exam states
  const [activeExamTest, setActiveExamTest] = useState(null);
  const [examResult, setExamResult] = useState(null);

  // Toast Notification state
  const [toast, setToast] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Fetch tests from Server Backend on Mount
  useEffect(() => {
    async function loadServerTests() {
      try {
        const res = await fetch("/api/tests");
        if (res.ok) {
          const serverTests = await res.json();
          if (Array.isArray(serverTests) && serverTests.length > 0) {
            setTests(serverTests);
            saveStoredTests(serverTests);
            setActiveTestId((prev) =>
              serverTests.some((t) => t.id === prev) ? prev : serverTests[0].id
            );
            setIsServerSynced(true);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not connect to /api/tests, using local cache:", err);
      }
      // If server empty or unreachable, sync local to server
      const local = getStoredTests();
      syncTestsToServer(local);
    }

    loadServerTests();
  }, []);

  // Auto-sync tests with Server and LocalStorage
  const syncTestsToServer = async (updatedTests) => {
    saveStoredTests(updatedTests);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTests),
      });
      if (res.ok) {
        setIsServerSynced(true);
      }
    } catch (err) {
      console.warn("Failed to sync tests to server:", err);
      setIsServerSynced(false);
    }
  };

  // Test Series CRUD Handlers
  const handleCreateTest = (newTest) => {
    const updated = [newTest, ...tests];
    setTests(updated);
    setActiveTestId(newTest.id);
    syncTestsToServer(updated);
  };

  const handleUpdateTest = (updatedTest) => {
    const updated = tests.map((t) => (t.id === updatedTest.id ? updatedTest : t));
    setTests(updated);
    syncTestsToServer(updated);
  };

  const handleDeleteTest = (testId) => {
    if (tests.length <= 1) {
      showToast("At least one test series must remain.", "error");
      return;
    }
    const remaining = tests.filter((t) => t.id !== testId);
    setTests(remaining);
    setActiveTestId(remaining[0].id);
    syncTestsToServer(remaining);
    showToast("Test series removed successfully.", "info");
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all test series to the default configuration?")) {
      setTests(INITIAL_TESTS);
      setActiveTestId(INITIAL_TESTS[0].id);
      syncTestsToServer(INITIAL_TESTS);
      showToast("Default test series restored successfully.", "success");
    }
  };

  // Student Flow Handlers
  const handleStartTest = (test) => {
    if (!test.questions || test.questions.length === 0) {
      showToast("This test series currently has no questions. Please add questions in the Admin panel.", "error");
      return;
    }
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
          isServerSynced={isServerSynced}
          onNewTestClick={() => {
            setCurrentView("admin");
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
