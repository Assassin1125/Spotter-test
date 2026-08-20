import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Popup, Polyline, useMap, CircleMarker, Marker, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Crosshair, Maximize2, Minimize2 } from 'lucide-react';
import { eventTone, formatClock, isFuelStop } from '../lib/trip';

const COLORS = {
    canvas: '#05070E',
    leg1: '#7C6CF6',
    leg2: '#22D3EE',
    start: '#34D399',
    pickup: '#7C6CF6',
    dropoff: '#22D3EE',
    break: '#F59E0B',
    reset: '#FB5C77',
    fuel: '#34D399',
};

const TONE_STYLES = {
    rest: { color: COLORS.reset, radius: 7 },
    break: { color: COLORS.break, radius: 5.5 },
    fuel: { color: COLORS.fuel, radius: 6 },
};

const LEGEND = [
    { label: 'To pickup', color: COLORS.leg1 },
    { label: 'Loaded', color: COLORS.leg2 },
    { label: 'Break', color: COLORS.break },
    { label: 'Reset', color: COLORS.reset },
    { label: 'Fuel', color: COLORS.fuel },
];

const createPinIcon = (color) =>
    L.divIcon({
        className: 'custom-pin-marker',
        html: `<div class="pin-pulse" style="width:16px;height:16px">
            <span style="background:${color};opacity:.35"></span>
            <div style="
                width:14px;height:14px;border-radius:50%;
                background:${color};
                border:2.5px solid ${COLORS.canvas};
                box-shadow:0 0 0 1.5px ${color}66, 0 0 14px ${color}aa;
            "></div>
          </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -12],
    });

const icons = {
    start: createPinIcon(COLORS.start),
    pickup: createPinIcon(COLORS.pickup),
    dropoff: createPinIcon(COLORS.dropoff),
};

function FitBounds({ coords, fitSignal }) {
    const map = useMap();

    useEffect(() => {
        if (!coords || coords.length === 0) return undefined;

        const fit = () => {
            map.invalidateSize();
            map.fitBounds(coords, { padding: [60, 60], animate: true, duration: 0.8 });
        };

        const raf = requestAnimationFrame(fit);
        window.addEventListener('resize', fit);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', fit);
        };
    }, [coords, map, fitSignal]);

    return null;
}

function PopupCard({ title, subtitle, meta }) {
    return (
        <div className="min-w-[9rem]">
            <div className="text-[12px] font-semibold text-ink">{title}</div>
            {subtitle && <div className="mt-0.5 text-[11px] leading-snug text-muted">{subtitle}</div>}
            {meta && <div className="mt-1.5 font-mono text-[10px] text-faint">{meta}</div>}
        </div>
    );
}

function GlowRoute({ positions, color }) {
    if (positions.length === 0) return null;
    return (
        <>
            <Polyline positions={positions} pathOptions={{ color, weight: 11, opacity: 0.14, lineCap: 'round' }} />
            <Polyline positions={positions} pathOptions={{ color, weight: 3.5, opacity: 0.95, lineCap: 'round' }} />
            <Polyline
                positions={positions}
                pathOptions={{ className: 'route-flow', color: '#FFFFFF', weight: 2, opacity: 0.5, lineCap: 'round' }}
            />
        </>
    );
}

export default function Map({ geometry1, geometry2, stops, events = [], badge }) {
    const [expanded, setExpanded] = useState(false);
    const [fitSignal, setFitSignal] = useState(0);

    const processGeo = (geo) => {
        if (!geo || !geo.coordinates) return [];
        return geo.coordinates.map((c) => [c[1], c[0]]);
    };

    const path1 = useMemo(() => processGeo(geometry1), [geometry1]);
    const path2 = useMemo(() => processGeo(geometry2), [geometry2]);
    const allPoints = useMemo(() => [...path1, ...path2], [path1, path2]);
    const center = allPoints.length > 0 ? allPoints[0] : [39.8283, -98.5795];

    const specialStops = useMemo(() => {
        const safeEvents = Array.isArray(events) ? events : [];
        return safeEvents.filter((e) => e.coord && (e.type === 'OFF' || e.type === 'SB' || isFuelStop(e)));
    }, [events]);

    const refit = useCallback(() => setFitSignal((n) => n + 1), []);

    useEffect(() => {
        if (!expanded) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setExpanded(false);
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [expanded]);

    const surface = (
        <>
            <MapContainer
                key={expanded ? 'expanded' : 'inline'}
                center={center}
                zoom={4}
                zoomControl={false}
                scrollWheelZoom={expanded}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <ZoomControl position="bottomright" />

                <GlowRoute positions={path1} color={COLORS.leg1} />
                <GlowRoute positions={path2} color={COLORS.leg2} />

                {stops?.start && (
                    <Marker position={[stops.start.coords[1], stops.start.coords[0]]} icon={icons.start}>
                        <Popup>
                            <PopupCard title="Start location" subtitle={stops.start.name} meta="Leg 1 · deadhead" />
                        </Popup>
                    </Marker>
                )}

                {stops?.pickup && (
                    <Marker position={[stops.pickup.coords[1], stops.pickup.coords[0]]} icon={icons.pickup}>
                        <Popup>
                            <PopupCard title="Pickup" subtitle={stops.pickup.name} meta="1 hr on duty" />
                        </Popup>
                    </Marker>
                )}

                {stops?.dropoff && (
                    <Marker position={[stops.dropoff.coords[1], stops.dropoff.coords[0]]} icon={icons.dropoff}>
                        <Popup>
                            <PopupCard title="Dropoff" subtitle={stops.dropoff.name} meta="1 hr on duty" />
                        </Popup>
                    </Marker>
                )}

                {specialStops.map((evt, idx) => {
                    const { color, radius } = TONE_STYLES[eventTone(evt)] ?? TONE_STYLES.break;

                    return (
                        <Fragment key={`${evt.start}-${idx}`}>
                            <CircleMarker
                                center={[evt.coord[1], evt.coord[0]]}
                                pathOptions={{ color, fillColor: color, fillOpacity: 0.18, weight: 0 }}
                                radius={radius * 2.4}
                            />
                            <CircleMarker
                                center={[evt.coord[1], evt.coord[0]]}
                                pathOptions={{ color: COLORS.canvas, fillColor: color, fillOpacity: 1, weight: 2 }}
                                radius={radius}
                            >
                                <Popup>
                                    <PopupCard
                                        title={evt.remarks || evt.status}
                                        subtitle={evt.location}
                                        meta={`${formatClock(evt.start)} → ${formatClock(evt.end)}`}
                                    />
                                </Popup>
                            </CircleMarker>
                        </Fragment>
                    );
                })}

                <FitBounds coords={allPoints} fitSignal={fitSignal} />
            </MapContainer>

            <div className="pointer-events-none absolute inset-x-0 top-0 z-[1200] flex items-start justify-between gap-3 p-4">
                {badge ? (
                    <span className="chip border-line2 bg-panel/85 backdrop-blur-xl">
                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-mint" />
                        {badge}
                    </span>
                ) : (
                    <span />
                )}

                <span className="pointer-events-auto flex items-center gap-2">
                    <button type="button" onClick={refit} className="btn-ghost btn-sm bg-panel/85 backdrop-blur-xl">
                        <Crosshair className="h-3.5 w-3.5" />
                        Fit route
                    </button>
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="btn-ghost btn-sm bg-panel/85 backdrop-blur-xl"
                    >
                        {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        {expanded ? 'Close' : 'Expand'}
                    </button>
                </span>
            </div>

            <div className="pointer-events-none absolute bottom-4 left-4 z-[1200] flex flex-wrap gap-3 rounded-xl border border-line2 bg-panel/85 px-3 py-2 backdrop-blur-xl">
                {LEGEND.map((item) => (
                    <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-muted">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
                        {item.label}
                    </span>
                ))}
                <span className="hidden text-[10px] text-faint sm:inline">
                    {expanded ? 'Scroll to zoom · Esc to close' : 'Expand to scroll-zoom'}
                </span>
            </div>
        </>
    );

    return (
        <>
            <div className="relative h-[380px] w-full sm:h-[470px]">{!expanded && surface}</div>

            {expanded &&
                createPortal(
                    <div className="fixed inset-0 z-[2000] bg-canvas/95 p-4 backdrop-blur-sm sm:p-6">
                        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line2 shadow-lift">
                            {surface}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
