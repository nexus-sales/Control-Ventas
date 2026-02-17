import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { UserCheck, UserX, Shield, Mail, RefreshCw, Search } from 'lucide-react';
import Card from '../ui/Card';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const { data, error } = await supabase
                .from('usuarios_cv')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const toggleUserActive = async (userId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('usuarios_cv')
                .update({ activo: !currentStatus })
                .eq('id', userId);

            if (error) throw error;

            // Actualizar estado local
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, activo: !currentStatus } : u
            ));
        } catch (err) {
            alert('Error updating user status');
            console.error(err);
        }
    };

    const changeUserRole = async (userId, newRole) => {
        try {
            const { error } = await supabase
                .from('usuarios_cv')
                .update({ rol: newRole })
                .eq('id', userId);

            if (error) throw error;

            // Actualizar estado local
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, rol: newRole } : u
            ));
        } catch (err) {
            alert('Error updating user role');
            console.error(err);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(filter.toLowerCase()) ||
        u.nombre_completo?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-[var(--brand-primary)]" />
                        Gestión de Usuarios
                    </h2>
                    <p className="text-slate-500 dark:text-gray-400">Administra quién tiene acceso a la aplicación y sus roles.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por email o nombre..."
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[var(--brand-primary)] outline-none transition-all w-64"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        disabled={isRefreshing}
                        className="p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-750 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <Card className="overflow-hidden border-slate-200 dark:border-gray-800 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Acceso App</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">Cargando usuarios...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No se encontraron usuarios.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center font-bold text-slate-500 dark:text-gray-400 uppercase">
                                                    {u.nombre_completo ? u.nombre_completo[0] : (u.email ? u.email[0] : '?')}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white leading-tight">{u.nombre_completo || 'Sin nombre'}</p>
                                                    <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Mail className="w-3 h-3" />
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={u.rol}
                                                onChange={(e) => changeUserRole(u.id, e.target.value)}
                                                className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-[var(--brand-primary)] outline-none"
                                            >
                                                <option value="user">USER</option>
                                                <option value="viewer">VIEWER</option>
                                                <option value="admin">ADMIN</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {u.app_access?.map(app => (
                                                    <span key={app} className="px-2 py-0.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded text-[10px] font-bold">
                                                        {app}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${u.activo
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                {u.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleUserActive(u.id, u.activo)}
                                                className={`p-2 rounded-xl transition-all ${u.activo
                                                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                    : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                    }`}
                                                title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                                            >
                                                {u.activo ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
