import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

let globalBrowser: Browser | null = null;

export async function getReusableBrowser(): Promise<Browser> {
  try {
    if (globalBrowser && globalBrowser.isConnected()) {
      return globalBrowser;
    }

    const executablePath = await chromium.executablePath();

    globalBrowser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        ...chromium.args,
        "--hide-scrollbars",
        "--disable-web-security",
        "--disable-dev-shm-usage",
      ],
    });

    return globalBrowser;
  } catch (err) {
    globalBrowser = null;
    throw err;
  }
}