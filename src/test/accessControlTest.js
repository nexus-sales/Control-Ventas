import { USER_ROLES, AccessRequestManager } from '../utils/accessControl';


// Test 1: Verificar emails autorizados
testEmails.forEach(email => {
// ...existing code...

// Test 2: Verificar sistema de roles
// LOG ELIMINADO
Object.values(USER_ROLES).forEach(role => {
  // ...existing code...
});

// Test 3: Probar gestión de solicitudes
// LOG ELIMINADO

// Limpiar solicitudes existentes para la prueba
// const existingRequests = AccessRequestManager.getAllRequests();
// LOG ELIMINADO

// Agregar una solicitud de prueba
const testRequest = AccessRequestManager.addRequest(
  'test@example.com',
  'Usuario de Prueba',
  'Necesito acceso para pruebas del sistema'
);

if (testRequest) {
  // LOG ELIMINADO
  
  // Obtener todas las solicitudes
  const allRequests = AccessRequestManager.getAllRequests();
  // LOG ELIMINADO
  
  // Mostrar la última solicitud
  const lastRequest = allRequests[allRequests.length - 1];
  if (lastRequest) {
    // LOG ELIMINADO
    // LOG ELIMINADO
    // LOG ELIMINADO
  }
} else {
  // LOG ELIMINADO
}

// Test 4: Mensajes de acceso denegado
// LOG ELIMINADO
const testEmail = 'test@example.com';
// const accessMessage = getAccessDeniedMessage(testEmail);
// LOG ELIMINADO
// LOG ELIMINADO
// LOG ELIMINADO

// Test 5: Verificar configuración
// LOG ELIMINADO
// import eliminado por lint
// LOG ELIMINADO
// LOG ELIMINADO
// LOG ELIMINADO

// LOG ELIMINADO

// Función para mostrar estadísticas
function showAccessControlStats() {
  const requests = AccessRequestManager.getAllRequests();
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };
  
  // LOG ELIMINADO
  return stats;
};

// Función para limpiar datos de prueba
function cleanupTestData() {
  const testEmails = ['test@example.com', 'usuario@test.com'];
  testEmails.forEach(email => {
    AccessRequestManager.removeRequestByEmail(email);
  });
  // LOG ELIMINADO
};