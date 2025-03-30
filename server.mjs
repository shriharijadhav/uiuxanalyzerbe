import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import { runLighthouse } from "./lighthouseAnalyzer.mjs";
import cloudinary from "cloudinary";

// ✅ Configure Cloudinary
cloudinary.v2.config({
  cloud_name: "df4prcuev",
  api_key: "412985248428749",
  api_secret: "x00qo_JQnpzYIwlmhGX8X_TuMNk",
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
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

// ✅ Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

app.post("/analyze", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // ✅ Capture screenshot properly
    const screenshotBase64 = await page.screenshot({ encoding: "base64" });

    // ✅ Upload screenshot to Cloudinary
    let imageUrl = await uploadToCloudinary(screenshotBase64);

    // ✅ Run Lighthouse Analysis
    let lighthouseResults = await runLighthouse(url);

    await browser.close();

    let uiuxScore =
      lighthouseResults.performance.score &&
      lighthouseResults.accessibility.score &&
      lighthouseResults.bestPractices.score
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
    res.status(500).json({
      error: "Failed to analyze website",
      details: error.toString(),
    });
  }
});

// ✅ Start the Express server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
