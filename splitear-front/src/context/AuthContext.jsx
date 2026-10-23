import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';


export const AuthContext = createContext();


export function AuthProvider({ children }) {

    const [usuario, setUsuario] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {

        const verificarSesion = async () => {
            try {
                const res = await api.get('/auth/me')
                setUsuario(res.data)
            } catch (error) {
                setUsuario(null)
            } finally {
                setCargando(false)
            }
        }
        verificarSesion();
    }, [])

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.warn("No se pudo notificar al servidor, cerrando sesión localmente:", error);
        } finally {
            setUsuario(null);
        }
    }

    return (
        <AuthContext.Provider value={{ usuario, setUsuario, cargando, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


export const useAuth = () => {
    return useContext(AuthContext)
}