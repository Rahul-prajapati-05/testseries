import React, { useState, useRef } from "react";
import { X, Download, FileUp, CheckCircle2 } from "lucide-react";
import {
  decodeTestFromShareString,
  decodeCatalogFromShareString
} from "../utils/shareHelper";

export default function ImportModal({ onClose, onImportTest, showToast }) {
  const [inputCode, setInputCode] = useState("");
  const fileInputRef = useRef(null);

  const processImportString = (raw) => {
    let code = raw.trim();

    // Check if it's a URL
    if (code.includes("?") || code.startsWith("http")) {
      try {
        const url = new URL(code);
        const catalogParam = url.searchParams.get("catalog") || url.searchParams.get("allTests");
        if (catalogParam) {
          const catalog = decodeCatalogFromShareString(catalogParam);
          if (catalog && catalog.length > 0) {
            onImportTest(catalog);
            showToast(`Successfully imported ${catalog.length} tests into your portal!`, "success");
            onClose();
            return;
          }
        }

        const singleParam = url.searchParams.get("shareTest") || url.searchParams.get("testData");
        if (singleParam) {
          code = singleParam;
        }
      } catch {
        // Continue with raw string
      }
    }

    // Try decoding as catalog
    const catalog = decodeCatalogFromShareString(code);
    if (catalog && catalog.length > 0) {
      onImportTest(catalog);
      showToast(`Successfully imported ${catalog.length} tests into your portal!`, "success");
      onClose();
      return;
    }

    // Try decoding as single test
    const singleTest = decodeTestFromShareString(code);
    if (singleTest && singleTest.title && Array.isArray(singleTest.questions)) {
      onImportTest(singleTest);
      showToast(`Test "${singleTest.title}" imported successfully with ${singleTest.questions.length} questions!`, "success");
      onClose();
      return;
    }

    // Try parsing as direct raw JSON
    try {
      const parsed = JSON.parse(code);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onImportTest(parsed);
        showToast(`Imported ${parsed.length} tests from JSON!`, "success");
        onClose();
        return;
      }
      if (parsed && parsed.title && Array.isArray(parsed.questions)) {
        onImportTest(parsed);
        showToast(`Test "${parsed.title}" imported successfully!`, "success");
        onClose();
        return;
      }
    } catch {
      // Not raw JSON
    }

    showToast("Invalid test code or link. Please check and try again.", "error");
  };

  const handleImport = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      showToast("Please paste the test code or link.", "error");
      return;
    }
    processImportString(inputCode);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content === "string") {
          processImportString(content);
        }
      } catch (err) {
        console.error("File read error:", err);
        showToast("Could not read test JSON file.", "error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              <Download size={20} className="text-primary inline-mr" />
              Import Tests (कोड या लिंक से लोड करें)
            </h3>
            <p className="modal-subtitle">
              Paste a test link, test code, or upload a JSON backup file to load tests into this browser.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleImport}>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label className="form-label">Paste Test Link or Test Code *</label>
              <textarea
                rows={4}
                className="form-textarea font-mono"
                placeholder="Paste the shareable test link (URL) or code here..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                required
              />
            </div>

            <div className="or-divider">
              <span>OR UPLOAD BACKUP FILE</span>
            </div>

            <div className="file-upload-box" onClick={() => fileInputRef.current?.click()}>
              <FileUp size={24} className="text-primary mb-1" />
              <p className="text-sm font-medium">Click to select backup .json file</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <CheckCircle2 size={18} /> Load Tests into Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
