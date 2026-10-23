import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function SoloInvitados() {
    const { usuario, cargando } = useAuth();

    if (cargando) {
        return null;
    }

    if (usuario) {
        return <Navigate to="/inicio" replace />;
    }

    return <Outlet />;
}

export default SoloInvitados;