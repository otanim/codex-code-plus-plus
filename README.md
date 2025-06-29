# Code++ Queue Helper

A userscript for ChatGPT Codex tasks that lets you queue prompts and run them sequentially. Clicking the injected **Code++** button stores the current prompt in a persistent list displayed as draggable toast cards. Items can be reordered, removed and will automatically execute one after another.

|                   |                                                      |
|-------------------|------------------------------------------------------|
| **Userscript name** | `Codex task – Code++ queue helper` |
| **Current version** | 0.1.24 |
| **Match URL**       | `https://chatgpt.com/codex/tasks/task*` |
| **Permissions**     | none (DOM only, uses `localStorage`) |
| **License**         | MIT |

## Features

- Queue any prompt by pressing **Code++**.
- Queue survives page reloads via `localStorage`.
- Toast cards (minimum 375&nbsp;px wide) can be drag‑resized.
- Inline SVG icons for moving up/down or deleting an entry.
- Automatic execution: the script types each queued prompt, clicks **Code**, waits for completion and proceeds to the next.
- Visual states highlight the item being processed and mark finished ones.

## Screenshots

### "Code++" button

![img_7.png](img_7.png)

### Queue list

![img_1.png](img_1.png)

## Installation

1. Install a userscript manager:
   - Chrome/Edge/Brave: [Tampermonkey](https://www.tampermonkey.net/)
   - Firefox: [Violentmonkey](https://violentmonkey.github.io/) or Tampermonkey
2. Open [`codeplus-queue-helper.user.js`](./codeplus-queue-helper.user.js) and click **Raw** to install.
3. Visit a Codex task page. A new **Code++** button appears next to the stop button.

## Usage

Click **Code++** to stash the current prompt. A toast with its text appears in the bottom right corner. Use the up/down arrows to reorder or the trash icon to delete. When you open or reload a task page, queued prompts are automatically injected into the editor and executed one by one while their toasts update from *processing* to *done*.

## Configuration

The script exposes a few constants near the top:

| Constant      | Purpose                         | Default        |
|---------------|---------------------------------|---------------|
| `MIN_WIDTH`   | Minimum toast width             | `375` |
| `LS_PREFIX`   | `localStorage` key prefix       | `code-plus-plusQueue:` |
| `CODE_TIMEOUT`| Maximum wait for a Code run (ms)| `600000` |

Adjust them directly in the script if needed.

## Contributing

1. Fork the repository and create a feature branch.
2. Commit your changes using conventional commit messages.
3. Open a pull request.

The codebase is plain ES2020 JavaScript with no build step.

## License

MIT © 2025 @otanim (Arman Yeghiazaryan)

---

Happy coding! 🚀
