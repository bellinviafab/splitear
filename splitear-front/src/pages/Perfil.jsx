import { useState } from 'react'
import BarraNav from '../components/BarraNav'
import Encabezado from '../components/Encabezado'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Logout from '../components/Logout'

const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';
const FIELD = cx(
    'h-[52px] w-full rounded-[14px] border border-slate-300 bg-white px-4 text-base text-emerald-950 placeholder:text-slate-400',
    'transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 motion-reduce:transition-none',
);
const LABEL = 'text-sm font-semibold';

/* Dato de solo lectura: mismo bloque gris con candado para email, nombre y apellido */
function CampoBloqueado({ id, etiqueta, valor }) {
    return (
        <div className="grid gap-[7px]">
            <p id={id} className={LABEL}>
                {etiqueta} <span className="font-normal text-slate-500">(no editable)</span>
            </p>
            <p
                aria-labelledby={id}
                className="flex h-[52px] min-w-0 items-center gap-2.5 rounded-[14px] border border-slate-200 bg-slate-100 px-4 text-base text-slate-600"
            >
                <svg className="shrink-0 text-slate-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
                    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                </svg>
                <span className="min-w-0 truncate">{valor}</span>
            </p>
        </div>
    );
}

/*
 * Perfil se divide en dos componentes por una regla de React: los hooks (useState) no pueden
 * ir después de un `return` condicional. Si `usuario` llega con retraso (por ejemplo al
 * recargar la página), el original cambiaba la cantidad de hooks entre renders y React fallaba.
 * Acá el formulario solo se monta cuando el usuario ya existe, y arranca con sus datos reales.
 */
function Perfil() {
    const { usuario, logout } = useAuth()

    if (!usuario) {
        return null;
    }

    return <FormularioPerfil usuario={usuario} logout={logout} />
}

function FormularioPerfil({ usuario, logout }) {
    const [formData, setFormData] = useState({
        name: usuario?.name || '',
        last_name: usuario?.last_name || '',
        alias: usuario?.alias || ''
    });

    const [mensaje, setMensaje] = useState('');
    const [esError, setEsError] = useState(false);
    const [loading, setIsLoading] = useState(false);

    // Nombre y apellido se pueden cargar una sola vez: si ya tienen valor, quedan de solo lectura.
    // `guardados` cubre el caso en que se completan ahora y el usuario del contexto todavía no se refrescó.
    const [guardados, setGuardados] = useState({ name: false, last_name: false });
    const nombreBloqueado = Boolean(usuario.name?.trim()) || guardados.name;
    const apellidoBloqueado = Boolean(usuario.last_name?.trim()) || guardados.last_name;

    const handleLogout = () => {
        logout();
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMensaje('');
        setEsError(false);
        try {
            // Solo se envían los campos editables: lo bloqueado no viaja al backend
            const datos = { alias: formData.alias };
            // y un nombre o apellido vacío tampoco se manda, para no pisar el dato con un string vacío
            if (!nombreBloqueado && formData.name.trim()) datos.name = formData.name.trim();
            if (!apellidoBloqueado && formData.last_name.trim()) datos.last_name = formData.last_name.trim();
            const response = await api.put(`/usuarios/${usuario.id}`, datos);

            // Lo que se acaba de completar pasa a solo lectura
            setGuardados((prev) => ({
                name: prev.name || (!nombreBloqueado && Boolean(formData.name.trim())),
                last_name: prev.last_name || (!apellidoBloqueado && Boolean(formData.last_name.trim())),
            }));
            setMensaje('Perfil actualizado correctamente');
            console.log('Perfil actualizado:', response.data);
        } catch (error) {
            setEsError(true);
            setMensaje(error.response?.data?.message || 'Error al actualizar el perfil');
            console.error('Error al actualizar el perfil:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Datos del recuadro superior. Salen del usuario guardado, no del formulario, para que no cambien mientras se tipea
    const nombreCompleto = [usuario.name, usuario.last_name].filter(Boolean).join(' ') || usuario.username || 'Tu cuenta';
    const iniciales =
        ((usuario.name?.[0] ?? '') + (usuario.last_name?.[0] ?? '')).toUpperCase() ||
        (usuario.email?.[0] ?? '?').toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50 font-['Instrument_Sans',system-ui,sans-serif] leading-normal text-emerald-950 antialiased">
            <title>Mi cuenta | Splitear</title>
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
                    Mi cuenta
                </h1>

                {/* Recuadro de identidad */}
                <section
                    aria-label="Tu perfil"
                    className="mt-5 flex items-center gap-4 rounded-3xl bg-emerald-950 p-5 text-emerald-50 shadow-xl shadow-emerald-900/20"
                >
                    <span
                        aria-hidden="true"
                        className={cx(
                            DISPLAY,
                            'flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-2xl font-extrabold text-emerald-950',
                        )}
                    >
                        {iniciales}
                    </span>
                    <div className="min-w-0">
                        <p className={cx(DISPLAY, 'break-words text-xl font-extrabold leading-tight tracking-[-0.02em]')}>
                            {nombreCompleto}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-emerald-100/80">{usuario.email}</p>
                        {usuario.alias && (
                            <p className="mt-2 inline-flex max-w-full rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-medium text-emerald-200">
                                <span className="truncate">{usuario.alias}</span>
                            </p>
                        )}
                    </div>
                </section>

                {/* Formulario real con sus inputs conectados */}
                <form
                    onSubmit={handleSubmit}
                    aria-busy={loading}
                    className="mt-4 grid grid-cols-1 gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-emerald-900/10"
                >
                    <h2 className={cx(DISPLAY, 'text-xl font-extrabold tracking-[-0.02em]')}>Información del usuario</h2>

                    <div aria-live="polite" className="empty:hidden">
                        {mensaje && (
                            <p
                                role={esError ? 'alert' : 'status'}
                                className={cx(
                                    'flex items-start gap-2.5 rounded-[14px] border px-4 py-3 text-sm font-medium',
                                    esError
                                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-900',
                                )}
                            >
                                <svg className="mt-px shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    {esError ? (
                                        <path d="M12 8v5M12 16.5v.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                                    ) : (
                                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                                    )}
                                </svg>
                                {mensaje}
                            </p>
                        )}
                    </div>

                    {nombreBloqueado ? (
                        <CampoBloqueado id="name-label" etiqueta="Nombre" valor={formData.name} />
                    ) : (
                        <div className="grid gap-[7px]">
                            <label htmlFor="name" className={LABEL}>Nombre</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                autoComplete="given-name"
                                value={formData.name}
                                onChange={handleChange}
                                className={FIELD}
                            />
                        </div>
                    )}

                    {apellidoBloqueado ? (
                        <CampoBloqueado id="last-name-label" etiqueta="Apellido" valor={formData.last_name} />
                    ) : (
                        <div className="grid gap-[7px]">
                            <label htmlFor="last_name" className={LABEL}>Apellido</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                autoComplete="family-name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className={FIELD}
                            />
                        </div>
                    )}

                    <CampoBloqueado id="email-label" etiqueta="Email" valor={usuario.email} />

                    <div className="grid gap-[7px]">
                        <label htmlFor="alias" className={LABEL}>Alias preferido</label>
                        <input
                            type="text"
                            id="alias"
                            name="alias"
                            autoComplete="nickname"
                            value={formData.alias}
                            onChange={handleChange}
                            className={FIELD}
                        />
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
                            'Guardar Cambios'
                        )}
                    </button>
                </form>

                <Logout texto="Cerrar sesión" className="mt-5 w-full" />

                <BarraNav />
            </div>
        </div>
    );
}

export default Perfil