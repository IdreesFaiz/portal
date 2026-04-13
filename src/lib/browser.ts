import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

let browser: Browser | null = null;

export async function getBrowser() {
  if (browser && browser.isConnected()) {
    return browser;
  }

  browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  return browser;
}