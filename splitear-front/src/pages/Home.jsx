import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* ------------------------------------------------------------------ */
/*  Datos ficticios de la vista previa                                */
/*  4 personas, 4 gastos, total $42.000 => $10.500 por cabeza.        */
/*  Neto: Vos +4.500 | Nico +1.500 | Lu -1.500 | Cami -4.500          */
/*  Saldo mínimo: Cami -> Vos $4.500 y Lu -> Nico $1.500 (2 pagos).   */
/* ------------------------------------------------------------------ */

const PEOPLE = {
    vos: { name: 'Vos', initial: 'V', avatar: 'bg-emerald-900 text-emerald-50', fill: 'fill-emerald-900', ink: 'fill-emerald-50' },
    nico: { name: 'Nico', initial: 'N', avatar: 'bg-amber-200 text-amber-900', fill: 'fill-amber-200', ink: 'fill-amber-900' },
    lu: { name: 'Lu', initial: 'L', avatar: 'bg-blue-200 text-blue-900', fill: 'fill-blue-200', ink: 'fill-blue-900' },
    cami: { name: 'Cami', initial: 'C', avatar: 'bg-pink-200 text-pink-900', fill: 'fill-pink-200', ink: 'fill-pink-900' },
}

const GROUP_SIZE = Object.keys(PEOPLE).length

const EXPENSES = [
    { id: 'asado', title: 'Asado finde', short: 'Asado', payer: 'vos', amount: 15000 },
    { id: 'nafta', title: 'Nafta', payer: 'nico', amount: 12000 },
    { id: 'bebidas', title: 'Bebidas', payer: 'lu', amount: 9000 },
    { id: 'postre', title: 'Postre', payer: 'cami', amount: 6000 },
]

const TRANSFERS = [
    { id: 'cami', from: 'cami', to: 'vos', text: 'Cami te paga', amount: 4500 },
    { id: 'lu', from: 'lu', to: 'nico', text: 'Lu le paga a Nico', amount: 1500 },
]

const GROUP_TOTAL = EXPENSES.reduce((sum, e) => sum + e.amount, 0)

const money = (n) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/* Íconos de los gastos (trazos estilo Lucide, SVG inline) */
const EXPENSE_ICONS = {
    asado: (
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    ),
    nafta: (
        <>
            <path d="M3 22h12M4 9h10" />
            <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
            <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5" />
        </>
    ),
    bebidas: (
        <>
            <path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8" />
            <path d="M5 8h14" />
            <path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" />
            <path d="m12 8 1-6h2" />
        </>
    ),
    postre: (
        <>
            <path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11" />
            <path d="M17 7A5 5 0 0 0 7 7" />
            <path d="M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4" />
        </>
    ),
}

/* Grafo del paso 2: 4 personas, 6 deudas posibles, 2 pagos que alcanzan */
const NODES = { vos: [36, 24], cami: [36, 96], nico: [164, 24], lu: [164, 96] }
const EDGES = [
    { id: 'vc', a: 'vos', b: 'cami', keep: true },
    { id: 'nl', a: 'nico', b: 'lu', keep: true },
    { id: 'vn', a: 'vos', b: 'nico' },
    { id: 'cl', a: 'cami', b: 'lu' },
    { id: 'vl', a: 'vos', b: 'lu' },
    { id: 'cn', a: 'cami', b: 'nico' },
]

/* ------------------------------------------------------------------ */
/*  Utilidades de estilo (todo son clases de Tailwind)                */
/* ------------------------------------------------------------------ */

const cx = (...classes) => classes.filter(Boolean).join(' ')

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]"
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'
const NAV_LINK = cx(
    'inline-flex h-9 items-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 text-[13px] font-semibold',
    'transition hover:border-slate-300 hover:bg-slate-50 motion-reduce:transition-none',
    'min-[400px]:px-3.5 min-[400px]:text-sm sm:h-10 sm:px-[18px] sm:text-[15px]',
    FOCUS,
)

const AVATAR_SIZES = { 28: 'h-7 w-7', 30: 'h-[30px] w-[30px]', 36: 'h-9 w-9', 40: 'h-10 w-10' }
const CHIP_DELAYS = ['delay-0', 'delay-150', 'delay-300', 'delay-[450ms]']
const ROW_DELAYS = ['delay-0', 'delay-200']

/* ------------------------------------------------------------------ */
/*  Piezas pequeñas                                                   */
/* ------------------------------------------------------------------ */

function LogoMark({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="10" className="fill-emerald-500" />
            <path d="M15 9A7 7 0 0 0 15 23Z" className="fill-emerald-950" />
            <path d="M17 9A7 7 0 0 1 17 23Z" className="fill-emerald-950" />
        </svg>
    )
}

function Avatar({ who, size = 36, className }) {
    const p = PEOPLE[who]
    return (
        <span
            aria-hidden="true"
            className={cx(
                'inline-flex flex-none items-center justify-center rounded-full text-[13px] font-semibold',
                AVATAR_SIZES[size],
                p.avatar,
                className,
            )}
        >
            {p.initial}
        </span>
    )
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
    )
}

/* Tarjeta de ejemplo: gastos / saldar, con pagos que se pueden marcar */
function GroupPreview() {
    const [tab, setTab] = useState('gastos')
    const [paid, setPaid] = useState({})

    const togglePaid = (id) => setPaid((prev) => ({ ...prev, [id]: !prev[id] }))

    const pending = TRANSFERS.filter((t) => !paid[t.id])
    const owedToMe = paid.cami ? 0 : 4500
    const clear = owedToMe === 0

    const settleSummary =
        pending.length === 0
            ? 'Todo saldado. Nadie debe nada.'
            : `${pending.length} ${pending.length === 1 ? 'pago deja' : 'pagos dejan'} todo en cero.`

    return (
        <div className="w-full max-w-[400px] justify-self-center lg:justify-self-end">
            <article
                aria-label="Vista previa de un grupo en Splitear"
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-emerald-900/15"
            >
                <header className="flex items-center justify-between gap-3 px-[18px] pb-3.5 pt-[18px]">
                    <div>
                        <h3 className={cx(DISPLAY, 'text-lg font-semibold tracking-tight')}>Escapada de finde</h3>
                        <p className="text-[13px] text-slate-600">{GROUP_SIZE} personas</p>
                    </div>
                    <div className="flex" aria-hidden="true">
                        {Object.keys(PEOPLE).map((id) => (
                            <Avatar key={id} who={id} size={30} className="-ml-2 border-2 border-white first:ml-0" />
                        ))}
                    </div>
                </header>

                <div
                    aria-live="polite"
                    className={cx(
                        'mx-3.5 rounded-[22px] p-5 transition-colors duration-300 motion-reduce:transition-none',
                        clear ? 'bg-emerald-500 text-emerald-950' : 'bg-emerald-900 text-white',
                    )}
                >
                    <p className={cx('text-[15px] font-medium', clear ? 'text-emerald-950/80' : 'text-emerald-200')}>
                        {clear ? 'Estás al día' : 'Te deben'}
                    </p>
                    <p className={cx(DISPLAY, 'mt-0.5 text-5xl font-extrabold leading-[1.1] tracking-tighter tabular-nums')}>
                        {clear ? '$0' : `+${money(owedToMe)}`}
                    </p>
                    <p className={cx('mt-0.5 text-[13px]', clear ? 'text-emerald-950/80' : 'text-white/80')}>
                        {clear ? 'Cami ya te pagó' : 'Pendiente de Cami'}
                    </p>
                </div>

                <div
                    role="tablist"
                    aria-label="Secciones del grupo"
                    className="mx-3.5 mb-1 mt-4 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1"
                >
                    {[
                        ['gastos', 'Gastos'],
                        ['saldar', 'Saldar'],
                    ].map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            id={`tab-${id}`}
                            aria-selected={tab === id}
                            aria-controls={`panel-${id}`}
                            onClick={() => setTab(id)}
                            className={cx(
                                'h-[38px] rounded-full text-sm font-semibold transition motion-reduce:transition-none',
                                tab === id ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-600 hover:text-emerald-950',
                                FOCUS,
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'gastos' ? (
                    <div role="tabpanel" id="panel-gastos" aria-labelledby="tab-gastos" className="px-[18px] pb-[18px] pt-1.5">
                        <ul>
                            {EXPENSES.map((e) => (
                                <li key={e.id} className="grid grid-cols-[36px_1fr] items-center gap-x-3 border-b border-slate-200 py-3 last:border-b-0">
                                    <Avatar who={e.payer} />
                                    <div>
                                        <div className="flex items-baseline gap-2 font-semibold">
                                            <span>{e.title}</span>
                                            <i aria-hidden="true" className="min-w-3 flex-1 -translate-y-[3px] border-b-2 border-dotted border-slate-300" />
                                            <b className="tabular-nums">{money(e.amount)}</b>
                                        </div>
                                        <p className="text-[13px] tabular-nums text-slate-600">
                                            {e.payer === 'vos' ? 'Pagaste vos' : `Pagó ${PEOPLE[e.payer].name}`}, {money(e.amount / GROUP_SIZE)} cada uno
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-1.5 flex items-baseline justify-between border-t-2 border-emerald-950 pt-3.5 text-[15px] text-slate-600">
                            <span>Total del grupo</span>
                            <b className={cx(DISPLAY, 'text-[22px] font-extrabold tracking-tight text-emerald-950 tabular-nums')}>
                                {money(GROUP_TOTAL)}
                            </b>
                        </div>
                    </div>
                ) : (
                    <div role="tabpanel" id="panel-saldar" aria-labelledby="tab-saldar" className="px-[18px] pb-[18px] pt-1.5">
                        <p className="pb-1 pt-2 text-sm text-slate-600">{settleSummary}</p>
                        <ul>
                            {TRANSFERS.map((t) => (
                                <li key={t.id} className="grid grid-cols-[36px_1fr_auto] items-center gap-x-3 border-b border-slate-200 py-3 last:border-b-0">
                                    <Avatar who={t.from} />
                                    <div>
                                        <p className="font-semibold">{t.text}</p>
                                        <p className="text-[13px] tabular-nums text-slate-600">{money(t.amount)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-pressed={!!paid[t.id]}
                                        onClick={() => togglePaid(t.id)}
                                        className={cx(
                                            'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition motion-reduce:transition-none',
                                            paid[t.id]
                                                ? 'border-transparent bg-emerald-100 text-emerald-800'
                                                : 'border-slate-300 bg-white text-emerald-950 hover:bg-slate-50',
                                            FOCUS,
                                        )}
                                    >
                                        {paid[t.id] ? (
                                            <>
                                                <CheckIcon /> Pagado
                                            </>
                                        ) : (
                                            'Marcar pagado'
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </article>
            <p className="mt-3.5 text-center text-[13px] text-slate-600">Vista de ejemplo con datos ficticios.</p>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Storyboard: gastos -> liquidar -> cuentas claras                  */
/*  Fases: idle (no empezó) > gastos > calculando > listo             */
/*  Arranca solo al entrar en pantalla; el botón del paso 2 lo repite */
/* ------------------------------------------------------------------ */

function Step({ n, title, last, children }) {
    return (
        <li className="relative flex flex-col gap-[18px] rounded-3xl border border-slate-200 bg-white p-[22px] shadow-xl shadow-emerald-900/10">
            <header className="flex items-center gap-2.5">
                <span
                    aria-hidden="true"
                    className={cx(DISPLAY, 'inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800')}
                >
                    {n}
                </span>
                <h3 className={cx(DISPLAY, 'text-[19px] font-semibold tracking-tight')}>{title}</h3>
            </header>
            {children}
            {!last && (
                /* Conector: abajo en móvil, a la derecha en desktop */
                <span
                    aria-hidden="true"
                    className="absolute -bottom-8 left-1/2 z-10 -ml-3.5 flex h-7 w-7 rotate-90 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-600 shadow-md lg:-right-[30px] lg:bottom-auto lg:left-auto lg:top-1/2 lg:-mt-3.5 lg:ml-0 lg:rotate-0"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 5 7 7-7 7" />
                    </svg>
                </span>
            )}
        </li>
    )
}

function ExpenseChip({ expense, index, on }) {
    const main = index === 0
    return (
        <div
            className={cx(
                'transition duration-500 ease-out motion-reduce:transition-none',
                CHIP_DELAYS[index],
                index % 2 === 1 ? 'self-end' : 'self-start',
                on ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2.5 scale-95 opacity-0',
            )}
        >
            <div
                className={cx(
                    'inline-flex items-center gap-2 rounded-full border py-[5px] pl-[5px] pr-3.5 text-sm font-medium',
                    main ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-transparent bg-slate-100 text-emerald-950',
                )}
            >
                <Avatar who={expense.payer} size={28} />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {EXPENSE_ICONS[expense.id]}
                </svg>
                <span>{expense.short ?? expense.title}</span>
                <b className="font-bold tabular-nums">{money(expense.amount)}</b>
            </div>
        </div>
    )
}

function DebtGraph({ simplified }) {
    return (
        <svg
            viewBox="0 0 200 120"
            role="img"
            aria-label="Seis deudas posibles entre cuatro personas que se reducen a dos pagos"
            className={cx(
                'h-auto w-full max-w-[230px] overflow-visible transition-opacity duration-500 motion-reduce:transition-none',
                simplified ? 'opacity-100' : 'opacity-60',
            )}
        >
            {EDGES.map((e) => {
                const [x1, y1] = NODES[e.a]
                const [x2, y2] = NODES[e.b]
                return (
                    <line
                        key={e.id}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        strokeLinecap="round"
                        className={cx(
                            'transition-[opacity,stroke,stroke-width] duration-700 motion-reduce:transition-none',
                            e.keep && simplified && 'stroke-emerald-500 [stroke-width:3.5]',
                            e.keep && !simplified && 'stroke-slate-300 [stroke-width:2]',
                            !e.keep && simplified && 'stroke-slate-300 opacity-0 [stroke-width:2]',
                            !e.keep && !simplified && 'stroke-slate-300 [stroke-width:2]',
                        )}
                    />
                )
            })}
            {['36,40 30.5,50.5 41.5,50.5', '164,40 158.5,50.5 169.5,50.5'].map((points) => (
                <polygon
                    key={points}
                    points={points}
                    className={cx(
                        'fill-emerald-500 transition-opacity delay-300 duration-500 motion-reduce:transition-none',
                        simplified ? 'opacity-100' : 'opacity-0',
                    )}
                />
            ))}
            {Object.entries(NODES).map(([id, [cx0, cy0]]) => (
                <g key={id}>
                    <circle cx={cx0} cy={cy0} r="15" className={cx(PEOPLE[id].fill, 'stroke-white [stroke-width:3]')} />
                    <text
                        x={cx0}
                        y={cy0}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={cx('text-xs font-semibold', PEOPLE[id].ink)}
                    >
                        {PEOPLE[id].initial}
                    </text>
                </g>
            ))}
        </svg>
    )
}

function FlowStoryboard() {
    const [phase, setPhase] = useState(() =>
        typeof window === 'undefined' ||
            !('IntersectionObserver' in window) ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'listo'
            : 'idle',
    )
    const rootRef = useRef(null)
    const timers = useRef([])

    const run = useCallback(([toCalculating, toDone]) => {
        timers.current.forEach(clearTimeout)
        setPhase('gastos')
        timers.current = [
            setTimeout(() => setPhase('calculando'), toCalculating),
            setTimeout(() => setPhase('listo'), toDone),
        ]
    }, [])

    // Arranca la secuencia la primera vez que la sección entra en pantalla
    useEffect(() => {
        const el = rootRef.current
        if (!el || phase !== 'idle') return undefined
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    io.disconnect()
                    run([1500, 2800])
                }
            },
            { threshold: 0.15 },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [phase, run])

    useEffect(() => {
        const list = timers
        return () => list.current.forEach(clearTimeout)
    }, [])

    const calculating = phase === 'calculando'
    const step1On = phase !== 'idle'
    const step2On = calculating || phase === 'listo'
    const step3On = phase === 'listo'

    return (
        <section ref={rootRef} aria-labelledby="flow-title" className="mb-[72px]">
            <h2 id="flow-title" className="sr-only">
                Cómo funciona Splitear
            </h2>
            <p className="sr-only" aria-live="polite">
                {step3On ? `Resultado: ${TRANSFERS.map((t) => `${t.text} ${money(t.amount)}`).join(' y ')}. Todo al día.` : ''}
            </p>

            <ol className="mx-auto grid max-w-[460px] gap-9 lg:max-w-none lg:grid-cols-3 lg:gap-8">
                <Step n={1} title="Gastos">
                    <div className="flex min-h-[216px] flex-col justify-center gap-2.5">
                        {EXPENSES.map((e, i) => (
                            <ExpenseChip key={e.id} expense={e} index={i} on={step1On} />
                        ))}
                    </div>
                </Step>

                <Step n={2} title="Liquidación">
                    <div className="flex min-h-[216px] flex-col items-center justify-center gap-3.5">
                        <DebtGraph simplified={step2On} />
                        <span className="relative inline-flex">
                            {!calculating && (
                                <span
                                    aria-hidden="true"
                                    className="absolute -inset-1.5 animate-pulse rounded-full bg-emerald-400/30 motion-reduce:animate-none"
                                />
                            )}
                            <button
                                type="button"
                                aria-pressed={calculating}
                                onClick={() => run([450, 1600])}
                                className={cx(
                                    'relative inline-flex h-12 items-center gap-2 rounded-full bg-emerald-500 px-[22px] text-base font-semibold text-emerald-950',
                                    'transition duration-150  hover:bg-emerald-400 motion-reduce:transition-none',
                                    calculating ? 'scale-95 shadow-inner' : 'shadow-lg shadow-emerald-500/40',
                                    FOCUS,
                                )}
                            >
                                {calculating ? (
                                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                                        <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M13 2 4 13.5h6.5L9.5 22 20 9.5h-6.8L13 2Z" />
                                    </svg>
                                )}
                                Liquidar deudas
                            </button>
                        </span>
                    </div>
                </Step>

                <Step n={3} title="Cuentas claras" last>
                    <div className="flex min-h-[216px] flex-col items-center justify-center gap-[18px]">
                        {TRANSFERS.map((t, i) => (
                            <div
                                key={t.id}
                                className={cx(
                                    'grid w-full grid-cols-[40px_1fr_40px] items-center gap-2 transition duration-500 motion-reduce:transition-none',
                                    ROW_DELAYS[i],
                                    step3On ? 'blur-none' : 'opacity-30 blur-[3px]',
                                )}
                            >
                                <Avatar who={t.from} size={40} />
                                <div className="relative flex h-10 items-center justify-center text-emerald-500">
                                    <span className="absolute left-0 right-2 top-1/2 -translate-y-px border-t-2 border-dashed border-emerald-500" />
                                    <b className="relative rounded-full bg-emerald-500 px-2.5 py-1 text-sm font-bold text-emerald-950 ring-4 ring-white tabular-nums">
                                        {money(t.amount)}
                                    </b>
                                    <svg className="absolute -right-[3px] top-1/2 -mt-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="m9 5 7 7-7 7" />
                                    </svg>
                                </div>
                                <Avatar who={t.to} size={40} />
                            </div>
                        ))}
                        <span
                            className={cx(
                                'inline-flex h-[34px] items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 text-sm font-semibold text-emerald-800',
                                'transition duration-500 delay-500 motion-reduce:transition-none',
                                step3On ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
                            )}
                        >
                            <CheckIcon /> Al día con {TRANSFERS.length} pagos
                        </span>
                    </div>
                </Step>
            </ol>
        </section>
    )
}

/* ------------------------------------------------------------------ */
/*  Página                                                            */
/* ------------------------------------------------------------------ */

function Home() {
    return (
        <div className="min-h-screen overflow-x-clip bg-slate-50 bg-[radial-gradient(52rem_26rem_at_88%_-6%,rgba(16,185,129,0.13),transparent_62%)] font-['Instrument_Sans',system-ui,sans-serif] leading-normal text-emerald-950 antialiased">
            <title>Splitear | Anda de vacaciones tranquilo</title>
            <meta
                name="description"
                content="Splitear divide los gastos del grupo por vos, para que el viaje sea solo de disfrutar."
            />
            {/* Tipografías sin tocar ningún CSS. Carga no bloqueante: arranca como "print" y pasa a "all" al terminar */}
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap"
                media="print"
                onLoad={(e) => {
                    e.currentTarget.media = 'all'
                }}
            />

            <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
                <nav aria-label="Principal" className="flex items-center justify-between py-5">
                    <Link
                        to="/"
                        className={cx(
                            DISPLAY,
                            'inline-flex items-center gap-2 rounded-lg text-base font-extrabold tracking-tight min-[400px]:text-lg sm:gap-2.5 sm:text-[1.3rem]',
                            FOCUS,
                        )}
                    >
                        <LogoMark />
                        <span>Splitear</span>
                    </Link>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Link to="/login" className={NAV_LINK}>
                            Iniciar sesión
                        </Link>
                        <Link to="/register" className={NAV_LINK}>
                            Registrarse
                        </Link>
                    </div>
                </nav>

                <main>
                    <section className="grid gap-11 pb-14 pt-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:pb-[88px] lg:pt-14">
                        <div>
                            <h1
                                className={cx(
                                    DISPLAY,
                                    'max-w-[11ch] text-balance text-[clamp(2.7rem,10vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.04em]',
                                )}
                            >
                                Vacaciones tranquilo
                            </h1>
                            <p className="mt-5 max-w-lg text-lg text-slate-600">
                                Anotá lo que pagaste y listo. Splitear divide los gastos del grupo por vos, y al volver cada uno sabe
                                cuánto le toca, sin cuentas ni discusiones.
                            </p>
                            <Link
                                to="/register"
                                className={cx(
                                    'mt-7 inline-flex h-14 w-full items-center justify-center rounded-full bg-emerald-500 px-[30px] text-[17px] font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40',
                                    'transition hover:-translate-y-px hover:bg-emerald-400 active:translate-y-0 motion-reduce:transition-none sm:w-auto',
                                    FOCUS,
                                )}
                            >
                                Empezar gratis
                            </Link>
                            <p className="mt-3 text-sm text-slate-600">Creás tu cuenta en un minuto.</p>
                        </div>

                        <GroupPreview />
                    </section>

                    <FlowStoryboard />
                </main>

                <footer className="flex flex-col gap-4 border-t border-slate-200 pb-11 pt-7 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <div className={cx(DISPLAY, 'flex items-center gap-2 font-extrabold text-emerald-950')}>
                        <LogoMark size={24} />
                        <span>Splitear</span>
                        <small className="ml-1.5 font-['Instrument_Sans',system-ui,sans-serif] text-[13px] font-normal text-slate-600">
                            © {new Date().getFullYear()}
                        </small>
                    </div>
                    <nav aria-label="Secundaria" className="flex gap-5">
                        <Link to="/login" className={cx('rounded font-medium underline-offset-4 hover:text-emerald-950 hover:underline', FOCUS)}>
                            Iniciar sesión
                        </Link>
                        <Link to="/register" className={cx('rounded font-medium underline-offset-4 hover:text-emerald-950 hover:underline', FOCUS)}>
                            Crear cuenta
                        </Link>
                    </nav>
                </footer>
            </div>
        </div>
    )
}

export default Home
