// src/components/RutaProtegida.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RutaProtegida() {
    const { usuario, cargando } = useAuth();

    if (cargando) {
        return <div>Cargando sesión...</div>;
    }

    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />; //Si hay usuario --> deja pasar a las rutas
}

export default RutaProtegida;