export type Framework = "Playwright" | "Cypress" | "Selenium";

export function generateCode(fw: Framework, story: string): string {
  const summary = story.trim().slice(0, 80).replace(/\s+/g, " ") || "user flow";
  switch (fw) {
    case "Playwright":
      return `import { test, expect } from "@playwright/test";

// SPEC · ${summary}
test.describe("Password reset flow", () => {
  test("valid email receives reset link", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot/i }).click();
    await page.getByLabel("Email").fill("qa+specimen@acidtest.dev");
    await page.getByRole("button", { name: /send link/i }).click();
    await expect(page.getByText(/check your inbox/i)).toBeVisible();
  });

  test("invalid email returns generic success", async ({ page }) => {
    await page.goto("/reset");
    await page.getByLabel("Email").fill("ghost@nowhere.zzz");
    await page.getByRole("button", { name: /send link/i }).click();
    await expect(page.getByText(/check your inbox/i)).toBeVisible();
  });

  test("expired token is rejected after 60m", async ({ page }) => {
    await page.goto("/reset?token=expired.mock.token");
    await expect(page.getByText(/link has expired/i)).toBeVisible();
  });
});`;
    case "Cypress":
      return `/// <reference types="cypress" />

// SPEC · ${summary}
describe("Password reset flow", () => {
  it("valid email receives reset link", () => {
    cy.visit("/login");
    cy.contains(/forgot/i).click();
    cy.get('input[name="email"]').type("qa+specimen@acidtest.dev");
    cy.contains("button", /send link/i).click();
    cy.contains(/check your inbox/i).should("be.visible");
  });

  it("invalid email returns generic success", () => {
    cy.visit("/reset");
    cy.get('input[name="email"]').type("ghost@nowhere.zzz");
    cy.contains("button", /send link/i).click();
    cy.contains(/check your inbox/i).should("be.visible");
  });

  it("expired token is rejected after 60m", () => {
    cy.visit("/reset?token=expired.mock.token");
    cy.contains(/link has expired/i).should("be.visible");
  });
});`;
    case "Selenium":
      return `import { Builder, By, until } from "selenium-webdriver";

// SPEC · ${summary}
async function passwordResetFlow() {
  const driver = await new Builder().forBrowser("chrome").build();
  try {
    await driver.get("https://app.acidtest.dev/reset");
    await driver.findElement(By.name("email")).sendKeys("qa+specimen@acidtest.dev");
    await driver.findElement(By.css("button[type=submit]")).click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'inbox')]")), 5000);
  } finally {
    await driver.quit();
  }
}

passwordResetFlow();`;
  }
}
