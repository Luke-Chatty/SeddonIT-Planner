# Infrastructure Planning Application

An interactive web application for creating and managing IT infrastructure plans with an automatically-displaying Gantt chart, task management, and integrated documentation.

**Domain**: plan.seddon.co.uk

## Features

- **Interactive Gantt Chart**: Visualize your infrastructure plan with an automatically-rendering Gantt chart
- **Task Management**: Create, edit, and delete tasks with dependencies, priorities, and status tracking
- **Documentation System**: Add Markdown documentation to each task with a built-in editor and viewer
- **Multiple View Modes**: Switch between Gantt-only, split view, tasks-only, or documentation-only views
- **Data Persistence**: Auto-save to browser localStorage with import/export functionality
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and tablet devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Create Tasks**: Click "Add Task" to create new infrastructure tasks
2. **Manage Timeline**: Drag tasks on the Gantt chart to adjust dates
3. **Add Dependencies**: Link tasks together to show dependencies
4. **Document Tasks**: Use the documentation editor to add notes and details
5. **Export/Import**: Save your plan as JSON or import existing plans

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Gantt Chart**: frappe-gantt
- **State Management**: Zustand
- **Markdown**: react-markdown
- **Icons**: lucide-react
- **Date Utilities**: date-fns

## Project Structure

```
infrastructure-plan/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── GanttChart/        # Gantt chart components
│   ├── TaskManager/       # Task management components
│   ├── Documentation/     # Documentation components
│   └── UI/                # Reusable UI components
├── lib/                   # Utilities and stores
│   ├── types.ts           # TypeScript interfaces
│   ├── storage.ts         # Data persistence
│   ├── store.ts           # Zustand store
│   └── utils.ts           # Helper functions
└── data/                  # Default data files
```

## License

Private project for plan.seddon.co.uk