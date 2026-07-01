import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(join(__dirname, "../frontend")));

// Health check / API root
app.get("/api", (req, res) => {
  res.json({
    status: "online",
    message: "Morphic Studio API is running!",
    version: "2.0.0",
    endpoints: [
      "POST /api/analyze-script",
      "GET  /api/scripts",
      "GET  /api/scripts/:id",
      "GET  /api/storyboards/:scriptId",
      "POST /api/characters",
      "GET  /api/characters",
    ],
  });
});

// Analyze script + generate storyboard
app.post("/api/analyze-script", async (req, res) => {
  try {
    const { title, scriptText } = req.body;

    if (!scriptText || !title) {
      return res.status(400).json({ error: "Missing title or scriptText in request body." });
    }

    console.log(`[Analyze] Saving script: "${title}"...`);

    const scriptResult = await pool.query(
      "INSERT INTO scripts (title, content) VALUES ($1, $2) RETURNING id, created_at",
      [title, scriptText]
    );
    const scriptId = scriptResult.rows[0].id;

    console.log(`[Analyze] Script saved (ID: ${scriptId}). Calling OpenRouter...`);

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://morphic-studio.replit.app",
        "X-Title": "Morphic Studio",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are the AI Story Planner for Morphic Studio, a professional comic and animation production platform. Analyze scripts and produce detailed storyboard breakdowns.",
          },
          {
            role: "user",
            content: `Convert this script into a structured comic storyboard. For each scene or beat, provide:\n- PANEL: Panel number and shot type (WS/MS/MCU/CU/ECU/OTS)\n- VISUAL: Detailed visual description for the artist\n- DIALOGUE: Any spoken lines\n- ACTION: Character actions and camera notes\n- MOOD: Lighting and atmosphere\n\nScript:\n\n${scriptText}`,
          },
        ],
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`OpenRouter error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const storyboardText = aiData.choices[0].message.content;

    await pool.query(
      "INSERT INTO storyboards (script_id, panel_data) VALUES ($1, $2)",
      [scriptId, JSON.stringify({ content: storyboardText, generated_at: new Date().toISOString() })]
    );

    console.log(`[Analyze] Storyboard generated and saved for script ${scriptId}`);

    res.json({
      success: true,
      scriptId,
      title,
      storyboard: storyboardText,
      createdAt: scriptResult.rows[0].created_at,
    });
  } catch (error) {
    console.error("[Analyze] Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to process script." });
  }
});

// List all scripts
app.get("/api/scripts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, created_at FROM scripts ORDER BY created_at DESC LIMIT 50"
    );
    res.json({ scripts: result.rows });
  } catch (error) {
    console.error("[Scripts] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch scripts." });
  }
});

// Get a single script
app.get("/api/scripts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const scriptResult = await pool.query("SELECT * FROM scripts WHERE id = $1", [id]);
    if (scriptResult.rows.length === 0) {
      return res.status(404).json({ error: "Script not found." });
    }
    const storyboardResult = await pool.query(
      "SELECT * FROM storyboards WHERE script_id = $1 ORDER BY created_at DESC LIMIT 1",
      [id]
    );
    res.json({
      script: scriptResult.rows[0],
      storyboard: storyboardResult.rows[0] || null,
    });
  } catch (error) {
    console.error("[Script] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch script." });
  }
});

// Get storyboard for a script
app.get("/api/storyboards/:scriptId", async (req, res) => {
  try {
    const { scriptId } = req.params;
    const result = await pool.query(
      "SELECT * FROM storyboards WHERE script_id = $1 ORDER BY created_at DESC",
      [scriptId]
    );
    res.json({ storyboards: result.rows });
  } catch (error) {
    console.error("[Storyboards] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch storyboards." });
  }
});

// Create a character
app.post("/api/characters", async (req, res) => {
  try {
    const { name, role, description, traits } = req.body;
    if (!name) return res.status(400).json({ error: "Character name is required." });
    const result = await pool.query(
      "INSERT INTO characters (name, description) VALUES ($1, $2) RETURNING *",
      [name, JSON.stringify({ role, description, traits })]
    );
    res.json({ success: true, character: result.rows[0] });
  } catch (error) {
    console.error("[Characters] Error:", error.message);
    res.status(500).json({ error: "Failed to create character." });
  }
});

// List characters
app.get("/api/characters", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM characters ORDER BY created_at DESC");
    res.json({ characters: result.rows });
  } catch (error) {
    console.error("[Characters] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch characters." });
  }
});

// Serve frontend pages (catch-all — must be last)
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../frontend/index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`\n🎬 Morphic Studio is live on port ${port}`);
  console.log(`   Frontend: http://localhost:${port}`);
  console.log(`   API: http://localhost:${port}/api\n`);
});
