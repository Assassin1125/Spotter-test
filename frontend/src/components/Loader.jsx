import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, Radar, Route, Timer } from 'lucide-react';

const STAGES = [
    { icon: MapPin, label: 'Geocoding stop addresses' },
    { icon: Route, label: 'Resolving truck route geometry' },
    { icon: Timer, label: 'Simulating drive and shift clocks' },
    { icon: Radar, label: 'Rendering daily log sheets' },
];

export default function Loader() {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStage((s) => Math.min(s + 1, STAGES.length - 1));
        }, 2200);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="card edge-light mx-auto max-w-xl overflow-hidden p-8 sm:p-10">
            <div className="mb-9 flex flex-col items-center text-center">
                <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border border-line" />
                    <motion.span
                        className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand border-r-aqua/60"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="absolute inset-2 animate-pulse-soft rounded-full bg-brand/15 blur-md" />
                    <Route className="relative h-5 w-5 text-brand-light" />
                </div>

                <h2 className="mb-2 font-display text-lg font-semibold tracking-tight text-ink">
                    Calculating optimal path
                </h2>
                <p className="text-[13px] text-muted">
                    Running the hours-of-service simulation across both legs of the run.
                </p>
            </div>

            <div className="mb-8 space-y-1">
                {STAGES.map(({ icon: Icon, label }, i) => {
                    const done = i < stage;
                    const active = i === stage;
                    return (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: done || active ? 1 : 0.4, x: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-500 ${active ? 'border-line2 bg-white/[0.04]' : 'border-transparent'
                                }`}
                        >
                            <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors duration-500 ${done
                                    ? 'border-mint/30 bg-mint/10 text-mint'
                                    : active
                                        ? 'border-brand/30 bg-brand/10 text-brand-light'
                                        : 'border-line bg-panel2 text-faint'
                                    }`}
                            >
                                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                            </span>
                            <span className={`text-[13px] ${active ? 'text-ink' : done ? 'text-muted' : 'text-faint'}`}>
                                {label}
                            </span>
                            {active && (
                                <span className="ml-auto flex gap-1">
                                    {[0, 1, 2].map((d) => (
                                        <motion.span
                                            key={d}
                                            className="h-1 w-1 rounded-full bg-brand-light"
                                            animate={{ opacity: [0.25, 1, 0.25] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.18 }}
                                        />
                                    ))}
                                </span>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="shimmer h-1 overflow-hidden rounded-full bg-line">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-aqua"
                    initial={{ width: '8%' }}
                    animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
        </div>
    );
}
