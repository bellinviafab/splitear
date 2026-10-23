import BarraNav from '../components/BarraNav'
import api from '../services/api'
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Encabezado from '../components/Encabezado';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';

/* Colores del recuadro del ícono. Rotan según la posición del grupo en la lista */
const TILES = [
    'bg-emerald-100 text-emerald-800',
    'bg-sky-100 text-sky-700',
    'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700',
];

const money = (n) => Math.abs(Number(n)).toLocaleString('es-AR');

function Inicio() {
    const [grupos, setGrupos] = useState([])

    useEffect(() => {
        const obtenerGrupos = async () => {
            const res = await api.get('/grupos/')  //Obtengo la respuesta
            setGrupos(res.data)   //Actualizar el estado
        }
        obtenerGrupos();
    }, [])

    // Totales del resumen superior, derivados de la lista (no agregan estado)
    const teDeben = grupos.reduce((acc, g) => (g.saldoNeto > 0 ? acc + Number(g.saldoNeto) : acc), 0)
    const debes = grupos.reduce((acc, g) => (g.saldoNeto < 0 ? acc + Math.abs(Number(g.saldoNeto)) : acc), 0)

    return (
        <div className="min-h-screen bg-slate-50 font-['Instrument_Sans',system-ui,sans-serif] leading-normal text-emerald-950 antialiased">
            <title>Tus grupos | Splitear</title>
            {/* Tipografías con carga no bloqueante, igual que en Home, Login y Register */}
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap"
                media="print"
                onLoad={(e) => {
                    e.currentTarget.media = 'all';
                }}
            />

            <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-44 pt-4">
                <Encabezado />

                <h1 className={cx(DISPLAY, 'mt-5 text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.035em]')}>
                    Tus Grupos
                </h1>

                <section
                    aria-label="Resumen de saldos"
                    className="mt-5 grid grid-cols-2 gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-emerald-900/10"
                >
                    <div>
                        <p className="text-sm text-slate-600">Te deben</p>
                        <p className={cx(DISPLAY, 'mt-1 text-[1.75rem] font-extrabold leading-none tracking-[-0.03em] text-emerald-600')}>
                            +${money(teDeben)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600">Debés</p>
                        <p className={cx(DISPLAY, 'mt-1 text-[1.75rem] font-extrabold leading-none tracking-[-0.03em] text-rose-600')}>
                            ${money(debes)}
                        </p>
                    </div>
                </section>

                <div className="mt-4 grid gap-3">
                    {grupos.length === 0 && (
                        <p className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-center text-[15px] text-slate-600">
                            Todavía no tenés grupos. Creá el primero con el botón verde.
                        </p>
                    )}

                    {grupos.map((grupo, i) => (
                        <Link
                            key={grupo.id}
                            to={`/grupos/${grupo.id}`}
                            className={cx(
                                'flex items-center gap-3.5 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-emerald-900/5',
                                'transition hover:-translate-y-px hover:border-emerald-300 motion-reduce:transition-none',
                                FOCUS,
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', TILES[i % TILES.length])}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="8" r="3.2" />
                                    <path d="M3 19c0-3.2 2.7-5 6-5s6 1.8 6 5" />
                                    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.3c1.7.7 3 2.2 3 4.7" />
                                </svg>
                            </span>

                            <h3 className={cx(DISPLAY, 'min-w-0 flex-1 break-words text-[17px] font-semibold leading-tight')}>
                                {grupo.nombreGrupo}
                            </h3>

                            {grupo.saldoNeto > 0 ? (
                                <p className="shrink-0 text-right">
                                    <span className={cx(DISPLAY, 'block text-lg font-extrabold leading-tight text-emerald-600')}>
                                        +${money(grupo.saldoNeto)}
                                    </span>
                                    <span className="block text-sm text-slate-600">te deben</span>
                                </p>
                            ) : grupo.saldoNeto < 0 ? (
                                <p className="shrink-0 text-right">
                                    <span className={cx(DISPLAY, 'block text-lg font-extrabold leading-tight text-rose-600')}>
                                        -${money(grupo.saldoNeto)}
                                    </span>
                                    <span className="block text-sm text-slate-600">debés</span>
                                </p>
                            ) : (
                                <p className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                                    </svg>
                                    Al día
                                </p>
                            )}
                        </Link>
                    ))}
                </div>

                {/* Botón flotante: queda dentro de la columna de max-w-md, encima de la barra de navegación */}
                <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 mx-auto flex w-full max-w-md justify-end px-5">
                    <Link
                        to="/grupos/nuevo"
                        className={cx(
                            'pointer-events-auto inline-flex h-14 items-center gap-2 rounded-full bg-emerald-500 pl-5 pr-6 text-[17px] font-semibold text-emerald-950 shadow-xl shadow-emerald-500/40',
                            'transition hover:-translate-y-px hover:bg-emerald-400 active:translate-y-0 motion-reduce:transition-none',
                            FOCUS,
                        )}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Nuevo Grupo
                    </Link>
                </div>



                <BarraNav />
            </div>
        </div>
    )
}

export default Inicio