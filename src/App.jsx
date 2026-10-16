import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import AdminPanel from "./components/Admin/AdminPanel";
import TestList from "./components/Student/TestList";
import ExamRoom from "./components/Student/ExamRoom";
import TestResult from "./components/Student/TestResult";
import HelpModal from "./components/HelpModal";
import ShareModal from "./components/ShareModal";
import ImportModal from "./components/ImportModal";
import {
  INITIAL_TESTS,
  getStoredTests,
  saveStoredTests,
} from "./data/mockData";
import { getSharedTestFromUrl, cleanShareUrl } from "./utils/shareHelper";

export default function App() {
  const [tests, setTests] = useState(() => getStoredTests());
  const [activeTestId, setActiveTestId] = useState(() => tests[0]?.id || "");
  const [isServerSynced, setIsServerSynced] = useState(false);
  
  // Views: "student" | "admin" | "exam" | "result"
  const [currentView, setCurrentView] = useState("student");
  
  // Exam states
  const [activeExamTest, setActiveExamTest] = useState(null);
  const [examResult, setExamResult] = useState(null);

  // Modals state
  const [toast, setToast] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [shareModalTest, setShareModalTest] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // 1. Check for Shared Test in URL on Mount (Direct Link received by student)
  useEffect(() => {
    const sharedTest = getSharedTestFromUrl();
    if (sharedTest) {
      setTests((prev) => {
        const existsIndex = prev.findIndex((t) => t.id === sharedTest.id);
        let updated;
        if (existsIndex >= 0) {
          updated = [...prev];
          updated[existsIndex] = sharedTest;
        } else {
          updated = [sharedTest, ...prev];
        }
        saveStoredTests(updated);
        return updated;
      });
      setActiveTestId(sharedTest.id);
      showToast(
        `New test received: "${sharedTest.title}" with ${sharedTest.questions?.length || 0} questions! Ready to take test.`,
        "success"
      );
      cleanShareUrl();
    }
  }, [showToast]);

  // 2. Fetch tests from Server Backend on Mount & Merge safely with local tests
  useEffect(() => {
    async function loadServerTests() {
      try {
        const res = await fetch("/api/tests");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const serverTests = await res.json();
            if (Array.isArray(serverTests) && serverTests.length > 0) {
              const localTests = getStoredTests();
              const mergedMap = new Map();

              // First add server tests
              serverTests.forEach((t) => {
                if (t && t.id) mergedMap.set(t.id, t);
              });

              // Also preserve any custom tests that were created locally by the admin
              let hasUnsyncedLocal = false;
              localTests.forEach((t) => {
                if (t && t.id && !mergedMap.has(t.id)) {
                  mergedMap.set(t.id, t);
                  hasUnsyncedLocal = true;
                }
              });

              const merged = Array.from(mergedMap.values());
              setTests(merged);
              saveStoredTests(merged);
              setActiveTestId((prev) =>
                merged.some((t) => t.id === prev) ? prev : merged[0].id
              );
              setIsServerSynced(true);

              // If admin had a local test that wasn't on server yet, upload it now
              if (hasUnsyncedLocal) {
                syncTestsToServer(merged);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Could not connect to /api/tests, using local cache:", err);
      }
    }

    loadServerTests();
  }, []);

  // Auto-sync tests with Server and LocalStorage (when Admin creates/modifies)
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

  // Import test by code/link
  const handleImportTest = (imported) => {
    setTests((prev) => {
      const idx = prev.findIndex((t) => t.id === imported.id);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = imported;
      } else {
        updated = [imported, ...prev];
      }
      saveStoredTests(updated);
      return updated;
    });
    setActiveTestId(imported.id);
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
            onShareTest={(test) => setShareModalTest(test)}
            onOpenImport={() => setShowImportModal(true)}
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
            onShareTest={(test) => setShareModalTest(test)}
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

      {/* Share Modal */}
      {shareModalTest && (
        <ShareModal
          test={shareModalTest}
          onClose={() => setShareModalTest(null)}
          showToast={showToast}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportTest={handleImportTest}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Help & Guide Modal */}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
}
