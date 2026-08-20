from datetime import datetime
from unittest.mock import patch

from django.test import SimpleTestCase
from django.urls import reverse

from .hos import HOUR, HosPlanner


def route(duration_hours, distance_miles):
    distance_meters = distance_miles / 0.000621371
    geometry = {'coordinates': [[-100, 35], [-95, 37], [-90, 40]]}
    return {
        'routes': [{
            'duration': duration_hours * HOUR,
            'distance': distance_meters,
            'geometry': geometry,
            'legs': [{
                'steps': [
                    {
                        'distance': distance_meters,
                        'duration': duration_hours * HOUR,
                        'name': 'Interstate 40',
                        'maneuver': {
                            'type': 'depart',
                            'modifier': 'east',
                            'location': geometry['coordinates'][0],
                        },
                    },
                    {
                        'distance': 0,
                        'duration': 0,
                        'name': '',
                        'maneuver': {
                            'type': 'arrive',
                            'location': geometry['coordinates'][-1],
                        },
                    },
                ],
            }],
        }]
    }, geometry


class HosPlannerTests(SimpleTestCase):
    def test_eleven_hour_limit_inserts_ten_hour_reset(self):
        planner = HosPlanner()
        trip, geometry = route(12, 720)

        planner.drive_leg(trip, geometry)

        resets = [e for e in planner.events if e['type'] == 'SB']
        self.assertEqual(len(resets), 1)
        self.assertEqual(resets[0]['remarks'], '10-hr Off Duty Reset')

    def test_thirty_minute_break_follows_eight_cumulative_drive_hours(self):
        planner = HosPlanner()
        trip, geometry = route(9, 540)

        planner.drive_leg(trip, geometry)

        breaks = [e for e in planner.events if e['remarks'] == '30-min Break']
        self.assertEqual(len(breaks), 1)

    def test_fuel_stop_is_inserted_by_one_thousand_miles(self):
        planner = HosPlanner()
        trip, geometry = route(9, 1125)

        planner.drive_leg(trip, geometry)

        fuel = [e for e in planner.events if e['remarks'] == 'Fuel Stop']
        breaks = [e for e in planner.events if e['remarks'] == '30-min Break']
        self.assertEqual(len(fuel), 1)
        self.assertEqual(len(breaks), 0)
        self.assertAlmostEqual(planner.dist_since_fuel * 0.000621371, 125, places=1)

    def test_exhausted_cycle_inserts_34_hour_restart_before_more_driving(self):
        planner = HosPlanner(cycle_used_hours=69.5)
        trip, geometry = route(2, 120)

        planner.drive_leg(trip, geometry)

        restarts = [e for e in planner.events if '34-hr Restart' in e['remarks']]
        self.assertEqual(len(restarts), 1)
        self.assertLessEqual(planner.cycle_used, 2 * HOUR)

    def test_pickup_and_dropoff_are_one_hour_on_duty_periods(self):
        planner = HosPlanner()

        planner.on_duty_stop('Memphis, TN', 'Pickup', [-90, 35])
        planner.on_duty_stop('Chicago, IL', 'Dropoff', [-87, 41])

        self.assertEqual(len(planner.events), 2)
        for event in planner.events:
            duration = (
                datetime.fromisoformat(event['end'])
                - datetime.fromisoformat(event['start'])
            ).total_seconds()
            self.assertEqual(duration, HOUR)


class CalculateTripApiTests(SimpleTestCase):
    @patch('logbook.views.draw_log_sheet', return_value='logs/test.png')
    @patch('logbook.views.get_osrm_route')
    @patch('logbook.views.geocode')
    def test_required_inputs_produce_map_events_logs_and_directions(
        self, geocode, get_route, _draw_log
    ):
        geocode.side_effect = [
            ((-96.8, 32.8), 'Dallas, TX'),
            ((-90.0, 35.1), 'Memphis, TN'),
            ((-87.6, 41.8), 'Chicago, IL'),
        ]
        route_one, _ = route(2, 120)
        route_two, _ = route(3, 180)
        get_route.side_effect = [route_one, route_two]

        response = self.client.post(
            reverse('calculate_trip'),
            {
                'start_location': 'Dallas, TX',
                'pickup_location': 'Memphis, TN',
                'dropoff_location': 'Chicago, IL',
                'current_cycle_used': 12,
            },
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('geometry_leg1', payload)
        self.assertIn('geometry_leg2', payload)
        self.assertTrue(payload['events'])
        self.assertTrue(payload['logs'])
        self.assertEqual(len(payload['route_instructions']), 4)
        self.assertEqual(payload['cycle']['cycle_used_hours'], 19)

    def test_rejects_cycle_hours_outside_assessment_range(self):
        response = self.client.post(
            reverse('calculate_trip'),
            {
                'start_location': 'Dallas, TX',
                'pickup_location': 'Memphis, TN',
                'dropoff_location': 'Chicago, IL',
                'current_cycle_used': 71,
            },
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('between 0 and 70', response.json()['error'])
