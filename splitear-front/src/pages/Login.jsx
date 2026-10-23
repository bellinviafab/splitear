import Alert from '../components/Alert';
import api from '../services/api';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';
const INPUT = cx(
    'h-[52px] w-full rounded-[14px] border border-slate-300 bg-white px-4 text-base text-emerald-950 placeholder:text-slate-400',
    'transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 motion-reduce:transition-none',
);

function Login() {
    const [formData, setFormData] = useState({
        identificador: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const [isLoading, setIsLoading] = useState(false);
    const [errorMensaje, setErrorMensaje] = useState('');
    const [verPassword, setVerPassword] = useState(false);

    const navigate = useNavigate();
    const { state } = useLocation();
    const { setUsuario } = useAuth();
    const mensajeExito = state?.mensajeExito;

    // Limpia el state del historial para que el cartel no reaparezca si recargan la página
    useEffect(() => {
        if (mensajeExito) window.history.replaceState({}, '');
    }, [mensajeExito]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMensaje('');
        setIsLoading(true);
        try {
            const res = await api.post('/auth/login', formData);
            setUsuario(res.data.user);
            navigate('/inicio');
        } catch (error) {
            const mensajeError = error.response?.data?.message || "Ocurrió un error al iniciar sesión";
            setErrorMensaje(mensajeError);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip bg-slate-50 bg-[radial-gradient(48rem_24rem_at_90%_-8%,rgba(16,185,129,0.13),transparent_62%)] font-['Instrument_Sans',system-ui,sans-serif] leading-normal text-emerald-950 antialiased">

            <title>Iniciar sesión | Splitear</title>
            {/* Tipografías sin tocar ningún CSS. Carga no bloqueante: arranca como "print" y pasa a "all" al terminar */}
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap"
                media="print"
                onLoad={(e) => {
                    e.currentTarget.media = 'all';
                }}
            />

            <header className="mx-auto w-full max-w-5xl px-2 pt-3.5 sm:px-6 sm:pt-5">
                <Link
                    to="/"
                    className={cx(
                        'inline-flex h-11 items-center gap-1 rounded-full pl-2 pr-3.5 text-[15px] font-medium text-slate-600',
                        'transition hover:bg-emerald-950/5 hover:text-emerald-950 motion-reduce:transition-none',
                        FOCUS,
                    )}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m15 5-7 7 7 7" />
                    </svg>
                    Volver al inicio
                </Link>
            </header>

            <main className="grid flex-1 place-items-center px-5 pb-12 pt-4 sm:px-8 sm:pb-16 sm:pt-6">
                <section
                    aria-labelledby="login-title"
                    className="w-full max-w-md rounded-3xl border border-slate-200 bg-white px-[22px] pb-[26px] pt-7 shadow-2xl shadow-emerald-900/15 sm:px-9 sm:pb-[34px] sm:pt-10"
                >
                    <svg className="mb-5 block" width="48" height="48" viewBox="0 0 32 32" aria-hidden="true">
                        <rect width="32" height="32" rx="10" className="fill-emerald-500" />
                        <path d="M15 9A7 7 0 0 0 15 23Z" className="fill-emerald-950" />
                        <path d="M17 9A7 7 0 0 1 17 23Z" className="fill-emerald-950" />
                    </svg>

                    <h1
                        id="login-title"
                        className={cx(DISPLAY, 'text-[2rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-4xl')}
                    >
                        Bienvenido de nuevo
                    </h1>
                    <p className="mt-2 text-base text-slate-600">Ingresá tus credenciales para acceder a tu cuenta.</p>

                    <form className="mt-[26px] grid gap-[18px]" onSubmit={handleSubmit} aria-busy={isLoading}>
                        <div aria-live="polite" className="grid gap-3">
                            {mensajeExito && !errorMensaje && (
                                <div
                                    role="status"
                                    className="flex items-start gap-2.5 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
                                >
                                    <svg className="mt-0.5 shrink-0 text-emerald-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="m8 12.5 3 3 5-6" />
                                    </svg>
                                    {mensajeExito}
                                </div>
                            )}
                            <Alert message={errorMensaje} />
                        </div>

                        <div className="grid gap-[7px]">
                            <label htmlFor="identificador" className="text-sm font-semibold">Usuario o email</label>
                            <input
                                id="identificador"
                                name="identificador"
                                value={formData.identificador}
                                onChange={handleChange}
                                type="text"
                                placeholder="Usuario o Email"
                                autoComplete="username"
                                className={INPUT}
                            />
                        </div>

                        <div className="grid gap-[7px]">
                            <label htmlFor="password" className="text-sm font-semibold">Contraseña</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    type={verPassword ? 'text' : 'password'}
                                    placeholder="Contraseña"
                                    autoComplete="current-password"
                                    className={cx(INPUT, 'pr-[52px]')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setVerPassword(!verPassword)}
                                    aria-label="Mostrar contraseña"
                                    aria-pressed={verPassword}
                                    className={cx(
                                        'absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-600',
                                        'transition hover:bg-slate-100 hover:text-emerald-950 motion-reduce:transition-none',
                                        FOCUS,
                                    )}
                                >
                                    {/* El ícono muestra el estado actual: ojo abierto = se ve, ojo tachado = oculta */}
                                    {verPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.5M6.6 6.6A17.5 17.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
                                            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                                            <path d="m3 3 18 18" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cx(
                                'mt-1 inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-emerald-500 px-6 text-[17px] font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40',
                                'transition hover:-translate-y-px hover:bg-emerald-400 active:translate-y-0 motion-reduce:transition-none',
                                'disabled:cursor-progress disabled:bg-emerald-300 disabled:opacity-80 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-emerald-300',
                                FOCUS,
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                                        <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                                    </svg>
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar sesión'
                            )}
                        </button>
                    </form>

                    <p className="mt-[22px] text-center text-[15px] text-slate-600">
                        ¿No tenés una cuenta?{' '}
                        <Link
                            to="/register"
                            className={cx('rounded font-semibold text-emerald-700 underline-offset-[3px] hover:underline', FOCUS)}
                        >
                            Registrate
                        </Link>
                    </p>
                </section>
            </main>
        </div>
    );
}

export default Login;