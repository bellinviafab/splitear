import { NavLink } from 'react-router-dom';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';

/* Íconos de trazo. Heredan el color del texto con currentColor */
const ICON_PROPS = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
};

const ICONOS = {
    Grupos: (
        <svg {...ICON_PROPS}>
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3 19c0-3.2 2.7-5 6-5s6 1.8 6 5" />
            <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.3c1.7.7 3 2.2 3 4.7" />
        </svg>
    ),
    Actividad: (
        <svg {...ICON_PROPS}>
            <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
    ),
    Perfil: (
        <svg {...ICON_PROPS}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
        </svg>
    ),
};

function BarraNav() {
    const items = [
        { label: 'Grupos', to: '/inicio' },
        { label: 'Actividad', to: '/actividad' },
        { label: 'Perfil', to: '/perfil' },
    ];

    return (
        <nav
            aria-label="Navegación principal"
            className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-3 border-t border-slate-200 bg-white/95 px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur"
        >
            {items.map((item) => (
                <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                        cx(
                            'group flex flex-col items-center gap-1 rounded-2xl py-0.5 text-sm font-semibold transition-colors motion-reduce:transition-none',
                            isActive ? 'text-emerald-900' : 'text-slate-500 hover:text-emerald-900',
                            FOCUS,
                        )
                    }
                >
                    {({ isActive }) => (
                        <>
                            <span
                                className={cx(
                                    'flex h-[30px] w-16 items-center justify-center rounded-full transition-colors motion-reduce:transition-none',
                                    isActive ? 'bg-emerald-100' : 'bg-transparent group-hover:bg-emerald-500/15',
                                )}
                            >
                                {ICONOS[item.label]}
                            </span>
                            <span>{item.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}

export default BarraNav;