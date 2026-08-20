# CrateLog - Intelligent ELD Route Planner

CrateLog is a full-stack Electronic Logging Device (ELD) route planning application for truck drivers. It calculates optimal routes between a start location, a pickup, and a dropoff, simulates the FMCSA hours-of-service (HOS) clocks against that route, and generates print-ready daily log sheets.

## Features

- **Route calculation** - Two legs (start → pickup, pickup → dropoff) resolved via OSRM, with turn-by-turn route instructions.
- **Full HOS engine** (`backend/logbook/hos.py`), covering:
  - 11-hour driving limit and 14-hour on-duty window
  - 30-minute break required after 8 cumulative hours of driving (any consecutive 30-minute non-driving period qualifies)
  - 10-hour sleeper-berth reset
  - 70-hour / 8-day cycle tracking, with an automatic 34-hour restart when the cycle is exhausted
  - Fuel stops inserted at least once every 1,000 miles
- **Interactive map** - Leaflet map with glowing route lines, pin markers for start/pickup/dropoff, and dots for breaks/resets/fuel stops. Expands to a full-screen view.
- **Trip results** - Animated stat summary (distance, drive time, elapsed time, compliance stops), a sequential event timeline, turn-by-turn route instructions, and the digital logbook.
- **Digital log sheets** - Print-ready daily grid sheets (driving/on-duty/sleeper/off-duty), rendered per calendar day and ready for a roadside inspection.

## Tech stack

**Frontend** - React 19 (Vite), Tailwind CSS, Framer Motion, React-Leaflet, Lucide icons, Axios.

**Backend** - Django + Django REST Framework, OSRM for routing, Nominatim for geocoding, Pillow for legacy image utilities, Whitenoise for static files, `dj-database-url` for production database config.

## Project layout

```
backend/
  eld_project/         Django project settings, root URLs
  logbook/
    hos.py             HOS/cycle simulation engine
    utils.py           Geocoding, OSRM routing, log-sheet image helper
    views.py           CalculateTripView API endpoint + route instruction formatting
    models.py          Trip / LogSheet models
    tests.py           HOS engine and API test suite
frontend/
  src/
    App.jsx            Top-level layout, header, view routing
    components/
      Form.jsx         Trip input form
      Map.jsx          Interactive route map
      Results.jsx      Stats, timeline, route instructions, log sheets
      LogSheet.jsx     Printable daily log grid
      Loader.jsx       Calculation progress state
      Background.jsx   Decorative backdrop
    lib/trip.js        Shared trip stat/formatting helpers
```

## Running locally

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API runs at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Create `frontend/.env.local` with `VITE_API_URL=http://localhost:8000` to point the frontend at your local backend instead of the deployed one.

> Note: if the Vite dev server appears to start but the page won't load, your machine's IPv6 loopback may be broken. Run `npm run dev -- --host 127.0.0.1` instead.

### Running tests

```bash
cd backend
python manage.py test logbook
```

## API

`POST /api/calculate/`

```json
{
  "start_location": "Dallas, TX",
  "pickup_location": "Memphis, TN",
  "dropoff_location": "Chicago, IL",
  "current_cycle_used": 12.5
}
```

Returns route geometry for both legs, the full HOS event stream, generated log-sheet image paths, turn-by-turn route instructions, and a cycle-hours summary.

## Deployment

- **Backend** - Deployable to Render/Railway/Heroku. `settings.py` uses `dj-database-url` for Postgres and Whitenoise for static files. Set `SECRET_KEY`, `ALLOWED_HOSTS`, and `DEBUG=False` in production.
- **Frontend** - `npm run build` produces a static `dist/` bundle, deployable to Vercel/Netlify (`frontend/vercel.json` is already configured for SPA routing) or served through Django.

## License

Internal proprietary tool.
