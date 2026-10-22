#!/usr/bin/env node
/**
 * VitaTwin — README screenshot capture.
 * Usage:  npm run screenshots -- https://vita-twin-ten.vercel.app
 *         npm run screenshots -- http://localhost:3000        (default)
 * Needs Chromium once:  npx playwright install chromium
 * Output: docs/screenshots/*.png (synthetic data only).
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = "docs/screenshots";

// Cookies that start the synthetic demo session and skip the welcome tour.
const cookies = ["vitatwin_demo", "vitatwin_onboarded"].map((name) => ({ name, value: "1", url: BASE }));

const SHOTS = [
  { file: "01-landing", path: "/", auth: false, full: true },
  { file: "02-login", path: "/login", auth: false },
  { file: "03-dashboard", path: "/dashboard", full: true },
  { file: "04-insights-explainability", path: "/insights", full: true },
  { file: "05-vitals", path: "/vitals", wait: ".recharts-surface", full: true },
  { file: "06-timeline", path: "/timeline", full: true },
  { file: "07-clinician", path: "/clinician", full: true },
  { file: "08-import-fhir-wearable", path: "/import", full: true },
  { file: "09-validation", path: "/validation", full: true },
  { file: "10-account", path: "/account" },
  { file: "11-privacy", path: "/privacy", auth: false },
  { file: "12-mobile-dashboard", path: "/dashboard", mobile: true },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
let failed = 0;

for (const shot of SHOTS) {
  const context = await browser.newContext(
    shot.mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: 1360, height: 860 }, deviceScaleFactor: 2 },
  );
  if (shot.auth !== false) await context.addCookies(cookies);
  const page = await context.newPage();
  try {
    await page.goto(BASE + shot.path, { waitUntil: "networkidle", timeout: 45_000 });
    if (shot.wait) await page.waitForSelector(shot.wait, { timeout: 20_000 });
    await page.waitForTimeout(700); // let animations settle
    await page.screenshot({ path: `${OUT}/${shot.file}.png`, fullPage: Boolean(shot.full) });
    console.log("✓", shot.file);
  } catch (error) {
    failed += 1;
    console.error("✗", shot.file, "-", String(error.message).split("\n")[0]);
  }
  await context.close();
}

await browser.close();
console.log(failed ? `${failed} screenshot(s) failed` : `Done: ${SHOTS.length} screenshots in ${OUT}/`);
process.exit(failed ? 1 : 0);
