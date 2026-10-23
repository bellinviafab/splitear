import { useState } from 'react';
import api from '../services/api'
import Alert from '../components/Alert'
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';
const INPUT = cx(
    'h-[52px] w-full rounded-[14px] border bg-white px-4 text-base text-emerald-950 placeholder:text-slate-400',
    'transition focus:outline-none focus:ring-4 motion-reduce:transition-none',
);
const INPUT_OK = 'border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20';
const INPUT_ERROR = 'border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20';

/* Campo de contraseña con ojo. El ícono muestra el estado actual:
   ojo abierto = la contraseña se ve, ojo tachado = está oculta. */
function PasswordField({ id, label, visible, onToggle, invalid, describedBy, ...inputProps }) {
    return (
        <div className="grid gap-[7px]">
            <label htmlFor={id} className="text-sm font-semibold">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    className={cx(INPUT, invalid ? INPUT_ERROR : INPUT_OK, 'pr-[52px]')}
                    {...inputProps}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label="Mostrar contraseñas"
                    aria-pressed={visible}
                    className={cx(
                        'absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-600',
                        'transition hover:bg-slate-100 hover:text-emerald-950 motion-reduce:transition-none',
                        FOCUS,
                    )}
                >
                    {visible ? (
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
    );
}

function Register() {

    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        password1: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [errorMensaje, setErrorMensaje] = useState('')
    const [verPassword, setVerPassword] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        })
    }


    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMensaje('')
        if (formData.password !== formData.password1) {
            setErrorMensaje("Las contraseñas no coinciden");
            return;
        }
        // password1 solo se usa para validar; se separa para no enviarlo al backend
        // eslint-disable-next-line no-unused-vars
        const { password1, ...datosUsuario } = formData;
        setIsLoading(true);
        try {
            await api.post('/auth/register', datosUsuario)
            navigate('/login', {
                state: { mensajeExito: '¡Cuenta creada con éxito! Iniciá sesión para continuar.' }
            });
        } catch (error) {
            const mensajeError = error.response?.data?.message || "Ocurrió un error al registrarse"
            setErrorMensaje(mensajeError)
        } finally {
            setIsLoading(false);
        }

    }

    const noCoinciden = formData.password1.length > 0 && formData.password !== formData.password1

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip bg-slate-50 bg-[radial-gradient(48rem_24rem_at_90%_-8%,rgba(16,185,129,0.13),transparent_62%)] font-['Instrument_Sans',system-ui,sans-serif] leading-normal text-emerald-950 antialiased">
            <title>Crear cuenta | Splitear</title>
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
                    aria-labelledby="register-title"
                    className="w-full max-w-md rounded-3xl border border-slate-200 bg-white px-[22px] pb-[26px] pt-7 shadow-2xl shadow-emerald-900/15 sm:px-9 sm:pb-[34px] sm:pt-10"
                >
                    <svg className="mb-5 block" width="48" height="48" viewBox="0 0 32 32" aria-hidden="true">
                        <rect width="32" height="32" rx="10" className="fill-emerald-500" />
                        <path d="M15 9A7 7 0 0 0 15 23Z" className="fill-emerald-950" />
                        <path d="M17 9A7 7 0 0 1 17 23Z" className="fill-emerald-950" />
                    </svg>

                    <h1
                        id="register-title"
                        className={cx(DISPLAY, 'text-[2rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-4xl')}
                    >
                        Crear cuenta en Splitear
                    </h1>
                    <p className="mt-2 text-base text-slate-600">Registrate para empezar a dividir los gastos de tu grupo.</p>

                    <form className="mt-[26px] grid gap-4" onSubmit={handleSubmit} aria-busy={isLoading}>
                        <div aria-live="polite">
                            <Alert message={errorMensaje} />
                        </div>

                        <div className="grid gap-[7px]">
                            <label htmlFor="email" className="text-sm font-semibold">Email</label>
                            <input
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                                placeholder="Email"
                                autoComplete="email"
                                className={cx(INPUT, INPUT_OK)}
                            />
                        </div>

                        <div className="grid gap-[7px]">
                            <label htmlFor="username" className="text-sm font-semibold">Nombre de usuario</label>
                            <input
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                type="text"
                                placeholder="Nombre de usuario"
                                autoComplete="username"
                                className={cx(INPUT, INPUT_OK)}
                            />
                        </div>

                        <PasswordField
                            id="password"
                            label="Contraseña"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Contraseña"
                            autoComplete="new-password"
                            visible={verPassword}
                            onToggle={() => setVerPassword(!verPassword)}
                        />

                        <div>
                            <PasswordField
                                id="password1"
                                label="Confirmar contraseña"
                                name="password1"
                                value={formData.password1}
                                onChange={handleChange}
                                placeholder="Confirmar contraseña"
                                autoComplete="new-password"
                                visible={verPassword}
                                onToggle={() => setVerPassword(!verPassword)}
                                invalid={noCoinciden}
                                describedBy={noCoinciden ? 'password1-error' : undefined}
                            />
                            {formData.password1.length > 0 && formData.password !== formData.password1 && (
                                <p id="password1-error" role="alert" className="mt-2 text-sm font-medium text-red-600">
                                    Las contraseñas no coinciden
                                </p>
                            )}
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
                                    Creando cuenta...
                                </>
                            ) : (
                                'Registrarse'
                            )}
                        </button>
                    </form>

                    <p className="mt-[22px] text-center text-[15px] text-slate-600">
                        ¿Ya tenés una cuenta?{' '}
                        <Link
                            to="/login"
                            className={cx('rounded font-semibold text-emerald-700 underline-offset-[3px] hover:underline', FOCUS)}
                        >
                            Iniciá sesión
                        </Link>
                    </p>
                </section>
            </main>
        </div>
    );
}

export default Register