import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const db = new Database("portfolio.db");
db.exec("PRAGMA foreign_keys = ON");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    video_url TEXT,
    problem TEXT,
    solution TEXT,
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'image',
    is_thumbnail INTEGER DEFAULT 0,
    FOREIGN KEY (portfolio_id) REFERENCES portfolio (id) ON DELETE CASCADE
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

// Migration: Add type column to portfolio_images if it doesn't exist
try {
  db.exec("ALTER TABLE portfolio_images ADD COLUMN type TEXT DEFAULT 'image'");
} catch (e) {}

// Migration: Make thumbnail optional in portfolio table if it exists
try {
  // SQLite doesn't support ALTER TABLE DROP COLUMN or ALTER COLUMN easily.
  // We'll just check if it exists and if so, we'll handle it in the insert or just ignore it if it's already nullable.
  // Actually, the simplest way to fix the "NOT NULL" issue is to just add a default value if we can't drop it.
  // But we can't easily change NOT NULL to NULL in SQLite without recreating the table.
  // Let's try to just add a default value.
  db.exec("ALTER TABLE portfolio ADD COLUMN thumbnail TEXT DEFAULT ''");
} catch (e) {
  // Column might already exist or table might be different
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Seed initial data if empty
const rowCount = db.prepare("SELECT count(*) as count FROM portfolio").get() as { count: number };
if (rowCount.count === 0) {
  const insert = db.prepare("INSERT INTO portfolio (title, category, problem, solution, result) VALUES (?, ?, ?, ?, ?)");
  const insertImg = db.prepare("INSERT INTO portfolio_images (portfolio_id, url, type, is_thumbnail) VALUES (?, ?, ?, ?)");
  
  const res1 = insert.run(
    "살림의 기준 - 브랜드 필름", 
    "브랜드 홍보 영상", 
    "정보 전달과 따뜻한 감성을 동시에 잡아야 하는 과제",
    "자막의 폰트 선택 이유, 색보정(DI) 의도, 클릭을 유도한 썸네일 디자인 전략 등",
    "조회수 10만회 돌파, 긍정 댓글 98%"
  );
  insertImg.run(res1.lastInsertRowid, "https://picsum.photos/seed/work1/800/450", "image", 1);

  const res2 = insert.run(
    "테크 리뷰 2024", 
    "유튜브 콘텐츠", 
    "복잡한 스펙을 시청자가 이해하기 쉽게 시각화",
    "인포그래픽과 모션 그래픽을 활용한 직관적 설명",
    "구독자 전환율 15% 상승"
  );
  insertImg.run(res2.lastInsertRowid, "https://picsum.photos/seed/work2/800/450", "image", 1);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // API Routes
  app.get("/api/debug/db", (req, res) => {
    try {
      const portfolioSchema = db.prepare("PRAGMA table_info(portfolio)").all();
      const imagesSchema = db.prepare("PRAGMA table_info(portfolio_images)").all();
      const lastItems = db.prepare("SELECT * FROM portfolio ORDER BY id DESC LIMIT 5").all();
      const lastImages = db.prepare("SELECT * FROM portfolio_images ORDER BY id DESC LIMIT 5").all();
      res.json({
        portfolioSchema,
        imagesSchema,
        lastItems,
        lastImages
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/portfolio", (req, res) => {
    const items = db.prepare("SELECT * FROM portfolio ORDER BY created_at DESC").all() as any[];
    const itemsWithImages = items.map(item => {
      const images = db.prepare("SELECT * FROM portfolio_images WHERE portfolio_id = ?").all(item.id);
      return { ...item, images };
    });
    res.json(itemsWithImages);
  });

  app.get("/api/portfolio/:id", (req, res) => {
    const item = db.prepare("SELECT * FROM portfolio WHERE id = ?").get(req.params.id) as any;
    if (item) {
      const images = db.prepare("SELECT * FROM portfolio_images WHERE portfolio_id = ?").all(item.id);
      res.json({ ...item, images });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post("/api/portfolio", upload.array("images"), (req, res) => {
    try {
      console.log("Received project upload request");
      const { title, category, video_url = null, problem = null, solution = null, result = null, password } = req.body;
      
      if (password !== "1234") {
        console.log("Upload failed: Unauthorized password");
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const files = req.files as Express.Multer.File[];
      console.log(`Received ${files?.length || 0} files`);
      
      if (!files || files.length === 0) {
        console.log("Upload failed: No files provided");
        return res.status(400).json({ error: "At least one file is required" });
      }

      // We check if thumbnail column exists in the actual table to avoid errors
      const tableInfo = db.prepare("PRAGMA table_info(portfolio)").all() as any[];
      const hasThumbnail = tableInfo.some(col => col.name === 'thumbnail');

      let info;
      if (hasThumbnail) {
        info = db.prepare("INSERT INTO portfolio (title, category, video_url, problem, solution, result, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(title, category, video_url, problem, solution, result, '');
      } else {
        info = db.prepare("INSERT INTO portfolio (title, category, video_url, problem, solution, result) VALUES (?, ?, ?, ?, ?, ?)")
          .run(title, category, video_url, problem, solution, result);
      }
      
      const portfolioId = info.lastInsertRowid;
      console.log(`Created portfolio record with ID: ${portfolioId}`);
      
      const insertImg = db.prepare("INSERT INTO portfolio_images (portfolio_id, url, type, is_thumbnail) VALUES (?, ?, ?, ?)");
      
      files.forEach((file, index) => {
        const url = `/uploads/${file.filename}`;
        const type = file.mimetype.startsWith("video/") ? "video" : "image";
        console.log(`Inserting image/video: ${url} (type: ${type})`);
        insertImg.run(portfolioId, url, type, index === 0 ? 1 : 0);
      });

      console.log("Upload completed successfully");
      res.json({ id: portfolioId });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/portfolio/:id", (req, res) => {
    try {
      const { password } = req.body;
      const id = Number(req.params.id);
      console.log(`[DELETE] Request received for ID: ${id}`);
      console.log(`[DELETE] Password provided: ${password ? '***' : 'NONE'}`);
      
      if (password !== "1234") {
        console.log("[DELETE] Failed: Unauthorized password");
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Check if project exists
      const project = db.prepare("SELECT * FROM portfolio WHERE id = ?").get(id);
      if (!project) {
        console.log(`[DELETE] Failed: Project ${id} not found`);
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Get images to delete files
      const images = db.prepare("SELECT url FROM portfolio_images WHERE portfolio_id = ?").all(id) as { url: string }[];
      console.log(`[DELETE] Found ${images.length} images/videos to delete from disk`);
      
      images.forEach(img => {
        try {
          if (img.url && img.url.startsWith("/uploads/")) {
            const relativePath = img.url.startsWith('/') ? img.url.substring(1) : img.url;
            const filePath = path.join(__dirname, relativePath);
            
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`[DELETE] Deleted file: ${filePath}`);
            } else {
              console.log(`[DELETE] File not found on disk, skipping: ${filePath}`);
            }
          }
        } catch (fileErr) {
          console.error(`[DELETE] Error deleting file ${img.url}:`, fileErr);
        }
      });

      // Explicitly delete images from DB first (though CASCADE should handle it)
      db.prepare("DELETE FROM portfolio_images WHERE portfolio_id = ?").run(id);
      console.log(`[DELETE] Deleted portfolio_images records for ID: ${id}`);

      // Delete the portfolio record
      const info = db.prepare("DELETE FROM portfolio WHERE id = ?").run(id);
      console.log(`[DELETE] Deleted portfolio record. Changes: ${info.changes}`);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE] Critical error:", error);
      res.status(500).json({ error: error.message });
    }
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

  // Error handling middleware for multer and other errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server Error:", err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "파일 크기가 너무 큽니다. (최대 100MB)" });
      }
      return res.status(400).json({ error: `업로드 오류: ${err.message}` });
    }
    res.status(500).json({ error: err.message || "서버 내부 오류가 발생했습니다." });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
      const portfolioSchema = db.prepare("PRAGMA table_info(portfolio)").all();
      console.log("Portfolio Schema:", JSON.stringify(portfolioSchema, null, 2));
      const lastItems = db.prepare("SELECT * FROM portfolio ORDER BY id DESC LIMIT 5").all();
      console.log("Last 5 Items:", JSON.stringify(lastItems, null, 2));
    } catch (e) {
      console.error("DB Debug Error:", e);
    }
  });
}

startServer();
