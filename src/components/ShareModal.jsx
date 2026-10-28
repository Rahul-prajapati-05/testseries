import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Download,
  Globe,
  FileText
} from "lucide-react";
import {
  generateShareUrl,
  encodeTestToShareString,
  generateCatalogShareUrl,
  encodeCatalogToShareString
} from "../utils/shareHelper";

export default function ShareModal({ test, allTests = [], initialTab = "auto", onClose, showToast }) {
  const hasSingleTest = Boolean(test);
  const testsList = allTests.length > 0 ? allTests : (test ? [test] : []);
  
  // Decide active tab: "catalog" or "single"
  const defaultTab = initialTab === "catalog" || !hasSingleTest ? "catalog" : "single";
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // URLs
  const singleShareUrl = test ? generateShareUrl(test) : "";
  const singleTestCode = test ? encodeTestToShareString(test) : "";
  
  const catalogShareUrl = generateCatalogShareUrl(testsList);
  const catalogCode = encodeCatalogToShareString(testsList);

  const activeUrl = activeTab === "catalog" ? catalogShareUrl : singleShareUrl;
  const activeCode = activeTab === "catalog" ? catalogCode : singleTestCode;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopiedLink(true);
    showToast(
      activeTab === "catalog"
        ? "Website link copied! Anyone opening this link will see all tests immediately."
        : "Direct test link copied! Send it to your students.",
      "success"
    );
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopiedCode(true);
    showToast("Code copied! Anyone can paste this in 'Import Test' to load.", "success");
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleDownloadJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(testsList, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `parikshapro_tests_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Test backup downloaded as JSON file!", "success");
    } catch (err) {
      console.error("Download error:", err);
      showToast("Failed to download file.", "error");
    }
  };

  // WhatsApp Message
  const whatsappCatalogMessage = encodeURIComponent(
    `📚 *ParikshaPro Online Mock Test Series*\n\n` +
    `Access all ${testsList.length} test series including latest tests:\n` +
    testsList.slice(0, 4).map((t, i) => `${i + 1}. ${t.title} (${t.questions?.length || 0} Qs)`).join("\n") +
    (testsList.length > 4 ? `\n...and ${testsList.length - 4} more tests!` : "") +
    `\n\n👉 Open this link in any browser or phone to start:\n${catalogShareUrl}`
  );

  const whatsappSingleMessage = test ? encodeURIComponent(
    `📝 *Test Invitation: ${test.title}*\n\n` +
    `Questions: ${test.questions?.length || 0} | Duration: ${test.durationMinutes || 15} Mins\n\n` +
    `👉 Click this link to start your test directly:\n${singleShareUrl}`
  ) : "";

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-large">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              <Share2 size={20} className="text-primary inline-mr" />
              Share Test Series Link (वेबसाइट और टेस्ट शेयर करें)
            </h3>
            <p className="modal-subtitle">
              Send this link to any phone, browser, or WhatsApp group. All tests (including manually added ones) will open instantly!
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher if both options are relevant */}
        {hasSingleTest && (
          <div className="share-tab-pills">
            <button
              type="button"
              className={`share-tab-btn ${activeTab === "catalog" ? "active" : ""}`}
              onClick={() => setActiveTab("catalog")}
            >
              <Globe size={16} />
              <span>Share Entire Website ({testsList.length} Tests)</span>
            </button>
            <button
              type="button"
              className={`share-tab-btn ${activeTab === "single" ? "active" : ""}`}
              onClick={() => setActiveTab("single")}
            >
              <FileText size={16} />
              <span>Share "{test.title}" Only</span>
            </button>
          </div>
        )}

        <div className="modal-body space-y-5">
          {/* Summary Banner */}
          {activeTab === "catalog" ? (
            <div className="share-test-summary">
              <div className="share-summary-head">
                <span className="category-tag">Complete Test Series Portal</span>
                <span className="live-status-pill">{testsList.length} Tests Active</span>
              </div>
              <h4 className="share-test-name">Full Exam Catalog with All Manual Tests</h4>
              <p className="text-muted text-sm mt-1">
                This link embeds all {testsList.length} tests. When opened in any other browser, mobile phone, or incognito window, all manual tests appear automatically!
              </p>
            </div>
          ) : (
            <div className="share-test-summary">
              <div className="share-summary-head">
                <span className="category-tag">{test.category || "General"}</span>
                <span className="live-status-pill">Ready to Share</span>
              </div>
              <h4 className="share-test-name">{test.title}</h4>
              <div className="share-metrics-strip">
                <span><strong>{test.questions?.length || 0}</strong> Questions</span>
                <span>•</span>
                <span><strong>{test.durationMinutes || 15}</strong> Minutes</span>
                <span>•</span>
                <span><strong>{(test.questions?.length || 0) * (test.positiveMarks || 1)}</strong> Marks</span>
              </div>
            </div>
          )}

          {/* Option 1: Direct Web Link (Works in any browser) */}
          <div className="share-action-box">
            <label className="form-label-prominent">
              <span>Method 1: Direct Web Link (Works in ANY Browser & Phone)</span>
            </label>
            <p className="form-hint mb-2">
              Send this link to anyone. Opening this URL in any browser automatically loads all tests into their portal!
            </p>
            <div className="share-input-row">
              <input
                type="text"
                readOnly
                value={activeUrl}
                className="form-input share-url-input"
              />
              <button
                type="button"
                className="btn-primary share-btn-copy"
                onClick={handleCopyLink}
              >
                {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>

            {/* Quick WhatsApp Share Button */}
            <div className="mt-3">
              <a
                href={`https://api.whatsapp.com/send?text=${activeTab === "catalog" ? whatsappCatalogMessage : whatsappSingleMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-share"
              >
                <MessageCircle size={18} />
                <span>Share Directly on WhatsApp (व्हाट्सएप पर भेजें)</span>
              </a>
            </div>
          </div>

          {/* Option 2: Test Code & JSON Backup */}
          <div className="share-action-box">
            <label className="form-label">
              <span>Method 2: Test Code or Backup File (For Offline / Import)</span>
            </label>
            <p className="form-hint mb-2">
              Students can paste this code under "Import Test", or you can download a .json backup file.
            </p>
            <div className="share-input-row">
              <input
                type="text"
                readOnly
                value={activeCode ? activeCode.substring(0, 45) + "..." : ""}
                className="form-input share-url-input font-mono"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCopyCode}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCode ? "Copied" : "Copy Code"}</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadJson}
                title="Download backup file"
              >
                <Download size={16} />
                <span>Backup JSON</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done (बंद करें)
          </button>
        </div>
      </div>
    </div>
  );
}
