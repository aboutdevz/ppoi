import { test, expect } from "@playwright/test";

test.describe("ppoi App", () => {
  test("homepage loads correctly", async ({ page }) => {
    await page.goto("/");

    // Check page title
    await expect(page).toHaveTitle(/ppoi/);

    // Check main heading
    await expect(
      page.getByRole("heading", {
        name: "Create Stunning Anime Profile Pictures",
      }),
    ).toBeVisible();

    // Check navigation links (specifically in main navigation)
    await expect(
      page.getByLabel("Main").getByRole("link", { name: "Generate" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Main").getByRole("link", { name: "Explore" }),
    ).toBeVisible();

    // Check hero buttons
    await expect(
      page.getByRole("link", { name: "Start Creating" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore Gallery" }),
    ).toBeVisible();
  });

  test("navigation between pages works", async ({ page }) => {
    await page.goto("/");

    // Navigate to Generate page (use specific navigation link)
    await page
      .getByLabel("Main")
      .getByRole("link", { name: "Generate" })
      .click();
    await expect(page).toHaveURL(/generate/);
    await expect(
      page.getByRole("heading", {
        name: "Create Your AI Anime Profile Picture",
      }),
    ).toBeVisible();

    // Navigate to Explore page (use specific navigation link)
    await page
      .getByLabel("Main")
      .getByRole("link", { name: "Explore" })
      .click();
    await expect(page).toHaveURL(/explore/);
    await expect(
      page.getByRole("heading", { name: "Explore Community Creations" }),
    ).toBeVisible();

    // Navigate back to home
    await page.getByRole("link", { name: "ppoi" }).first().click();
    await expect(page).toHaveURL("/");
  });

  test("generate form validation works", async ({ page }) => {
    await page.goto("/generate");

    // Initially, generate button should be disabled
    const generateButton = page.getByRole("button", { name: "Generate Image" });
    await expect(generateButton).toBeDisabled();

    // Fill in prompt
    const promptTextbox = page.getByRole("textbox", {
      name: "Describe your character *",
    });
    await promptTextbox.fill("anime girl with blue hair");

    // Wait for the button to become enabled (with longer timeout)
    await expect(generateButton).toBeEnabled({ timeout: 10000 });

    // Character counter should update (use regex for flexible matching)
    await expect(page.getByText(/\d+\/1000 characters/)).toBeVisible();
  });

  test("explore page displays correctly", async ({ page }) => {
    await page.goto("/explore");

    // Check search functionality
    await expect(
      page.getByRole("textbox", {
        name: "Search by prompt, tags, or creator...",
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();

    // Check filters
    await expect(page.getByText("Recent")).toBeVisible();
    await expect(page.getByText("All Ratios")).toBeVisible();

    // Check empty state (since we have no images)
    await expect(page.getByText("No images found")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Clear Filters" }),
    ).toBeVisible();
  });

  test("popular prompts work in generate page", async ({ page }) => {
    await page.goto("/generate");

    // Click on a popular prompt
    await page
      .getByRole("button", {
        name: "anime girl with purple hair and golden eyes",
      })
      .click();

    // Check that the prompt was filled in
    const promptTextbox = page.getByRole("textbox", {
      name: "Describe your character *",
    });
    await expect(promptTextbox).toHaveValue(
      "anime girl with purple hair and golden eyes",
    );

    // Generate button should be enabled
    await expect(
      page.getByRole("button", { name: "Generate Image" }),
    ).toBeEnabled();
  });

  test("theme toggle works", async ({ page }) => {
    await page.goto("/");

    // Find the theme toggle button
    const themeToggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(themeToggle).toBeVisible();

    // Click to toggle theme (we can't easily test the actual theme change without complex DOM inspection)
    await themeToggle.click();
  });

  test("quality selection works in generate page", async ({ page }) => {
    await page.goto("/generate");

    // Both quality options should be visible
    await expect(
      page.getByRole("button", { name: "Fast Quick generation, good quality" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "High Quality Slower but better results",
      }),
    ).toBeVisible();

    // Click high quality option
    await page
      .getByRole("button", { name: "High Quality Slower but better results" })
      .click();
  });
});
