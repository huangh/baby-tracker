# Baby Event Tracker

A React web application for tracking baby events (feeding, peeing, pooping) with YAML-configurable forms, SQLite database backend, and URL-based state storage for maximum portability.

## Features

- **YAML-Configured Events**: Define event types and fields via `public/config.yaml`
- **Three Event Types**:
  - **Feeding**: Track type (breastmilk/formula/bottle) and amount (ml)
  - **Peeing**: Simple timestamp tracking
  - **Pooping**: Timestamp tracking with optional consistency description
- **Smart Timestamps**: Defaults to current time with option to specify custom date/time
- **SQLite Database Backend**: Persistent storage with automatic synchronization
- **URL-Based State**: Data also stored in URL as URL-safe base64 encoded JSON for portability
- **Mobile-Optimized Input**: Large, easy-to-click buttons with slider for feed amounts
- **Event History**: View all entered events in reverse chronological order
- **Data Visualization**: Daily timeline charts and weekly summary statistics
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ (works with Node 18.19.1+, though newer versions recommended)
- npm

### Installation

```bash
npm install
```

### Development

The application requires both a backend server (for SQLite database) and the frontend dev server.

**Option 1: Run both together (recommended)**

```bash
npm run dev:full
```

This starts both the backend API server (port 3001) and the frontend dev server (port 3000).

**Option 2: Run separately**

In one terminal, start the backend server:
```bash
npm run server
```

In another terminal, start the frontend dev server:
```bash
npm run dev
```

The app will open at `http://localhost:3000` and the API will be available at `http://localhost:3001`

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Deployment with Docker

The simplest way to deploy this application for local network usage is using Docker Compose.

1.  **Build and Run**:
    ```bash
    docker-compose up -d --build
    ```

2.  **Access the App**:
    Open your browser and navigate to `http://localhost:8080` (or your server's IP address:8080).

3.  **Update Configuration**:
    The `public/config.yaml` file is mounted into the container. You can edit this file locally to change event types or fields, and simply refresh the page in your browser to see the changes. No rebuild is required.

## Configuration

Edit `public/config.yaml` to customize event types, fields, and validation rules. The configuration structure:

```yaml
events:
  - id: event-type-id
    label: Display Name
    fields:
      - id: field-id
        label: Field Label
        type: datetime|select|number|text
        required: true|false
        default: now|value
        options: # for select fields
          - value: option-value
            label: Option Label
        slider: # for number fields (feed amount)
          min: 0
          max: 300
          step: 5
```

### Feed Amount Slider

The feed amount input uses a slider that:
- Defaults to the average of the last 2 feed amounts
- Has configurable min/max limits (default: 0-300ml)
- Step size is configurable (default: 5ml)

## How It Works

1. **Form Rendering**: The app dynamically generates forms based on YAML configuration
2. **Database Storage**: All events are stored in SQLite database (`baby_tracker.db`) for persistence
3. **State Management**: Events are loaded from database on page load and synced on every update
4. **URL Synchronization**: State is also encoded to URL-safe base64 and stored in the URL hash as backup/portability
5. **Portability**: Share the URL to transfer all events and configuration
6. **Persistence**: Database ensures data persists across sessions; URL provides backup and sharing capability

## Project Structure

```
baby-tracker/
├── public/
│   └── config.yaml          # Event type definitions
├── src/
│   ├── components/
│   │   ├── MobileEventInput.jsx
│   │   ├── DateTimePicker.jsx
│   │   ├── EventForm.jsx
│   │   ├── EventList.jsx
│   │   ├── charts/
│   │   │   ├── DailyTimelineChart.jsx
│   │   │   └── WeeklySummaryChart.jsx
│   │   └── statistics/
│   │       └── StatisticsModule.jsx
│   ├── utils/
│   │   ├── configLoader.js
│   │   └── urlState.js
│   ├── styles/
│   │   └── App.css
│   ├── App.jsx
│   └── main.jsx
├── server.js                # Express backend with SQLite
├── baby_tracker.db          # SQLite database (created automatically)
├── index.html
├── vite.config.js
└── package.json
```

## Technologies

- React 19
- Vite
- Express.js (backend API)
- better-sqlite3 (SQLite database)
- js-yaml (YAML parsing)
- react-datepicker (date/time picker)
- Recharts (data visualization)

## License

ISC
