import React, { useState } from "react";
import { X, Copy, Check, Share2, MessageCircle, FileText, Sparkles, BookOpen } from "lucide-react";
import { generateShareUrl, encodeTestToShareString } from "../utils/shareHelper";

export default function ShareModal({ test, onClose, showToast }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!test) return null;

  const shareUrl = generateShareUrl(test);
  const testCode = encodeTestToShareString(test);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast("Direct test link copied! Send it to your students on WhatsApp.", "success");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(testCode);
    setCopiedCode(true);
    showToast("Test code copied! Students can import this code in their portal.", "success");
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const whatsappMessage = encodeURIComponent(
    `📝 *Test Invitation: ${test.title}*\n\n` +
    `Questions: ${test.questions?.length || 0} | Duration: ${test.durationMinutes || 15} Mins\n\n` +
    `Click this link to start your test directly:\n${shareUrl}`
  );

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-large">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              <Share2 size={20} className="text-primary inline-mr" />
              Share Test with Students (छात्रों को टेस्ट भेजें)
            </h3>
            <p className="modal-subtitle">
              Send this link to students on WhatsApp or Telegram. When they open it, this test will appear on their device immediately!
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-5">
          {/* Test Summary Card */}
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
              <span><strong>{(test.questions?.length || 0) * (test.positiveMarks || 1)}</strong> Total Marks</span>
            </div>
          </div>

          {/* Option 1: Direct Web Link (Most Popular) */}
          <div className="share-action-box">
            <label className="form-label-prominent">
              <span>Method 1: Direct Test Link (Direct WhatsApp / Mobile Link)</span>
            </label>
            <p className="form-hint mb-2">
              Students don't need to install anything. Opening this link opens this exact test on their phone!
            </p>
            <div className="share-input-row">
              <input
                type="text"
                readOnly
                value={shareUrl}
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

            {/* Quick WhatsApp Button */}
            <div className="mt-3">
              <a
                href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-share"
              >
                <MessageCircle size={18} />
                <span>Share Directly on WhatsApp (व्हाट्सएप पर भेजें)</span>
              </a>
            </div>
          </div>

          {/* Option 2: Test Code for Manual Import */}
          <div className="share-action-box">
            <label className="form-label">
              <span>Method 2: Test Code (For Student Import)</span>
            </label>
            <p className="form-hint mb-2">
              Students can also paste this code in their portal under "Import Test".
            </p>
            <div className="share-input-row">
              <input
                type="text"
                readOnly
                value={testCode ? testCode.substring(0, 40) + "..." : ""}
                className="form-input share-url-input font-mono"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCopyCode}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCode ? "Copied Code" : "Copy Code"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done (हो गया)
          </button>
        </div>
      </div>
    </div>
  );
}
