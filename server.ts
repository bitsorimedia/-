import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("portfolio.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    video_url TEXT,
    problem TEXT,
    solution TEXT,
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    budget TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const rowCount = db.prepare("SELECT count(*) as count FROM portfolio").get() as { count: number };
if (rowCount.count === 0) {
  const insert = db.prepare("INSERT INTO portfolio (title, category, thumbnail, problem, solution, result) VALUES (?, ?, ?, ?, ?, ?)");
  insert.run(
    "살림의 기준 - 브랜드 필름", 
    "브랜드 홍보 영상", 
    "https://picsum.photos/seed/work1/800/450",
    "정보 전달과 따뜻한 감성을 동시에 잡아야 하는 과제",
    "자막의 폰트 선택 이유, 색보정(DI) 의도, 클릭을 유도한 썸네일 디자인 전략 등",
    "조회수 10만회 돌파, 긍정 댓글 98%"
  );
  insert.run(
    "테크 리뷰 2024", 
    "유튜브 콘텐츠", 
    "https://picsum.photos/seed/work2/800/450",
    "복잡한 스펙을 시청자가 이해하기 쉽게 시각화",
    "인포그래픽과 모션 그래픽을 활용한 직관적 설명",
    "구독자 전환율 15% 상승"
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/portfolio", (req, res) => {
    const items = db.prepare("SELECT * FROM portfolio ORDER BY created_at DESC").all();
    res.json(items);
  });

  app.get("/api/portfolio/:id", (req, res) => {
    const item = db.prepare("SELECT * FROM portfolio WHERE id = ?").get(req.params.id);
    if (item) res.json(item);
    else res.status(404).json({ error: "Not found" });
  });

  app.post("/api/portfolio", (req, res) => {
    const { title, category, thumbnail, video_url, problem, solution, result, password } = req.body;
    if (password !== "1234") return res.status(403).json({ error: "Unauthorized" });
    
    const info = db.prepare("INSERT INTO portfolio (title, category, thumbnail, video_url, problem, solution, result) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(title, category, thumbnail, video_url, problem, solution, result);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/portfolio/:id", (req, res) => {
    const { password } = req.body;
    if (password !== "1234") return res.status(403).json({ error: "Unauthorized" });
    
    db.prepare("DELETE FROM portfolio WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/inquiries", (req, res) => {
    const { name, email, phone, budget, message } = req.body;
    db.prepare("INSERT INTO inquiries (name, email, phone, budget, message) VALUES (?, ?, ?, ?, ?)")
      .run(name, email, phone, budget, message);
    res.json({ success: true });
  });

  app.post("/api/admin/inquiries", (req, res) => {
    const { password } = req.body;
    if (password !== "1234") return res.status(403).json({ error: "Unauthorized" });
    const items = db.prepare("SELECT * FROM inquiries ORDER BY created_at DESC").all();
    res.json(items);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
