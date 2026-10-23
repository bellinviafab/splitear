import BarraNav from '../components/BarraNav'
import Encabezado from '../components/Encabezado'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';
const FIELD = cx(
    'w-full rounded-[14px] border border-slate-300 bg-white px-4 text-base text-emerald-950 placeholder:text-slate-400',
    'transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 motion-reduce:transition-none',
);
const INPUT = cx(FIELD, 'h-[52px]');
const LABEL = 'text-sm font-semibold';

/* Avatares: mismo criterio que en el detalle del grupo. El usuario logueado va siempre en verde oscuro */
const AVATAR_YO = 'bg-emerald-900 text-emerald-50';
const AVATAR_COLORES = [
    'bg-amber-200 text-amber-900',
    'bg-sky-200 text-sky-900',
    'bg-pink-200 text-pink-900',
    'bg-violet-200 text-violet-900',
    'bg-orange-200 text-orange-900',
    'bg-teal-200 text-teal-900',
];

const nombreCompleto = (u) => [u.name, u.last_name].filter(Boolean).join(' ') || u.username || u.alias || 'Usuario';
const inicial = (u) => (u.name || u.username || u.alias || '?').trim().charAt(0).toUpperCase();
const money = (n) =>
    '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function NuevoGasto() {
    const [formGasto, setFormGasto] = useState({
        descripcion: '',
        monto: '',
    })
    const [loading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const { id } = useParams();
    const { usuario } = useAuth();
    const [error, setError] = useState('');

    const [integrantes, setIntegrantes] = useState([]);
    const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);
    const [cargandoIntegrantes, setCargandoIntegrantes] = useState(true);
    const [errorIntegrantes, setErrorIntegrantes] = useState(false);
    const [intento, setIntento] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormGasto({
            ...formGasto,
            [name]: value
        })
    }

    useEffect(() => {
        let activo = true;
        const fetchIntegrantes = async () => {
            try {
                // GET /grupos/:id devuelve { grupo, integrantes, ... }, el mismo que usa el detalle del grupo
                const res = await api.get(`/grupos/${id}`);
                if (!activo) return;
                const miembros = res.data.integrantes || [];
                setIntegrantes(miembros);
                setParticipantesSeleccionados(miembros.map((m) => m.id)); // Selecciona todos los integrantes por defecto
            } catch (error) {
                console.error('Error al obtener integrantes:', error);
                if (activo) setErrorIntegrantes(true);
            } finally {
                if (activo) setCargandoIntegrantes(false);
            }
        }
        fetchIntegrantes();
        return () => {
            activo = false;
        };
    }, [id, intento]);

    const reintentar = () => {
        setCargandoIntegrantes(true);
        setErrorIntegrantes(false);
        setIntento((n) => n + 1);
    };

    const handleToggleParticipante = (idMiembro) => {
        setError('')
        setParticipantesSeleccionados((prev) =>
            prev.includes(idMiembro)
                ? prev.filter((item) => item !== idMiembro)
                : [...prev, idMiembro]
        );
    };

    const todosSeleccionados = integrantes.length > 0 && participantesSeleccionados.length === integrantes.length;

    const handleToggleTodos = () => {
        setError('')
        setParticipantesSeleccionados(todosSeleccionados ? [] : integrantes.map((m) => m.id));
    };

    // Resumen de la división: se deriva del monto y de la selección, no agrega estado
    const montoNumerico = parseFloat(formGasto.monto);
    const cantidad = participantesSeleccionados.length;
    const porPersona = cantidad > 0 && montoNumerico > 0 ? montoNumerico / cantidad : null;

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (participantesSeleccionados.length === 0) {
            setError('Debe seleccionar al menos un participante para el gasto.');
            return;
        }
        if (!(montoNumerico > 0)) {
            setError('Ingresá un monto mayor a cero.');
            return;
        }
        setIsLoading(true)
        try {
            const payload = {
                descripcion: formGasto.descripcion.trim(),
                monto: montoNumerico,
                participantes: participantesSeleccionados.map((idMiembro) => ({ id: idMiembro })), // Convertir a array de objetos con id
            }

            await api.post(`/gastos/${id}/`, payload)
            navigate(`/grupos/${id}`)
        } catch (error) {
            console.error('Error al agregar gasto:', error)
            setError(error.response?.data?.message || 'No se pudo agregar el gasto. Probá de nuevo.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-['Instrument_Sans',system-ui,sans-serif] leading-normal text-emerald-950 antialiased">
            <title>Nuevo gasto | Splitear</title>
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

                <h1 className={cx(DISPLAY, 'mt-5 text-[2.25rem] font-extrabold leading-[1.05] tracking-[-0.035em]')}>
                    Nuevo gasto
                </h1>

                <form
                    onSubmit={handleSubmit}
                    aria-busy={loading}
                    className="mt-5 grid grid-cols-1 gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-emerald-900/10"
                >
                    <div aria-live="polite" className="empty:hidden">
                        {error && (
                            <p role="alert" className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-[7px]">
                        <label htmlFor="descripcion" className={LABEL}>Descripción</label>
                        <input
                            type="text"
                            id="descripcion"
                            name="descripcion"
                            required
                            autoComplete="off"
                            placeholder="Ej: Asado del sábado"
                            value={formGasto.descripcion}
                            onChange={handleChange}
                            className={INPUT}
                        />
                    </div>

                    <div className="grid gap-[7px]">
                        <label htmlFor="monto" className={LABEL}>Monto</label>
                        <div className="relative">
                            <span
                                aria-hidden="true"
                                className={cx(DISPLAY, 'pointer-events-none absolute inset-y-0 left-4 flex items-center text-2xl font-extrabold text-slate-400')}
                            >
                                $
                            </span>
                            <input
                                type="number"
                                id="monto"
                                name="monto"
                                required
                                inputMode="decimal"
                                min="0.01"
                                step="0.01"
                                placeholder="0,00"
                                value={formGasto.monto}
                                onChange={handleChange}
                                className={cx(
                                    FIELD,
                                    DISPLAY,
                                    'h-[60px] pl-10 text-2xl font-extrabold tracking-[-0.02em]',
                                    '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                                )}
                            />
                        </div>
                    </div>

                    <div role="group" aria-labelledby="titulo-participantes" className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 id="titulo-participantes" className={cx(DISPLAY, 'text-lg font-extrabold leading-tight tracking-[-0.02em]')}>
                                ¿Quiénes dividen este gasto?
                            </h2>
                            {integrantes.length > 1 && (
                                <button
                                    type="button"
                                    onClick={handleToggleTodos}
                                    className={cx(
                                        'shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 motion-reduce:transition-none',
                                        FOCUS,
                                    )}
                                >
                                    {todosSeleccionados ? 'Quitar todos' : 'Todos'}
                                </button>
                            )}
                        </div>

                        {cargandoIntegrantes && (
                            <ul aria-hidden="true" className="grid gap-2">
                                {[0, 1, 2].map((i) => (
                                    <li key={i} className="flex h-[68px] animate-pulse items-center gap-3.5 rounded-2xl border border-slate-200 px-3.5 motion-reduce:animate-none">
                                        <span className="h-11 w-11 rounded-full bg-slate-200" />
                                        <span className="grid flex-1 gap-2">
                                            <span className="h-3.5 w-1/2 rounded bg-slate-200" />
                                            <span className="h-3 w-1/3 rounded bg-slate-100" />
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {errorIntegrantes && (
                            <div role="alert" className="flex items-center justify-between gap-3 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                No pudimos cargar los integrantes del grupo.
                                <button
                                    type="button"
                                    onClick={reintentar}
                                    className={cx('shrink-0 rounded-lg px-2 py-1 font-semibold underline underline-offset-2', FOCUS)}
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}

                        {!cargandoIntegrantes && !errorIntegrantes && (
                            <ul className="grid grid-cols-1 gap-2">
                                {integrantes.map((miembro, i) => {
                                    const seleccionado = participantesSeleccionados.includes(miembro.id);
                                    const soyYo = miembro.id === usuario?.id;
                                    return (
                                        <li key={miembro.id}>
                                            <label
                                                className={cx(
                                                    'flex cursor-pointer items-center gap-3.5 rounded-2xl border px-3.5 py-3 transition motion-reduce:transition-none',
                                                    seleccionado
                                                        ? 'border-emerald-300 bg-emerald-50'
                                                        : 'border-slate-200 bg-white hover:border-slate-300',
                                                )}
                                            >
                                                {/* El checkbox real queda oculto pero accesible; el cuadro verde de la derecha lo representa */}
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={seleccionado}
                                                    onChange={() => handleToggleParticipante(miembro.id)}
                                                />
                                                <span
                                                    aria-hidden="true"
                                                    className={cx(
                                                        DISPLAY,
                                                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold',
                                                        soyYo ? AVATAR_YO : AVATAR_COLORES[i % AVATAR_COLORES.length],
                                                    )}
                                                >
                                                    {inicial(miembro)}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className={cx(DISPLAY, 'flex items-center gap-2 text-[17px] font-semibold leading-tight')}>
                                                        <span className="truncate">{nombreCompleto(miembro)}</span>
                                                        {soyYo && (
                                                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 font-['Instrument_Sans',system-ui,sans-serif] text-xs font-semibold text-emerald-900">
                                                                Vos
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="mt-0.5 block truncate text-sm text-slate-500">
                                                        {miembro.alias ? `Alias: ${miembro.alias}` : 'Sin alias cargado'}
                                                    </span>
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className={cx(
                                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-transparent transition motion-reduce:transition-none',
                                                        'peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:text-emerald-950',
                                                        'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-800',
                                                    )}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                                                    </svg>
                                                </span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {/* Resumen de la división */}
                        {!cargandoIntegrantes && !errorIntegrantes && integrantes.length > 0 && (
                            <p aria-live="polite" className="rounded-[14px] bg-slate-100 px-4 py-3 text-sm text-slate-600">
                                {cantidad === 0 ? (
                                    'Elegí al menos una persona.'
                                ) : porPersona !== null ? (
                                    <>
                                        Dividido entre {cantidad} {cantidad === 1 ? 'persona' : 'personas'}:{' '}
                                        <strong className="font-semibold text-emerald-950">{money(porPersona)} cada una</strong>
                                    </>
                                ) : (
                                    `Dividido entre ${cantidad} ${cantidad === 1 ? 'persona' : 'personas'}.`
                                )}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={cx(
                            'mt-1 inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-emerald-500 px-6 text-[17px] font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40',
                            'transition hover:-translate-y-px hover:bg-emerald-400 active:translate-y-0 motion-reduce:transition-none',
                            'disabled:cursor-progress disabled:bg-emerald-300 disabled:opacity-80 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-emerald-300',
                            FOCUS,
                        )}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                                    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                                </svg>
                                Guardando...
                            </>
                        ) : (
                            'Agregar Gasto'
                        )}
                    </button>
                </form>

                <BarraNav />
            </div>
        </div>
    )
}

export default NuevoGasto