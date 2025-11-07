import { 
  isEmailAuthorized, 
  getRoleFromEmail, 
  USER_ROLES, 
  AccessRequestManager, 
  getAccessDeniedMessage 
} from '../utils/accessControl';

// Script de prueba para verificar el sistema de control de acceso
console.log('🔐 Iniciando pruebas del sistema de control de acceso...\n');

// Test 1: Verificar emails autorizados
console.log('📧 Test 1: Verificación de emails autorizados');
const testEmails = [
  'info@luzmatel.com', // Admin
  'usuario@test.com',  // No autorizado
  'admin@luzmatel.com' // Admin (si existe)
];

testEmails.forEach(email => {
  const authorized = isEmailAuthorized(email);
  const role = getRoleFromEmail(email);
  console.log(`   ${email}: ${authorized ? '✅ Autorizado' : '❌ No autorizado'} - Rol: ${role}`);
});

// Test 2: Verificar sistema de roles
console.log('\n👥 Test 2: Sistema de roles');
Object.values(USER_ROLES).forEach(role => {
  console.log(`   ${role}: Definido ✅`);
});

// Test 3: Probar gestión de solicitudes
console.log('\n📝 Test 3: Gestión de solicitudes de acceso');

// Limpiar solicitudes existentes para la prueba
const existingRequests = AccessRequestManager.getAllRequests();
console.log(`   Solicitudes existentes: ${existingRequests.length}`);

// Agregar una solicitud de prueba
const testRequest = AccessRequestManager.addRequest(
  'test@example.com',
  'Usuario de Prueba',
  'Necesito acceso para pruebas del sistema'
);

if (testRequest) {
  console.log('   ✅ Solicitud de prueba agregada correctamente');
  
  // Obtener todas las solicitudes
  const allRequests = AccessRequestManager.getAllRequests();
  console.log(`   📊 Total de solicitudes: ${allRequests.length}`);
  
  // Mostrar la última solicitud
  const lastRequest = allRequests[allRequests.length - 1];
  if (lastRequest) {
    console.log(`   📄 Última solicitud: ${lastRequest.name} (${lastRequest.email})`);
    console.log(`       Estado: ${lastRequest.status}`);
    console.log(`       Fecha: ${new Date(lastRequest.requestedAt).toLocaleString()}`);
  }
} else {
  console.log('   ⚠️ No se pudo agregar la solicitud (puede que ya exista)');
}

// Test 4: Mensajes de acceso denegado
console.log('\n🚫 Test 4: Mensajes de acceso denegado');
const testEmail = 'test@example.com';
const accessMessage = getAccessDeniedMessage(testEmail);
console.log(`   Email: ${testEmail}`);
console.log(`   Título: ${accessMessage.title}`);
console.log(`   Mensaje: ${accessMessage.message}`);

// Test 5: Verificar configuración
console.log('\n⚙️ Test 5: Configuración del sistema');
import { ACCESS_REQUEST_CONFIG } from '../utils/accessControl';
console.log(`   App Name: ${ACCESS_REQUEST_CONFIG.appName}`);
console.log(`   Admin Email: ${ACCESS_REQUEST_CONFIG.adminEmail}`);
console.log(`   Max Requests: ${ACCESS_REQUEST_CONFIG.maxRequestsPerEmail}`);

console.log('\n✅ Pruebas del sistema de control de acceso completadas');

// Función para mostrar estadísticas
export const showAccessControlStats = () => {
  const requests = AccessRequestManager.getAllRequests();
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };
  
  console.log('📊 Estadísticas de Control de Acceso:', stats);
  return stats;
};

// Función para limpiar datos de prueba
export const cleanupTestData = () => {
  const testEmails = ['test@example.com', 'usuario@test.com'];
  testEmails.forEach(email => {
    AccessRequestManager.removeRequestByEmail(email);
  });
  console.log('🧹 Datos de prueba limpiados');
};