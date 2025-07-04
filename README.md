# 🚀 Code Problem Solver Chrome Extension

A smart Chrome extension that auto-detects programming problems when you copy them, sends them to OpenAI (GPT-4), and inserts the generated code solution directly into code editors like LeetCode, HackerRank, CodeChef, and more.

---

## 🔧 Features

- 🧠 Detects when you copy a programming problem
- ✨ Generates a code solution using OpenAI's API
- 💬 Supports multiple languages: Python, JavaScript, Java, C++, and more
- 🖱️ Inserts solution into code editors automatically
- 🔐 Securely stores your API key using Chrome's storage
- ⚙️ One-click activation and deactivation via popup UI

---

## 📸 Screenshot

<p align="center">
  <img src="screenshots/screenshotexe.png" alt="Extension Popup UI" width="400">
</p>


---

## 📂 Folder Structure

📦 code-problem-solver-extension
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── screenshots/
│ └── popup.png
├── icons/
│ ├── icon16.png
│ ├── icon48.png
│ └── icon128.png

---

## 🛠️ How to Use

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer Mode** (top right)
4. Click **"Load unpacked"** and select this project folder
5. Click on the extension icon
6. Enter your **OpenAI API key** and select your preferred language
7. Click **"Activate Extension"**
8. Copy any programming question
9. Click inside a code editor on websites like LeetCode or CodeChef
10. ✅ The generated solution will be inserted automatically!

---

## 💬 Supported Platforms

- LeetCode
- HackerRank
- CodeChef
- GeeksforGeeks
- Codewars
- Any website with a code editor or textarea

---

## 🧠 Powered By

- OpenAI API (ChatGPT-4)
- Chrome Extensions API
- JavaScript + HTML + CSS

---

## 🙋‍♂️ Want to Contribute?

Feel free to fork the repo, open issues, or suggest improvements. You can also customize this project to support even more sites and languages.

---

> ⭐ If you like this project, give it a star and share it with others!

