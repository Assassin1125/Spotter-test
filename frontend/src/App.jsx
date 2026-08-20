import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    FileCheck2,
    Gauge,
    Printer,
    Route as RouteIcon,
    ShieldCheck,
    Sparkles,
    X,
} from 'lucide-react';
import Background from './components/Background';
import Form from './components/Form';
import Loader from './components/Loader';
import Results from './components/Results';

const VIEWS = [
    { id: 'landing', label: 'Overview' },
    { id: 'form', label: 'Trip setup' },
    { id: 'results', label: 'Logbook' },
];

const viewTransition = {
    initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -12, filter: 'blur(6px)' },
};

const stagger = {
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const riseIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const FEATURES = [
    {
        icon: ShieldCheck,
        code: 'DOT',
        label: 'Fully compliant',
        desc: '30-minute breaks and 10-hour resets inserted automatically, per FMCSA rules.',
        accent: 'from-brand/25',
    },
    {
        icon: RouteIcon,
        code: 'OSRM',
        label: 'Smart routing',
        desc: 'Optimized road geometry built for heavy trucking, leg by leg.',
        accent: 'from-aqua/25',
    },
    {
        icon: Printer,
        code: 'PDF',
        label: 'Print ready',
        desc: 'Inspection-ready daily log sheets, generated the moment the route resolves.',
        accent: 'from-mint/25',
    },
];

const STEPS = [
    { n: '01', title: 'Enter the dispatch', desc: 'Carrier, unit, driver, and the three stops of the run.' },
    { n: '02', title: 'Simulate the clocks', desc: 'Drive, shift, and fuel timers tick against live route data.' },
    { n: '03', title: 'Collect the paperwork', desc: 'Daily grids and remarks, formatted for a roadside check.' },
];

function BrandMark() {
    return (
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel2">
            <span className="absolute inset-0 rounded-xl bg-brand-fade" />
            <svg viewBox="0 0 24 24" fill="none" className="relative h-[18px] w-[18px]">
                <defs>
                    <linearGradient id="markGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#A78BFA" />
                        <stop offset="100%" stopColor="#67E8F9" />
                    </linearGradient>
                </defs>
                <path
                    d="M4 16.5h11.5M4 16.5V7.6A1 1 0 0 1 5 6.6h9.5a1 1 0 0 1 1 1v8.9M15.5 16.5H21V12l-2.8-3.3h-2.7"
                    stroke="url(#markGradient)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <circle cx="8.4" cy="18" r="1.8" stroke="#A78BFA" strokeWidth="1.4" />
                <circle cx="17.4" cy="18" r="1.8" stroke="#67E8F9" strokeWidth="1.4" />
            </svg>
        </span>
    );
}

function SpotlightCard({ children, className = '' }) {
    const handleMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };

    return (
        <div onMouseMove={handleMove} className={`group card card-hover spotlight overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

function App() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [view, setView] = useState('landing');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!error) return undefined;
        const timer = setTimeout(() => setError(null), 7000);
        return () => clearTimeout(timer);
    }, [error]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [view]);

    const handleSubmit = async (searchData) => {
        setLoading(true);
        setError(null);
        setData(null);
        setFormData(searchData);
        setView('results');
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'https://cratelog-1.onrender.com';
            const response = await axios.post(`${API_BASE}/api/calculate/?t=${Date.now()}`, searchData);
            if (response.data?.error) {
                throw new Error(response.data.error);
            }
            setData(response.data);
        } catch (err) {
            console.error(err);
            const apiMessage = err.response?.data?.error || err.message;
            setError(apiMessage || 'Error calculating trip. Please check your inputs and try again.');
            setView('form');
        } finally {
            setLoading(false);
        }
    };

    const activeStep = VIEWS.findIndex((v) => v.id === view);

    return (
        <div className="relative min-h-screen">
            <Background />

            <header
                className={`sticky top-0 z-40 border-b transition-all duration-500 ease-smooth ${scrolled
                    ? 'border-line bg-canvas/80 backdrop-blur-xl'
                    : 'border-transparent bg-transparent'
                    }`}
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
                    <button
                        onClick={() => setView('landing')}
                        className="group flex items-center gap-3 text-left transition-opacity duration-300 hover:opacity-90"
                    >
                        <BrandMark />
                        <span className="leading-tight">
                            <span className="block font-display text-[15px] font-bold tracking-tight text-ink">
                                Crate<span className="text-brand-light">Log</span>
                            </span>
                            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-faint sm:block">
                                Route planner &amp; digital logbook
                            </span>
                        </span>
                    </button>

                    <nav className="hidden items-center gap-1 rounded-full border border-line bg-panel/60 p-1 backdrop-blur-xl md:flex">
                        {VIEWS.map((v, i) => {
                            const reachable = v.id !== 'results' || Boolean(data) || loading;
                            const active = view === v.id;
                            return (
                                <button
                                    key={v.id}
                                    disabled={!reachable}
                                    onClick={() => reachable && setView(v.id)}
                                    className={`relative rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'text-ink' : 'text-faint hover:text-muted'
                                        }`}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="navPill"
                                            className="absolute inset-0 rounded-full border border-line2 bg-white/[0.06]"
                                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                        />
                                    )}
                                    <span className="relative flex items-center gap-1.5">
                                        <span className="font-mono text-[10px] text-faint">{`0${i + 1}`}</span>
                                        {v.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <span className="hidden items-center gap-2 text-[11px] text-faint lg:flex">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-mint" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
                            </span>
                            HOS engine live
                        </span>
                        {view !== 'form' && (
                            <button onClick={() => setView('form')} className="btn-ghost btn-sm">
                                New trip
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-px w-full bg-line">
                    <motion.div
                        className="h-px bg-brand-line"
                        initial={false}
                        animate={{ width: `${((activeStep + 1) / VIEWS.length) * 100}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
                <AnimatePresence mode="wait">
                    {view === 'landing' && (
                        <motion.div
                            key="landing"
                            variants={viewTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <motion.section
                                variants={stagger}
                                initial="initial"
                                animate="animate"
                                className="flex flex-col items-center text-center"
                            >
                                <motion.div variants={riseIn} className="chip mb-8 border-brand/25 bg-brand/[0.07] text-brand-light">
                                    <Sparkles className="h-3 w-3" />
                                    FMCSA hours-of-service engine
                                </motion.div>

                                <motion.h1
                                    variants={riseIn}
                                    className="mb-5 max-w-3xl font-display text-[2.6rem] font-bold leading-[1.05] tracking-tightest text-ink sm:text-6xl"
                                >
                                    Route planning,{' '}
                                    <span className="text-gradient">shipped clean.</span>
                                </motion.h1>

                                <motion.p variants={riseIn} className="mb-10 max-w-xl text-[15px] leading-relaxed text-muted">
                                    Generate compliant ELD logbooks and calculate optimal trucking routes - automatic HOS
                                    breaks, resets, and print-ready daily logs.
                                </motion.p>

                                <motion.div variants={riseIn} className="mb-16 flex flex-wrap items-center justify-center gap-3">
                                    <button onClick={() => setView('form')} className="btn-primary group">
                                        <span>Generate logs</span>
                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-x-1" />
                                    </button>
                                    <a href="#how-it-works" className="btn-ghost">
                                        How it works
                                    </a>
                                </motion.div>

                                <motion.div
                                    variants={riseIn}
                                    className="mb-20 grid w-full max-w-3xl grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-panel/50 backdrop-blur-xl"
                                >
                                    {[
                                        { value: '70h', label: 'Cycle tracked' },
                                        { value: '11h', label: 'Drive cap' },
                                        { value: '1,000mi', label: 'Fuel range' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="px-4 py-5">
                                            <div className="font-mono text-xl font-semibold text-ink">{stat.value}</div>
                                            <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-faint">
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            </motion.section>

                            <motion.section
                                variants={stagger}
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true, margin: '-80px' }}
                                className="mb-24 grid grid-cols-1 gap-5 md:grid-cols-3"
                            >
                                {FEATURES.map(({ icon: Icon, ...card }) => (
                                    <motion.div key={card.code} variants={riseIn}>
                                        <SpotlightCard className="h-full p-6 text-left">
                                            <div
                                                className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${card.accent} to-transparent opacity-60`}
                                            />
                                            <div className="relative">
                                                <span className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel2 text-brand-light transition-transform duration-500 ease-smooth group-hover:-translate-y-0.5">
                                                    <Icon className="h-[18px] w-[18px]" />
                                                </span>
                                                <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                                                    {card.code}
                                                </div>
                                                <h3 className="mb-2 font-display text-base font-semibold text-ink">{card.label}</h3>
                                                <p className="text-[13px] leading-relaxed text-muted">{card.desc}</p>
                                            </div>
                                        </SpotlightCard>
                                    </motion.div>
                                ))}
                            </motion.section>

                            <motion.section
                                id="how-it-works"
                                variants={stagger}
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true, margin: '-80px' }}
                                className="mb-20 scroll-mt-28"
                            >
                                <motion.div variants={riseIn} className="mb-10 text-center">
                                    <p className="eyebrow mb-3">How it works</p>
                                    <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                                        Three inputs. One compliant logbook.
                                    </h2>
                                </motion.div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                    {STEPS.map((step) => (
                                        <motion.div key={step.n} variants={riseIn}>
                                            <SpotlightCard className="h-full p-6">
                                                <span className="mb-4 inline-flex items-center justify-center rounded-lg border border-line bg-canvas px-2.5 py-1 font-mono text-[11px] text-brand-light">
                                                    {step.n}
                                                </span>
                                                <h3 className="mb-1.5 font-display text-[15px] font-semibold text-ink">{step.title}</h3>
                                                <p className="text-[13px] leading-relaxed text-muted">{step.desc}</p>
                                            </SpotlightCard>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>

                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-faint">
                                {['OSRM routing', 'FMCSA HOS engine', 'Nominatim geocoding', 'Print-ready logs'].map((item) => (
                                    <span key={item} className="flex items-center gap-2">
                                        <span className="h-1 w-1 rounded-full bg-line2" />
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {view === 'form' && (
                        <motion.div
                            key="form"
                            variants={viewTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            className="flex justify-center"
                        >
                            <div className="w-full max-w-2xl">
                                <Form onSubmit={handleSubmit} loading={loading} initialValues={formData} />
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setView('landing')}
                                        className="group inline-flex items-center gap-2 text-[13px] text-faint transition-colors duration-300 hover:text-ink"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 ease-smooth group-hover:-translate-x-1" />
                                        Back to overview
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {view === 'results' && (
                        <motion.div
                            key="results"
                            variants={viewTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {loading ? (
                                <Loader />
                            ) : data ? (
                                <Results data={data} driverInfo={formData} onReset={() => setView('form')} />
                            ) : (
                                <div className="card flex h-[420px] flex-col items-center justify-center gap-4 border-dashed text-center">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-panel2 text-faint">
                                        <Gauge className="h-5 w-5" />
                                    </span>
                                    <p className="text-sm text-muted">No trip data yet.</p>
                                    <button onClick={() => setView('form')} className="btn-primary">
                                        Start a calculation
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="border-t border-line py-8">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-[11px] text-faint sm:flex-row">
                    <span className="flex items-center gap-2">
                        <FileCheck2 className="h-3.5 w-3.5" />
                        CrateLog - compliant route planning for fleets
                    </span>
                    <span>Built on OSRM, Nominatim, and the FMCSA rulebook.</span>
                </div>
            </footer>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="fixed bottom-6 left-1/2 z-50 w-[min(26rem,calc(100vw-3rem))] -translate-x-1/2"
                        role="alert"
                        aria-live="assertive"
                    >
                        <div className="card flex items-start gap-3 border-flare/30 p-4 shadow-lift">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-flare/15 text-flare-light">
                                <AlertTriangle className="h-4 w-4" />
                            </span>
                            <p className="flex-1 text-[13px] leading-relaxed text-muted">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-faint transition-colors duration-300 hover:text-ink"
                                aria-label="Dismiss"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
