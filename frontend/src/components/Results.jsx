import { Fragment, useEffect, useMemo, useState } from 'react';
import { animate, AnimatePresence, motion, useMotionValue } from 'framer-motion';
import {
    CalendarClock,
    CircleDot,
    Clock,
    Coffee,
    Flag,
    Fuel,
    Gauge,
    MapPin,
    Moon,
    PackageCheck,
    Printer,
    RotateCcw,
    Route as RouteIcon,
    Truck,
} from 'lucide-react';
import LogSheet from './LogSheet';
import Map from './Map';
import { deriveTripStats, eventTone, formatClock, formatDuration, pluralize } from '../lib/trip';

const TONES = {
    drive: { icon: Truck, ring: 'border-brand/30 bg-brand/10 text-brand-light', dot: 'bg-brand', link: 'from-brand/50' },
    rest: { icon: Moon, ring: 'border-flare/30 bg-flare/10 text-flare-light', dot: 'bg-flare', link: 'from-flare/50' },
    break: { icon: Coffee, ring: 'border-sun/30 bg-sun/10 text-sun-light', dot: 'bg-sun', link: 'from-sun/50' },
    fuel: { icon: Fuel, ring: 'border-mint/30 bg-mint/10 text-mint', dot: 'bg-mint', link: 'from-mint/50' },
    duty: { icon: PackageCheck, ring: 'border-line2 bg-white/[0.05] text-muted', dot: 'bg-faint', link: 'from-line2' },
};

const TABS = [
    { id: 'logs', label: 'Log sheets', icon: CalendarClock },
    { id: 'schedule', label: 'Trip timeline', icon: Clock },
    { id: 'directions', label: 'Route instructions', icon: RouteIcon },
];

function Counter({ value, decimals = 0 }) {
    const motionValue = useMotionValue(0);
    const [display, setDisplay] = useState('0');

    useEffect(() => {
        const controls = animate(motionValue, value, {
            duration: 1.1,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) =>
                setDisplay(v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })),
        });
        return () => controls.stop();
    }, [value, decimals, motionValue]);

    return <>{display}</>;
}

function StatCard({ icon: Icon, label, value, suffix, decimals, raw, hint, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className="card card-hover group p-4"
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.16em] text-faint">{label}</span>
                <Icon className="h-3.5 w-3.5 text-faint transition-colors duration-500 group-hover:text-brand-light" />
            </div>
            <div className="font-mono text-xl font-semibold tracking-tight text-ink">
                {raw ?? <Counter value={value} decimals={decimals} />}
                {suffix && <span className="ml-1 text-[11px] font-normal text-faint">{suffix}</span>}
            </div>
            {hint && <p className="mt-1.5 truncate text-[10px] text-faint">{hint}</p>}
        </motion.div>
    );
}

function StopChip({ icon: Icon, tone, label, name }) {
    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
                <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span>
                <span className="block truncate text-[13px] text-ink">{name || '-'}</span>
            </span>
        </div>
    );
}

export default function Results({ data, driverInfo, onReset }) {
    const { events, stops } = data;
    const [viewMode, setViewMode] = useState('logs');
    const instructions = Array.isArray(data.route_instructions) ? data.route_instructions : [];

    const stats = useMemo(() => deriveTripStats(data), [data]);

    const logsByDay = useMemo(() => {
        const uniqueDates = new Set();
        events.forEach((e) => {
            uniqueDates.add(new Date(e.start).toDateString());
            uniqueDates.add(new Date(new Date(e.end).getTime() - 1).toDateString());
        });
        return Array.from(uniqueDates).sort((a, b) => new Date(a) - new Date(b));
    }, [events]);

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-end justify-between gap-4"
            >
                <div>
                    <p className="eyebrow mb-2">
                        Dispatched {stats.departure ? stats.departure.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                        {typeof stats.cycleRemaining === 'number' ? ` · ${stats.cycleRemaining.toFixed(1)}h cycle remaining` : ''}
                    </p>
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                        Trip <span className="text-gradient">resolved</span>
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.print()} className="btn-ghost btn-sm">
                        <Printer className="h-3.5 w-3.5" />
                        Print logs
                    </button>
                    <button onClick={onReset} className="btn-primary btn-sm group">
                        <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 ease-smooth group-hover:-rotate-180" />
                        New trip
                    </button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="card edge-light grid grid-cols-1 gap-5 p-5 sm:grid-cols-3"
            >
                <StopChip icon={CircleDot} tone="border-mint/30 bg-mint/10 text-mint" label="Start" name={stops?.start?.name} />
                <StopChip icon={MapPin} tone="border-brand/30 bg-brand/10 text-brand-light" label="Pickup" name={stops?.pickup?.name} />
                <StopChip icon={Flag} tone="border-aqua/30 bg-aqua/10 text-aqua-light" label="Dropoff" name={stops?.dropoff?.name} />
            </motion.div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={RouteIcon}
                    label="Distance"
                    value={Math.round(stats.miles)}
                    suffix="mi"
                    hint="Deadhead plus loaded"
                    delay={0.1}
                />
                <StatCard
                    icon={Truck}
                    label="Drive time"
                    raw={formatDuration(stats.driveMs)}
                    hint="11h daily driving cap"
                    delay={0.16}
                />
                <StatCard
                    icon={Clock}
                    label="Total elapsed"
                    raw={formatDuration(stats.elapsedMs)}
                    hint={`${pluralize(stats.days, 'day')} on the road`}
                    delay={0.22}
                />
                <StatCard
                    icon={Gauge}
                    label="Compliance stops"
                    raw={`${stats.breaks + stats.resets + stats.fuelStops}`}
                    hint={`${stats.resets} rest · ${stats.breaks} break · ${stats.fuelStops} fuel`}
                    delay={0.28}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="card relative overflow-hidden p-0"
            >
                <Map
                    geometry1={data.geometry_leg1}
                    geometry2={data.geometry_leg2}
                    stops={stops}
                    events={events}
                    badge={`${pluralize(stats.days, 'day')} · ${pluralize(logsByDay.length, 'log')}`}
                />
            </motion.div>

            <div className="flex justify-center pt-2">
                <div className="flex gap-1 rounded-full border border-line bg-panel/70 p-1 backdrop-blur-xl">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setViewMode(id)}
                            className={`relative rounded-full px-5 py-2 text-xs font-medium transition-colors duration-300 ${viewMode === id ? 'text-ink' : 'text-faint hover:text-muted'
                                }`}
                        >
                            {viewMode === id && (
                                <motion.span
                                    layoutId="resultsTab"
                                    className="absolute inset-0 rounded-full border border-line2 bg-white/[0.07]"
                                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                />
                            )}
                            <span className="relative flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'logs' ? (
                    <motion.div
                        key="logs"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-5"
                    >
                        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand-light">
                                    <CalendarClock className="h-4 w-4" />
                                </span>
                                <div>
                                    <h3 className="text-[13px] font-semibold text-ink">Digital logbook</h3>
                                    <p className="text-[11px] text-faint">
                                        {pluralize(logsByDay.length, 'daily log')} generated ·{' '}
                                        {Math.round(stats.miles).toLocaleString()} mi covered
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => window.print()} className="btn-primary btn-sm">
                                <Printer className="h-3.5 w-3.5" />
                                Print all
                            </button>
                        </div>

                        <div className="max-h-[820px] space-y-5 overflow-y-auto pr-1 print-content">
                            {logsByDay.map((dateStr, idx) => (
                                <motion.div
                                    key={dateStr}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className={`card overflow-hidden p-0 print:border-0 print:shadow-none ${idx < logsByDay.length - 1 ? 'print:break-after-page' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between border-b border-line bg-panel2/80 px-4 py-2.5 print:hidden">
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
                                                Driver daily log
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-muted">
                                                {new Date(dateStr).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                            <span className="rounded-full border border-line2 bg-canvas px-2 py-0.5 font-mono text-[10px] text-brand-light">
                                                DAY {idx + 1}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white">
                                        <LogSheet
                                            date={dateStr}
                                            events={events}
                                            driverInfo={driverInfo || {}}
                                            dayIndex={idx}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : viewMode === 'schedule' ? (
                    <motion.div
                        key="schedule"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="card overflow-hidden"
                    >
                        <div className="flex items-center justify-between border-b border-line px-6 py-5">
                            <div>
                                <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Trip itinerary</h2>
                                <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-faint">
                                    Sequential event timeline
                                </p>
                            </div>
                            <span className="chip">{events.length} events</span>
                        </div>

                        <div className="relative px-6 py-7">
                            <div className="relative space-y-3">
                                {events.map((evt, idx) => {
                                    const tone = TONES[eventTone(evt)];
                                    const Icon = tone.icon;
                                    const durationMs = new Date(evt.end) - new Date(evt.start);

                                    return (
                                        <motion.div
                                            key={`${evt.start}-${idx}`}
                                            initial={{ opacity: 0, x: -12 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, margin: '-40px' }}
                                            transition={{ duration: 0.45, delay: Math.min(idx * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
                                            className="group relative flex items-stretch gap-4"
                                        >
                                            {idx < events.length - 1 && (
                                                <span
                                                    aria-hidden
                                                    className={`pointer-events-none absolute left-[17.5px] top-[22px] h-[calc(100%_+_0.75rem)] w-px bg-gradient-to-b to-line2/40 ${tone.link}`}
                                                />
                                            )}
                                            <span
                                                className={`relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tone.ring}`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </span>

                                            <div className="flex-1 rounded-xl border border-line bg-white/[0.02] p-3.5 transition duration-500 ease-smooth group-hover:border-line2 group-hover:bg-white/[0.05]">
                                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                                    <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                                                        {evt.status}
                                                        <span className={`h-1 w-1 rounded-full ${tone.dot}`} />
                                                    </span>
                                                    <span className="font-mono text-[11px] text-faint">
                                                        {formatClock(evt.start)} → {formatClock(evt.end)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="text-[12px] text-muted">{evt.remarks}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="chip px-2 py-0.5 font-mono text-[10px]">
                                                            {formatDuration(durationMs)}
                                                        </span>
                                                        {evt.location && (
                                                            <span className="chip border-brand/20 bg-brand/[0.08] px-2 py-0.5 text-[10px] text-brand-light">
                                                                <MapPin className="h-2.5 w-2.5" />
                                                                {evt.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="directions"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="card overflow-hidden"
                    >
                        <div className="flex items-center justify-between border-b border-line px-6 py-5">
                            <div>
                                <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                                    Route instructions
                                </h2>
                                <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-faint">
                                    Current location to pickup to dropoff
                                </p>
                            </div>
                            <span className="chip">{pluralize(instructions.length, 'step')}</span>
                        </div>

                        {instructions.length ? (
                            <div className="divide-y divide-line">
                                {instructions.map((step, idx) => {
                                    const startsNewLeg = idx === 0 || instructions[idx - 1].leg !== step.leg;
                                    return (
                                        <Fragment key={step.id || `${step.leg}-${idx}`}>
                                            {startsNewLeg && (
                                                <div className="bg-brand/[0.05] px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-light">
                                                    {step.leg}
                                                </div>
                                            )}
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.35, delay: Math.min(idx * 0.02, 0.25) }}
                                                className="flex items-center gap-4 px-6 py-4 transition-colors duration-300 hover:bg-white/[0.03]"
                                            >
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line2 bg-panel2 font-mono text-[10px] text-faint">
                                                    {idx + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-medium text-ink">{step.instruction}</p>
                                                    <p className="mt-1 truncate text-[11px] text-faint">{step.road}</p>
                                                </div>
                                                <div className="shrink-0 text-right font-mono">
                                                    <p className="text-[11px] text-muted">
                                                        {Number(step.distance_miles || 0).toFixed(1)} mi
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-faint">
                                                        {step.duration_minutes > 0 ? `${step.duration_minutes} min` : '< 1 min'}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </Fragment>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-6 py-14 text-center text-[13px] text-muted">
                                Turn-by-turn instructions are unavailable for this route.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
