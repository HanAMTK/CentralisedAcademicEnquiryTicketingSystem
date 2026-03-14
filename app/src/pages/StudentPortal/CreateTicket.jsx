import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { ArrowLeft, Send, AlertCircle, CheckCircle } from "lucide-react";
import NotificationBell from "../../components/NotificationBell";
import UserMenu from "../../components/UserMenu";

const API_BASE = "https://w25037936.nuwebspace.co.uk/KV6027/CAETS/api/tickets/index.php";

const categories = [
  { value: "Module Content", label: "Module Content" },
  { value: "Gradebook", label: "Gradebook" },
  { value: "Assessment & Submission", label: "Assessment & Submission" },
  { value: "Other", label: "Other" },
];

const urgencyLevels = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

const CreateTicket = () => {
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    module_id: "",
    urgency: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingModules, setIsLoadingModules] = useState(true);

  // Fetch modules on mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch(`${API_BASE}?action=modules`, {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && data.modules) {
          setModules(data.modules);
        }
      } catch {
        console.error("Failed to fetch modules");
      } finally {
        setIsLoadingModules(false);
      }
    };

    fetchModules();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}?action=create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create ticket");
      }

      setSuccess(`Ticket ${data.ticket.ticket_number} created successfully!`);

      // Redirect to student portal after short delay
      setTimeout(() => {
        navigate("/student", { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={s.pageWrapper}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerLeft}>
            <button onClick={() => navigate("/student")} className={s.backButton}>
              <ArrowLeft className={s.backIcon} />
            </button>
            <div>
              <h1 className={s.pageTitle}>Create New Ticket</h1>
            </div>
          </div>
          <div className={s.headerRight}>
            <NotificationBell portal="student" userId="student-001" />
            <UserMenu portal="student" />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className={s.scrollArea}>
        <div className={s.contentWrapper}>
          {/* Error */}
          {error && (
            <div className={s.errorBox}>
              <AlertCircle className={s.alertIcon} />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className={s.successBox}>
              <CheckCircle className={s.alertIcon} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={s.formCard}>
            <div className={s.formBody}>
              {/* Subject */}
              <div className={s.fieldGroup}>
                <label htmlFor="subject" className={s.label}>
                  Subject <span className={s.required}>*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  className={s.input}
                />
              </div>

              {/* Category, Module, Urgency row */}
              <div className={s.fieldRow}>
                {/* Category */}
                <div className={s.fieldGroup}>
                  <label htmlFor="category" className={s.label}>
                    Category <span className={s.required}>*</span>
                  </label>
                  <select
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className={s.select}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module */}
                <div className={s.fieldGroup}>
                  <label htmlFor="module" className={s.label}>
                    Module <span className={s.required}>*</span>
                  </label>
                  <select
                    id="module"
                    required
                    value={formData.module_id}
                    onChange={(e) => handleChange("module_id", e.target.value)}
                    className={s.select}
                    disabled={isLoadingModules}
                  >
                    <option value="">
                      {isLoadingModules ? "Loading modules..." : "Select a module"}
                    </option>
                    {modules.map((mod) => (
                      <option key={mod.module_id} value={mod.module_id}>
                        {mod.module_code} - {mod.module_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Urgency */}
                <div className={s.fieldGroup}>
                  <label htmlFor="urgency" className={s.label}>
                    Urgency Level <span className={s.required}>*</span>
                  </label>
                  <select
                    id="urgency"
                    required
                    value={formData.urgency}
                    onChange={(e) => handleChange("urgency", e.target.value)}
                    className={s.select}
                  >
                    <option value="">Select urgency</option>
                    {urgencyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className={s.fieldGroup}>
                <label htmlFor="description" className={s.label}>
                  Description <span className={s.required}>*</span>
                </label>
                <textarea
                  id="description"
                  required
                  rows={10}
                  maxLength={2000}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Please provide detailed information about your enquiry..."
                  className={s.textarea}
                />
                <div className={s.charCount}>
                  <p>{formData.description.length}/2000 characters</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={s.formFooter}>
              <button
                type="button"
                onClick={() => navigate("/student")}
                className={s.cancelButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={s.submitButton}
              >
                <Send className={s.submitIcon} />
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;

/* ========================
   Styles
   ======================== */
const s = {
  pageWrapper: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #f9fafb;
    overflow: hidden;
  `,
  header: css`
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  `,
  headerInner: css`
    max-width: 80rem;
    margin: 0 auto;
    padding: 1.25rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    @media (min-width: 1024px) {
      padding-left: 3rem;
      padding-right: 3rem;
    }
  `,
  headerLeft: css`
    display: flex;
    align-items: center;
    gap: 1rem;
  `,
  backButton: css`
    padding: 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
    &:hover {
      background-color: #f3f4f6;
    }
  `,
  backIcon: css`
    width: 1.25rem;
    height: 1.25rem;
    color: #4b5563;
  `,
  pageTitle: css`
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  `,
  headerRight: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  scrollArea: css`
    flex: 1;
    overflow-y: auto;
  `,
  contentWrapper: css`
    max-width: 80rem;
    margin: 0 auto;
    padding: 2rem;
    @media (min-width: 1024px) {
      padding-left: 3rem;
      padding-right: 3rem;
    }
  `,
  errorBox: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #991b1b;
    font-size: 0.875rem;
  `,
  successBox: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0.5rem;
    color: #166534;
    font-size: 0.875rem;
  `,
  alertIcon: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  formCard: css`
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  `,
  formBody: css`
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  `,
  fieldGroup: css`
    display: flex;
    flex-direction: column;
  `,
  fieldRow: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr 1fr;
    }
  `,
  label: css`
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.75rem;
  `,
  required: css`
    color: #ef4444;
  `,
  input: css`
    width: 100%;
    padding: 1rem 1.25rem;
    font-size: 1.0625rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
  `,
  select: css`
    width: 100%;
    padding: 1rem 1.25rem;
    font-size: 1.0625rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    outline: none;
    background-color: #ffffff;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    &:disabled {
      background-color: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }
  `,
  textarea: css`
    width: 100%;
    padding: 1rem 1.25rem;
    font-size: 1.0625rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    outline: none;
    box-sizing: border-box;
    resize: none;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    &::placeholder {
      color: #9ca3af;
    }
  `,
  charCount: css`
    margin-top: 0.75rem;
    text-align: right;
    & p {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
    }
  `,
  formFooter: css`
    padding: 2rem 2.5rem;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  cancelButton: css`
    padding: 1rem 2rem;
    font-size: 1.0625rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    color: #374151;
    background-color: #ffffff;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover {
      background-color: #f3f4f6;
    }
  `,
  submitButton: css`
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    font-size: 1.0625rem;
    background-color: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
    &:hover {
      background-color: #1d4ed8;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  submitIcon: css`
    width: 1.25rem;
    height: 1.25rem;
  `,
};