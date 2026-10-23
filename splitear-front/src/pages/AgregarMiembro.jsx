import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Encabezado from '../components/Encabezado';
import BarraNav from '../components/BarraNav';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';
/* Los colores del borde van aparte: si se mezclaran en una sola lista, Tailwind resuelve el empate por el orden de su CSS y el rojo del error no se aplicaría */
const FIELD = cx(
    'h-[52px] w-full rounded-[14px] border bg-white pl-11 pr-4 text-base text-emerald-950 placeholder:text-slate-400',
    'transition focus:outline-none focus:ring-4 motion-reduce:transition-none',
    'disabled:bg-slate-100 disabled:text-slate-500',
);
const FIELD_OK = 'border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20';
const FIELD_ERROR = 'border-rose-400 hover:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20';

/* Estilo de cada tipo de aviso. 'info' queda disponible por si el backend distingue "invitación enviada" de "ya se sumó" */
const AVISOS = {
    exito: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
};

function AgregarMiembro() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null); // { tipo: 'exito' | 'info' | 'error', texto: '' }
    const temporizador = useRef(null);

    // Si el usuario sale de la pantalla antes de que termine la espera, no se lo redirige después
    useEffect(() => () => clearTimeout(temporizador.current), []);

    // Con el alta hecha, el formulario queda bloqueado hasta la redirección
    const exito = mensaje?.tipo === 'exito';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje(null);
        setLoading(true);

        try {
            // El backend espera: { integrante: { email: "..." } }
            const res = await api.post(`/grupos/${id}/miembros`, {
                integrante: { email: email.trim().toLowerCase() }
            });

            // Distinguimos si se agregó directo o si se mandó invitación por correo
            const textoRespuesta = res.data.message || res.data.mensaje || 'Operación realizada';
            setMensaje({ tipo: 'exito', texto: textoRespuesta });
            setEmail('');

            // Redirigir de vuelta al grupo luego de un breve momento para ver el feedback
            temporizador.current = setTimeout(() => {
                navigate(`/grupos/${id}`);
            }, 1500);

        } catch (error) {
            const errorMsg = error.response?.data?.message
                || error.response?.data?.mensaje
                || 'Error al agregar integrante al grupo';
            setMensaje({ tipo: 'error', texto: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-['Instrument_Sans',system-ui,sans-serif] leading-normal text-emerald-950 antialiased">
            <title>Agregar integrante | Splitear</title>
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

                <Link
                    to={`/grupos/${id}`}
                    className={cx(
                        'mt-3 inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white pl-3 pr-4 text-[15px] font-semibold',
                        'transition hover:border-emerald-400 hover:bg-emerald-500/10 motion-reduce:transition-none',
                        FOCUS,
                    )}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m15 5-7 7 7 7" />
                    </svg>
                    Volver al grupo
                </Link>

                <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-emerald-900/10">
                    <span
                        aria-hidden="true"
                        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9.5" cy="8" r="3.4" />
                            <path d="M3 19.5c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5" />
                            <path d="M19 8v6M16 11h6" />
                        </svg>
                    </span>

                    <h1 className={cx(DISPLAY, 'mt-4 text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.03em]')}>
                        Sumar amigo al grupo
                    </h1>
                    <p className="mt-2 text-[15px] text-slate-600">
                        Ingresá el correo electrónico. Si ya tiene cuenta en Splitear se sumará de inmediato; si no, le enviaremos un correo de invitación.
                    </p>

                    <div aria-live="polite" className="empty:hidden">
                        {mensaje && (
                            <p
                                role={mensaje.tipo === 'error' ? 'alert' : 'status'}
                                className={cx(
                                    'mt-4 flex items-start gap-2.5 rounded-[14px] border px-4 py-3 text-sm font-medium',
                                    AVISOS[mensaje.tipo] || AVISOS.info,
                                )}
                            >
                                <svg className="mt-px shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    {mensaje.tipo === 'error' ? (
                                        <path d="M12 8v5M12 16.5v.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                                    ) : (
                                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                                    )}
                                </svg>
                                <span>
                                    {mensaje.texto}
                                    {exito && <span className="mt-0.5 block font-normal opacity-80">Volviendo al grupo...</span>}
                                </span>
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} aria-busy={loading} className="mt-5 grid grid-cols-1 gap-5">
                        <div className="grid gap-[7px]">
                            <label htmlFor="email" className="text-sm font-semibold">Email del integrante</label>
                            <div className="relative">
                                <svg
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <rect x="3" y="5" width="18" height="14" rx="3" />
                                    <path d="m4 7.5 8 5.5 8-5.5" />
                                </svg>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    autoComplete="off"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    required
                                    disabled={exito}
                                    aria-invalid={mensaje?.tipo === 'error'}
                                    className={cx(FIELD, mensaje?.tipo === 'error' ? FIELD_ERROR : FIELD_OK)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || exito}
                            className={cx(
                                'inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-emerald-500 px-6 text-[17px] font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40',
                                'transition hover:-translate-y-px hover:bg-emerald-400 active:translate-y-0 motion-reduce:transition-none',
                                'disabled:cursor-progress disabled:bg-emerald-300 disabled:opacity-80 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-emerald-300',
                                FOCUS,
                            )}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin motion-reduce:animate-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                                        <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                                    </svg>
                                    Añadiendo...
                                </>
                            ) : (
                                'Añadir al grupo'
                            )}
                        </button>
                    </form>
                </section>

                <BarraNav />
            </div>
        </div>
    );
}

export default AgregarMiembro;