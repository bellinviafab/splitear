import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Encabezado from '../components/Encabezado';
import BarraNav from '../components/BarraNav';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';

/* Ruta del back. Ojo con el orden en el router: tiene que declararse ANTES de '/grupos/:id', si no Express toma "actividad" como un id */
const URL_ACTIVIDAD = '/grupos/actividad';

/* Nombres de las propiedades que devuelve Sequelize según cómo están declaradas las asociaciones.
   Si alguna no coincide con lo que ves en el console.log de la respuesta, se corrige acá y en ningún otro lugar */
const grupoDe = (g) => g.Grupo ?? g.grupo ?? null;
const detallesDe = (g) => g.participante ?? g.detalle_gastos ?? [];
const usuarioDe = (d) => d.User ?? d.usuario ?? null;

/* Colores de avatar. Sin lista de integrantes (acá se mezclan varios grupos), el color sale del id del usuario; el usuario logueado va siempre en verde oscuro */
const AVATAR_YO = 'bg-emerald-900 text-emerald-50';
const AVATAR_COLORES = [
    'bg-amber-200 text-amber-900',
    'bg-sky-200 text-sky-900',
    'bg-pink-200 text-pink-900',
    'bg-violet-200 text-violet-900',
    'bg-orange-200 text-orange-900',
    'bg-teal-200 text-teal-900',
];
const AVATAR_TAMANOS = {
    xs: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-base',
};

const money = (n) => {
    const v = Math.abs(Number(n) || 0);
    return '$' + v.toLocaleString('es-AR', {
        minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
        maximumFractionDigits: 2,
    });
};

const redondear = (n) => Math.round(n * 100) / 100;

const nombreCompleto = (u) => {
    if (!u) return 'Alguien';
    return [u.name, u.last_name].filter(Boolean).join(' ') || u.username || u.alias || 'Usuario';
};
const nombreCorto = (u) => (u ? u.name || u.username || u.alias || 'Usuario' : 'Alguien');

/* ---------- Fechas: "Hoy", "Ayer", "14 de octubre" ---------- */
const FORMATO_DIA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' });
const FORMATO_DIA_ANIO = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
const FORMATO_HORA = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

const claveDia = (f) => `${f.getFullYear()}-${f.getMonth()}-${f.getDate()}`;

const etiquetaDia = (fecha) => {
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    if (claveDia(fecha) === claveDia(hoy)) return 'Hoy';
    if (claveDia(fecha) === claveDia(ayer)) return 'Ayer';
    return (fecha.getFullYear() === hoy.getFullYear() ? FORMATO_DIA : FORMATO_DIA_ANIO).format(fecha);
};

/* La lista llega ordenada de más nueva a más vieja, así que alcanza con cortar cada vez que cambia el día */
const agruparPorDia = (gastos) => {
    const dias = [];
    gastos.forEach((g) => {
        const fecha = new Date(g.createdAt);
        const clave = claveDia(fecha);
        const ultimo = dias[dias.length - 1];
        if (ultimo && ultimo.clave === clave) ultimo.items.push(g);
        else dias.push({ clave, etiqueta: etiquetaDia(fecha), items: [g] });
    });
    return dias;
};

/* ---------- Íconos ---------- */
const ICON = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
};
const IconoChevron = ({ abierto }) => (
    <svg
        {...ICON}
        width={18}
        height={18}
        className={cx('shrink-0 text-slate-400 transition-transform motion-reduce:transition-none', abierto && 'rotate-180')}
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);
const IconoActividad = () => (
    <svg {...ICON} width={26} height={26} strokeWidth={1.9}>
        <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />
    </svg>
);

/* ---------- Estructura común ---------- */
function Pagina({ titulo, children }) {
    return (
        <div className="min-h-screen bg-slate-50 font-['Instrument_Sans',system-ui,sans-serif] leading-normal text-emerald-950 antialiased">
            <title>{titulo}</title>
            {/* Tipografías con carga no bloqueante, igual que en el resto de las pantallas */}
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap"
                media="print"
                onLoad={(e) => {
                    e.currentTarget.media = 'all';
                }}
            />
            <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-32 pt-4">
                <Encabezado />

                <h1 className={cx(DISPLAY, 'mt-5 text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.035em]')}>
                    Actividad
                </h1>
                <p className="mt-1.5 text-[15px] text-slate-600">Lo último que pasó en tus grupos</p>

                <div className="mt-5">{children}</div>

                <BarraNav />
            </div>
        </div>
    );
}

function Esqueleto() {
    const bloque = 'animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none';
    return (
        <div role="status" aria-live="polite">
            <span className="sr-only">Cargando actividad...</span>
            <div className={cx(bloque, 'h-4 w-16')} />
            <div className="mt-3 grid gap-5 rounded-3xl border border-slate-200 bg-white p-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3.5">
                        <div className={cx(bloque, 'h-11 w-11 shrink-0 !rounded-full')} />
                        <div className="grid flex-1 gap-2">
                            <div className={cx(bloque, 'h-4 w-4/5')} />
                            <div className={cx(bloque, 'h-3.5 w-1/2')} />
                        </div>
                        <div className={cx(bloque, 'h-5 w-14')} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function Avatar({ usuario, esYo, tam = 'md' }) {
    const color = esYo ? AVATAR_YO : AVATAR_COLORES[(Number(usuario?.id) || 0) % AVATAR_COLORES.length];
    return (
        <span
            aria-hidden="true"
            className={cx('flex shrink-0 items-center justify-center rounded-full font-semibold', AVATAR_TAMANOS[tam], color)}
        >
            {nombreCorto(usuario).charAt(0).toUpperCase()}
        </span>
    );
}

/* ---------- Una fila del feed: cerrada muestra quién, dónde y cuánto; abierta muestra el reparto ---------- */
function FilaGasto({ gasto, miId, abierto, onToggle }) {
    const creador = gasto.creador ?? null;
    const grupo = grupoDe(gasto);
    const detalles = detallesDe(gasto);
    const pagoYo = miId != null && gasto.idCreadorGasto === miId;
    const miParte = Number(detalles.find((d) => d.idParticipante === miId)?.monto) || 0;
    const hora = FORMATO_HORA.format(new Date(gasto.createdAt));

    // Efecto sobre vos: misma regla que en la pestaña Gastos del grupo
    let efecto = null;
    if (miId != null) {
        if (pagoYo) {
            const aFavor = redondear(Number(gasto.monto) - miParte);
            efecto = aFavor > 0
                ? { texto: `Te deben ${money(aFavor)}`, color: 'text-emerald-600' }
                : { texto: 'Sin deudas', color: 'text-slate-500' };
        } else {
            efecto = miParte > 0
                ? { texto: `Debés ${money(miParte)}`, color: 'text-rose-600' }
                : { texto: 'No participás', color: 'text-slate-500' };
        }
    }

    const idPanel = `reparto-${gasto.id}`;

    return (
        <li>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={abierto}
                aria-controls={idPanel}
                className={cx(
                    '-mx-2 flex w-[calc(100%+1rem)] items-start gap-3.5 rounded-2xl px-2 py-3.5 text-left transition hover:bg-emerald-50/60 motion-reduce:transition-none',
                    FOCUS,
                )}
            >
                <Avatar usuario={creador} esYo={pagoYo} />
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug">
                        <span className="font-semibold">{pagoYo ? 'Vos' : nombreCorto(creador)}</span>
                        {pagoYo ? ' hiciste un gasto en ' : ' hizo un gasto en '}
                        <span className="font-semibold">{grupo?.nombreGrupo ?? 'un grupo'}</span>
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-600">
                        {gasto.descripcion || 'Gasto sin descripción'} · {hora}
                    </p>
                    {efecto && <p className={cx('mt-0.5 text-sm font-semibold', efecto.color)}>{efecto.texto}</p>}
                </div>
                <p className={cx(DISPLAY, 'shrink-0 text-right text-[17px] font-extrabold leading-tight')}>{money(gasto.monto)}</p>
                <span className="mt-0.5">
                    <IconoChevron abierto={abierto} />
                </span>
            </button>

            {abierto && (
                <div id={idPanel} className="pb-4 pl-[58px]">
                    <div className="rounded-2xl bg-slate-50 p-3.5">
                        <p className="text-sm font-semibold text-slate-600">
                            {detalles.length > 0
                                ? `Repartido entre ${detalles.length} ${detalles.length === 1 ? 'persona' : 'personas'}`
                                : 'Este gasto no tiene reparto cargado'}
                        </p>
                        {detalles.length > 0 && (
                            <ul className="mt-2.5 grid gap-2.5">
                                {detalles.map((d) => {
                                    const u = usuarioDe(d);
                                    const esYo = miId != null && d.idParticipante === miId;
                                    return (
                                        <li key={d.idParticipante} className="flex items-center gap-2.5">
                                            <Avatar usuario={u} esYo={esYo} tam="xs" />
                                            <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                                                {esYo ? 'Vos' : nombreCompleto(u)}
                                                {d.idParticipante === gasto.idCreadorGasto && (
                                                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                                                        Pagó
                                                    </span>
                                                )}
                                            </span>
                                            <span className="shrink-0 text-[15px] font-semibold">{money(d.monto)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        <Link
                            to={`/grupos/${gasto.idGrupo}`}
                            className={cx(
                                'mt-3.5 inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-[15px] font-semibold',
                                'transition hover:border-emerald-400 hover:bg-emerald-500/10 motion-reduce:transition-none',
                                FOCUS,
                            )}
                        >
                            Ver grupo
                        </Link>
                    </div>
                </div>
            )}
        </li>
    );
}

/* ---------- Pantalla ---------- */
function Actividad() {
    const { usuario } = useAuth();
    const miId = usuario?.id;

    const [gastos, setGastos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null); // La primera carga falló: pantalla de error con reintento
    const [errorRefresco, setErrorRefresco] = useState(false); // Un refresco falló pero ya hay datos en pantalla: se conservan
    const [intento, setIntento] = useState(0); // Sube al tocar "Reintentar" o al volver a la pestaña para pedir los datos de nuevo
    const [abierto, setAbierto] = useState(null); // Id del gasto con el reparto desplegado
    const yaCargo = useRef(false);

    useEffect(() => {
        let activo = true; // Evita pisar el estado si el usuario se fue de la pantalla antes de que responda

        const fetchActividad = async () => {
            try {
                const res = await api.get(URL_ACTIVIDAD);
                if (!activo) return;
                setGastos(res.data?.gastosGrupos || []);
                setError(null);
                setErrorRefresco(false);
                yaCargo.current = true;
            } catch {
                if (!activo) return;
                // Con datos ya cargados, una falla de refresco no reemplaza la lista: se avisa y se dejan los últimos datos
                if (yaCargo.current) setErrorRefresco(true);
                else setError('No pudimos cargar la actividad');
            } finally {
                if (activo) setCargando(false);
            }
        };
        fetchActividad();

        return () => {
            activo = false;
        };
    }, [intento]);

    // Esta pantalla responde a "qué pasó", así que al volver a la pestaña del navegador (o a la app en el celular) se piden los datos de nuevo
    useEffect(() => {
        const alVolver = () => {
            if (document.visibilityState === 'visible') setIntento((n) => n + 1);
        };
        document.addEventListener('visibilitychange', alVolver);
        return () => document.removeEventListener('visibilitychange', alVolver);
    }, []);

    let contenido;

    if (error) {
        contenido = (
            <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-lg shadow-emerald-900/5">
                <p className="text-[15px] font-medium text-rose-700">{error}</p>
                <button
                    type="button"
                    onClick={() => {
                        setError(null);
                        setCargando(true);
                        setIntento((n) => n + 1);
                    }}
                    className={cx(
                        'mt-4 inline-flex h-11 items-center rounded-full bg-emerald-500 px-5 text-[15px] font-semibold text-emerald-950 transition hover:bg-emerald-400 motion-reduce:transition-none',
                        FOCUS,
                    )}
                >
                    Reintentar
                </button>
            </div>
        );
    } else if (cargando) {
        contenido = <Esqueleto />;
    } else if (gastos.length === 0) {
        contenido = (
            <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                    <IconoActividad />
                </span>
                <p className={cx(DISPLAY, 'mt-4 text-lg font-semibold')}>Todavía no hay movimientos</p>
                <p className="mt-1 text-[15px] text-slate-600">Cuando alguien cargue un gasto en tus grupos, lo vas a ver acá.</p>
                <Link
                    to="/inicio"
                    className={cx(
                        'mt-4 inline-flex h-11 items-center rounded-full border border-slate-300 bg-white px-5 text-[15px] font-semibold',
                        'transition hover:border-emerald-400 hover:bg-emerald-500/10 motion-reduce:transition-none',
                        FOCUS,
                    )}
                >
                    Ir a mis grupos
                </Link>
            </div>
        );
    } else {
        contenido = (
            <div className="grid grid-cols-1 gap-5">
                {agruparPorDia(gastos).map((dia) => (
                    <section key={dia.clave} aria-labelledby={`dia-${dia.clave}`}>
                        <h2 id={`dia-${dia.clave}`} className={cx(DISPLAY, 'text-[15px] font-semibold text-slate-600')}>
                            {dia.etiqueta}
                        </h2>
                        <ul className="mt-2 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-4 shadow-lg shadow-emerald-900/5">
                            {dia.items.map((g) => (
                                <FilaGasto
                                    key={g.id}
                                    gasto={g}
                                    miId={miId}
                                    abierto={abierto === g.id}
                                    onToggle={() => setAbierto(abierto === g.id ? null : g.id)}
                                />
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        );
    }

    return (
        <Pagina titulo="Actividad | Splitear">
            {errorRefresco && (
                <p role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    No pudimos actualizar la actividad. Estás viendo la última información cargada.
                </p>
            )}
            {contenido}
        </Pagina>
    );
}

export default Actividad;