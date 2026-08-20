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
  - No adverse-condition driving extension
- **Input validation**, front and back end:
  - Required, geocodable, routable locations - unresolvable addresses are rejected with a field-specific message
  - Current/pickup/dropoff locations must all be different from each other (a duplicate collapses a route leg to zero distance)
  - Cycle hours used must be a number between 0 and 70
- **Interactive map** - Leaflet map with glowing route lines, pin markers for start/pickup/dropoff, and dots for breaks/resets/fuel stops. Expands to a full-screen view.
- **Trip results** - Animated stat summary (distance, drive time, elapsed time, compliance stops), a sequential event timeline, turn-by-turn route instructions, and the digital logbook.
- **Digital log sheets** - Print-ready daily grid sheets (driving/on-duty/sleeper/off-duty), rendered per calendar day and ready for a roadside inspection. Includes carrier, truck, driver, load/shipping reference, and per-day mileage.

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
    views.py           CalculateTripView API endpoint + input validation + route instruction formatting
    models.py          Trip / LogSheet models
    tests.py           HOS engine and API test suite
frontend/
  src/
    App.jsx            Top-level layout, header, view routing
    components/
      Form.jsx         Trip input form, inline field validation
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

## Environment variables

| Var | Where | Required | Purpose |
|---|---|---|---|
| `SECRET_KEY` | backend | yes, in production | Django's cryptographic signing key |
| `DEBUG` | backend | yes, in production | set to `False` in production |
| `ALLOWED_HOSTS` | backend | yes, in production | comma-separated list of hostnames Django will serve (defaults to `*`) |
| `DATABASE_URL` | backend | no | Postgres connection string; falls back to local SQLite if unset |
| `VITE_API_URL` | frontend | no | backend base URL the frontend calls; falls back to a hardcoded deployed URL if unset |

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

On validation failure, returns HTTP 400 with both a combined `error` string and a `field_errors` object keyed by input name (`start_location`, `pickup_location`, `dropoff_location`, `current_cycle_used`), so the frontend can show the message under the specific field that's wrong.

## Deployment

- **Backend** - Deployable to Render/Railway/Heroku. `settings.py` uses `dj-database-url` for Postgres and Whitenoise for static files. Set `SECRET_KEY`, `ALLOWED_HOSTS`, and `DEBUG=False` in production.
- **Frontend** - `npm run build` produces a static `dist/` bundle, deployable to Vercel/Netlify (`frontend/vercel.json` is already configured for SPA routing) or served through Django.

## Assumptions

- **Driver type**: property-carrying driver on the 70-hour/8-day cycle only. The 60-hour/7-day cycle and passenger-carrying rules are out of scope.
- **Current cycle hours** is taken as a single number the user reports for "hours already used in the current cycle," not derived from a multi-day log history - there is no persisted driver/day-by-day ledger behind it.
- **Fuel stops** are modeled as a fixed 30-minute on-duty stop every 1,000 miles; real fueling time/frequency varies by carrier policy.
- **Pickup and dropoff** are each a fixed 1 hour on-duty, not-driving.
- Route legs are geocoded via Nominatim and routed via the public OSRM demo server - no API keys are required or used anywhere in this project.
- A duplicate location between current/pickup/dropoff is treated as a user input error (see Features), not a valid zero-distance leg.

## Known limitations

- The 70-hour cycle is tracked only for the duration of the simulated trip; it does not maintain a real rolling 8-day window across multiple sessions, since the app has no persistent per-driver history.
- Location validation happens on submit (server round-trip), not as-you-type; there's no live autocomplete/typeahead against the geocoding service.
- The public OSRM/Nominatim demo endpoints are rate-limited and not guaranteed uptime - a production deployment should point at a dedicated OSRM instance and a Nominatim provider with an SLA.
- Render's free tier spins down after ~15 minutes idle; the first request after that takes 30-50 seconds to wake up.
- `Trip`/`LogSheet` Django models exist but nothing in the current request flow persists to them - the API is stateless per request.

## License

Internal proprietary tool.
