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
import {
  getSharedTestFromUrl,
  getSharedCatalogFromUrl,
  cleanShareUrl,
} from "./utils/shareHelper";

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
  const [shareModalTest, setShareModalTest] = useState(null); // test object or "catalog"
  const [showImportModal, setShowImportModal] = useState(false);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Auto-sync tests with Server and LocalStorage (when Admin creates/modifies)
  const syncTestsToServer = useCallback(async (updatedTests) => {
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
  }, []);

  // Initialize tests from URL parameters (shared links) and Server Backend
  useEffect(() => {
    async function initializeAndSyncTests() {
      let currentTests = getStoredTests();
      let hasUrlUpdates = false;

      // 1. Check for shared catalog in URL (?catalog=...)
      const sharedCatalog = getSharedCatalogFromUrl();
      if (sharedCatalog && sharedCatalog.length > 0) {
        const map = new Map();
        currentTests.forEach((t) => {
          if (t && t.id) map.set(t.id, t);
        });
        sharedCatalog.forEach((t) => {
          if (t && t.id) map.set(t.id, t);
        });
        currentTests = Array.from(map.values());
        hasUrlUpdates = true;
        showToast(
          `Loaded ${sharedCatalog.length} tests from shared website link!`,
          "success"
        );
        cleanShareUrl();
      }

      // 2. Check for single shared test in URL (?shareTest=...)
      const sharedTest = getSharedTestFromUrl();
      if (sharedTest && sharedTest.id) {
        const map = new Map();
        currentTests.forEach((t) => {
          if (t && t.id) map.set(t.id, t);
        });
        map.set(sharedTest.id, sharedTest);
        currentTests = Array.from(map.values());
        setActiveTestId(sharedTest.id);
        hasUrlUpdates = true;
        showToast(
          `New test received: "${sharedTest.title}" with ${sharedTest.questions?.length || 0} questions! Ready to take test.`,
          "success"
        );
        cleanShareUrl();
      }

      // If we got tests from URL, save immediately
      if (hasUrlUpdates) {
        setTests(currentTests);
        saveStoredTests(currentTests);
      }

      // 3. Connect to Server Backend (/api/tests)
      try {
        const res = await fetch("/api/tests");
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const serverTests = await res.json();
            if (Array.isArray(serverTests) && serverTests.length > 0) {
              const mergedMap = new Map();

              // First add server tests
              serverTests.forEach((t) => {
                if (t && t.id) mergedMap.set(t.id, t);
              });

              // Preserve any custom tests created locally or loaded from URL
              let hasUnsyncedLocal = false;
              currentTests.forEach((t) => {
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
        console.warn("Could not connect to /api/tests, running in local storage mode:", err);
      }
    }

    initializeAndSyncTests();
  }, [showToast, syncTestsToServer]);

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

  // Import test by code/link or catalog
  const handleImportTest = (imported) => {
    if (Array.isArray(imported)) {
      setTests((prev) => {
        const map = new Map();
        prev.forEach((t) => {
          if (t && t.id) map.set(t.id, t);
        });
        imported.forEach((t) => {
          if (t && t.id) map.set(t.id, t);
        });
        const updated = Array.from(map.values());
        saveStoredTests(updated);
        syncTestsToServer(updated);
        return updated;
      });
      if (imported.length > 0 && imported[0].id) {
        setActiveTestId(imported[0].id);
      }
      return;
    }

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
      syncTestsToServer(updated);
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
          onShareWebsiteClick={() => setShareModalTest("catalog")}
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
            onSharePortal={() => setShareModalTest("catalog")}
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
            onSharePortal={() => setShareModalTest("catalog")}
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
          test={shareModalTest === "catalog" ? null : shareModalTest}
          allTests={tests}
          initialTab={shareModalTest === "catalog" ? "catalog" : "single"}
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
