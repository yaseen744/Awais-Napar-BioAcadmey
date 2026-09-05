import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  FileUp,
  Plus,
  Trash2,
  Pencil,
  Lock,
  Unlock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shuffle,
  ListChecks,
  X,
  Eye,
  EyeOff,
  Users,
  ArrowLeft,
} from "lucide-react";
import api from "../../api/axios";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "English", "Logical Reasoning"];
const inputClass =
  "w-full px-3 py-2 border border-black/15 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold-500)]";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Banner({ ok, children }) {
  return (
    <p
      className={`text-sm px-3 py-2 rounded-sm border flex items-start gap-2 ${
        ok
          ? "text-[var(--success)] bg-green-50 border-green-200"
          : "text-[var(--danger)] bg-red-50 border-red-200"
      }`}
    >
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export default function TestsPanel() {
  const [view, setView] = useState("list"); // list | import | create | attempts
  const [tests, setTests] = useState(null);
  const [editingTest, setEditingTest] = useState(null); // test object being edited, or null
  const [attemptsTest, setAttemptsTest] = useState(null); // test object whose attempts we're viewing

  const refresh = useCallback(() => {
    api.get("/tests").then(({ data }) => setTests(data));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleImported() {
    setView("list");
    refresh();
  }

  function handleCreated() {
    setEditingTest(null);
    setView("list");
    refresh();
  }

  return (
    <div className="space-y-4">
      {view === "list" && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setView("import")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold bg-[var(--navy-950)] text-[var(--paper)] hover:bg-[var(--navy-800)]"
            >
              <FileUp size={15} /> Import questions from PDF
            </button>
            <button
              onClick={() => {
                setEditingTest(null);
                setView("create");
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold border border-black/15 hover:border-[var(--navy-950)]"
            >
              <Plus size={15} /> Create test
            </button>
          </div>

          <TestList
            tests={tests}
            onChanged={refresh}
            onEdit={(t) => {
              setEditingTest(t);
              setView("create");
            }}
            onViewAttempts={(t) => {
              setAttemptsTest(t);
              setView("attempts");
            }}
          />
        </>
      )}

      {view === "import" && (
        <PdfImportWizard onCancel={() => setView("list")} onImported={handleImported} />
      )}

      {view === "create" && (
        <TestForm
          existing={editingTest}
          onCancel={() => {
            setEditingTest(null);
            setView("list");
          }}
          onSaved={handleCreated}
        />
      )}

      {view === "attempts" && (
        <TestAttempts test={attemptsTest} onBack={() => setView("list")} />
      )}
    </div>
  );
}

/* ---------------------------- Test list/table ---------------------------- */

function TestList({ tests, onChanged, onEdit, onViewAttempts }) {
  const [busyId, setBusyId] = useState(null);

  async function togglePublish(t) {
    setBusyId(t._id);
    try {
      await api.patch(`/tests/${t._id}/publish`, { published: t.status !== "published" });
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleOpen(t) {
    setBusyId(t._id);
    try {
      await api.patch(`/tests/${t._id}/${t.isOpen ? "close" : "open"}`);
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(t) {
    if (!confirm(`Delete "${t.title}"? Past results will be kept, but the test itself cannot be recovered.`))
      return;
    setBusyId(t._id);
    try {
      await api.delete(`/tests/${t._id}`);
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  if (tests === null) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-black/5 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="bg-white border border-dashed border-black/15 rounded-md p-8 text-center text-[var(--ink-soft)] text-sm">
        No tests yet. Import a PDF to build a question bank, then create a test from it.
      </div>
    );
  }

  return (
    <div className="bg-white border border-black/10 rounded-md overflow-hidden">
      <div className="divide-y divide-black/10">
        {tests.map((t) => (
          <div key={t._id} className="px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
            <div className="min-w-[180px]">
              <p className="font-semibold text-[var(--navy-950)] text-sm">{t.title}</p>
              <p className="text-xs text-[var(--ink-soft)]">
                {t.subject} · {t.chapter}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
              {t.selectionMode === "random" ? <Shuffle size={13} /> : <ListChecks size={13} />}
              {t.selectionMode === "random" ? "Random" : "Specific"} · {t.questionsPerAttempt}/
              {t.totalAvailableQuestions}
            </div>

            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                t.status === "published"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-black/5 text-[var(--ink-soft)] border border-black/10"
              }`}
            >
              {t.status === "published" ? "Published" : "Draft"}
            </span>

            <span
              className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                t.isOpen
                  ? "bg-green-50 text-[var(--success)] border border-green-200"
                  : "bg-red-50 text-[var(--danger)] border border-red-200"
              }`}
            >
              {t.isOpen ? <Unlock size={12} /> : <Lock size={12} />}
              {t.isOpen ? "Open" : "Closed"}
            </span>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => onViewAttempts(t)}
                title="View attempts (who took it, scores)"
                className="p-1.5 rounded-sm border border-black/15 hover:border-[var(--navy-950)]"
              >
                <Users size={14} />
              </button>
              <button
                disabled={busyId === t._id}
                onClick={() => togglePublish(t)}
                title={t.status === "published" ? "Unpublish" : "Publish"}
                className="p-1.5 rounded-sm border border-black/15 hover:border-[var(--navy-950)] disabled:opacity-50"
              >
                {t.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                disabled={busyId === t._id}
                onClick={() => toggleOpen(t)}
                title={t.isOpen ? "Close test" : "Open test"}
                className="p-1.5 rounded-sm border border-black/15 hover:border-[var(--navy-950)] disabled:opacity-50"
              >
                {t.isOpen ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <button
                onClick={() => onEdit(t)}
                title="Edit"
                className="p-1.5 rounded-sm border border-black/15 hover:border-[var(--navy-950)]"
              >
                <Pencil size={14} />
              </button>
              <button
                disabled={busyId === t._id}
                onClick={() => remove(t)}
                title="Delete"
                className="p-1.5 rounded-sm border border-[var(--danger)] text-[var(--danger)] hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Attempts for a test -------------------------- */

function TestAttempts({ test, onBack }) {
  const [attempts, setAttempts] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!test) return;
    api
      .get(`/tests/${test._id}/attempts`)
      .then(({ data }) => setAttempts(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load attempts."));
  }, [test]);

  async function handleReset(attempt) {
    if (
      !confirm(
        `Delete ${attempt.user?.name || "this student"}'s attempt? This lets them take the test again (only one attempt is allowed at a time).`
      )
    )
      return;
    setBusyId(attempt._id);
    try {
      await api.delete(`/attempts/${attempt._id}`);
      setAttempts((prev) => prev.filter((a) => a._id !== attempt._id));
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete attempt.");
    } finally {
      setBusyId(null);
    }
  }

  if (!test) return null;

  return (
    <div className="bg-white border border-black/10 rounded-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-sm hover:bg-black/5">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="font-display text-lg text-[var(--navy-950)]">{test.title}</h2>
            <p className="text-xs text-[var(--ink-soft)]">
              {test.subject} · {test.chapter} — who has taken this test
            </p>
          </div>
        </div>
      </div>

      {error && <Banner ok={false}>{error}</Banner>}

      {attempts === null && !error && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-black/5 rounded-md animate-pulse" />
          ))}
        </div>
      )}

      {attempts?.length === 0 && (
        <p className="text-sm text-[var(--ink-soft)] bg-black/[0.02] border border-dashed border-black/15 rounded-sm p-6 text-center">
          No student has taken this test yet.
        </p>
      )}

      {attempts?.length > 0 && (
        <>
          <p className="text-xs text-[var(--ink-soft)]">
            Each student gets one attempt. Delete an attempt below to let that student retake the
            test.
          </p>
          <div className="border border-black/10 rounded-sm overflow-hidden">
          <div className="divide-y divide-black/10">
            {attempts.map((a) => (
              <div key={a._id} className="px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
                <div className="min-w-[160px]">
                  <p className="font-semibold text-[var(--navy-950)] text-sm">
                    {a.user?.name || "Deleted user"}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">{a.user?.email}</p>
                </div>
                <p className="text-xs text-[var(--ink-soft)]">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
                <p className="text-sm font-mono">
                  <span className="text-[var(--success)] font-semibold">{a.correctCount}</span>
                  <span className="text-[var(--ink-soft)]"> correct · </span>
                  <span className="text-[var(--danger)] font-semibold">{a.incorrectCount}</span>
                  <span className="text-[var(--ink-soft)]"> wrong / {a.totalQuestions}</span>
                </p>
                <span
                  className={`font-display text-lg font-semibold ${
                    a.scorePercent >= 60 ? "text-[var(--success)]" : "text-[var(--danger)]"
                  }`}
                >
                  {a.scorePercent}%
                </span>
                <button
                  disabled={busyId === a._id}
                  onClick={() => handleReset(a)}
                  title="Delete attempt (let student retake)"
                  className="p-1.5 rounded-sm border border-[var(--danger)] text-[var(--danger)] hover:bg-red-50 disabled:opacity-50 ml-auto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ PDF Import ------------------------------ */

function PdfImportWizard({ onCancel, onImported }) {
  const [testTitle, setTestTitle] = useState("");
  const [subject, setSubject] = useState("Biology");
  const [chapter, setChapter] = useState("");
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null); // { filename, questions }
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);

  async function handleExtract(e) {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF file first.");
      return;
    }
    if (!chapter.trim()) {
      setError("Chapter is required.");
      return;
    }
    setError("");
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("subject", subject);
      formData.append("chapter", chapter);
      const { data } = await api.post("/tests/import-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Always show at least 4 option fields (A, B, C, D) per question so the
      // admin can fill in any missing ones and pick the correct answer, even
      // if the PDF only had 2 options detected.
      const questions = (data.questions || []).map((q) => {
        const options = [...q.options];
        while (options.length < 4) options.push("");
        return { ...q, options };
      });
      setPreview({ ...data, questions, source: file.name });
    } catch (err) {
      setError(err.response?.data?.message || "Could not extract questions from this PDF.");
    } finally {
      setExtracting(false);
    }
  }

  function updateQuestion(idx, patch) {
    setPreview((p) => {
      const questions = [...p.questions];
      questions[idx] = { ...questions[idx], ...patch };
      return { ...p, questions };
    });
  }

  function updateOption(idx, optIdx, value) {
    setPreview((p) => {
      const questions = [...p.questions];
      const options = [...questions[idx].options];
      options[optIdx] = value;
      questions[idx] = { ...questions[idx], options };
      return { ...p, questions };
    });
  }

  function deleteQuestion(idx) {
    setPreview((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }));
  }

  function addOption(idx) {
    setPreview((p) => {
      const questions = [...p.questions];
      const options = [...questions[idx].options];
      if (options.length >= 5) return p; // model caps options at 5
      options.push("");
      questions[idx] = { ...questions[idx], options };
      return { ...p, questions };
    });
  }

  function removeOption(idx, optIdx) {
    setPreview((p) => {
      const questions = [...p.questions];
      const q = questions[idx];
      if (q.options.length <= 2) return p; // model requires at least 2 options
      const options = q.options.filter((_, i) => i !== optIdx);
      let correctIndex = q.correctIndex;
      if (optIdx === correctIndex) correctIndex = -1;
      else if (optIdx < correctIndex) correctIndex = correctIndex - 1;
      questions[idx] = { ...q, options, correctIndex };
      return { ...p, questions };
    });
  }

  async function handleImport() {
    setImporting(true);
    setImportMessage(null);
    try {
      const { data } = await api.post("/questions/import", {
        subject,
        chapter,
        source: preview.source,
        questions: preview.questions,
      });

      // Importing only adds questions to the shared bank -- it does NOT create
      // a Test by itself. Auto-create a Test from exactly the questions we just
      // imported (in "specific" mode) and publish + open it immediately, so the
      // admin doesn't have to do a separate "Create test" step and the test
      // shows up in the list (and to students) right away.
      const questionIds = (data.questions || []).map((q) => q._id);
      const finalTitle = testTitle.trim() || `${subject} - ${chapter}`;

      if (questionIds.length > 0) {
        try {
          const { data: createdTest } = await api.post("/tests", {
            title: finalTitle,
            subject,
            chapter,
            selectionMode: "specific",
            selectedQuestions: questionIds,
            questionBank: questionIds,
            source: preview.source,
          });
          await api.patch(`/tests/${createdTest._id}/publish`, { published: true });
          await api.patch(`/tests/${createdTest._id}/open`);

          setImportMessage({
            ok: true,
            text: `Imported ${data.imported} question(s) and created the test "${finalTitle}" — it's published and open now.`,
          });
        } catch (testErr) {
          // Questions are safely in the bank even if the test step failed --
          // tell the admin so they can finish it with "Create test" manually.
          setImportMessage({
            ok: false,
            text: `Imported ${data.imported} question(s) into the bank, but could not auto-create the test (${
              testErr.response?.data?.message || testErr.message
            }). Use "Create test" to finish it using these questions.`,
          });
          setImporting(false);
          return;
        }
      } else {
        setImportMessage({ ok: true, text: `Imported ${data.imported} question(s) into the bank.` });
      }

      setTimeout(() => onImported(), 900);
    } catch (err) {
      setImportMessage({ ok: false, text: err.response?.data?.message || "Import failed." });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="bg-white border border-black/10 rounded-md p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-[var(--navy-950)]">Import questions from PDF</h2>
        <button onClick={onCancel} className="p-1.5 rounded-sm hover:bg-black/5">
          <X size={16} />
        </button>
      </div>

      {!preview && (
        <form onSubmit={handleExtract} className="space-y-4">
          <Field label="Test title (students will see this name)">
            <input
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className={inputClass}
              placeholder="e.g. Biomolecules Mock Test"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject">
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass}>
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Chapter">
              <input
                required
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className={inputClass}
                placeholder="e.g. Biomolecules"
              />
            </Field>
          </div>

          <Field label="PDF file (MCQs with options and correct answers)">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className={inputClass}
            />
          </Field>

          {error && <Banner ok={false}>{error}</Banner>}

          <button
            type="submit"
            disabled={extracting}
            className="w-full flex items-center justify-center gap-2 bg-[var(--navy-950)] text-[var(--paper)] font-semibold py-2.5 rounded-sm hover:bg-[var(--navy-800)] disabled:opacity-60"
          >
            {extracting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {extracting ? "Extracting questions..." : "Extract questions"}
          </button>
        </form>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ink-soft)]">
              Detected <b>{preview.questions.length}</b> question(s) from{" "}
              <span className="font-mono">{preview.source}</span>. Review and edit before importing.
            </p>
            <button
              onClick={() => setPreview(null)}
              className="text-xs font-semibold text-[var(--navy-800)] hover:underline"
            >
              Start over
            </button>
          </div>

          {preview.needsReviewCount > 0 && (
            <Banner ok={false}>
              {preview.needsReviewCount} question(s) need review — the correct answer could not be
              detected automatically. Fix them below before importing.
            </Banner>
          )}

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {preview.questions.map((q, idx) => (
              <div
                key={q.tempId || idx}
                className={`border rounded-sm p-4 space-y-2 ${
                  q.correctIndex < 0 ? "border-[var(--danger)] bg-red-50/40" : "border-black/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono text-[var(--ink-soft)] pt-2">Q{idx + 1}</span>
                  <textarea
                    rows={2}
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    onClick={() => deleteQuestion(idx)}
                    className="p-1.5 rounded-sm text-[var(--danger)] hover:bg-red-50 shrink-0"
                    title="Delete question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-1.5 pl-7">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${idx}`}
                        checked={Number(q.correctIndex) === oIdx}
                        onChange={() => updateQuestion(idx, { correctIndex: oIdx })}
                      />
                      <span className="text-xs font-mono w-4 text-[var(--ink-soft)]">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <input
                        value={opt}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                        className={inputClass}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx, oIdx)}
                          className="p-1 rounded-sm text-[var(--ink-soft)] hover:text-[var(--danger)] hover:bg-red-50 shrink-0"
                          title="Remove option"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 5 && (
                    <button
                      type="button"
                      onClick={() => addOption(idx)}
                      className="flex items-center gap-1 text-xs font-medium text-[var(--navy-800)] hover:text-[var(--gold-500)] pt-0.5"
                    >
                      <Plus size={12} /> Add option
                    </button>
                  )}
                </div>
                {q.correctIndex < 0 && (
                  <p className="text-xs text-[var(--danger)] pl-7">
                    Correct answer not detected — select it above.
                  </p>
                )}
              </div>
            ))}
          </div>

          {importMessage && <Banner ok={importMessage.ok}>{importMessage.text}</Banner>}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 border border-black/15 font-semibold py-2.5 rounded-sm hover:border-[var(--navy-950)]"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={
                importing || preview.questions.length === 0 || preview.questions.some((q) => q.correctIndex < 0)
              }
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--gold-500)] text-[var(--navy-950)] font-semibold py-2.5 rounded-sm hover:bg-[var(--gold-300)] disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              {importing ? "Importing..." : `Import ${preview.questions.length} question(s)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Create / Edit test -------------------------- */

function TestForm({ existing, onCancel, onSaved }) {
  const isEdit = Boolean(existing);
  const [title, setTitle] = useState(existing?.title || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [subject, setSubject] = useState(existing?.subject || "Biology");
  const [chapter, setChapter] = useState(existing?.chapter && existing.chapter !== "Mixed" ? existing.chapter : "");
  const [duration, setDuration] = useState(existing?.duration || "");
  const [selectionMode, setSelectionMode] = useState(existing?.selectionMode || "random");
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(existing?.questionsPerAttempt || 10);
  const [pool, setPool] = useState(null); // full matching question bank (for count + specific picker)
  const [selectedIds, setSelectedIds] = useState(new Set(existing?.selectedQuestions?.map(String) || []));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!subject) return;
    const params = { subject };
    if (chapter.trim()) params.chapter = chapter.trim();
    api.get("/questions/all", { params }).then(({ data }) => setPool(data));
  }, [subject, chapter]);

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!title.trim()) return setMessage({ ok: false, text: "Title is required." });
    if (!pool || pool.length === 0)
      return setMessage({ ok: false, text: "No questions found for this subject/chapter. Import a PDF first." });

    const payload = {
      title,
      description,
      subject,
      chapter: chapter.trim() || "Mixed",
      duration: duration ? Number(duration) : null,
      selectionMode,
      bankFilter: { subject, chapter: chapter.trim() || undefined },
    };

    if (selectionMode === "random") {
      const n = Number(questionsPerAttempt);
      if (!Number.isInteger(n) || n <= 0) {
        return setMessage({ ok: false, text: "Questions per attempt must be a positive whole number." });
      }
      if (n > pool.length) {
        return setMessage({
          ok: false,
          text: `Questions per attempt (${n}) cannot exceed the available bank (${pool.length}).`,
        });
      }
      payload.questionsPerAttempt = n;
    } else {
      if (selectedIds.size === 0) {
        return setMessage({ ok: false, text: "Select at least one specific question." });
      }
      payload.selectedQuestions = [...selectedIds];
      payload.questionBank = pool.map((q) => q._id); // ensure selection validates against full pool
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/tests/${existing._id}`, payload);
      } else {
        await api.post("/tests", payload);
      }
      onSaved();
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || "Could not save test." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-black/10 rounded-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-[var(--navy-950)]">
          {isEdit ? "Edit test" : "Create test"}
        </h2>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-sm hover:bg-black/5">
          <X size={16} />
        </button>
      </div>

      <Field label="Test title">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </Field>

      <Field label="Description (optional)">
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject">
          <select
            disabled={isEdit}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`${inputClass} disabled:opacity-60`}
          >
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Chapter (blank = mixed, all chapters of subject)">
          <input
            disabled={isEdit}
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className={`${inputClass} disabled:opacity-60`}
            placeholder="e.g. Biomolecules"
          />
        </Field>
      </div>

      <p className="text-xs text-[var(--ink-soft)]">
        Question bank available:{" "}
        <b className="text-[var(--navy-950)]">{pool === null ? "…" : pool.length}</b> question(s)
      </p>

      <Field label="Duration in minutes (optional)">
        <input
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Selection mode">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectionMode("random")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-sm text-sm font-medium border ${
              selectionMode === "random"
                ? "bg-[var(--navy-950)] text-[var(--paper)] border-[var(--navy-950)]"
                : "border-black/15 hover:border-[var(--navy-950)]"
            }`}
          >
            <Shuffle size={14} /> Random
          </button>
          <button
            type="button"
            onClick={() => setSelectionMode("specific")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-sm text-sm font-medium border ${
              selectionMode === "specific"
                ? "bg-[var(--navy-950)] text-[var(--paper)] border-[var(--navy-950)]"
                : "border-black/15 hover:border-[var(--navy-950)]"
            }`}
          >
            <ListChecks size={14} /> Specific
          </button>
        </div>
      </Field>

      {selectionMode === "random" && (
        <Field label={`Questions per attempt (out of ${pool ? pool.length : "…"} available)`}>
          <input
            type="number"
            min="1"
            max={pool ? pool.length : undefined}
            value={questionsPerAttempt}
            onChange={(e) => setQuestionsPerAttempt(e.target.value)}
            className={inputClass}
          />
        </Field>
      )}

      {selectionMode === "specific" && (
        <Field label={`Pick specific questions (${selectedIds.size} selected)`}>
          <div className="border border-black/10 rounded-sm max-h-72 overflow-y-auto divide-y divide-black/5">
            {pool === null && <p className="p-3 text-sm text-[var(--ink-soft)]">Loading…</p>}
            {pool?.length === 0 && (
              <p className="p-3 text-sm text-[var(--ink-soft)]">
                No questions found for this subject/chapter yet.
              </p>
            )}
            {pool?.map((q, idx) => (
              <label key={q._id} className="flex items-start gap-2 p-2.5 text-sm hover:bg-black/[0.02] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(q._id)}
                  onChange={() => toggleSelected(q._id)}
                  className="mt-0.5"
                />
                <span>
                  <span className="text-[var(--ink-soft)] font-mono text-xs mr-1">{idx + 1}.</span>
                  {q.text}
                </span>
              </label>
            ))}
          </div>
        </Field>
      )}

      {message && <Banner ok={message.ok}>{message.text}</Banner>}

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[var(--navy-950)] text-[var(--paper)] font-semibold py-2.5 rounded-sm hover:bg-[var(--navy-800)] disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        {saving ? "Saving..." : isEdit ? "Save changes" : "Create test"}
      </button>
    </form>
  );
}
