import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Cloud Configuration ---
const useCloud = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const supabase = useCloud 
  ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!) 
  : null;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// --- Local SQLite Fallback ---
const db = new Database("portfolio.db");
db.exec("PRAGMA foreign_keys = ON");

// Initialize Local Database
db.exec(`
  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    video_url TEXT,
    problem TEXT,
    solution TEXT,
    result TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'image',
    is_thumbnail INTEGER DEFAULT 0,
    public_id TEXT,
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

// Migration: Add public_id to portfolio_images
try { db.exec("ALTER TABLE portfolio_images ADD COLUMN public_id TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE portfolio ADD COLUMN sort_order INTEGER DEFAULT 0"); } catch (e) {}

// Multer configuration (Memory storage for Cloudinary, Disk for Local)
const storage = useCloudinary ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // --- API Routes ---

  app.get("/api/portfolio", async (req, res) => {
    try {
      if (useCloud && supabase) {
        // Try to fetch with images join first
        let query = supabase.from('portfolio').select('*, portfolio_images(*)');
        
        // Try to order by sort_order if it exists, fallback to created_at
        const { data: portfolio, error } = await query
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Supabase fetch error:", error);
          // Fallback: try without images join if it failed due to relationship issues
          if (error.message.includes("relationship") || error.message.includes("portfolio_images")) {
            const { data: pOnly, error: pError } = await supabase.from('portfolio').select('*').order('created_at', { ascending: false });
            if (pError) throw pError;
            
            // Fetch images separately for each item
            const items = await Promise.all(pOnly.map(async (item) => {
              const { data: images } = await supabase.from('portfolio_images').select('*').eq('portfolio_id', item.id);
              return { ...item, images: images || [] };
            }));
            return res.json(items);
          }
          throw error;
        }

        // Map Supabase structure to match local structure
        const items = (portfolio || []).map(item => ({
          ...item,
          images: item.portfolio_images || []
        }));
        
        // Sort by sort_order manually if it exists in the data
        items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
        return res.json(items);
      }

      const items = db.prepare("SELECT * FROM portfolio ORDER BY sort_order ASC, created_at DESC").all() as any[];
      const itemsWithImages = items.map(item => {
        const images = db.prepare("SELECT * FROM portfolio_images WHERE portfolio_id = ?").all(item.id);
        return { ...item, images };
      });
      res.json(itemsWithImages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/portfolio/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (useCloud && supabase) {
        const { data, error } = await supabase
          .from('portfolio')
          .select('*, portfolio_images(*)')
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          console.error("Supabase fetch detail error:", error);
          // Fallback if join fails
          const { data: pOnly, error: pError } = await supabase.from('portfolio').select('*').eq('id', id).maybeSingle();
          if (pError || !pOnly) return res.status(404).json({ error: "Not found" });
          
          const { data: images } = await supabase.from('portfolio_images').select('*').eq('portfolio_id', id);
          return res.json({ ...pOnly, images: images || [] });
        }
        
        if (!data) return res.status(404).json({ error: "Not found" });
        return res.json({ ...data, images: data.portfolio_images || [] });
      }

      const item = db.prepare("SELECT * FROM portfolio WHERE id = ?").get(id) as any;
      if (item) {
        const images = db.prepare("SELECT * FROM portfolio_images WHERE portfolio_id = ?").all(item.id);
        res.json({ ...item, images });
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/verify", (req, res) => {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || "1234";
    if (password === adminPass) {
      res.json({ success: true });
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
  });

  app.post("/api/portfolio", upload.array("images"), async (req, res) => {
    try {
      const { title, category, video_url = null, problem = null, solution = null, result = null, password } = req.body;
      console.log("Portfolio POST request received:", { title, category, video_url, password: password ? 'PROVIDED' : 'MISSING' });
      
      const adminPass = process.env.ADMIN_PASSWORD || "1234";
      
      if (password !== adminPass) {
        console.warn("Unauthorized portfolio upload attempt");
        return res.status(403).json({ error: "Unauthorized" });
      }

      const files = req.files as Express.Multer.File[];
      console.log(`Received ${files?.length || 0} files`);
      
      // Upload to Cloudinary if enabled
      const uploadedMedia = [];
      if (useCloudinary && files && files.length > 0) {
        for (const file of files) {
          const b64 = Buffer.from(file.buffer).toString("base64");
          const dataURI = "data:" + file.mimetype + ";base64," + b64;
          const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "auto",
            folder: "portfolio"
          });
          uploadedMedia.push({
            url: result.secure_url,
            public_id: result.public_id,
            type: file.mimetype.startsWith("video/") ? "video" : "image"
          });
        }
      } else if (files && files.length > 0) {
        // Local storage fallback
        files.forEach(file => {
          uploadedMedia.push({
            url: `/uploads/${file.filename}`,
            type: file.mimetype.startsWith("video/") ? "video" : "image"
          });
        });
      }

      if (uploadedMedia.length === 0 && !video_url) {
        return res.status(400).json({ error: "이미지/영상 파일 또는 외부 영상 링크가 필요합니다." });
      }

      if (useCloud && supabase) {
        const { data: portfolio, error: pError } = await supabase
          .from('portfolio')
          .insert([{ title, category, video_url, problem, solution, result }])
          .select()
          .single();
        
        if (pError) throw pError;

        const imagesToInsert = uploadedMedia.map((media, index) => ({
          portfolio_id: portfolio.id,
          url: media.url,
          public_id: media.public_id,
          type: media.type,
          is_thumbnail: index === 0 ? 1 : 0
        }));

        const { error: iError } = await supabase.from('portfolio_images').insert(imagesToInsert);
        if (iError) throw iError;

        return res.json({ id: portfolio.id });
      }

      // Local SQLite fallback
      let portfolioId: number | bigint;
      db.transaction(() => {
        const info = db.prepare("INSERT INTO portfolio (title, category, video_url, problem, solution, result) VALUES (?, ?, ?, ?, ?, ?)")
          .run(title, category, video_url, problem, solution, result);
        portfolioId = info.lastInsertRowid;
        
        const insertImg = db.prepare("INSERT INTO portfolio_images (portfolio_id, url, type, is_thumbnail, public_id) VALUES (?, ?, ?, ?, ?)");
        uploadedMedia.forEach((media, index) => {
          insertImg.run(portfolioId, media.url, media.type, index === 0 ? 1 : 0, media.public_id || null);
        });
      })();

      res.json({ id: portfolioId! });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/portfolio/order", async (req, res) => {
    try {
      const { orders, password } = req.body;
      const adminPass = process.env.ADMIN_PASSWORD || "1234";
      if (password !== adminPass) return res.status(403).json({ error: "Unauthorized" });

      console.log(`Updating order for ${orders?.length || 0} items`);

      if (useCloud && supabase) {
        for (const item of orders) {
          const { error } = await supabase
            .from('portfolio')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id);
          
          if (error) {
            console.error(`Error updating sort_order for item ${item.id}:`, error);
            // If the error is because the column doesn't exist, we should inform the user
            if (error.message.includes("column") && error.message.includes("sort_order")) {
              return res.status(500).json({ 
                error: "Supabase 'portfolio' 테이블에 'sort_order' 컬럼이 없습니다. SQL Editor에서 'ALTER TABLE portfolio ADD COLUMN sort_order INTEGER DEFAULT 0;'를 실행해주세요." 
              });
            }
            throw error;
          }
        }
        return res.json({ success: true });
      }

      const updateStmt = db.prepare("UPDATE portfolio SET sort_order = ? WHERE id = ?");
      db.transaction(() => {
        for (const item of orders) {
          updateStmt.run(item.sort_order, item.id);
        }
      })();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/portfolio/:id", async (req, res) => {
    try {
      const { password } = req.body;
      const id = req.params.id;
      const adminPass = process.env.ADMIN_PASSWORD || "1234";
      
      if (password !== adminPass) return res.status(403).json({ error: "Unauthorized" });

      if (useCloud && supabase) {
        // Get images to delete from Cloudinary
        const { data: images } = await supabase.from('portfolio_images').select('public_id').eq('portfolio_id', id);
        
        if (useCloudinary && images) {
          for (const img of images) {
            if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
          }
        }

        const { error } = await supabase.from('portfolio').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
      }

      // Local fallback
      const images = db.prepare("SELECT url, public_id FROM portfolio_images WHERE portfolio_id = ?").all(id) as any[];
      images.forEach(img => {
        if (useCloudinary && img.public_id) {
          cloudinary.uploader.destroy(img.public_id);
        } else if (img.url && img.url.startsWith("/uploads/")) {
          const filePath = path.join(__dirname, img.url.substring(1));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      });

      db.prepare("DELETE FROM portfolio WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/portfolio/:id", async (req, res) => {
    try {
      const { title, category, video_url, problem, solution, result, password } = req.body;
      const id = req.params.id;
      const adminPass = process.env.ADMIN_PASSWORD || "1234";
      
      if (password !== adminPass) return res.status(403).json({ error: "Unauthorized" });

      if (useCloud && supabase) {
        const { error } = await supabase
          .from('portfolio')
          .update({ title, category, video_url, problem, solution, result })
          .eq('id', id);
        
        if (error) throw error;
        return res.json({ success: true });
      }

      // Local fallback
      db.prepare("UPDATE portfolio SET title = ?, category = ?, video_url = ?, problem = ?, solution = ?, result = ? WHERE id = ?")
        .run(title, category, video_url, problem, solution, result, id);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/inquiries", async (req, res) => {
    try {
      const { name, email, phone, budget, message } = req.body;
      if (useCloud && supabase) {
        const { error } = await supabase.from('inquiries').insert([{ name, email, phone, budget, message }]);
        if (error) throw error;
        return res.json({ success: true });
      }
      db.prepare("INSERT INTO inquiries (name, email, phone, budget, message) VALUES (?, ?, ?, ?, ?)")
        .run(name, email, phone, budget, message);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/inquiries", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPass = process.env.ADMIN_PASSWORD || "1234";
      if (password !== adminPass) return res.status(403).json({ error: "Unauthorized" });

      if (useCloud && supabase) {
        const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data);
      }
      const items = db.prepare("SELECT * FROM inquiries ORDER BY created_at DESC").all();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/inquiries/:id", async (req, res) => {
    try {
      const { password } = req.body;
      const id = req.params.id;
      const adminPass = process.env.ADMIN_PASSWORD || "1234";
      
      if (password !== adminPass) return res.status(403).json({ error: "Unauthorized" });

      if (useCloud && supabase) {
        const { error } = await supabase.from('inquiries').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
      }

      db.prepare("DELETE FROM inquiries WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server Error:", err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    res.status(500).json({ error: "Internal server error" });
  });

  // --- Production Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist/index.html")));
  }

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Node Environment: ${process.env.NODE_ENV}`);
    console.log(`Cloud Mode: ${useCloud ? 'ENABLED' : 'DISABLED (Using SQLite)'}`);
    console.log(`Cloudinary Mode: ${useCloudinary ? 'ENABLED' : 'DISABLED (Using Local Disk)'}`);
  });
}

startServer();
