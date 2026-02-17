import React, { useState, useEffect } from 'react';
import { AccessRequestManager, isAdminEmail, ACCESS_REQUEST_CONFIG } from '../../utils/accessControl';
import Card from '../ui/Card';
import SectionTitle from '../ui/SectionTitle';

export default function AccessRequestsManager({ userEmail }) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar permisos de admin al cargar
  useEffect(() => {
    const adminStatus = isAdminEmail(userEmail);
    setIsAdmin(adminStatus);

    if (adminStatus) {
      loadRequests();
    }
  }, [userEmail]);

  const loadRequests = () => {
    const allRequests = AccessRequestManager.getAllRequests();
    setRequests(allRequests);
  };

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <SectionTitle className="text-red-600 dark:text-red-400">Acceso Denegado</SectionTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
        </div>
      </Card>
    );
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const handleApprove = (requestId) => {
    setIsLoading(true);
    try {
      AccessRequestManager.updateRequestStatus(requestId, 'approved');
      loadRequests();
      setSelectedRequest(null);
      // Aquí podrías enviar un email de notificación
      // LOG ELIMINADO
    } catch {
      // LOG ELIMINADO
      alert('Error al aprobar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = (requestId, reason = '') => {
    setIsLoading(true);
    try {
      AccessRequestManager.updateRequestStatus(requestId, 'rejected', reason);
      loadRequests();
      setSelectedRequest(null);
      // Aquí podrías enviar un email de notificación
      // LOG ELIMINADO
    } catch {
      // LOG ELIMINADO
      alert('Error al rechazar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (requestId) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) {
      AccessRequestManager.removeRequest(requestId);
      loadRequests();
      setSelectedRequest(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };

    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <SectionTitle>Gestión de Solicitudes de Acceso</SectionTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Administra las solicitudes de acceso al sistema
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtrar:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[var(--brand-primary)] dark:bg-gray-800 dark:text-white"
          >
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="all">Todas</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: requests.length, color: 'blue' },
          { label: 'Pendientes', value: requests.filter(r => r.status === 'pending').length, color: 'yellow' },
          { label: 'Aprobadas', value: requests.filter(r => r.status === 'approved').length, color: 'green' },
          { label: 'Rechazadas', value: requests.filter(r => r.status === 'rejected').length, color: 'red' }
        ].map(stat => (
          <Card key={stat.label} className="text-center">
            <div className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Requests List */}
      <Card>
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              No hay solicitudes {filter !== 'all' ? `${filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas'}` : ''} por el momento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => (
              <div
                key={request.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {request.name}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <strong>Email:</strong> {request.email}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Fecha:</strong> {formatDate(request.requestedAt)}
                    </p>

                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Motivo:</strong> {request.reason}
                    </p>

                    {request.rejectionReason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        <strong>Motivo del rechazo:</strong> {request.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(request.id)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="mb-4">
              <SectionTitle>Rechazar Solicitud</SectionTitle>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Solicitud de: {selectedRequest.name} ({selectedRequest.email})
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const reason = e.target.reason.value;
              handleReject(selectedRequest.id, reason);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo del rechazo (opcional)
                </label>
                <textarea
                  name="reason"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] dark:bg-gray-800 dark:text-white resize-none"
                  placeholder="Explica por qué se rechaza esta solicitud..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors duration-200"
                >
                  {isLoading ? 'Rechazando...' : 'Rechazar'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <SectionTitle className="mb-4">Acciones Rápidas</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              if (confirm('¿Aprobar todas las solicitudes pendientes?')) {
                const pendingRequests = requests.filter(r => r.status === 'pending');
                pendingRequests.forEach(req => handleApprove(req.id));
              }
            }}
            className="p-4 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200 text-left"
          >
            <div className="font-medium text-green-700 dark:text-green-300">
              Aprobar Todas las Pendientes
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Aprueba automáticamente todas las solicitudes pendientes
            </div>
          </button>

          <a
            href={`mailto:?subject=Notificación de Estado - ${ACCESS_REQUEST_CONFIG.appName}&body=Estimado usuario, tu solicitud de acceso ha sido procesada.`}
            className="p-4 border border-[var(--brand-primary)]/30 dark:border-[var(--brand-primary)]/30 rounded-lg hover:bg-[var(--brand-primary)]/5 dark:hover:bg-[var(--brand-primary)]/10 transition-colors duration-200 text-left block"
          >
            <div className="font-medium text-[var(--brand-primary)]">
              Enviar Notificaciones
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Abre el cliente de email para notificar a los usuarios
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
}