import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Encabezado from '../components/Encabezado';
import BarraNav from '../components/BarraNav';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';
const FIELD = cx(
    'w-full rounded-[14px] border border-slate-300 bg-white px-4 text-base text-emerald-950 placeholder:text-slate-400',
    'transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 motion-reduce:transition-none',
);
const INPUT = cx(FIELD, 'h-[52px]');
const TEXTAREA = cx(FIELD, 'min-h-[104px] resize-none py-3');

// Fecha mínima para fechaFin: hoy, en hora local (toISOString usaría UTC y puede adelantar el día)
const HOY = (() => {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
})();

function NuevoGrupo() {
    const navigate = useNavigate();

    // 1. Datos principales del grupo
    const [formGrupo, setFormGrupo] = useState({
        nombreGrupo: '',
        descripcion: '',
        fechaFin: '',
    });

    // 2. Estados para manejar los integrantes
    const [integrantes, setIntegrantes] = useState([]);
    const [inputEmail, setInputEmail] = useState('');
    const [errorEmail, setErrorEmail] = useState('');

    // 3. Estados de control
    const [isLoading, setIsLoading] = useState(false);
    const [errorSubmit, setErrorSubmit] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormGrupo((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Función para agregar un integrante a la lista
    const handleAgregarIntegrante = () => {
        const emailLimpio = inputEmail.trim().toLowerCase();
        setErrorEmail('');

        if (!emailLimpio) return;

        // Validar formato básico de email
        if (!emailLimpio.includes('@')) {
            setErrorEmail('Ingresá un correo válido.');
            return;
        }

        // Evitar duplicados en la lista local
        if (integrantes.includes(emailLimpio)) {
            setErrorEmail('Este correo ya fue agregado.');
            return;
        }

        setIntegrantes((prev) => [...prev, emailLimpio]);
        setInputEmail('');
    };

    // Permitir agregar presionando la tecla Enter dentro del input de email
    const handleKeyDownEmail = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita que se envíe el formulario general
            handleAgregarIntegrante();
        }
    };

    // Función para quitar un integrante antes de enviar
    const handleEliminarIntegrante = (emailAEliminar) => {
        setIntegrantes((prev) => prev.filter((email) => email !== emailAEliminar));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorSubmit('');
        setIsLoading(true);

        try {
            // El backend espera el array de emails en la propiedad "integrantes"
            const payload = {
                ...formGrupo,
                fechaFin: formGrupo.fechaFin || null, // campo opcional: vacío viaja como null, no como ''
                integrantes
            };

            await api.post('/grupos', payload);

            // Redirigimos al dashboard o al detalle del grupo recién creado
            navigate('/inicio');
        } catch (error) {
            const mensaje = error.response?.data?.message || 'Error al crear el grupo';
            setErrorSubmit(mensaje);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-['Instrument_Sans',system-ui,sans-serif] leading-normal text-emerald-950 antialiased">
            <title>Nuevo grupo | Splitear</title>
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
                    Crear Nuevo Grupo
                </h1>

                <form
                    onSubmit={handleSubmit}
                    aria-busy={isLoading}
                    className="mt-5 grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-emerald-900/10"
                >
                    <div aria-live="polite" className="empty:hidden">
                        {errorSubmit && (
                            <p role="alert" className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                {errorSubmit}
                            </p>
                        )}
                    </div>

                    {/* Nombre del Grupo */}
                    <div className="grid gap-[7px]">
                        <label htmlFor="nombreGrupo" className="text-sm font-semibold">Nombre</label>
                        <input
                            type="text"
                            id="nombreGrupo"
                            name="nombreGrupo"
                            value={formGrupo.nombreGrupo}
                            onChange={handleChange}
                            placeholder="Ej: Viaje a la Costa"
                            required
                            className={INPUT}
                        />
                    </div>

                    {/* Descripción */}
                    <div className="grid gap-[7px]">
                        <label htmlFor="descripcion" className="text-sm font-semibold">Descripción</label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            value={formGrupo.descripcion}
                            onChange={handleChange}
                            placeholder="Notas o detalles del grupo..."
                            className={TEXTAREA}
                        />
                    </div>

                    {/* Fecha de fin (opcional) */}
                    <div className="grid gap-[7px]">
                        <label htmlFor="fechaFin" className="text-sm font-semibold">
                            Fecha de fin <span className="font-normal text-slate-500">(opcional)</span>
                        </label>
                        <input
                            type="date"
                            id="fechaFin"
                            name="fechaFin"
                            value={formGrupo.fechaFin}
                            onChange={handleChange}
                            min={HOY}
                            aria-describedby="fechaFin-ayuda"
                            className={cx(INPUT, 'block min-w-0')}
                        />
                        <div className="flex items-center justify-between gap-3">
                            <p id="fechaFin-ayuda" className="text-sm text-slate-500">
                                Para viajes o eventos con un cierre definido.
                            </p>
                            {formGrupo.fechaFin && (
                                <button
                                    type="button"
                                    onClick={() => setFormGrupo((prev) => ({ ...prev, fechaFin: '' }))}
                                    className={cx(
                                        'shrink-0 rounded px-1 text-sm font-semibold text-emerald-700 underline-offset-[3px] hover:underline',
                                        FOCUS,
                                    )}
                                >
                                    Quitar fecha
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sección de Integrantes */}
                    <div className="grid gap-[7px]">
                        <label htmlFor="emailIntegrante" className="text-sm font-semibold">Participantes (por email)</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                id="emailIntegrante"
                                value={inputEmail}
                                onChange={(e) => setInputEmail(e.target.value)}
                                onKeyDown={handleKeyDownEmail}
                                placeholder="amigo@email.com"
                                aria-invalid={errorEmail ? true : undefined}
                                aria-describedby={errorEmail ? 'email-error' : undefined}
                                className={cx(INPUT, 'min-w-0 flex-1', errorEmail && 'border-rose-400 hover:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20')}
                            />
                            {/* type="button" es vital para que no haga submit del form */}
                            <button
                                type="button"
                                onClick={handleAgregarIntegrante}
                                className={cx(
                                    'inline-flex h-[52px] shrink-0 items-center gap-1.5 rounded-full border border-slate-300 bg-white pl-3.5 pr-4 text-[15px] font-semibold',
                                    'transition hover:border-emerald-400 hover:bg-emerald-500/10 motion-reduce:transition-none',
                                    FOCUS,
                                )}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Agregar
                            </button>
                        </div>

                        {errorEmail && (
                            <p id="email-error" role="alert" className="text-sm font-medium text-rose-600">
                                {errorEmail}
                            </p>
                        )}

                        {/* Lista de píldoras / chips agregados */}
                        {integrantes.length > 0 && (
                            <ul className="mt-1 flex flex-wrap gap-2">
                                {integrantes.map((email) => (
                                    <li
                                        key={email}
                                        className="flex max-w-full items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-3.5 pr-1 text-sm font-medium text-emerald-900"
                                    >
                                        <span className="min-w-0 break-all">{email}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleEliminarIntegrante(email)}
                                            aria-label={`Eliminar ${email}`}
                                            className={cx(
                                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-emerald-800 transition hover:bg-emerald-500/20 motion-reduce:transition-none',
                                                FOCUS,
                                            )}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                                                <path d="M6 6l12 12M18 6 6 18" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Botón de acción principal */}
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
                                Creando grupo...
                            </>
                        ) : (
                            'Crear Grupo'
                        )}
                    </button>
                </form>

                <BarraNav />
            </div>
        </div>
    );
}

export default NuevoGrupo;