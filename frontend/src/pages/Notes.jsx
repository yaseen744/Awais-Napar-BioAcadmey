import { useEffect, useState } from "react";
import { FileText, ExternalLink, ArrowLeft, BookOpen, Atom, FlaskConical, Dna, Languages, Brain } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const SUBJECT_ICONS = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Biology: Dna,
  English: Languages,
  "Logical Reasoning": Brain,
};

export default function Notes() {
  const [meta, setMeta] = useState([]);
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState(null);
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/notes/meta")
      .then(({ data }) => {
        setMeta(data);
        if (data.length) setSubject(data[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!subject || !chapter) return;
    api.get("/notes", { params: { subject, chapter } }).then(({ data }) => {
      setNotes(data);
      setOpen(data[0] || null);
    });
  }, [subject, chapter]);

  const chapters = meta.find((m) => m._id === subject)?.chapters || [];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 py-10">
        <h1 className="font-display text-3xl text-[var(--navy-950)] mb-1 flex items-center gap-2">
          <BookOpen size={26} className="text-[var(--gold-500)]" /> Notes
        </h1>
        <p className="text-[var(--ink-soft)] mb-6">Browse study notes by subject and chapter.</p>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-black/5 rounded-md animate-pulse" />
            ))}
          </div>
        )}

        {!loading && meta.length === 0 && (
          <EmptyState text="No notes added yet. An admin can add some from the Admin panel." />
        )}

        {!loading && meta.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {meta.map((m) => {
                const Icon = SUBJECT_ICONS[m._id] || BookOpen;
                return (
                  <button
                    key={m._id}
                    onClick={() => {
                      setSubject(m._id);
                      setChapter(null);
                      setNotes([]);
                      setOpen(null);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-medium border transition-colors ${
                      subject === m._id
                        ? "bg-[var(--navy-950)] text-[var(--paper)] border-[var(--navy-950)]"
                        : "border-black/15 hover:border-[var(--navy-950)]"
                    }`}
                  >
                    <Icon size={15} />
                    {m._id}
                  </button>
                );
              })}
            </div>

            {!chapter && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {chapters.map((c) => (
                  <button
                    key={c.chapter}
                    onClick={() => setChapter(c.chapter)}
                    className="bg-white border border-black/10 rounded-md p-4 text-left hover:border-[var(--gold-500)] transition-colors"
                  >
                    <FileText size={22} className="text-[var(--gold-500)]" strokeWidth={1.75} />
                    <p className="font-semibold text-[var(--navy-950)] mt-2 text-sm">
                      {c.chapter}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)]">{c.count} note(s)</p>
                  </button>
                ))}
              </div>
            )}

            {chapter && (
              <div>
                <button
                  onClick={() => setChapter(null)}
                  className="flex items-center gap-1 text-sm text-[var(--navy-800)] font-semibold mb-4 hover:underline"
                >
                  <ArrowLeft size={15} /> Back to {subject} folders
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    {open ? (
                      <div className="bg-white border border-black/10 rounded-md p-6">
                        <p className="font-display text-xl text-[var(--navy-950)] mb-3">
                          {open.title}
                        </p>
                        {open.fileUrl && (
                          <a
                            href={open.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mb-4 px-4 py-2 bg-[var(--navy-950)] text-[var(--paper)] rounded-sm text-sm font-semibold hover:bg-[var(--navy-800)]"
                          >
                            Open file <ExternalLink size={14} />
                          </a>
                        )}
                        {open.content && (
                          <p className="text-sm text-[var(--ink)] whitespace-pre-wrap leading-relaxed">
                            {open.content}
                          </p>
                        )}
                      </div>
                    ) : (
                      <EmptyState text="No notes in this chapter yet." />
                    )}
                  </div>
                  <div className="space-y-2">
                    {notes.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => setOpen(n)}
                        className={`w-full text-left px-4 py-3 rounded-sm border text-sm transition-colors ${
                          open?._id === n._id
                            ? "border-[var(--gold-500)] bg-[var(--gold-500)]/10"
                            : "border-black/10 hover:border-[var(--navy-950)]"
                        }`}
                      >
                        <p className="font-medium text-[var(--navy-950)]">{n.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-white border border-dashed border-black/15 rounded-md p-8 text-center text-[var(--ink-soft)] text-sm">
      {text}
    </div>
  );
}
