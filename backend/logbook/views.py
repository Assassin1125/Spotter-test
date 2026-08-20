from rest_framework.views import APIView
from rest_framework.response import Response
from .utils import geocode, get_osrm_route, draw_log_sheet
from .hos import HosPlanner
from datetime import datetime, timedelta


def build_route_instructions(route, leg_label):
    steps = route['routes'][0].get('legs', [{}])[0].get('steps', [])
    instructions = []
    for index, step in enumerate(steps):
        maneuver = step.get('maneuver', {})
        maneuver_type = maneuver.get('type', 'continue').replace('_', ' ')
        modifier = maneuver.get('modifier', '')
        road = step.get('name') or 'unnamed road'

        if maneuver_type == 'depart':
            text = f"Depart on {road}"
        elif maneuver_type == 'arrive':
            text = f"Arrive at {leg_label.lower()}"
        elif maneuver_type in ('turn', 'fork', 'merge', 'on ramp', 'off ramp', 'end of road'):
            direction = f" {modifier}" if modifier else ''
            text = f"{maneuver_type.title()}{direction} onto {road}"
        elif maneuver_type == 'roundabout':
            exit_number = maneuver.get('exit')
            exit_text = f" and take exit {exit_number}" if exit_number else ''
            text = f"Enter the roundabout{exit_text} onto {road}"
        else:
            text = f"Continue on {road}"

        instructions.append({
            'id': f"{leg_label.lower().replace(' ', '-')}-{index}",
            'leg': leg_label,
            'instruction': text,
            'road': road,
            'distance_miles': round(float(step.get('distance', 0)) * 0.000621371, 1),
            'duration_minutes': round(float(step.get('duration', 0)) / 60),
            'location': maneuver.get('location'),
        })
    return instructions


class CalculateTripView(APIView):
    def post(self, request):
        start_loc = (request.data.get('start_location') or '').strip()
        pickup_loc = (request.data.get('pickup_location') or '').strip()
        dropoff_loc = (request.data.get('dropoff_location') or '').strip()

        if not (start_loc and pickup_loc and dropoff_loc):
            return Response({"error": "Start, pickup, and dropoff locations are required."}, status=400)

        try:
            cycle_used = float(request.data.get('current_cycle_used', 0) or 0)
        except (TypeError, ValueError):
            return Response({"error": "Current cycle used must be a number of hours."}, status=400)

        if cycle_used < 0 or cycle_used > 70:
            return Response({"error": "Current cycle used must be between 0 and 70 hours."}, status=400)

        start_coords, start_name = geocode(start_loc)
        pickup_coords, pickup_name = geocode(pickup_loc)
        dropoff_coords, dropoff_name = geocode(dropoff_loc)

        field_errors = {}
        if not start_coords:
            field_errors['start_location'] = (
                f'We could not find "{start_loc}". Check the spelling, or add more detail like city and state.'
            )
        if not pickup_coords:
            field_errors['pickup_location'] = (
                f'We could not find "{pickup_loc}". Check the spelling, or add more detail like city and state.'
            )
        if not dropoff_coords:
            field_errors['dropoff_location'] = (
                f'We could not find "{dropoff_loc}". Check the spelling, or add more detail like city and state.'
            )

        if field_errors:
            return Response({
                "error": " ".join(field_errors.values()),
                "field_errors": field_errors,
            }, status=400)

        route1 = get_osrm_route(start_coords, pickup_coords)
        route2 = get_osrm_route(pickup_coords, dropoff_coords)

        if not (route1 and route2):
            return Response({"error": "Could not calculate route between the given locations."}, status=500)

        planner = HosPlanner(cycle_used)
        planner.drive_leg(route1, route1['routes'][0]['geometry'])
        planner.on_duty_stop(pickup_name, 'Pickup', pickup_coords)
        planner.drive_leg(route2, route2['routes'][0]['geometry'])
        planner.on_duty_stop(dropoff_name, 'Dropoff', dropoff_coords)

        events = planner.events
        unique_days = sorted({
            day
            for e in events
            for day in (
                datetime.fromisoformat(e['start']).date(),
                (datetime.fromisoformat(e['end']) - timedelta(microseconds=1)).date(),
            )
        })
        logs_generated = []
        for day in unique_days:
            day_events = [
                e for e in events
                if datetime.fromisoformat(e['start']).date() == day
                or datetime.fromisoformat(e['end']).date() == day
            ]
            parsed = []
            for e in day_events:
                item = dict(e)
                item['start'] = datetime.fromisoformat(e['start'])
                item['end'] = datetime.fromisoformat(e['end'])
                parsed.append(item)
            logs_generated.append(draw_log_sheet(parsed, day.strftime('%Y-%m-%d')))

        return Response({
            "geometry_leg1": route1['routes'][0]['geometry'],
            "geometry_leg2": route2['routes'][0]['geometry'],
            "stops": {
                "start": {"coords": start_coords, "name": start_name},
                "pickup": {"coords": pickup_coords, "name": pickup_name},
                "dropoff": {"coords": dropoff_coords, "name": dropoff_name},
            },
            "events": events,
            "logs": logs_generated,
            "cycle": planner.summary(),
            "route_instructions": (
                build_route_instructions(route1, 'To pickup')
                + build_route_instructions(route2, 'To dropoff')
            ),
        })
