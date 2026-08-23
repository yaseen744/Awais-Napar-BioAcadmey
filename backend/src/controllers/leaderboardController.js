import User from "../models/User.js";
import Attempt from "../models/Attempt.js";

// GET /api/leaderboard - top students by points, with rank
export async function getLeaderboard(req, res) {
  try {
    const users = await User.find({ role: "student" })
      .sort({ points: -1 })
      .limit(100)
      .select("name points");

    // attach solved count (total correct across attempts) for a richer row, like the reference site
    const leaderboard = await Promise.all(
      users.map(async (u, idx) => {
        const attempts = await Attempt.find({ user: u._id }).select("correctCount totalQuestions");
        const solved = attempts.reduce((sum, a) => sum + a.correctCount, 0);
        const attempted = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
        const accuracy = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;
        return {
          rank: idx + 1,
          name: u.name,
          points: u.points,
          solved,
          accuracy,
        };
      })
    );

    return res.json(leaderboard);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch leaderboard.", error: err.message });
  }
}

// GET /api/leaderboard/me - the logged-in student's own rank
export async function getMyRank(req, res) {
  try {
    const higherCount = await User.countDocuments({
      role: "student",
      points: { $gt: req.user.points },
    });
    return res.json({ rank: higherCount + 1, points: req.user.points });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch your rank.", error: err.message });
  }
}
