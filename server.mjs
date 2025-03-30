import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import { runLighthouse } from "./lighthouseAnalyzer.mjs";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// ✅ Validate required environment variables
const REQUIRED_ENV_VARS = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
REQUIRED_ENV_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Error: Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// ✅ Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} base64Image - Screenshot in base64 format
 * @returns {Promise<string|null>} - Cloudinary image URL or null if failed
 */
const uploadToCloudinary = async (base64Image) => {
  try {
    const result = await cloudinary.v2.uploader.upload(`data:image/png;base64,${base64Image}`, {
      folder: "uiuxAnalyzerImages",
    });
    return result.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error.message);
    return null;
  }
};

// ✅ Initialize Express
const app = express();
app.use(express.json());
// ✅ Proper CORS setup
app.use(
  cors({
    origin: "*", // Allow all origins (Change to specific origin if needed)
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.post("/analyze", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // ✅ Capture screenshot properly
    const screenshotBase64 = await page.screenshot({ encoding: "base64" });

    // ✅ Upload screenshot to Cloudinary
    let imageUrl = await uploadToCloudinary(screenshotBase64);

    // ✅ Run Lighthouse Analysis
    let lighthouseResults = await runLighthouse(url);

    // ✅ Compute UI/UX Score
    let uiuxScore =
      lighthouseResults.performance?.score &&
      lighthouseResults.accessibility?.score &&
      lighthouseResults.bestPractices?.score
        ? (lighthouseResults.performance.score +
            lighthouseResults.accessibility.score +
            lighthouseResults.bestPractices.score) /
          3
        : "UI/UX Score not available";

    res.json({
      title: url, // Just returning URL as title for now
      description: "Website analyzed successfully",
      screenshot: imageUrl || "https://example.com/default-placeholder.png",
      uiuxScore,
      scores: lighthouseResults,
    });
  } catch (error) {
    console.error("❌ Error analyzing website:", error.message);
    res.status(500).json({
      error: "Failed to analyze website",
      details: error.message,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// ✅ Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
