import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import BarraNav from '../components/BarraNav';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';
const BOTON_CIRCULO = cx(
    'flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-950',
    'transition hover:bg-slate-50 motion-reduce:transition-none',
    FOCUS,
);

/* Colores de avatar. Cada integrante toma uno según su posición en la lista; el usuario logueado va siempre en verde oscuro */
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
    sm: 'h-9 w-9 text-sm',
    md: 'h-11 w-11 text-base',
};

const TABS = [
    { id: 'gastos', label: 'Gastos' },
    { id: 'saldos', label: 'Saldos' },
    { id: 'integrantes', label: 'Integrantes' },
];

const money = (n) => {
    const v = Math.abs(Number(n) || 0);
    return '$' + v.toLocaleString('es-AR', {
        minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
        maximumFractionDigits: 2,
    });
};

const redondear = (n) => Math.round(n * 100) / 100;

/* Nombre para mostrar: nombre y apellido, si no usuario, si no alias. "Corto" usa solo el nombre */
const nombreCompleto = (u) => {
    if (!u) return 'Alguien';
    return [u.name, u.last_name].filter(Boolean).join(' ') || u.username || u.alias || 'Usuario';
};
const nombreCorto = (u) => (u ? u.name || u.username || u.alias || 'Usuario' : 'Alguien');

/* "Cami", "Cami y Nico", "3 personas" */
const listaNombres = (usuarios) => {
    if (usuarios.length === 1) return nombreCorto(usuarios[0]);
    if (usuarios.length === 2) return `${nombreCorto(usuarios[0])} y ${nombreCorto(usuarios[1])}`;
    return `${usuarios.length} personas`;
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
const IconoVolver = () => (
    <svg {...ICON}>
        <path d="m15 5-7 7 7 7" />
    </svg>
);
const IconoOpciones = () => (
    <svg {...ICON} fill="currentColor" stroke="none">
        <circle cx="5.5" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="18.5" cy="12" r="1.8" />
    </svg>
);
const IconoMas = ({ tam = 18 }) => (
    <svg {...ICON} width={tam} height={tam} strokeWidth={2.4}>
        <path d="M12 5v14M5 12h14" />
    </svg>
);
const IconoRayo = () => (
    <svg {...ICON} width={17} height={17} strokeWidth={2.2}>
        <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />
    </svg>
);
const IconoFlecha = () => (
    <svg {...ICON} width={16} height={16} strokeWidth={2.4}>
        <path d="m9 6 6 6-6 6" />
    </svg>
);
const IconoCheck = () => (
    <svg {...ICON} width={18} height={18} strokeWidth={2.4}>
        <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
);

/* ---------- Estructura común: título, fuentes, columna centrada y barra de navegación ---------- */
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
            <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-44 pt-4">{children}</div>
            <BarraNav />
        </div>
    );
}

function Esqueleto() {
    const bloque = 'animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none';
    return (
        <Pagina titulo="Cargando grupo | Splitear">
            <div role="status" aria-live="polite">
                <span className="sr-only">Cargando grupo...</span>
                <div className="flex items-center justify-between">
                    <div className={cx(bloque, 'h-11 w-11 !rounded-full')} />
                    <div className={cx(bloque, 'h-6 w-44')} />
                    <div className={cx(bloque, 'h-11 w-11 !rounded-full')} />
                </div>
                <div className={cx(bloque, 'mt-5 h-9 w-48')} />
                <div className={cx(bloque, 'mt-4 h-[148px] !rounded-[28px]')} />
                <div className={cx(bloque, 'mt-4 h-[52px] !rounded-full')} />
                <div className="mt-5 grid gap-5">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3.5">
                            <div className={cx(bloque, 'h-11 w-11 shrink-0 !rounded-full')} />
                            <div className="grid flex-1 gap-2">
                                <div className={cx(bloque, 'h-4 w-2/3')} />
                                <div className={cx(bloque, 'h-3.5 w-1/2')} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Pagina>
    );
}

function Avatar({ usuario, esYo, color, tam = 'md', className }) {
    return (
        <span
            aria-hidden="true"
            className={cx(
                'flex shrink-0 items-center justify-center rounded-full font-semibold',
                AVATAR_TAMANOS[tam],
                esYo ? AVATAR_YO : color,
                className,
            )}
        >
            {nombreCorto(usuario).charAt(0).toUpperCase()}
        </span>
    );
}

/* ---------- Pestaña Gastos ---------- */
function TabGastos({ gastos, miId, porId, avatarDe, gastoTotalGrupo }) {
    if (gastos.length === 0) {
        return (
            <p className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-center text-[15px] text-slate-600">
                Todavía no hay gastos. Cargá el primero con el botón verde.
            </p>
        );
    }

    return (
        <>
            <ul className="divide-y divide-slate-200">
                {gastos.map((g) => {
                    const pagador = porId[g.idCreadorGasto] || g.creador;
                    const pagoYo = miId != null && g.idCreadorGasto === miId;

                    // Los detalles (reparto por participante) llegan si el backend incluye Detalle_gasto en el listado
                    const detalles = g.detalle_gastos;
                    const cantidad = detalles?.length;
                    const miParte = Number(detalles?.find((d) => d.idParticipante === miId)?.monto) || 0;

                    const subtitulo =
                        (pagoYo ? 'Pagaste vos' : `Pagó ${nombreCorto(pagador)}`) + (cantidad ? `, entre ${cantidad}` : '');

                    let efecto = null;
                    if (detalles && miId != null) {
                        if (pagoYo) {
                            const aFavor = redondear(Number(g.monto) - miParte);
                            efecto = aFavor > 0
                                ? { texto: `Te deben ${money(aFavor)}`, color: 'text-emerald-600' }
                                : { texto: 'Sin deudas', color: 'text-slate-500' };
                        } else {
                            efecto = miParte > 0
                                ? { texto: `Debés ${money(miParte)}`, color: 'text-rose-600' }
                                : { texto: 'No participás', color: 'text-slate-500' };
                        }
                    }

                    return (
                        <li key={g.id} className="flex items-start gap-3.5 py-3.5">
                            {avatarDe(g.idCreadorGasto, 'md')}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-end gap-2">
                                    <h3 className={cx(DISPLAY, 'min-w-0 truncate text-[17px] font-semibold leading-tight')}>
                                        {g.descripcion || 'Gasto sin descripción'}
                                    </h3>
                                    <span
                                        aria-hidden="true"
                                        className="mb-[5px] h-0 min-w-3 flex-1 border-b-2 border-dotted border-slate-300"
                                    />
                                    <span className={cx(DISPLAY, 'shrink-0 text-[17px] font-extrabold leading-tight')}>
                                        {money(g.monto)}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-baseline justify-between gap-3 text-sm">
                                    <p className="min-w-0 truncate text-slate-600">{subtitulo}</p>
                                    {efecto && <p className={cx('shrink-0 font-semibold', efecto.color)}>{efecto.texto}</p>}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div className="mt-1 flex items-center justify-between border-t-2 border-emerald-950 pt-4">
                <span className="text-[15px] text-slate-600">Total del grupo</span>
                <span className={cx(DISPLAY, 'text-2xl font-extrabold tracking-[-0.02em]')}>{money(gastoTotalGrupo)}</span>
            </div>
        </>
    );
}

/* ---------- Pestaña Saldos ---------- */
function TabSaldos({ integrantes, saldos, transferencias, miId, porId, avatarDe }) {
    const filas = integrantes
        .map((u) => ({ usuario: u, saldo: saldos[u.id] || 0 }))
        .sort((a, b) => b.saldo - a.saldo);
    const maximo = Math.max(...filas.map((f) => Math.abs(f.saldo)), 0);

    if (transferencias.length === 0) {
        return (
            <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <IconoCheck />
                </span>
                <p className="text-[15px] font-medium">Todas las cuentas están saldadas. No hay pagos pendientes.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            <p className="flex items-center justify-center gap-2 rounded-full bg-emerald-100 px-4 py-3 text-[15px] font-semibold text-emerald-900">
                <IconoRayo />
                {transferencias.length === 1
                    ? 'Con 1 pago queda todo en cero'
                    : `Con ${transferencias.length} pagos queda todo en cero`}
            </p>

            <ul className="grid gap-3">
                {transferencias.map((t) => {
                    const deudor = porId[t.idA];
                    const acreedor = porId[t.idB];
                    const texto =
                        t.idA === miId
                            ? `Le pagás a ${nombreCorto(acreedor)}`
                            : t.idB === miId
                                ? `${nombreCorto(deudor)} te paga`
                                : `${nombreCorto(deudor)} le paga a ${nombreCorto(acreedor)}`;
                    return (
                        <li
                            key={`${t.idA}-${t.idB}`}
                            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-emerald-900/5"
                        >
                            <div className="flex items-center gap-2.5">
                                {avatarDe(t.idA, 'md')}
                                <div className="flex min-w-0 flex-1 items-center" aria-hidden="true">
                                    <span className="h-0 flex-1 border-t-2 border-dashed border-emerald-500" />
                                    <span className={cx(DISPLAY, 'mx-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[15px] font-bold text-emerald-950')}>
                                        {money(t.montoDeuda)}
                                    </span>
                                    <span className="h-0 flex-1 border-t-2 border-dashed border-emerald-500" />
                                    <span className="-ml-1.5 text-emerald-500">
                                        <IconoFlecha />
                                    </span>
                                </div>
                                {avatarDe(t.idB, 'md')}
                            </div>
                            <p className="mt-3 text-[15px] font-semibold">
                                {texto}
                                <span className="sr-only">{`, ${money(t.montoDeuda)}`}</span>
                            </p>
                        </li>
                    );
                })}
            </ul>

            <section
                aria-labelledby="titulo-saldos"
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5"
            >
                <h2 id="titulo-saldos" className={cx(DISPLAY, 'text-[17px] font-semibold')}>Quién puso de más</h2>
                <ul className="mt-2 grid gap-0.5">
                    {filas.map(({ usuario, saldo }) => {
                        const ancho = maximo ? Math.max(3, (Math.abs(saldo) / maximo) * 50) : 0;
                        return (
                            <li key={usuario.id} className="grid grid-cols-[minmax(0,6.5rem)_1fr_5.25rem] items-center gap-2 py-1.5">
                                <span className="flex min-w-0 items-center gap-2">
                                    {avatarDe(usuario.id, 'xs')}
                                    <span className="truncate text-[15px] font-medium">
                                        {usuario.id === miId ? 'Vos' : nombreCorto(usuario)}
                                    </span>
                                </span>
                                <span className="relative block h-3.5" aria-hidden="true">
                                    <i className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
                                    {saldo !== 0 && (
                                        <i
                                            style={{ width: `${ancho}%` }}
                                            className={cx(
                                                'absolute inset-y-0',
                                                saldo > 0 ? 'left-1/2 rounded-r-lg bg-emerald-500' : 'right-1/2 rounded-l-lg bg-rose-400',
                                            )}
                                        />
                                    )}
                                </span>
                                <span
                                    className={cx(
                                        'text-right text-[15px] font-semibold',
                                        saldo > 0 ? 'text-emerald-600' : saldo < 0 ? 'text-rose-600' : 'text-slate-500',
                                    )}
                                >
                                    {saldo > 0 ? '+' : saldo < 0 ? '-' : ''}
                                    {money(saldo)}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}


// 2) Pegar todo lo que sigue en lugar de tu TabIntegrantes (copiarTexto y AliasCopiable son nuevos)

/* Copia al portapapeles. La Clipboard API solo existe en https o localhost: si falla (por ejemplo al probar desde el celular por http en la red local) se usa el método viejo */
async function copiarTexto(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch {
        const campo = document.createElement('textarea');
        campo.value = texto;
        campo.setAttribute('readonly', '');
        campo.style.position = 'fixed';
        campo.style.opacity = '0';
        document.body.appendChild(campo);
        campo.select();
        let ok;
        try {
            ok = document.execCommand('copy');
        } catch {
            ok = false;
        }
        document.body.removeChild(campo);
        return ok;
    }
}

/* Alias que se copia con un toque. Cada fila lleva su propio estado, así el aviso "copiado" aparece solo en la que se tocó */
function AliasCopiable({ alias }) {
    const [estado, setEstado] = useState('reposo'); // 'reposo' | 'copiado' | 'error'
    const temporizador = useRef(null);

    useEffect(() => () => clearTimeout(temporizador.current), []);

    const copiar = async () => {
        const ok = await copiarTexto(alias);
        setEstado(ok ? 'copiado' : 'error');
        clearTimeout(temporizador.current);
        temporizador.current = setTimeout(() => setEstado('reposo'), 2000);
    };

    return (
        <>
            <button
                type="button"
                onClick={copiar}
                aria-label={`Copiar alias: ${alias}`}
                className={cx(
                    '-ml-2 mt-0.5 inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-xl px-2 text-sm transition motion-reduce:transition-none',
                    estado === 'copiado' && 'bg-emerald-100 font-semibold text-emerald-900',
                    estado === 'error' && 'bg-rose-50 font-semibold text-rose-700',
                    estado === 'reposo' && 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 active:bg-emerald-100',
                    FOCUS,
                )}
            >
                <span className="truncate">
                    {estado === 'copiado' ? 'Alias copiado' : estado === 'error' ? 'No se pudo copiar' : `Alias: ${alias}`}
                </span>
                {estado === 'copiado' ? (
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                ) : (
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="11" height="11" rx="2.5" />
                        <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
                    </svg>
                )}
            </button>
            {/* Aviso para lectores de pantalla */}
            <span role="status" className="sr-only">
                {estado === 'copiado' ? 'Alias copiado' : estado === 'error' ? 'No se pudo copiar el alias' : ''}
            </span>
        </>
    );
}

function TabIntegrantes({ integrantes, gastosPorIntegrante, miId, avatarDe }) {
    return (
        <ul className="divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-4 shadow-lg shadow-emerald-900/5">
            {integrantes.map((u) => (
                <li key={u.id} className="flex items-center gap-3.5 py-3.5">
                    {avatarDe(u.id, 'md')}
                    <div className="min-w-0 flex-1">
                        <p className={cx(DISPLAY, 'flex items-center gap-2 text-[17px] font-semibold leading-tight')}>
                            <span className="truncate">{nombreCompleto(u)}</span>
                            {u.id === miId && (
                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 font-['Instrument_Sans',system-ui,sans-serif] text-xs font-semibold text-emerald-900">
                                    Vos
                                </span>
                            )}
                        </p>
                        {u.alias ? (
                            <AliasCopiable alias={u.alias} />
                        ) : (
                            <p className="mt-0.5 truncate text-sm text-slate-500">Sin alias cargado</p>
                        )}
                    </div>
                    <p className="shrink-0 text-right text-sm">
                        <span className="block font-semibold">{money(gastosPorIntegrante[u.id] ?? 0)}</span>
                        <span className="block text-slate-500">Gastos en total</span>
                    </p>
                </li>
            ))}
        </ul>
    );
}

/* ---------- Pantalla ---------- */
function DetalleGrupo() {
    const { id } = useParams();
    const { usuario } = useAuth();
    const miId = usuario?.id;

    const [grupo, setGrupo] = useState(null);
    const [integrantes, setIntegrantes] = useState([]);
    const [gastosPorIntegrante, setGastosPorIntegrante] = useState({});
    const [gastoTotalGrupo, setGastoTotalGrupo] = useState(0);
    const [gastos, setGastos] = useState([]); // Historial de gastos
    const [transferencias, setTransferencias] = useState([]); // Pagos sugeridos { idA debe a idB montoDeuda }
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [intento, setIntento] = useState(0); // Sube al tocar "Reintentar" o "Saldar cuentas" para volver a pedir los datos
    const [actualizando, setActualizando] = useState(false); // true mientras se refrescan los datos al tocar "Saldar cuentas"
    const [errorRefresco, setErrorRefresco] = useState(false); // El refresco falló pero ya hay datos en pantalla: se conservan
    const datosDe = useRef(null); // Id del grupo cuyos datos ya se mostraron al menos una vez

    // Estado para controlar las 3 pestañas: 'gastos' | 'saldos' | 'integrantes'
    const [tabActiva, setTabActiva] = useState('gastos');

    useEffect(() => {
        let activo = true; // Evita pisar el estado si cambió el grupo o se desmontó antes de que respondan

        const fetchDatos = async () => {
            try {
                const [resGrupo, resGastos, resBalance] = await Promise.all([
                    api.get(`/grupos/${id}`),
                    api.get(`/grupos/${id}/gastos`),
                    api.get(`/gastos/grupos/${id}/balance`),
                ]);
                if (!activo) return;

                setGrupo(resGrupo.data.grupo);
                setIntegrantes(resGrupo.data.integrantes || []);
                setGastosPorIntegrante(resGrupo.data.gastosPorIntegrante || {});
                setGastoTotalGrupo(resGrupo.data.gastoTotalGrupo || 0);
                setGastos(resGastos.data || []);
                // Se descartan restos de redondeo (menos de medio centavo)
                setTransferencias((resBalance.data || []).filter((t) => Number(t.montoDeuda) >= 0.005));
                setError(null);
                setErrorRefresco(false);
                datosDe.current = id;
            } catch {
                if (activo) {
                    // Con datos ya cargados, una falla de refresco no reemplaza la pantalla: se avisa y se dejan los últimos datos
                    if (datosDe.current === id) setErrorRefresco(true);
                    else setError('Error al obtener los detalles del grupo');
                }
            } finally {
                if (activo) {
                    setCargando(false);
                    setActualizando(false);
                }
            }
        };
        fetchDatos();

        return () => {
            activo = false;
        };
    }, [id, intento]);

    // Al volver a esta pestaña del navegador (o a la app en el celular) se piden los datos de nuevo, sin esqueleto ni cambiar de pestaña.
    // Cubre el caso en que el grupo estaba en cero, no hay botón "Saldar cuentas" y otro integrante cargó un gasto mientras tanto.
    useEffect(() => {
        const alVolver = () => {
            if (document.visibilityState === 'visible') setIntento((n) => n + 1);
        };
        document.addEventListener('visibilitychange', alVolver);
        return () => document.removeEventListener('visibilitychange', alVolver);
    }, []);

    // "Saldar cuentas": lleva a la pestaña de saldos y vuelve a pedir grupo, gastos y balance, para ver lo que cargaron los demás
    const handleSaldarCuentas = () => {
        setTabActiva('saldos');
        setErrorRefresco(false);
        setActualizando(true);
        setIntento((n) => n + 1);
    };

    // Si la ruta cambió a otro grupo, no se muestran los datos del anterior mientras llegan los nuevos
    const sinDatos = cargando || (grupo && String(grupo.id) !== String(id));

    if (error) {
        return (
            <Pagina titulo="Error | Splitear">
                <div role="alert" className="mt-8 rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-lg shadow-emerald-900/5">
                    <p className="text-[15px] font-medium text-rose-700">{error}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                setCargando(true);
                                setIntento((n) => n + 1);
                            }}
                            className={cx(
                                'inline-flex h-11 items-center rounded-full bg-emerald-500 px-5 text-[15px] font-semibold text-emerald-950 transition hover:bg-emerald-400 motion-reduce:transition-none',
                                FOCUS,
                            )}
                        >
                            Reintentar
                        </button>
                        <Link
                            to="/inicio"
                            className={cx(
                                'inline-flex h-11 items-center rounded-full border border-slate-300 bg-white px-5 text-[15px] font-semibold transition hover:border-emerald-400 hover:bg-emerald-500/10 motion-reduce:transition-none',
                                FOCUS,
                            )}
                        >
                            Volver a mis grupos
                        </Link>
                    </div>
                </div>
            </Pagina>
        );
    }

    if (sinDatos || !grupo) return <Esqueleto />;

    /* ---------- Datos derivados ---------- */
    const porId = Object.fromEntries(integrantes.map((u) => [u.id, u]));
    const colores = Object.fromEntries(integrantes.map((u, i) => [u.id, AVATAR_COLORES[i % AVATAR_COLORES.length]]));

    const avatarDe = (idUsuario, tam, className) => (
        <Avatar
            usuario={porId[idUsuario]}
            esYo={idUsuario === miId}
            color={colores[idUsuario] || 'bg-slate-200 text-slate-700'}
            tam={tam}
            className={className}
        />
    );

    // Saldo neto de cada integrante a partir de los pagos sugeridos: el que cobra suma, el que paga resta
    const saldos = {};
    integrantes.forEach((u) => {
        saldos[u.id] = 0;
    });
    transferencias.forEach((t) => {
        saldos[t.idB] = redondear((saldos[t.idB] || 0) + Number(t.montoDeuda));
        saldos[t.idA] = redondear((saldos[t.idA] || 0) - Number(t.montoDeuda));
    });
    const miSaldo = saldos[miId] || 0;

    let hero;
    if (miId == null) {
        // Sin usuario en el contexto no se puede hablar en primera persona: se muestra el total del grupo
        hero = {
            titulo: 'Total del grupo',
            monto: money(gastoTotalGrupo),
            detalle: `${gastos.length} ${gastos.length === 1 ? 'gasto' : 'gastos'}`,
        };
    } else if (miSaldo > 0) {
        const deudores = transferencias.filter((t) => t.idB === miId).map((t) => porId[t.idA]);
        hero = { titulo: 'Te deben', monto: `+${money(miSaldo)}`, detalle: `Pendiente de ${listaNombres(deudores)}` };
    } else if (miSaldo < 0) {
        const acreedores = transferencias.filter((t) => t.idA === miId).map((t) => porId[t.idB]);
        hero = { titulo: 'Debés', monto: money(miSaldo), detalle: `Le debés a ${listaNombres(acreedores)}` };
    } else {
        hero = { titulo: 'Estás al día', monto: '$0', detalle: 'No tenés pagos pendientes en este grupo' };
    }

    const visibles = integrantes.slice(0, 4);
    const restantes = integrantes.length - visibles.length;

    return (
        <Pagina titulo={`${grupo.nombreGrupo} | Splitear`}>
            {/* Cabecera */}
            <header className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
                <Link to="/inicio" aria-label="Volver a mis grupos" className={BOTON_CIRCULO}>
                    <IconoVolver />
                </Link>
                <h1 className={cx(DISPLAY, 'truncate text-center text-xl font-semibold tracking-[-0.02em]')}>
                    {grupo.nombreGrupo}
                </h1>
                {/* Menú de opciones del grupo: queda para conectar (eliminar grupo, editar, etc.) */}
                <button type="button" aria-label="Opciones del grupo" className={BOTON_CIRCULO}>
                    <IconoOpciones />
                </button>
            </header>

            {/* Participantes */}
            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex -space-x-2.5">
                        {visibles.map((u) => (
                            <span key={u.id}>{avatarDe(u.id, 'sm', 'ring-2 ring-slate-50')}</span>
                        ))}
                        {restantes > 0 && (
                            <span
                                aria-hidden="true"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 ring-2 ring-slate-50"
                            >
                                +{restantes}
                            </span>
                        )}
                    </div>
                    <p className="truncate text-[15px] text-slate-600">
                        {integrantes.length} {integrantes.length === 1 ? 'persona' : 'personas'}
                    </p>
                </div>
                <Link
                    to={`/grupos/${id}/agregar-miembro`}
                    className={cx(
                        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-slate-300 bg-white pl-3 pr-4 text-[15px] font-semibold',
                        'transition hover:border-emerald-400 hover:bg-emerald-500/10 motion-reduce:transition-none',
                        FOCUS,
                    )}
                >
                    <IconoMas />
                    Agregar
                </Link>
            </div>

            {/* Balance */}
            <section
                aria-label="Balance del grupo"
                className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-[28px] bg-emerald-900 p-5 text-white shadow-xl shadow-emerald-900/25"
            >
                <div className="min-w-0">
                    <p className="text-[15px] text-emerald-200">{hero.titulo}</p>
                    <p className={cx(DISPLAY, 'mt-0.5 text-[2.25rem] font-extrabold leading-none tracking-[-0.035em]')}>
                        {hero.monto}
                    </p>
                    <p className="mt-2 text-sm text-emerald-100/90">{hero.detalle}</p>
                </div>
                {transferencias.length > 0 && (
                    <button
                        type="button"
                        onClick={handleSaldarCuentas}
                        disabled={actualizando}
                        className={cx(
                            'relative inline-flex h-11 shrink-0 items-center rounded-full bg-emerald-500 px-4 text-[15px] font-semibold text-emerald-950',
                            'transition hover:bg-emerald-400 active:scale-[0.98] motion-reduce:transition-none',
                            'disabled:cursor-progress disabled:opacity-80 disabled:hover:bg-emerald-500 disabled:active:scale-100',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                        )}
                    >
                        {/* El texto se oculta pero sigue ocupando lugar: el botón no cambia de ancho al actualizar */}
                        <span className={actualizando ? 'invisible' : undefined}>Saldar cuentas</span>
                        {actualizando && (
                            <>
                                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                                    <svg className="animate-spin motion-reduce:animate-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                        <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                                    </svg>
                                </span>
                                <span className="sr-only">Actualizando...</span>
                            </>
                        )}
                    </button>
                )}
            </section>

            {errorRefresco && (
                <p role="alert" className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    No pudimos actualizar los datos. Estás viendo la última información cargada.
                </p>
            )}

            {/* Pestañas */}
            <div
                role="tablist"
                aria-label="Secciones del grupo"
                className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-slate-200/70 p-1.5"
            >
                {TABS.map((tab) => {
                    const activa = tab.id === tabActiva;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            id={`tab-${tab.id}`}
                            aria-selected={activa}
                            aria-controls="panel-grupo"
                            onClick={() => setTabActiva(tab.id)}
                            className={cx(
                                'h-10 rounded-full text-[15px] font-semibold transition motion-reduce:transition-none',
                                activa ? 'bg-white text-emerald-950 shadow-md shadow-slate-900/10' : 'text-slate-600 hover:text-emerald-950',
                                FOCUS,
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div role="tabpanel" id="panel-grupo" aria-labelledby={`tab-${tabActiva}`} aria-busy={actualizando} className="mt-3">
                {tabActiva === 'gastos' && (
                    <TabGastos gastos={gastos} miId={miId} porId={porId} avatarDe={avatarDe} gastoTotalGrupo={gastoTotalGrupo} />
                )}
                {tabActiva === 'saldos' && (
                    <TabSaldos
                        integrantes={integrantes}
                        saldos={saldos}
                        transferencias={transferencias}
                        miId={miId}
                        porId={porId}
                        avatarDe={avatarDe}
                    />
                )}
                {tabActiva === 'integrantes' && (
                    <TabIntegrantes
                        integrantes={integrantes}
                        gastosPorIntegrante={gastosPorIntegrante}
                        miId={miId}
                        avatarDe={avatarDe}
                    />
                )}
            </div>

            {/* Botón flotante: queda dentro de la columna de max-w-md, encima de la barra de navegación */}
            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 mx-auto flex w-full max-w-md justify-end px-5">
                <Link
                    to={`/grupos/${id}/nuevo-gasto`}
                    className={cx(
                        'pointer-events-auto inline-flex h-14 items-center gap-2 rounded-full bg-emerald-500 pl-5 pr-6 text-[17px] font-semibold text-emerald-950 shadow-xl shadow-emerald-500/40',
                        'transition hover:-translate-y-px hover:bg-emerald-400 active:translate-y-0 motion-reduce:transition-none',
                        FOCUS,
                    )}
                >
                    <IconoMas tam={22} />
                    Gasto
                </Link>
            </div>
        </Pagina>
    );
}

export default DetalleGrupo;