
## Scope

1. **LiveDemo (`src/components/site/LiveDemo.tsx`)** — add an "Upload doc" button next to the story input, mirroring Playground behaviour (sign-in required, 5 MB cap, reuses existing `parseUploadedFile` server fn). Replace the 3-tab framework switcher with the same 16-framework picker used on Playground.

2. **Playground (`src/routes/playground.tsx`)** — replace the current `<select>` (3 active + 5 disabled) with the full 16-framework picker.

3. **Framework catalog (`src/components/site/generators.ts`)** — extend `Framework` type + `generateCode()` to cover all 16 targets. Each generator emits a minimal, syntactically-correct stub in the target language so `CodeTyper` renders it and BYO/Lovable generation prompts can request the same framework by name.

## The 16 frameworks (Multi-language QA set)

| # | Label | Language | File ext |
|---|---|---|---|
| 1 | Playwright | TypeScript | `.spec.ts` |
| 2 | Cypress | TypeScript | `.cy.ts` |
| 3 | Selenium (Java) | Java | `.java` |
| 4 | Selenium (Python) | Python / pytest | `.py` |
| 5 | Selenium (C#) | C# / NUnit | `.cs` |
| 6 | Puppeteer | TypeScript | `.test.ts` |
| 7 | WebdriverIO | TypeScript | `.e2e.ts` |
| 8 | Appium | JavaScript | `.test.js` |
| 9 | Espresso | Kotlin | `.kt` |
| 10 | XCUITest | Swift | `.swift` |
| 11 | RestAssured | Java | `.java` |
| 12 | Postman | JSON collection | `.json` |
| 13 | Robot Framework | Robot | `.robot` |
| 14 | Cucumber | Gherkin | `.feature` |
| 15 | JUnit | Java | `.java` |
| 16 | TestNG | Java | `.xml` + Java |

## UI approach

- **Framework picker**: compact 4×4 grid of pill buttons (mono, uppercase, `text-[10px]`) styled like the existing Engine toggle. Selected pill uses `border-acid/60 bg-acid/10 text-acid`. Fits both LiveDemo and Playground layouts without breaking the folder-tab visual.
- **CodeTyper filename**: derive extension from a small `FRAMEWORK_META` map so the tab shows `generated.playwright.spec.ts`, `generated.selenium-python.py`, `generated.jira.feature`, etc.
- **BYO prompt**: `buildPrompt()` in `ai-generate.functions.ts` already interpolates the framework name — pass the full label (e.g. "Selenium (Python / pytest)") so the LLM produces the right language.

## Files to touch

- `src/components/site/generators.ts` — expand `Framework` union, add `FRAMEWORK_META` (label, ext, language), add 16 stub generators.
- `src/components/site/LiveDemo.tsx` — add upload button + hidden file input (reuses `parseUploadedFile` + `useSession`), swap 3-tab bar for 16-item pill grid.
- `src/routes/playground.tsx` — replace `<select>` with the same pill-grid component (extract shared `FrameworkPicker` into `src/components/site/FrameworkPicker.tsx`).
- `src/lib/ai-generate.functions.ts` — widen `Framework` validator to accept all 16 labels.

## Not in scope

- No new DB tables, no new server routes, no auth changes.
- Jira ticket creation stays as previously scoped (separate follow-up).
- Anonymous upload stays disabled per your answer.
