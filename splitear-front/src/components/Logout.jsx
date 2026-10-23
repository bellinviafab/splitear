import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const cx = (...classes) => classes.filter(Boolean).join(' ');

function Logout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [cerrando, setCerrando] = useState(false);

    const handleLogout = async () => {
        setCerrando(true);
        try {
            await logout();
            navigate('/login');
        } finally {
            setCerrando(false);
        }
    }

    return (
        <div className="mt-4">
            <button
                type="button"
                onClick={handleLogout}
                disabled={cerrando}
                className={cx(
                    'inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full border border-rose-200 bg-white px-6 text-[17px] font-semibold text-rose-700',
                    'transition hover:border-rose-300 hover:bg-rose-50 motion-reduce:transition-none',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700',
                    'disabled:cursor-progress disabled:opacity-70 disabled:hover:border-rose-200 disabled:hover:bg-white',
                )}
            >
                {cerrando ? (
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H9" />
                        <path d="M15 8l4 4-4 4M19 12H9.5" />
                    </svg>
                )}
                {cerrando ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </button>
        </div>
    )
}

export default Logout