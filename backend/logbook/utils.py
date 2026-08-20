import requests
from django.conf import settings
import os
from PIL import Image, ImageDraw, ImageFont

OSRM_ROUTE_URL = "http://router.project-osrm.org/route/v1/driving/"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {'User-Agent': 'TruckELDApp/1.0'}

def get_coord_at_distance(geometry, total_distance, target_distance):
    if not geometry or 'coordinates' not in geometry:
        return None

    coords = geometry['coordinates']
    if target_distance <= 0:
        return coords[0]
    if target_distance >= total_distance:
        return coords[-1]

    fraction = target_distance / total_distance
    index = int(fraction * (len(coords) - 1))

    return coords[index]

def geocode(location):
    if not location or not str(location).strip():
        return None, None
    params = {'q': location, 'format': 'json', 'limit': 1}
    try:
        response = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=12)
        payload = response.json() if response.status_code == 200 else []
        if payload:
            data = payload[0]
            return (float(data['lon']), float(data['lat'])), data['display_name']
    except Exception as e:
        print(f"Geocode error: {e}")
    return None, None

def get_osrm_route(start_coords, end_coords):
    coords = f"{start_coords[0]},{start_coords[1]};{end_coords[0]},{end_coords[1]}"
    url = f"{OSRM_ROUTE_URL}{coords}?overview=full&geometries=geojson&steps=true"
    try:
        response = requests.get(url, timeout=20)
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 'Ok' and data.get('routes'):
                return data
    except Exception as e:
        print(f"OSRM error: {e}")
    return None

def draw_log_sheet(events, date_str):
    template_path = os.path.join(settings.BASE_DIR, 'logbook/templates/log_sheet_template.png')

    try:
        img = Image.open(template_path)
    except:
        img = Image.new('RGB', (1000, 800), 'white')

    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("Arial.ttf", 15)
    except IOError:
        font = ImageFont.load_default()

    draw.text((50, 50), f"Log Date: {date_str}", fill="black", font=font)

    y = 100
    for e in events:
        line = f"{e['start'].strftime('%H:%M')} - {e['end'].strftime('%H:%M')} : {e['status']} ({e['remarks']})"
        draw.text((50, y), line, fill="black", font=font)
        y += 20

    output_filename = f"log_{date_str}.png"
    save_path = os.path.join(settings.MEDIA_ROOT, 'logs', output_filename)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    img.save(save_path)

    return f"logs/{output_filename}"
