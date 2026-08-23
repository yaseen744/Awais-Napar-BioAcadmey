import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MessageSquarePlus, MessageCircle, ArrowLeft, Send } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    api.get("/community").then(({ data }) => setPosts(data));
  }

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  function openPost(id) {
    api.get(`/community/${id}`).then(({ data }) => setSelected(data));
  }

  if (selected) {
    return <PostDetail post={selected} onBack={() => { setSelected(null); refresh(); }} onRefresh={() => openPost(selected._id)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-3xl text-[var(--navy-950)] flex items-center gap-2">
            <Users size={26} className="text-[var(--gold-500)]" /> Community
          </h1>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--navy-950)] text-[var(--paper)] rounded-sm text-sm font-semibold hover:bg-[var(--navy-800)]"
          >
            <MessageSquarePlus size={15} />
            {showForm ? "Cancel" : "New post"}
          </button>
        </div>
        <p className="text-[var(--ink-soft)] mb-6">Ask questions, share tips with other students.</p>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <NewPostForm
              onCreated={() => {
                setShowForm(false);
                refresh();
              }}
            />
          </motion.div>
        )}

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-black/5 rounded-md animate-pulse" />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="bg-white border border-dashed border-black/15 rounded-md p-8 text-center text-[var(--ink-soft)] text-sm">
            No posts yet. Start the conversation!
          </div>
        )}

        <div className="space-y-2">
          {posts.map((p, i) => (
            <motion.button
              key={p._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.3 }}
              whileHover={{ y: -2 }}
              onClick={() => openPost(p._id)}
              className="w-full text-left bg-white border border-black/10 rounded-md px-4 py-3 hover:border-[var(--gold-500)] hover:shadow-sm transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--navy-950)]">{p.title}</p>
                <span className="text-xs bg-[var(--navy-950)]/5 text-[var(--ink-soft)] px-2 py-0.5 rounded-sm">
                  {p.subject}
                </span>
              </div>
              <p className="text-sm text-[var(--ink-soft)] mt-1 line-clamp-2">{p.body}</p>
              <p className="text-xs text-[var(--ink-soft)] mt-2 flex items-center gap-1">
                {p.authorName} ·
                <MessageCircle size={12} /> {p.comments.length} repl{p.comments.length === 1 ? "y" : "ies"} ·{" "}
                {new Date(p.createdAt).toLocaleDateString()}
              </p>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}

function NewPostForm({ onCreated }) {
  const [form, setForm] = useState({ title: "", body: "", subject: "General" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await api.post("/community", form);
    setSaving(false);
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-black/10 rounded-md p-5 mb-6 space-y-3">
      <input
        required
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full px-3 py-2 border border-black/15 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold-500)]"
      />
      <textarea
        required
        placeholder="What's on your mind?"
        rows={3}
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        className="w-full px-3 py-2 border border-black/15 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold-500)]"
      />
      <div className="flex items-center gap-3">
        <select
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="px-3 py-2 border border-black/15 rounded-sm text-sm"
        >
          {["General", "Physics", "Chemistry", "Biology", "English", "Logical Reasoning"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[var(--gold-500)] text-[var(--navy-950)] rounded-sm text-sm font-semibold hover:bg-[var(--gold-300)] disabled:opacity-60"
        >
          <Send size={14} />
          {saving ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}

function PostDetail({ post, onBack, onRefresh }) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    await api.post(`/community/${post._id}/comments`, { body: comment });
    setComment("");
    setSaving(false);
    onRefresh();
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[var(--navy-800)] font-semibold mb-4 hover:underline">
          <ArrowLeft size={15} /> Back to Community
        </button>

        <div className="bg-white border border-black/10 rounded-md p-6 mb-6">
          <span className="text-xs bg-[var(--navy-950)]/5 text-[var(--ink-soft)] px-2 py-0.5 rounded-sm">
            {post.subject}
          </span>
          <h1 className="font-display text-2xl text-[var(--navy-950)] mt-2">{post.title}</h1>
          <p className="text-sm text-[var(--ink)] mt-3 whitespace-pre-wrap">{post.body}</p>
          <p className="text-xs text-[var(--ink-soft)] mt-4">
            {post.authorName} · {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>

        <h2 className="font-display text-lg text-[var(--navy-950)] mb-3">
          {post.comments.length} Repl{post.comments.length === 1 ? "y" : "ies"}
        </h2>

        <div className="space-y-2 mb-6">
          {post.comments.map((c, idx) => (
            <div key={idx} className="bg-white border border-black/10 rounded-md px-4 py-3">
              <p className="text-sm text-[var(--ink)]">{c.body}</p>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                {c.authorName} · {new Date(c.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleComment} className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 px-3 py-2 border border-black/15 rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold-500)]"
          />
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--navy-950)] text-[var(--paper)] rounded-sm text-sm font-semibold hover:bg-[var(--navy-800)] disabled:opacity-60"
          >
            <Send size={14} /> Reply
          </button>
        </form>
      </main>
    </div>
  );
}
