# StudyDesk – Minimalist Student Task Manager

StudyDesk is a responsive, client-side productivity application designed to help students track coursework, organize study items by subject, and manage deadlines effectively. Built using vanilla web technologies, the app operates completely in the browser with persistent local storage.

## ✨ Features

* Dynamic Task Organization:

1. Categorize tasks by customized subjects with distinct color badges.
2. Set priority levels: High, Medium, and Low.
3. Schedule deadlines with both date and optional due time.
4. Add descriptive notes to tasks for extra study context.

* Multiple Smart Views & Filtering:

1. All Tasks: Comprehensive overview of all current items.
2. Due Today: Filters items due on the current calendar date.
3. Upcoming: Tracks future deadlines.
4. Overdue: Highlights missed deadlines automatically in red.
5. Completed: View finished tasks with instant uncheck capability.
6. Subject Views: Filter exclusively by selected subject tags.
7. Priority Filter Chips & Search: Instant live-search by title or notes.

* Productivity Metrics & Progress Tracking:

1. Real-time stat bar tracking total, completed, pending, and overdue counts.
2. Dynamic completion progress bar reflecting current completion percentage.

* Persistent Local Storage:

Uses the browser's localStorage API so tasks and subjects persist across refreshes without requiring a backend database.

* Adaptive Design:

Responsive layout for desktop and tablet screens.

Native dark mode and light mode adaptation via prefers-color-scheme.

* Subject Management:

Custom color picker palette for newly created subjects.

Inline subject deletion with automatic task unlinking.

## 🛠️ Tech Stack

* HTML5: Semantic markup structure and modal overlays.
* CSS3: Custom CSS variables for theming, responsive flexbox layout, and dark mode media queries.
* JavaScript (ES6+): Pure vanilla JavaScript for state management, date filtering logic, and DOM manipulation.
* Tabler Icons: Clean vector icon webfont loaded via CDN for UI controls.

## 📁 Project Structure

studydesk/
├── index.html       
├── style.css        
├── app.js           
└── README.md        


## 🚀 Getting Started

No build tools, bundlers, or server runtimes are required.

Clone or Download the repository:

git clone https://github.com/your-username/studydesk.git
cd studydesk


Open the application:

Double-click index.html to open it directly in any modern browser (Chrome, Firefox, Safari, Edge).

Alternatively, use a local server like VS Code's Live Server extension.

## 💡 Architecture & Key Functions

* state: Central JavaScript state object storing the array of tasks, subjects, current view filter, and active priorities.
* save() / load(): Serializes state to and from JSON stored in localStorage.getItem('studydesk').
* getFilteredTasks(): Pure filtering pipeline supporting combined text querying, view matching, and multi-tier priority sorting.
* render(): Master UI synchronization routine updating navigation counters, metrics bars, and task cards.

## Autor

Yogeshwari Bhosale