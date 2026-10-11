# W3Schools C# Tutorial — Offline Copy

An offline snapshot of the **W3Schools C# tutorial** (all 71 pages) with its
stylesheets, scripts, images and fonts included. Once downloaded it works
**without an internet connection** — just a normal web browser.

---

## What you need

- A Windows PC
- Any modern browser (Microsoft Edge, Google Chrome, or Firefox)
- No installation and no internet connection required

---

## 1. Download the files

You will receive the project as a **ZIP file** (or as a folder).

**If you have a ZIP file:**

1. Save it somewhere easy to find, for example your **Desktop** or **Downloads**.
2. Right-click the ZIP and choose **Extract All…**, then click **Extract**.
3. You now have a folder named **`w3schools-cs`** containing this README.

> Important: always extract the ZIP before opening anything. Do not open files
> from inside the ZIP preview window (that shows a temporary copy and links will
> not work).

**If you already have a folder:** copy it somewhere permanent, for example
**Documents**, so it is not lost.

---

## 2. Open the tutorial

1. Open the **`w3schools-cs`** folder.
2. **Double-click `index.html`** — the file at the very top level, next to this
   README.
3. Your browser opens and immediately redirects to the **C# tutorial** start
   page.
4. Use the **left-hand sidebar** to move between chapters, or the
   **Previous / Next** buttons at the bottom of each page.

That's it. Everything is local; clicking links moves between the saved pages.

> If double-clicking opens a text editor instead of your browser, right-click
> `index.html` → **Open with** → choose Edge, Chrome, or Firefox.
>
> Tip: once it's open, bookmark the page (Ctrl+D) for quick access later.

---

## Optional: run a tiny local web server (most accurate)

Opening `index.html` directly works for the whole tutorial. For the most
faithful rendering (the top navigation bar, the "my learning" widget, and the
"Try it Yourself" editor), you can serve the files with a small local server.
This is optional.

1. Install Python from <https://www.python.org/downloads/> if you don't have it.
   During install, tick **"Add python.exe to PATH"**.
2. Open the folder `w3schools-cs\www.w3schools.com`.
3. Click the address bar, type `cmd`, and press Enter to open a Command Prompt
   in that folder.
4. Run:

   ```bat
   python -m http.server 8000
   ```

5. Open your browser and go to <http://localhost:8000/>.
6. When finished, return to the Command Prompt and press **Ctrl+C** to stop the
   server.

---

## Notes and limitations

- This is a **point-in-time snapshot** of the W3Schools C# tutorial. The
  original content is **© W3Schools** and is included for personal, offline
  study.
- Features that depend on the live website will not work offline: the search
  box, logging in, saving progress, and some online quizzes/submissions.
- The "Try it Yourself" example pages are included; a few may still ask for an
  internet connection.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Pages look unstyled / plain | Make sure you extracted the ZIP fully and opened the **top-level** `index.html` (not one inside the `www.w3schools.com` folder). |
| Clicking links does nothing | Open `index.html` from the top-level folder; don't open individual files directly from a ZIP preview. |
| Page is blank | Try a different browser, or use the optional local server method above. |
| Browser opens a notepad/text file | Right-click `index.html` → **Open with** → pick your browser. |

---

## Folder layout

```
w3schools-cs\
├─ index.html          <-- double-click this to start
├─ README.md           <-- this file
└─ www.w3schools.com\
   ├─ cs\              <-- all C# tutorial pages
   ├─ lib\             <-- stylesheets, scripts, fonts
   ├─ images\          <-- images
   └─ ...              <-- other shared assets
```
