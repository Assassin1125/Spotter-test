import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowRight,
    Building2,
    CircleDot,
    FileText,
    Flag,
    IdCard,
    Loader2,
    MapPin,
    Truck,
    Users,
} from 'lucide-react';

const CYCLE_LIMIT = 70;

const section = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
};

function Field({ icon: Icon, label, children, error }) {
    return (
        <label className="group block">
            <span className="label mb-2 group-focus-within:text-brand-light">{label}</span>
            <span className="relative block">
                <Icon
                    className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${error ? 'text-flare-light' : 'text-faint group-focus-within:text-brand-light'
                        }`}
                />
                {children}
            </span>
            {error && (
                <span className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-flare-light">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    {error}
                </span>
            )}
        </label>
    );
}

const EMPTY_TRIP = {
    start_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: 0,
    driver_id: '',
    co_driver_id: '',
    truck_number: '',
    carrier_name: '',
    shipping_doc: '',
};

const EXAMPLE_TRIP = {
    carrier_name: 'Crate Logistics',
    truck_number: 'Unit 104',
    driver_id: 'D-8842',
    co_driver_id: 'D-2291',
    start_location: 'Dallas, TX',
    pickup_location: 'Memphis, TN',
    dropoff_location: 'Chicago, IL',
    current_cycle_used: 12.5,
    shipping_doc: 'BOL-48213',
};

export default function Form({ onSubmit, loading, initialValues, fieldErrors }) {
    const [data, setData] = useState({ ...EMPTY_TRIP, ...initialValues });
    const [prevFieldErrors, setPrevFieldErrors] = useState(fieldErrors);
    const [liveErrors, setLiveErrors] = useState(fieldErrors || {});

    if (fieldErrors !== prevFieldErrors) {
        setPrevFieldErrors(fieldErrors);
        setLiveErrors(fieldErrors || {});
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = name === 'current_cycle_used' && value !== ''
            ? String(Math.min(CYCLE_LIMIT, Math.max(0, Number(value) || 0)))
            : value;
        setData((prev) => ({ ...prev, [name]: next }));
        if (liveErrors[name]) {
            setLiveErrors((prev) => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...data,
            current_cycle_used: Number(data.current_cycle_used) || 0,
        });
    };

    const cycleUsed = Number(data.current_cycle_used) || 0;
    const cyclePct = Math.min(100, (cycleUsed / CYCLE_LIMIT) * 100);
    const remaining = Math.max(0, CYCLE_LIMIT - cycleUsed);
    const cycleTone = cyclePct > 85 ? 'text-flare-light' : cyclePct > 60 ? 'text-sun-light' : 'text-mint';

    const stops = [
        {
            name: 'start_location',
            label: 'Current location',
            placeholder: 'e.g. Dallas, TX',
            dot: 'bg-mint shadow-[0_0_12px_rgba(52,211,153,0.7)]',
            rail: 'from-mint/60 to-brand/60',
            icon: CircleDot,
        },
        {
            name: 'pickup_location',
            label: 'Pickup',
            placeholder: 'e.g. Memphis, TN',
            dot: 'bg-brand shadow-[0_0_12px_rgba(124,108,246,0.7)]',
            rail: 'from-brand/60 to-aqua/60',
            icon: MapPin,
        },
        {
            name: 'dropoff_location',
            label: 'Dropoff',
            placeholder: 'e.g. Chicago, IL',
            dot: 'bg-aqua shadow-[0_0_12px_rgba(34,211,238,0.7)]',
            icon: Flag,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="card edge-light overflow-hidden"
        >
            <div className="flex items-start justify-between gap-4 border-b border-line bg-brand-fade px-7 py-6">
                <div>
                    <p className="eyebrow mb-2">Step 02 - Trip setup</p>
                    <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Dispatch details</h2>
                    <p className="mt-1 text-[13px] text-muted">
                        Fill in the run and we&apos;ll build the clocks, breaks, and daily grids around it.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setData({ ...EXAMPLE_TRIP })}
                    className="btn-ghost btn-sm shrink-0"
                >
                    Fill example
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 p-7">
                <motion.fieldset
                    variants={section}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                >
                    <legend className="eyebrow mb-4">Carrier &amp; crew</legend>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field icon={Building2} label="Carrier">
                            <input
                                type="text"
                                name="carrier_name"
                                className="field pl-10"
                                placeholder="Crate Logistics"
                                value={data.carrier_name}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field icon={Truck} label="Truck #">
                            <input
                                type="text"
                                name="truck_number"
                                className="field pl-10"
                                placeholder="Unit 104"
                                value={data.truck_number}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field icon={IdCard} label="Driver ID">
                            <input
                                type="text"
                                name="driver_id"
                                className="field pl-10"
                                placeholder="D-8842"
                                value={data.driver_id}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field icon={Users} label="Co-driver">
                            <input
                                type="text"
                                name="co_driver_id"
                                className="field pl-10"
                                placeholder="Optional"
                                value={data.co_driver_id}
                                onChange={handleChange}
                            />
                        </Field>
                        <div className="sm:col-span-2">
                            <Field icon={FileText} label="Shipping doc / load #">
                                <input
                                    type="text"
                                    name="shipping_doc"
                                    className="field pl-10"
                                    placeholder="Optional - e.g. BOL-48213"
                                    value={data.shipping_doc}
                                    onChange={handleChange}
                                />
                            </Field>
                        </div>
                    </div>
                </motion.fieldset>

                <motion.fieldset
                    variants={section}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    className="relative border-t border-line pt-7"
                >
                    <legend className="eyebrow mb-5">Route</legend>

                    <div className="space-y-4">
                        {stops.map((stop) => {
                            const error = liveErrors[stop.name];
                            return (
                                <div key={stop.name} className="relative flex items-end gap-4">
                                    {stop.rail && (
                                        <span
                                            aria-hidden
                                            className={`pointer-events-none absolute left-[7px] top-[calc(100%_-_21.5px)] h-[calc(100%_+_1rem)] w-px bg-gradient-to-b ${stop.rail}`}
                                        />
                                    )}
                                    <span className="relative mb-3.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center">
                                        <span className={`h-[7px] w-[7px] rounded-full ${error ? 'bg-flare shadow-[0_0_12px_rgba(251,92,119,0.7)]' : stop.dot}`} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <Field icon={stop.icon} label={stop.label} error={error}>
                                            <input
                                                type="text"
                                                name={stop.name}
                                                className={`field pl-10 ${error ? 'border-flare/60 focus:border-flare focus:ring-flare/20' : ''}`}
                                                placeholder={stop.placeholder}
                                                value={data[stop.name]}
                                                onChange={handleChange}
                                                aria-invalid={Boolean(error)}
                                                required
                                            />
                                        </Field>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.fieldset>

                <motion.fieldset
                    variants={section}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="border-t border-line pt-7"
                >
                    <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                            <legend className="eyebrow mb-1.5">Cycle hours used</legend>
                            <p className="text-[12px] text-faint">Hours already logged in the current 70-hour cycle.</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline justify-end font-mono text-ink">
                                <input
                                    type="number"
                                    name="current_cycle_used"
                                    inputMode="decimal"
                                    min="0"
                                    max={CYCLE_LIMIT}
                                    step="0.1"
                                    value={data.current_cycle_used}
                                    onChange={handleChange}
                                    aria-label="Current cycle hours used"
                                    aria-invalid={Boolean(liveErrors.current_cycle_used)}
                                    className={`w-20 rounded-lg border-0 bg-transparent px-1 py-0 text-right text-2xl font-semibold leading-none ${liveErrors.current_cycle_used ? 'text-flare-light' : ''
                                        }`}
                                />
                                <span className="text-sm text-faint">/{CYCLE_LIMIT}</span>
                            </div>
                            <div className={`mt-1.5 font-mono text-[11px] ${liveErrors.current_cycle_used ? 'text-flare-light' : cycleTone}`}>
                                {liveErrors.current_cycle_used || `${remaining.toFixed(1)}h remaining`}
                            </div>
                        </div>
                    </div>

                    <input
                        type="range"
                        name="current_cycle_used"
                        min="0"
                        max={CYCLE_LIMIT}
                        step="0.1"
                        value={cycleUsed}
                        onChange={handleChange}
                        aria-label="Cycle hours used slider"
                        className="range"
                        style={{
                            background: `linear-gradient(90deg, #7C6CF6 0%, #22D3EE ${cyclePct}%, #1A2233 ${cyclePct}%, #1A2233 100%)`,
                        }}
                    />
                    <div className="mt-2 flex justify-between font-mono text-[10px] text-faint">
                        <span>0h</span>
                        <span>35h</span>
                        <span>{CYCLE_LIMIT}h</span>
                    </div>
                </motion.fieldset>

                <motion.div
                    variants={section}
                    initial="initial"
                    animate="animate"
                    transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                    <button type="submit" disabled={loading} className="btn-primary group w-full py-3.5">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Calculating
                            </>
                        ) : (
                            <>
                                <span>Calculate route</span>
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                    <p className="mt-3 text-center text-[11px] text-faint">
                        Routes resolve through OSRM · addresses via Nominatim
                    </p>
                </motion.div>
            </form>
        </motion.div>
    );
}
