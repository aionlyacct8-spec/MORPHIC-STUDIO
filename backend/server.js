import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import pkg from "pg";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const { Pool } = pkg;

// Connect to your new Replit PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const ai = new GoogleGenAI({});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Morphic Studio API is running!",
    version: "1.0.0",
  });
});

// Upgraded Route: Save Script -> Analyze -> Save Storyboard
app.post("/api/analyze-script", async (req, res) => {
  try {
    const { title, scriptText } = req.body;

    // We now require a title to save the script properly
    if (!scriptText || !title) {
      return res
        .status(400)
        .json({ error: "Missing title or scriptText in request body." });
    }

    console.log(`Saving script: "${title}"...`);

    // 1. Save the raw script to the database and retrieve its unique ID
    const scriptResult = await pool.query(
      "INSERT INTO scripts (title, content) VALUES ($1, $2) RETURNING id",
      [title, scriptText],
    );
    const scriptId = scriptResult.rows[0].id;

    console.log(`Script saved (ID: ${scriptId}). Generating storyboard...`);

    // 2. Generate the storyboard via the AI Stack
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `You are the AI Story Planner for Morphic Studio. Convert the following script into a structured comic storyboard format. Outline the panels, visual descriptions, and dialogue:\n\n${scriptText}`,
    });

    const storyboardText = response.text;

    // 3. Save the generated storyboard, permanently linking it to the Script ID
    await pool.query(
      "INSERT INTO storyboards (script_id, panel_data) VALUES ($1, $2)",
      [scriptId, JSON.stringify({ content: storyboardText })],
    );

    console.log("Storyboard generated and saved permanently!");

    // 4. Return the complete package to the user
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
