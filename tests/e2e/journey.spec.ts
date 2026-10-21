import { expect, test } from "@playwright/test";

/**
 * Critical user journey (TEST_PLAN.md §1–2):
 *   landing → demo sign-in → dashboard with risk summary and an insight →
 *   alert explanation → vitals charts.
 * Plus the authorization journey (§3): protected routes require a session.
 */

// Most journeys start after the welcome tour; the onboarding test below clears this.
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "vitatwin_onboarded", value: "1", url: baseURL! }]);
});

test.describe("VitaTwin main journey", () => {
  test("landing page states the synthetic-data notice", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /living/i }),
    ).toBeVisible();
    await expect(page.getByText(/All patient data in this demonstration is synthetic/i)).toBeVisible();
  });

  test("demo sign-in reaches a populated twin dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();

    await page.waitForURL("**/dashboard");

    // Hero: a named synthetic patient and live vitals.
    await expect(page.getByText(/Twin live/i)).toBeVisible();
    await expect(page.getByText(/Hyderabad, Telangana/i)).toBeVisible();

    // Explainable risk cards (each card label is unique).
    const riskCards = page.locator("section", { hasText: "Explainable risk" });
    await expect(riskCards.getByText("10-year cardiovascular risk", { exact: true })).toBeVisible();
    await expect(riskCards.getByText("Diabetes risk & progression", { exact: true })).toBeVisible();
    await expect(riskCards.getByText("Acute cardiac stress risk", { exact: true })).toBeVisible();

    // At least one alert with a recommended action.
    await expect(page.getByText("Alerts", { exact: true })).toBeVisible();
    await expect(page.getByText(/Next step:/i).first()).toBeVisible();

    // Synthetic-data reassurance somewhere on the page.
    await expect(page.getByText(/All data is synthetic/i)).toBeVisible();
  });

  test("dashboard values are physiologically plausible", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");

    const body = await page.locator("body").innerText();

    // Regression guards for the two render bugs we fixed.
    const hba1c = body.match(/HbA1c\s+([\d.]+)%/);
    expect(hba1c).not.toBeNull();
    expect(Number(hba1c![1])).toBeGreaterThan(3);
    expect(Number(hba1c![1])).toBeLessThan(12);

    const sleep = body.match(/Sleep last night\s*\n?\s*([\d.]+)/);
    expect(sleep).not.toBeNull();
    expect(Number(sleep![1])).toBeGreaterThanOrEqual(3);

    const steps = body.match(/([\d,]+)\s*steps/);
    expect(steps).not.toBeNull();
    expect(Number(steps![1].replace(/,/g, ""))).toBeGreaterThan(500);
  });

  test("what-if panel re-runs the models on the server", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");

    await expect(page.getByText(/No change from today/i)).toBeVisible();
    await page.getByRole("button", { name: "Glucose under control" }).click();
    await expect(page.getByText(/lower the combined risk score/i)).toBeVisible();
    await expect(page.getByText(/Down \d+ pts/).first()).toBeVisible();

    await page.getByRole("button", { name: "A rough week of sleep" }).click();
    await expect(page.getByText(/Up \d+ pts/).first()).toBeVisible();

    await page.getByRole("button", { name: /Reset to today/i }).click();
    await expect(page.getByText(/No change from today/i)).toBeVisible();
  });

  test("alert explanation and risk drivers are visible on insights", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");

    await page.goto("/insights");
    await expect(page.getByRole("heading", { name: /Insights & alerts/i })).toBeVisible();
    await expect(page.getByText(/Every prediction is paired with the factors/i)).toBeVisible();

    // Explainability: a factor table with directions.
    await expect(page.getByText("Factor", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/raises risk|lowers reserve/i).first()).toBeVisible();

    // The disclaimer.
    await expect(page.getByText(/Decision support only; not a diagnosis/i)).toBeVisible();
  });

  test("vitals page renders charts from the wearable window", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");

    await page.goto("/vitals");
    await expect(page.getByRole("heading", { name: /Vitals & streams/i })).toBeVisible();
    await expect(page.getByText("Heart rate", { exact: true }).first()).toBeVisible();

    // Recharts renders SVG paths for the area charts.
    await expect(page.locator("svg.recharts-surface").first()).toBeVisible({
      timeout: 15_000,
    });
    expect(await page.locator("svg.recharts-surface").count()).toBeGreaterThanOrEqual(3);
  });

  test("timeline and clinician and profile pages all render", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");

    for (const [path, heading] of [
      ["/timeline", /Twin timeline/i],
      ["/clinician", /Clinician view/i],
      ["/profile", /Profile & EHR snapshot/i],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }

    await page.goto("/profile");
    await expect(page.getByText("HbA1c", { exact: true })).toBeVisible();
    await expect(page.getByText(/synthetic/i).first()).toBeVisible();
  });

  test("sign out returns to the landing page and re-locks the twin", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");

    await page.getByRole("button", { name: /Sign out/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"));

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Authorization", () => {
  test("unauthenticated twin routes redirect to login", async ({ page }) => {
    for (const path of ["/dashboard", "/vitals", "/insights", "/timeline", "/profile", "/clinician"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("login page keeps the requested return path", async ({ page }) => {
    await page.goto("/insights");
    await expect(page).toHaveURL(/\/login\?next=%2Finsights/);
  });

  test("email sign-in honestly reflects whether Supabase is configured", async ({ page }) => {
    await page.goto("/login");

    const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const signInButton = page.getByRole("button", { name: /^Sign in$/ });
    await expect(signInButton).toBeVisible();

    if (configured) {
      await expect(signInButton).toBeEnabled();
      await expect(page.getByText(/Backed by Supabase Auth/i)).toBeVisible();
    } else {
      // With no credentials the email path must stay closed rather than
      // failing at submit time.
      await expect(signInButton).toBeDisabled();
      await expect(page.getByRole("button", { name: /Create account/i })).toBeDisabled();
      await expect(page.getByLabel("Email")).toBeDisabled();
      await expect(page.getByLabel("Password")).toBeDisabled();
      await expect(page.getByText(/activates once NEXT_PUBLIC_SUPABASE_URL/i)).toBeVisible();
    }
  });
});

test.describe("Theme", () => {
  test("no dark-mode classes reach the page and the palette is light", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");

    const darkClasses = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[class]"))
        .flatMap((element) => Array.from(element.classList))
        .filter((name) => name.startsWith("dark:")).length,
    );
    expect(darkClasses).toBe(0);

    const bodyBackground = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(bodyBackground).toBe("rgb(250, 251, 252)");

    const noDarkScheme = await page.evaluate(() =>
      Array.from(document.styleSheets).every((sheet) => {
        try {
          return !Array.from(sheet.cssRules).some((rule) =>
            rule.cssText.includes("prefers-color-scheme: dark"),
          );
        } catch {
          return true;
        }
      }),
    );
    expect(noDarkScheme).toBe(true);
  });
});

test.describe("Mobile navigation", () => {
  test("phone tab bar reaches the clinician view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");
    await page.getByRole("navigation", { name: /mobile/i }).getByRole("link", { name: /Clinic/ }).click();
    await expect(page.getByRole("heading", { name: /Clinician view/i })).toBeVisible();
  });
});

test.describe("Responsive", () => {
  for (const viewport of [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    test(`dashboard renders without horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/login");
      await page.getByRole("button", { name: /Continue with demo twin/i }).click();
      await page.waitForURL("**/dashboard");

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(2);
    });
  }
});

test.describe("Onboarding, legal pages and account", () => {
  test("first visit shows the welcome tour once", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Next" }).click();
    await dialog.getByRole("button", { name: "Next" }).click();
    await dialog.getByRole("button", { name: /Start exploring/i }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("privacy and terms pages are public", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /Privacy policy/i })).toBeVisible();
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /Terms of use/i })).toBeVisible();
  });

  test("password reset page explains itself", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /Reset your password/i })).toBeVisible();
  });

  test("ending a demo session requires typing DELETE", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Continue with demo twin/i }).click();
    await page.waitForURL("**/dashboard");

    await page.goto("/account");
    await page.getByRole("button", { name: /End demo session/i }).click();
    const confirmButton = page.getByRole("button", { name: /End session/i });
    await expect(confirmButton).toBeDisabled();
    await page.getByLabel(/Type DELETE/i).fill("DELETE");
    await confirmButton.click();
    await page.waitForURL(/\/login/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unknown routes show the custom 404", async ({ page }) => {
    await page.goto("/definitely-not-a-page");
    await expect(page.getByText(/not part of the twin/i)).toBeVisible();
  });
});
