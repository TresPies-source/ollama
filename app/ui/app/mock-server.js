import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const sessions = [
  {
    id: "1",
    title: "Project Planning",
    working_dir: "/home/user/projects/planning",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    id: "2",
    title: "Code Review",
    working_dir: "/home/user/projects/review",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    id: "3",
    title: "Bug Fixes",
    working_dir: "/home/user/projects/bugs",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
];

const messages = {
  1: [
    {
      id: "m1",
      session_id: "1",
      role: "user",
      content: "Let's start planning the new feature",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "m2",
      session_id: "1",
      role: "assistant",
      content: "Great! Let's break down the requirements...",
      created_at: new Date(
        Date.now() - 2 * 60 * 60 * 1000 + 5000,
      ).toISOString(),
      agent_type: "dojo",
      mode: "scout",
    },
  ],
  2: [
    {
      id: "m3",
      session_id: "2",
      role: "user",
      content: "Review the authentication code",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  3: [
    {
      id: "m4",
      session_id: "3",
      role: "user",
      content: "Fix the login bug",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/sessions", (req, res) => {
  res.json({ sessions });
});

app.get("/api/sessions/:id", (req, res) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json({
    session,
    messages: messages[req.params.id] || [],
  });
});

app.post("/api/sessions", (req, res) => {
  const { title, working_dir } = req.body;
  const newSession = {
    id: String(sessions.length + 1),
    title,
    working_dir,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "active",
  };
  sessions.push(newSession);
  messages[newSession.id] = [];
  res.json({ session_id: newSession.id });
});

app.post("/api/chat", (req, res) => {
  const { session_id, message } = req.body;
  res.json({
    session_id,
    message_id: `m${Date.now()}`,
    content: "This is a mock response",
    agent_type: "dojo",
    mode: "mirror",
    done: true,
  });
});

const PORT = 8090;
app.listen(PORT, () => {
  console.log(`Mock DGD backend running on http://localhost:${PORT}`);
});
