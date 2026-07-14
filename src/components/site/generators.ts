export type Framework =
  | "Playwright"
  | "Cypress"
  | "Selenium (Java)"
  | "Selenium (Python)"
  | "Selenium (C#)"
  | "Puppeteer"
  | "WebdriverIO"
  | "Appium"
  | "Espresso"
  | "XCUITest"
  | "RestAssured"
  | "Postman"
  | "Robot Framework"
  | "Cucumber"
  | "JUnit"
  | "TestNG";

export const FRAMEWORKS: Framework[] = [
  "Playwright",
  "Cypress",
  "Selenium (Java)",
  "Selenium (Python)",
  "Selenium (C#)",
  "Puppeteer",
  "WebdriverIO",
  "Appium",
  "Espresso",
  "XCUITest",
  "RestAssured",
  "Postman",
  "Robot Framework",
  "Cucumber",
  "JUnit",
  "TestNG",
];

export const FRAMEWORK_META: Record<Framework, { short: string; ext: string; lang: string }> = {
  Playwright: { short: "Playwright", ext: "spec.ts", lang: "TypeScript" },
  Cypress: { short: "Cypress", ext: "cy.ts", lang: "TypeScript" },
  "Selenium (Java)": { short: "Selenium·Java", ext: "java", lang: "Java" },
  "Selenium (Python)": { short: "Selenium·Py", ext: "py", lang: "Python" },
  "Selenium (C#)": { short: "Selenium·C#", ext: "cs", lang: "C#" },
  Puppeteer: { short: "Puppeteer", ext: "test.ts", lang: "TypeScript" },
  WebdriverIO: { short: "WebdriverIO", ext: "e2e.ts", lang: "TypeScript" },
  Appium: { short: "Appium", ext: "test.js", lang: "JavaScript" },
  Espresso: { short: "Espresso", ext: "kt", lang: "Kotlin" },
  XCUITest: { short: "XCUITest", ext: "swift", lang: "Swift" },
  RestAssured: { short: "RestAssured", ext: "java", lang: "Java" },
  Postman: { short: "Postman", ext: "postman.json", lang: "JSON" },
  "Robot Framework": { short: "Robot", ext: "robot", lang: "Robot" },
  Cucumber: { short: "Cucumber", ext: "feature", lang: "Gherkin" },
  JUnit: { short: "JUnit", ext: "java", lang: "Java" },
  TestNG: { short: "TestNG", ext: "java", lang: "Java" },
};

export function generateCode(fw: Framework, story: string): string {
  const summary = story.trim().slice(0, 80).replace(/\s+/g, " ") || "user flow";
  switch (fw) {
    case "Playwright":
      return `import { test, expect } from "@playwright/test";

// SPEC · ${summary}
test.describe("Generated flow", () => {
  test("happy path", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot/i }).click();
    await page.getByLabel("Email").fill("qa+specimen@acidtest.dev");
    await page.getByRole("button", { name: /send link/i }).click();
    await expect(page.getByText(/check your inbox/i)).toBeVisible();
  });

  test("invalid input", async ({ page }) => {
    await page.goto("/reset");
    await page.getByLabel("Email").fill("ghost@nowhere.zzz");
    await page.getByRole("button", { name: /send link/i }).click();
    await expect(page.getByText(/check your inbox/i)).toBeVisible();
  });

  test("edge case: expired token", async ({ page }) => {
    await page.goto("/reset?token=expired.mock.token");
    await expect(page.getByText(/link has expired/i)).toBeVisible();
  });
});`;
    case "Cypress":
      return `/// <reference types="cypress" />

// SPEC · ${summary}
describe("Generated flow", () => {
  it("happy path", () => {
    cy.visit("/login");
    cy.contains(/forgot/i).click();
    cy.get('input[name="email"]').type("qa+specimen@acidtest.dev");
    cy.contains("button", /send link/i).click();
    cy.contains(/check your inbox/i).should("be.visible");
  });

  it("invalid input", () => {
    cy.visit("/reset");
    cy.get('input[name="email"]').type("ghost@nowhere.zzz");
    cy.contains("button", /send link/i).click();
    cy.contains(/check your inbox/i).should("be.visible");
  });
});`;
    case "Selenium (Java)":
      return `import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.junit.jupiter.api.*;

// SPEC · ${summary}
class GeneratedFlowTest {
  WebDriver driver;

  @BeforeEach void setUp() { driver = new ChromeDriver(); }
  @AfterEach  void tearDown() { driver.quit(); }

  @Test void happyPath() {
    driver.get("https://app.acidtest.dev/reset");
    driver.findElement(By.name("email")).sendKeys("qa+specimen@acidtest.dev");
    driver.findElement(By.cssSelector("button[type=submit]")).click();
    Assertions.assertTrue(driver.getPageSource().contains("inbox"));
  }
}`;
    case "Selenium (Python)":
      return `# SPEC · ${summary}
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By

@pytest.fixture
def driver():
    d = webdriver.Chrome()
    yield d
    d.quit()

def test_happy_path(driver):
    driver.get("https://app.acidtest.dev/reset")
    driver.find_element(By.NAME, "email").send_keys("qa+specimen@acidtest.dev")
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    assert "inbox" in driver.page_source

def test_invalid_input(driver):
    driver.get("https://app.acidtest.dev/reset")
    driver.find_element(By.NAME, "email").send_keys("ghost@nowhere.zzz")
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    assert "inbox" in driver.page_source`;
    case "Selenium (C#)":
      return `using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

// SPEC · ${summary}
public class GeneratedFlowTests {
  IWebDriver driver;

  [SetUp]    public void SetUp()    => driver = new ChromeDriver();
  [TearDown] public void TearDown() => driver.Quit();

  [Test]
  public void HappyPath() {
    driver.Navigate().GoToUrl("https://app.acidtest.dev/reset");
    driver.FindElement(By.Name("email")).SendKeys("qa+specimen@acidtest.dev");
    driver.FindElement(By.CssSelector("button[type=submit]")).Click();
    Assert.That(driver.PageSource, Does.Contain("inbox"));
  }
}`;
    case "Puppeteer":
      return `import puppeteer from "puppeteer";

// SPEC · ${summary}
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://app.acidtest.dev/reset");
  await page.type('input[name="email"]', "qa+specimen@acidtest.dev");
  await page.click('button[type="submit"]');
  await page.waitForSelector("text/inbox");
  await browser.close();
})();`;
    case "WebdriverIO":
      return `// SPEC · ${summary}
describe("Generated flow", () => {
  it("happy path", async () => {
    await browser.url("/reset");
    await $('input[name="email"]').setValue("qa+specimen@acidtest.dev");
    await $('button[type="submit"]').click();
    await expect($("body")).toHaveTextContaining("inbox");
  });
});`;
    case "Appium":
      return `// SPEC · ${summary}
const wdio = require("webdriverio");

const caps = {
  platformName: "Android",
  "appium:deviceName": "Pixel_5",
  "appium:app": "/path/to/app.apk",
};

describe("Generated mobile flow", () => {
  it("happy path", async () => {
    const driver = await wdio.remote({ capabilities: caps });
    await driver.$("~emailField").setValue("qa+specimen@acidtest.dev");
    await driver.$("~submit").click();
    await driver.deleteSession();
  });
});`;
    case "Espresso":
      return `// SPEC · ${summary}
package com.acidtest.generated

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.*
import org.junit.Test

class GeneratedFlowTest {
  @Test fun happyPath() {
    onView(withId(R.id.email)).perform(typeText("qa+specimen@acidtest.dev"), closeSoftKeyboard())
    onView(withId(R.id.submit)).perform(click())
    onView(withText("Check your inbox")).check(matches(isDisplayed()))
  }
}`;
    case "XCUITest":
      return `// SPEC · ${summary}
import XCTest

final class GeneratedFlowTests: XCTestCase {
  func testHappyPath() {
    let app = XCUIApplication()
    app.launch()
    app.textFields["email"].tap()
    app.textFields["email"].typeText("qa+specimen@acidtest.dev")
    app.buttons["submit"].tap()
    XCTAssertTrue(app.staticTexts["Check your inbox"].waitForExistence(timeout: 5))
  }
}`;
    case "RestAssured":
      return `import io.restassured.RestAssured;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import org.junit.jupiter.api.Test;

// SPEC · ${summary}
class GeneratedApiTest {
  @Test void happyPath() {
    RestAssured.baseURI = "https://api.acidtest.dev";
    given().contentType("application/json")
      .body("{\\"email\\":\\"qa+specimen@acidtest.dev\\"}")
    .when().post("/reset")
    .then().statusCode(200).body("status", equalTo("ok"));
  }
}`;
    case "Postman":
      return `{
  "info": { "name": "Generated · ${summary.replace(/"/g, "'")}", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  "item": [
    {
      "name": "Happy path — request reset",
      "request": {
        "method": "POST",
        "url": "https://api.acidtest.dev/reset",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\\"email\\":\\"qa+specimen@acidtest.dev\\"}" }
      },
      "event": [{
        "listen": "test",
        "script": { "exec": ["pm.test('200', () => pm.response.to.have.status(200));"] }
      }]
    }
  ]
}`;
    case "Robot Framework":
      return `*** Settings ***
Documentation    ${summary}
Library          SeleniumLibrary

*** Variables ***
\${URL}          https://app.acidtest.dev/reset
\${EMAIL}        qa+specimen@acidtest.dev

*** Test Cases ***
Happy Path
    Open Browser              \${URL}    chrome
    Input Text                name=email    \${EMAIL}
    Click Button              css=button[type=submit]
    Page Should Contain       inbox
    [Teardown]    Close Browser`;
    case "Cucumber":
      return `# SPEC · ${summary}
Feature: Generated flow

  Scenario: Happy path
    Given the user is on the reset page
    When they submit "qa+specimen@acidtest.dev"
    Then they see "Check your inbox"

  Scenario: Invalid input
    Given the user is on the reset page
    When they submit "ghost@nowhere.zzz"
    Then they see "Check your inbox"

  Scenario: Expired token
    Given the user opens "/reset?token=expired.mock.token"
    Then they see "Link has expired"`;
    case "JUnit":
      return `import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

// SPEC · ${summary}
class GeneratedFlowTest {
  @Test void happyPath() {
    String response = ResetClient.request("qa+specimen@acidtest.dev");
    assertTrue(response.contains("ok"));
  }

  @Test void invalidInput() {
    String response = ResetClient.request("ghost@nowhere.zzz");
    assertTrue(response.contains("ok"));
  }

  @Test void expiredToken() {
    assertThrows(TokenExpiredException.class, () -> ResetClient.confirm("expired.mock.token"));
  }
}`;
    case "TestNG":
      return `import org.testng.annotations.*;
import static org.testng.Assert.*;

// SPEC · ${summary}
public class GeneratedFlowTest {
  @Test public void happyPath() {
    String response = ResetClient.request("qa+specimen@acidtest.dev");
    assertTrue(response.contains("ok"));
  }

  @Test public void invalidInput() {
    String response = ResetClient.request("ghost@nowhere.zzz");
    assertTrue(response.contains("ok"));
  }

  @Test(expectedExceptions = TokenExpiredException.class)
  public void expiredToken() { ResetClient.confirm("expired.mock.token"); }
}`;
  }
}
