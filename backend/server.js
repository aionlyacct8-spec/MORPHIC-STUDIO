import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Morphic Studio API is running!",
    version: "1.0.0",
  });
});

app.post("/api/analyze-script", async (req, res) => {
  try {
    const { title, scriptText } = req.body;

    if (!scriptText || !title) {
      return res
        .status(400)
        .json({ error: "Missing title or scriptText in request body." });
    }

    console.log(`Saving script: "${title}"...`);

    const scriptResult = await pool.query(
      "INSERT INTO scripts (title, content) VALUES ($1, $2) RETURNING id",
      [title, scriptText],
    );
    const scriptId = scriptResult.rows[0].id;

    console.log(`Script saved (ID: ${scriptId}). Generating storyboard...`);

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
            role: "user",
            content: `You are the AI Story Planner for Morphic Studio. Convert the following script into a structured comic storyboard format. Outline the panels, visual descriptions, and dialogue:\n\n${scriptText}`,
          },
        ],
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
      [scriptId, JSON.stringify({ content: storyboardText })],
    );

    console.log("Storyboard generated and saved permanently!");

    res.json({
      success: true,
      scriptId: scriptId,
      storyboard: storyboardText,
    });
  } catch (error) {
    console.error("Pipeline Error:", error);
    res.status(500).json({ error: "Failed to process and save script." });
  }
});

app.listen(port, () => {
  console.log(
    `🚀 Morphic Studio backend is successfully running on port ${port}`,
  );
});
