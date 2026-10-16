import React, { useState } from "react";
import { X, Download, FileUp, Sparkles, CheckCircle2 } from "lucide-react";
import { decodeTestFromShareString } from "../utils/shareHelper";

export default function ImportModal({ onClose, onImportTest, showToast }) {
  const [inputCode, setInputCode] = useState("");

  const handleImport = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      showToast("Please paste the test code or link.", "error");
      return;
    }

    let code = inputCode.trim();

    // If a full URL was pasted, extract the shareTest query param
    if (code.includes("shareTest=") || code.includes("testData=")) {
      try {
        const url = new URL(code);
        code = url.searchParams.get("shareTest") || url.searchParams.get("testData") || code;
      } catch (err) {
        // Continue with raw code if url parsing fails
      }
    }

    const test = decodeTestFromShareString(code);
    if (!test || !test.title || !Array.isArray(test.questions)) {
      showToast("Invalid test code. Please check and try again.", "error");
      return;
    }

    onImportTest(test);
    showToast(`Test "${test.title}" imported successfully with ${test.questions.length} questions!`, "success");
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              <Download size={20} className="text-primary inline-mr" />
              Import Test by Code (कोड से टेस्ट लोड करें)
            </h3>
            <p className="modal-subtitle">
              Paste the test code or test link received from your teacher or administrator.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleImport}>
          <div className="modal-body space-y-4">
            <div className="form-group">
              <label className="form-label">Paste Test Code or Test Link *</label>
              <textarea
                rows={4}
                className="form-textarea font-mono"
                placeholder="Paste the shareable test code or link here..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <CheckCircle2 size={18} /> Load Test into My Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
