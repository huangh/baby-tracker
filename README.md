# Baby Event Tracker

A React web application for tracking baby events (feeding, peeing, pooping) with YAML-configurable forms and URL-based state storage for maximum portability.

## Features

- **YAML-Configured Events**: Define event types and fields via `public/config.yaml`
- **Three Event Types**:
  - **Feeding**: Track type (breastmilk/formula/bottle) and amount (ml)
  - **Peeing**: Simple timestamp tracking
  - **Pooping**: Timestamp tracking with optional consistency description
- **Smart Timestamps**: Defaults to current time with option to specify custom date/time
- **URL-Based State**: All configuration and data stored in URL as URL-safe base64 encoded JSON
- **Event History**: View all entered events in reverse chronological order
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

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

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
```

## How It Works

1. **Form Rendering**: The app dynamically generates forms based on YAML configuration
2. **State Management**: All events are stored in React state
3. **URL Synchronization**: State is automatically encoded to URL-safe base64 and stored in the URL hash
4. **Portability**: Share the URL to transfer all events and configuration
5. **Persistence**: Browser back/forward navigation works via URL state

## Project Structure

```
baby-tracker/
├── public/
│   └── config.yaml          # Event type definitions
├── src/
│   ├── components/
│   │   ├── DateTimePicker.jsx
│   │   ├── EventForm.jsx
│   │   └── EventList.jsx
│   ├── utils/
│   │   ├── configLoader.js
│   │   └── urlState.js
│   ├── styles/
│   │   └── App.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

## Technologies

- React 19
- Vite
- js-yaml (YAML parsing)
- react-datepicker (date/time picker)

## License

ISC
