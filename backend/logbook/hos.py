from datetime import datetime, timedelta

from .utils import get_coord_at_distance

HOUR = 3600
DRIVE_LIMIT = 11 * HOUR
WINDOW_LIMIT = 14 * HOUR
BREAK_DRIVE_LIMIT = 8 * HOUR
REST_RESET = 10 * HOUR
RESTART_34 = 34 * HOUR
CYCLE_LIMIT = 70 * HOUR
FUEL_METERS = 1_609_344
FUEL_DURATION = 30 * 60
STOP_DURATION = 1 * HOUR
BREAK_30 = 30 * 60


def _iso(dt):
    return dt.isoformat()


class HosPlanner:
    def __init__(self, cycle_used_hours=0):
        used = max(0.0, min(70.0, float(cycle_used_hours or 0)))
        self.now = datetime.now()
        self.events = []
        self.drive_since_break = 0.0
        self.drive_since_reset = 0.0
        self.window_start = None
        self.cycle_used = used * HOUR
        self.dist_since_fuel = 0.0

    def _window_left(self):
        if self.window_start is None:
            return WINDOW_LIMIT
        elapsed = (self.now - self.window_start).total_seconds()
        return max(0.0, WINDOW_LIMIT - elapsed)

    def _cycle_left(self):
        return max(0.0, CYCLE_LIMIT - self.cycle_used)

    def _ensure_window(self):
        if self.window_start is None:
            self.window_start = self.now

    def _append(self, type_, status, duration, location, remarks, coord=None, miles=0, on_duty=False, driving=False):
        end = self.now + timedelta(seconds=duration)
        event = {
            'type': type_,
            'status': status,
            'start': _iso(self.now),
            'end': _iso(end),
            'location': location,
            'remarks': remarks,
        }
        if coord is not None:
            event['coord'] = coord
        if miles:
            event['miles'] = miles
        self.events.append(event)
        self.now = end
        if on_duty or driving:
            self.cycle_used += duration
        if driving:
            self.drive_since_break += duration
            self.drive_since_reset += duration

    def rest_10(self, coord, remarks='10-hr Off Duty Reset'):
        self._append('SB', 'Sleeper Berth', REST_RESET, 'Rest Stop', remarks, coord=coord)
        self.drive_since_break = 0
        self.drive_since_reset = 0
        self.window_start = None

    def restart_34(self, coord):
        self._append('OFF', 'Off Duty', RESTART_34, 'Rest Stop', '34-hr Restart (70-hr cycle)', coord=coord)
        self.drive_since_break = 0
        self.drive_since_reset = 0
        self.window_start = None
        self.cycle_used = 0

    def break_30(self, coord):
        self._append('OFF', 'Off Duty', BREAK_30, 'Rest Area', '30-min Break', coord=coord)
        self.drive_since_break = 0

    def fuel(self, coord):
        self._ensure_window()
        self._append('ON', 'On Duty', FUEL_DURATION, 'Gas Station', 'Fuel Stop', coord=coord, on_duty=True)
        self.dist_since_fuel = 0
        self.drive_since_break = 0

    def on_duty_stop(self, location, remarks, coord):
        self._ensure_window()
        self._append('ON', 'On Duty', STOP_DURATION, location, remarks, coord=coord, on_duty=True)
        self.drive_since_break = 0

    def drive_leg(self, route, geometry):
        r_data = route['routes'][0]
        remaining_time = float(r_data['duration'])
        leg_distance = float(r_data['distance'])
        avg_speed = leg_distance / remaining_time if remaining_time > 0 else 0
        covered = 0.0
        steps = 0

        while remaining_time > 1 and steps < 400:
            steps += 1
            coord = get_coord_at_distance(geometry, leg_distance, covered)

            time_to_8h = BREAK_DRIVE_LIMIT - self.drive_since_break
            time_to_11h = DRIVE_LIMIT - self.drive_since_reset
            time_to_14h = self._window_left()
            time_to_cycle = self._cycle_left()
            dist_to_fuel = FUEL_METERS - self.dist_since_fuel
            time_to_fuel = dist_to_fuel / avg_speed if avg_speed > 0 else 10**9

            limits = [remaining_time, time_to_8h, time_to_11h, time_to_14h, time_to_cycle, time_to_fuel]
            dt = min(limits)

            if dt < 1:
                if time_to_cycle <= 1:
                    self.restart_34(coord)
                elif time_to_11h <= 1 or time_to_14h <= 1:
                    self.rest_10(coord)
                elif time_to_fuel <= 1:
                    self.fuel(coord)
                elif time_to_8h <= 1:
                    self.break_30(coord)
                else:
                    break
                continue

            self._ensure_window()
            miles = dt * avg_speed * 0.000621371
            self._append(
                'D', 'Driving', dt, 'En route', 'Driving',
                miles=miles, driving=True,
            )
            remaining_time -= dt
            covered += dt * avg_speed
            self.dist_since_fuel += dt * avg_speed

        return get_coord_at_distance(geometry, leg_distance, covered)

    def summary(self):
        return {
            'cycle_used_hours': round(self.cycle_used / HOUR, 2),
            'cycle_remaining_hours': round(self._cycle_left() / HOUR, 2),
        }
