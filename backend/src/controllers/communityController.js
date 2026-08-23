import Post from "../models/Post.js";

// GET /api/community
export async function getPosts(req, res) {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(100);
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch posts.", error: err.message });
  }
}

// GET /api/community/:id
export async function getPost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    return res.json(post);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch post.", error: err.message });
  }
}

// POST /api/community
export async function createPost(req, res) {
  try {
    const { title, body, subject } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: "title and body are required." });
    }
    const post = await Post.create({
      title,
      body,
      subject: subject || "General",
      author: req.user._id,
      authorName: req.user.name,
    });
    return res.status(201).json(post);
  } catch (err) {
    return res.status(500).json({ message: "Could not create post.", error: err.message });
  }
}

// POST /api/community/:id/comments
export async function addComment(req, res) {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ message: "Comment body is required." });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    post.comments.push({
      body,
      author: req.user._id,
      authorName: req.user.name,
    });
    await post.save();

    return res.status(201).json(post);
  } catch (err) {
    return res.status(500).json({ message: "Could not add comment.", error: err.message });
  }
}
