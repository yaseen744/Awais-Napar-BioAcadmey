import { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  HelpCircle,
  PlayCircle,
  FileText,
  Check,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "English", "Logical Reasoning"];
const TABS = [
  { key: "Approvals", label: "Approvals", icon: UserCheck },
  { key: "Question", label: "Add Question", icon: HelpCircle },
  { key: "Video", label: "Add Video", icon: PlayCircle },
  { key: "Note", label: "Add Note", icon: FileText },
];

export default function Admin() {
  const [tab, setTab] = useState("Approvals");
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <div className="bg-[var(--navy-950)] text-[var(--paper)] rounded-md px-6 py-5 flex items-center gap-3 mb-6">
          <span className="w-11 h-11 rounded-full border-[3px] border-double border-[var(--gold-500)] text-[var(--gold-300)] flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h1 className="font-display text-xl">Admin panel</h1>
            <p className="text-xs text-[var(--gold-300)] uppercase tracking-wide">
              Approve students and add content
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-sm text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                tab === key
                  ? "bg-[var(--navy-950)] text-[var(--paper)] border-[var(--navy-950)]"
                  : "border-black/15 hover:border-[var(--navy-950)]"
              }`}
            >
              <Icon size={15} />
              {label}
              {key === "Approvals" && pendingCount > 0 && (
                <span className="bg-[var(--gold-500)] text-[var(--navy-950)] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "Approvals" && <ApprovalsPanel onCountChange={setPendingCount} />}
        {tab === "Question" && <QuestionForm />}
        {tab === "Video" && <VideoForm />}
        {tab === "Note" && <NoteForm />}
      </main>
    </div>
  );
}

function ApprovalsPanel({ onCountChange }) {
  const [pending, setPending] = useState(null); // null = loading
  const [busyId, setBusyId] = useState(null);

  function refresh() {
    api.get("/auth/pending").then(({ data }) => {
      setPending(data);
      onCountChange(data.length);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(id) {
    setBusyId(id);
    try {
      await api.post(`/auth/approve/${id}`);
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id) {
    if (!confirm("Reject and delete this registration? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await api.delete(`/auth/reject/${id}`);
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (pending === null) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-black/5 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="bg-white border border-dashed border-black/15 rounded-md p-8 text-center text-[var(--ink-soft)] text-sm">
        No pending registrations. New sign-ups will show up here for your approval.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pending.map((u) => (
        <div
          key={u._id}
          className="bg-white border border-black/10 rounded-md px-4 py-3 flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-[var(--navy-950)]">{u.name}</p>
            <p className="text-xs text-[var(--ink-soft)]">
              {u.email} · registered {new Date(u.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => reject(u._id)}
              disabled={busyId === u._id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[var(--danger)] text-[var(--danger)] text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              <UserX size={13} /> Reject
            </button>
            <button
              onClick={() => approve(u._id)}
              disabled={busyId === u._id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[var(--success)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              <UserCheck size={13} /> Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FormShell({ children, onSubmit, saving, message }) {
  return (
    <form onSubmit={onSubmit} className="bg-white border border-black/10 rounded-md p-6 space-y-4">
      {children}
      {message && (
        <p
          className={`text-sm px-3 py-2 rounded-sm border ${
            message.ok
              ? "text-[var(--success)] bg-green-50 border-green-200"
              : "text-[var(--danger)] bg-red-50 border-red-200"
          }`}
        >
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[var(--navy-950)] text-[var(--paper)] font-semibold py-2.5 rounded-sm hover:bg-[var(--navy-800)] disabled:opacity-60"
      >
        <Check size={16} strokeWidth={2.5} />
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

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

const inputClass =
  "w-full px-3 py-2 border border-black/15 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold-500)]";

function QuestionForm() {
  const empty = {
    subject: "Biology",
    chapter: "",
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    source: "",
    explanation: "",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/questions", {
        ...form,
        options: form.options.filter((o) => o.trim() !== ""),
        correctIndex: Number(form.correctIndex),
      });
      setMessage({ ok: true, text: "Question added." });
      setForm(empty);
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || "Failed to add question." });
    } finally {
      setSaving(false);
    }
  }

  function updateOption(idx, value) {
    const options = [...form.options];
    options[idx] = value;
    setForm({ ...form, options });
  }

  return (
    <FormShell onSubmit={handleSubmit} saving={saving} message={message}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject">
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className={inputClass}
          >
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Chapter">
          <input
            required
            value={form.chapter}
            onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            className={inputClass}
            placeholder="e.g. Biomolecules"
          />
        </Field>
      </div>

      <Field label="Question text">
        <textarea
          required
          rows={2}
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          className={inputClass}
        />
      </Field>

      <Field label="Options (mark the correct one)">
        <div className="space-y-2">
          {form.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctIndex"
                checked={Number(form.correctIndex) === idx}
                onChange={() => setForm({ ...form, correctIndex: idx })}
              />
              <input
                required={idx < 2}
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Source (optional)">
          <input
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className={inputClass}
            placeholder="e.g. DUHS 2022"
          />
        </Field>
        <Field label="Explanation (optional)">
          <input
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
    </FormShell>
  );
}

function VideoForm() {
  const empty = { subject: "Biology", chapter: "", title: "", videoUrl: "", description: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/videos", form);
      setMessage({ ok: true, text: "Video added." });
      setForm(empty);
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || "Failed to add video." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormShell onSubmit={handleSubmit} saving={saving} message={message}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject">
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className={inputClass}
          >
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Chapter">
          <input
            required
            value={form.chapter}
            onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            className={inputClass}
            placeholder="e.g. Genetics"
          />
        </Field>
      </div>
      <Field label="Title">
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Video URL (YouTube/Vimeo link)">
        <input
          required
          value={form.videoUrl}
          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          className={inputClass}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </Field>
      <Field label="Description (optional)">
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputClass}
        />
      </Field>
    </FormShell>
  );
}

function NoteForm() {
  const empty = { subject: "Biology", chapter: "", title: "", fileUrl: "", content: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/notes", form);
      setMessage({ ok: true, text: "Note added." });
      setForm(empty);
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.message || "Failed to add note." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormShell onSubmit={handleSubmit} saving={saving} message={message}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject">
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className={inputClass}
          >
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Chapter">
          <input
            required
            value={form.chapter}
            onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            className={inputClass}
            placeholder="e.g. Evolution"
          />
        </Field>
      </div>
      <Field label="Title">
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="File URL (Google Drive / hosted PDF link — optional)">
        <input
          value={form.fileUrl}
          onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
          className={inputClass}
          placeholder="https://drive.google.com/..."
        />
      </Field>
      <Field label="Or paste text content directly (optional)">
        <textarea
          rows={4}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className={inputClass}
        />
      </Field>
    </FormShell>
  );
}
