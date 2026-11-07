# Personal Task Tracker

A responsive, lightweight Personal Task Tracker built with pure **HTML5**, **CSS3**, and **vanilla JavaScript**. 

All data is stored directly in your browser using `localStorage`, keeping your tasks intact across page refreshes and browser sessions without requiring any backend, server, or database.

![Personal Task Tracker Preview](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)
![Built With](https://img.shields.io/badge/Made%20With-HTML5%20%7C%20CSS3%20%7C%20JavaScript-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

---

## ✨ Features

- **Add New Tasks**: Set a title, short description, due date, and priority level (`Low`, `Medium`, `High`).
- **Organised Task View**: Clean card layout displaying task details, formatted due dates, priority tags, and status badges.
- **Edit Tasks**: Update title, description, due date, or priority anytime with inline form validation.
- **Safe Deletion**: Dedicated confirmation dialog before deleting tasks to prevent accidental removals.
- **Completion Toggle**: Mark tasks as completed or pending with an interactive checkbox; completed tasks feature strikethrough styling and adjusted opacity.
- **Instant Search**: Real-time search by task title with a 1-click clear search button.
- **Smart Filtering**: Filter tasks by **All**, **Pending**, or **Completed**, complete with dynamic count badges on each tab.
- **Task Sorting**: Sort tasks by earliest/latest due date, priority (high-to-low or low-to-high), alphabetical title (A–Z), or newly added.
- **Live Statistics & Progress Bar**: Real-time counters for Total, Pending, Completed, and Overdue tasks, with a dynamic completion rate percentage and progress bar.
- **Overdue Task Highlighting**: Overdue pending tasks are highlighted with a red accent border, warning tint, and an animated `⚠️ Overdue` pill badge.
- **Friendly Empty States**: Clean, helpful illustrations and messages when you have no tasks or when filters yield no matches.
- **Theme Support**: Seamless Light and Dark mode toggle with persistence.
- **Backup & Restore**: Export your tasks as a JSON file or import a previous backup at any time.
- **Keyboard Shortcuts**:
  - `N`: Open "Add New Task" modal.
  - `/`: Focus search input.
  - `Esc`: Close open modal.

---

## 🚀 Getting Started

No build tools, package managers, or server setup needed!

1. Clone or download this repository:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   ```
2. Navigate into the directory and open `index.html` in your favorite web browser:
   - On Windows: double-click `index.html` or run:
     ```powershell
     Start-Process index.html
     ```
   - On macOS:
     ```bash
     open index.html
     ```
   - On Linux:
     ```bash
     xdg-open index.html
     ```

---

## 📁 Project Structure

```
├── index.html     # Semantic HTML5 layout and modals
├── style.css      # Modern responsive styling and Light/Dark themes
├── script.js      # Core logic, localStorage persistence, and event handlers
└── README.md      # Project documentation
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
