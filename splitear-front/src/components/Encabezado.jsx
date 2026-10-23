import { Link } from 'react-router-dom';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const DISPLAY = "font-['Bricolage_Grotesque',system-ui,sans-serif]";
const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800';

function Encabezado() {
    return (
        <header className="flex items-center justify-between">
            <Link
                to="/"
                className={cx(
                    DISPLAY,
                    'flex h-11 items-center gap-2 rounded-xl pr-2 text-xl font-extrabold tracking-[-0.03em]',
                    FOCUS,
                )}
            >
                <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
                    <rect width="32" height="32" rx="10" className="fill-emerald-500" />
                    <path d="M15 9A7 7 0 0 0 15 23Z" className="fill-emerald-950" />
                    <path d="M17 9A7 7 0 0 1 17 23Z" className="fill-emerald-950" />
                </svg>
                Splitear
            </Link>
            <Link
                to="/perfil"
                aria-label="Perfil"
                className={cx(
                    'flex h-11 w-11 items-center justify-center rounded-full bg-emerald-900 text-emerald-50 transition hover:bg-emerald-800 motion-reduce:transition-none',
                    FOCUS,
                )}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
                </svg>
            </Link>
        </header>
    );
}

export default Encabezado;