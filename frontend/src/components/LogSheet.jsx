import { useMemo } from 'react';

const GRID_WIDTH = 600;
const ROW_HEIGHT = 40;
const GRID_HEIGHT = ROW_HEIGHT * 4;
const MARGIN_LEFT = 104;
const MARGIN_TOP = 44;
const SVG_WIDTH = 800;

const STATUS_MAP = { OFF: 0, SB: 1, D: 2, ON: 3 };

const PAPER = {
    ink: '#0F172A',
    body: '#334155',
    subtle: '#475569',
    meta: '#64748B',
    faint: '#94A3B8',
    tick: '#CBD5E1',
    rule: '#D8DFEA',
    hairline: '#E2E8F0',
    hairlineSoft: '#E8ECF3',
    wash: '#F1F5F9',
    zebra: '#FAFBFD',
    panel: '#FCFDFF',
    white: '#FFFFFF',
};

const BRAND = '#7C6CF6';
const AQUA = '#22D3EE';

const MONO = "'JetBrains Mono', monospace";
const SANS = 'Inter, sans-serif';

const ROWS = [
    { label: '1. Off duty', tone: '#B4700A', tint: 'rgba(245,158,11,0.06)' },
    { label: '2. Sleeper', tone: '#0E93AF', tint: 'rgba(34,211,238,0.06)' },
    { label: '3. Driving', tone: '#5546D6', tint: 'rgba(124,108,246,0.07)' },
    { label: '4. On duty', tone: '#0F9D6E', tint: 'rgba(52,211,153,0.06)' },
];

const MetaRow = ({ label, value, mono = true }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            borderBottom: `1px solid ${PAPER.hairlineSoft}`,
            padding: '3px 0',
        }}
    >
        <span style={{ minWidth: 74, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.09em', color: PAPER.faint, textTransform: 'uppercase' }}>
            {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: PAPER.ink, fontFamily: mono ? MONO : SANS }}>
            {value}
        </span>
    </div>
);

export default function LogSheet({ date, events, driverInfo, dayIndex = 0 }) {
    const startOfDay = useMemo(() => new Date(date).setHours(0, 0, 0, 0), [date]);

    const dayEvents = useMemo(() => {
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);

        const clipped = events
            .map((e) => {
                let statusKey = 'OFF';
                if (e.type === 'SB') statusKey = 'SB';
                else if (e.type === 'D') statusKey = 'D';
                else if (e.type === 'ON') statusKey = 'ON';

                return {
                    ...e,
                    startTime: new Date(e.start).getTime(),
                    endTime: new Date(e.end).getTime(),
                    statusIdx: STATUS_MAP[statusKey],
                    synthetic: false,
                };
            })
            .filter((e) => e.endTime > startOfDay && e.startTime < endOfDay)
            .map((e) => ({
                ...e,
                drawStart: Math.max(e.startTime, startOfDay),
                drawEnd: Math.min(e.endTime, endOfDay),
            }))
            .sort((a, b) => a.drawStart - b.drawStart);

        const padded = [];
        if (clipped.length === 0) {
            padded.push({
                type: 'OFF',
                statusIdx: 0,
                drawStart: startOfDay,
                drawEnd: endOfDay,
                start: startOfDay,
                remarks: 'Off duty',
                location: '',
                synthetic: true,
            });
        } else {
            if (clipped[0].drawStart > startOfDay + 1000) {
                padded.push({
                    type: 'OFF',
                    statusIdx: 0,
                    drawStart: startOfDay,
                    drawEnd: clipped[0].drawStart,
                    start: startOfDay,
                    remarks: 'Off duty',
                    location: '',
                    synthetic: true,
                });
            }
            padded.push(...clipped);
            const last = padded[padded.length - 1];
            if (last.drawEnd < endOfDay - 1000) {
                padded.push({
                    type: 'OFF',
                    statusIdx: 0,
                    drawStart: last.drawEnd,
                    drawEnd: endOfDay,
                    start: last.drawEnd,
                    remarks: 'Off duty',
                    location: '',
                    synthetic: true,
                });
            }
        }
        return padded;
    }, [events, date, startOfDay]);

    const loggedEvents = useMemo(() => dayEvents.filter((e) => !e.synthetic), [dayEvents]);

    const getX = (timestamp) => ((timestamp - startOfDay) / (24 * 60 * 60 * 1000)) * GRID_WIDTH;

    const rowY = (idx) => MARGIN_TOP + idx * ROW_HEIGHT + ROW_HEIGHT / 2;

    const totals = [0, 0, 0, 0];
    let calculatedMiles = 0;

    dayEvents.forEach((e) => {
        totals[e.statusIdx] += (e.drawEnd - e.drawStart) / 3600000;
        if (e.miles && e.endTime - e.startTime > 0) {
            calculatedMiles += e.miles * ((e.drawEnd - e.drawStart) / (e.endTime - e.startTime));
        }
    });

    const totalOnDuty = totals[2] + totals[3];

    return (
        <div
            style={{
                fontFamily: SANS,
                width: '100%',
                maxWidth: 860,
                margin: '0 auto',
                background: PAPER.white,
                color: PAPER.ink,
                padding: '26px 24px',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ display: 'inline-block', width: 18, height: 3, borderRadius: 2, background: `linear-gradient(90deg,${BRAND},${AQUA})` }} />
                        <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.22em', color: BRAND, textTransform: 'uppercase' }}>
                            CrateLog · Day {dayIndex + 1}
                        </span>
                    </div>
                    <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                        Driver&apos;s Daily Log
                    </div>
                    <div style={{ fontSize: 10, color: PAPER.meta, marginTop: 2 }}>
                        Original - file at home terminal · Duplicate - driver retains 8 days
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: PAPER.ink }}>
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ marginTop: 6, display: 'inline-flex', gap: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 600, color: PAPER.subtle, background: PAPER.wash, borderRadius: 999, padding: '3px 9px' }}>
                            {Math.round(calculatedMiles).toLocaleString()} mi
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: PAPER.subtle, background: PAPER.wash, borderRadius: 999, padding: '3px 9px' }}>
                            {totalOnDuty.toFixed(1)} h on duty
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ height: 2, background: `linear-gradient(90deg,${PAPER.ink},${BRAND} 55%,${AQUA})`, borderRadius: 2, marginBottom: 14 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 18 }}>
                <div>
                    <MetaRow label="Driver ID" value={driverInfo.driver_id || '-'} />
                    <MetaRow label="Co-driver" value={driverInfo.co_driver_id || '-'} />
                    <MetaRow label="Carrier" value={driverInfo.carrier_name || '-'} mono={false} />
                    <MetaRow label="Truck #" value={driverInfo.truck_number || '-'} />
                </div>
                <div>
                    <MetaRow label="From" value={driverInfo.start_location || '-'} mono={false} />
                    <MetaRow label="Via" value={driverInfo.pickup_location || '-'} mono={false} />
                    <MetaRow label="To" value={driverInfo.dropoff_location || '-'} mono={false} />
                    <MetaRow label="Total miles" value={`${Math.round(calculatedMiles).toLocaleString()} mi`} />
                </div>
            </div>

            <svg
                viewBox={`0 0 ${SVG_WIDTH} ${MARGIN_TOP + GRID_HEIGHT + 26}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ width: '100%', height: 'auto', display: 'block' }}
            >
                {ROWS.map((row, i) => (
                    <g key={row.label}>
                        <rect
                            x={MARGIN_LEFT}
                            y={MARGIN_TOP + i * ROW_HEIGHT}
                            width={GRID_WIDTH}
                            height={ROW_HEIGHT}
                            fill={i % 2 === 0 ? PAPER.white : PAPER.zebra}
                            stroke={PAPER.rule}
                            strokeWidth="1"
                        />
                        <rect x={MARGIN_LEFT} y={MARGIN_TOP + i * ROW_HEIGHT} width={3} height={ROW_HEIGHT} fill={row.tone} opacity="0.75" />
                        <text x="4" y={rowY(i) + 3.5} fontSize="9.5" fontWeight="700" fill={PAPER.body} letterSpacing="0.04em">
                            {row.label.toUpperCase()}
                        </text>

                        <rect
                            x={MARGIN_LEFT + GRID_WIDTH + 16}
                            y={MARGIN_TOP + i * ROW_HEIGHT + 5}
                            width="56"
                            height="30"
                            rx="7"
                            fill={row.tint}
                            stroke={PAPER.hairline}
                        />
                        <text x={MARGIN_LEFT + GRID_WIDTH + 44} y={rowY(i) + 4.5} fontSize="12.5" fontWeight="700" textAnchor="middle" fill={row.tone} fontFamily={MONO}>
                            {totals[i].toFixed(1)}
                        </text>
                    </g>
                ))}

                {Array.from({ length: 25 }).map((_, i) => {
                    const x = MARGIN_LEFT + i * (GRID_WIDTH / 24);
                    const major = i % 6 === 0;
                    return (
                        <g key={`h-${i}`}>
                            <line
                                x1={x}
                                y1={MARGIN_TOP}
                                x2={x}
                                y2={MARGIN_TOP + GRID_HEIGHT}
                                stroke={major ? PAPER.faint : PAPER.hairline}
                                strokeWidth={major ? 1.2 : 0.8}
                            />
                            {i < 24 &&
                                ROWS.map((_, r) =>
                                    [0.25, 0.5, 0.75].map((frac) => {
                                        const tx = x + frac * (GRID_WIDTH / 24);
                                        const baseY = MARGIN_TOP + r * ROW_HEIGHT;
                                        const len = frac === 0.5 ? 8 : 4.5;
                                        return (
                                            <line
                                                key={`t-${i}-${r}-${frac}`}
                                                x1={tx}
                                                y1={baseY}
                                                x2={tx}
                                                y2={baseY + len}
                                                stroke={PAPER.tick}
                                                strokeWidth="0.7"
                                            />
                                        );
                                    })
                                )}
                            <text
                                x={x}
                                y={MARGIN_TOP - 10}
                                fontSize="8.5"
                                textAnchor="middle"
                                fill={major ? PAPER.body : PAPER.faint}
                                fontWeight={major ? '700' : '500'}
                                fontFamily={MONO}
                            >
                                {i % 24 === 0 ? 'M' : i}
                            </text>
                        </g>
                    );
                })}

                {dayEvents.map((e, idx) => {
                    const prev = dayEvents[idx - 1];
                    const x1 = getX(e.drawStart) + MARGIN_LEFT;
                    const x2 = getX(e.drawEnd) + MARGIN_LEFT;
                    const y = rowY(e.statusIdx);
                    return (
                        <g key={`seg-${idx}`}>
                            {prev && prev.statusIdx !== e.statusIdx && (
                                <line x1={x1} y1={rowY(prev.statusIdx)} x2={x1} y2={y} stroke={PAPER.faint} strokeWidth="1.6" strokeLinecap="round" />
                            )}
                            <line
                                x1={x1}
                                y1={y}
                                x2={Math.max(x2, x1 + 1.5)}
                                y2={y}
                                stroke={ROWS[e.statusIdx].tone}
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <circle cx={x1} cy={y} r="2.6" fill={PAPER.white} stroke={ROWS[e.statusIdx].tone} strokeWidth="1.6" />
                        </g>
                    );
                })}
            </svg>

            <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.16em', color: PAPER.faint, textTransform: 'uppercase', marginBottom: 6 }}>
                    Remarks &amp; annotations
                </div>
                <div style={{ border: `1px solid ${PAPER.hairline}`, borderRadius: 8, minHeight: 92, padding: '10px 12px', background: PAPER.panel }}>
                    {loggedEvents.length === 0 && (
                        <div style={{ fontSize: 10.5, color: PAPER.faint }}>No duty changes recorded for this day.</div>
                    )}
                    {loggedEvents.map((e, i) => (
                        <div key={`${e.start}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 10.5, padding: '2.5px 0' }}>
                            <span style={{ fontFamily: MONO, fontWeight: 600, color: PAPER.ink, minWidth: 38 }}>
                                {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: ROWS[e.statusIdx].tone }} />
                            <span style={{ fontWeight: 600, color: PAPER.body }}>{e.location}</span>
                            <span style={{ color: PAPER.meta }}>{e.remarks}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div
                style={{
                    marginTop: 16,
                    paddingTop: 10,
                    borderTop: `1px solid ${PAPER.hairline}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    fontSize: 9,
                    color: PAPER.faint,
                }}
            >
                <span>Generated by CrateLog · FMCSA hours-of-service engine</span>
                <span style={{ color: PAPER.subtle }}>
                    I certify these entries are true and correct.
                    <span style={{ display: 'inline-block', width: 190, borderBottom: `1px solid ${PAPER.faint}`, marginLeft: 10 }} />
                </span>
            </div>
        </div>
    );
}
