import React from "react";
import { X, Sparkles } from "lucide-react";

export default function HelpModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-large">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              <Sparkles size={20} className="text-primary inline-mr" />
              ParikshaPro - User Guide & Instructions
            </h3>
            <p className="modal-subtitle">
              Learn how to create tests, add individual questions with 4 options + 5th correct answer, and upload questions from PDF.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-6">
          {/* Feature 1 */}
          <div className="guide-card">
            <div className="guide-icon-badge">1</div>
            <div>
              <h4 className="guide-step-title">Adding Individual Questions (4 Options + 5th Correct Option)</h4>
              <p className="guide-step-desc">
                Go to the Admin Panel and select the <strong>'Add Individual Question'</strong> tab:
              </p>
              <ul className="guide-step-list">
                <li><strong>Question Statement:</strong> Enter the question text.</li>
                <li><strong>Four Options (A, B, C, D):</strong> Fill in the text for all 4 options.</li>
                <li><strong>5th Field: Correct Option:</strong> Click on one of the 4 buttons (Option A, B, C, or D) to mark it as the official correct answer. It will be highlighted in green.</li>
                <li><strong>Explanation / Solution:</strong> Enter a step-by-step explanation for the question.</li>
                <li>Click <strong>'Add Question to Test'</strong> to save the question immediately.</li>
              </ul>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="guide-card">
            <div className="guide-icon-badge">2</div>
            <div>
              <h4 className="guide-step-title">Uploading Questions via PDF (Auto Parser)</h4>
              <p className="guide-step-desc">
                If you already have a Question Paper in PDF format, upload it directly:
              </p>
              <ul className="guide-step-list">
                <li>Go to the <strong>'Upload Questions from PDF'</strong> tab and select or drop your <code>.pdf</code> file.</li>
                <li>The smart AI parser extracts questions, 4 options (A, B, C, D), and answer keys automatically.</li>
                <li><strong>Interactive Review Modal:</strong> Review and edit any question text, options, or the 5th correct answer selector before saving.</li>
                <li>Click <strong>'Import All Questions to Test'</strong> to add them to your test in 1 click.</li>
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="guide-card">
            <div className="guide-icon-badge">3</div>
            <div>
              <h4 className="guide-step-title">Taking Tests as a Student (Live CBT Exam Interface)</h4>
              <p className="guide-step-desc">
                Click on the <strong>'Student / Test Portal'</strong> tab to practice:
              </p>
              <ul className="guide-step-list">
                <li>Real CBT exam interface with countdown timer, question palette, and review status.</li>
                <li>Instant scorecard upon submission: Total score, percentage, accuracy %, and time spent.</li>
                <li>Comprehensive question-by-question solution review showing your chosen answer vs. the official correct answer.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Got it, Let's Start
          </button>
        </div>
      </div>
    </div>
  );
}
