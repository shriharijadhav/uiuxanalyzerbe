import puppeteer from "puppeteer";

export default async function scrapeWebsite(url) {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(15000);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    let title = await page.title().catch(() => "Title not found");

    let description = await page.$eval('meta[name="description"]', el => el.content).catch(() => "Meta description missing");

    let screenshot = await page.screenshot({ encoding: "base64" }).catch(() => "Screenshot could not be captured");

    return { title, description, screenshot };
  } catch (error) {
    return { error: "Failed to scrape website", details: error.message };
  } finally {
    await browser.close();
  }
}
