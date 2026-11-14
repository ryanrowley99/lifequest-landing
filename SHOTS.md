# SHOTS.md: screenshots the landing page is waiting for

The five images in `shots/` are STAND-INS, rendered from the old HTML replicas of the app's screens (S95 L9). They are not screenshots. Replace each with a real capture once the final colour is chosen and build 9 is installed. Keep the file names or update the `src` in `index.html`.

## How to capture

- Device: iPhone 15 Pro or 16 Pro simulator (1179 x 2556 or 1206 x 2622), light/dark as shipped.
- Build 9, App Store configuration, so the Dev gear and Looks panel are not on screen.
- Clean test account named "Alex", no test or junk quests, no pop-ups or sheets open, tour finished.
- Main objective: "Run a half marathon", target date December 2027, three dated checkpoints (April, August, November).
- Today's quests: "Run 2 km" (Health) and "Read 10 pages" (Growth), both from the library, neither logged.
- Export as WebP, about 600 px wide (the page shows them at 240 to 264 px, so 2x is enough). Status bar: 9:41, full battery.
- The page crops with `object-fit: cover` from the top, so any iPhone screenshot ratio works.

## The list

| File | Screen | State |
|---|---|---|
| `shots/standin-home-cp1.webp` | Home | Mid-April. Timeline about 29%, checkpoint 1 passed (`dev/tlstart` and `dev/tlend` set the line). Days showed up and XP at early-year values. |
| `shots/standin-home-cp2.webp` | Home | Mid-August, after a week with nothing logged (no dots under the earlier days of the week). Timeline about 62%, checkpoints 1 and 2 passed. If the Return card is showing, capture one with it and one after "Later". |
| `shots/standin-home-cp3.webp` | Home | Mid-November. Timeline about 87%, all three checkpoints passed, every earlier day this week logged. |
| `shots/standin-you.webp` | You | December. Objective row "By Dec 2027 · 3 of 3", days showed up grid well filled, level and XP to match. |
| `shots/standin-skills.webp` | Skills | Four skill trees, a few nodes lit on each (at least one ladder with several), "1 skill point available" pill showing. |

## After replacing

- Update each image's `alt` text in `index.html` to describe what the real screenshot shows (numbers included).
- Delete this file's stand-in note and the `standin-` prefix if you rename the files.
