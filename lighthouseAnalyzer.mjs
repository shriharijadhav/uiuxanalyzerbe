import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

export async function runLighthouse(url) {
  const chrome = await launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });

  try {
    const options = {
      logLevel: "info",
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices"],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);
    const { categories, audits } = runnerResult.lhr;

    return {
      performance: {
        score: Math.round(categories.performance.score * 100),
        reasons: extractAuditFindings(audits, "performance", categories),
      },
      accessibility: {
        score: Math.round(categories.accessibility.score * 100),
        reasons: extractAuditFindings(audits, "accessibility", categories),
      },
      bestPractices: {
        score: Math.round(categories["best-practices"].score * 100),
        reasons: extractAuditFindings(audits, "best-practices", categories),
      },
    };
  } catch (error) {
    console.error("Lighthouse Error:", error);
    return {
      error: "Lighthouse analysis failed",
      message: error.message,
    };
  } finally {
    await chrome.kill();
  }
}

// ✅ Extracts detailed reasons from Lighthouse audit, correctly mapping to category
function extractAuditFindings(audits, category, categories) {
  const auditRefs = categories[category]?.auditRefs || []; // Get audit references for the category

  return auditRefs
    .map(ref => audits[ref.id]) // Match audit ID with actual audit data
    .filter(audit => audit && audit.score !== undefined && audit.score !== 1) // Exclude perfect scores
    .map(audit => ({
      title: audit.title,
      description: audit.description || "No additional details available.",
      score: audit.score !== null ? Math.round(audit.score * 100) : "N/A",
    }))
    .slice(0, 5); // Limit to top 5 issues
}
