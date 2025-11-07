// SCRIPT DE EMERGENCIA PARA FORZAR MODO ONLINE
// Copiar y pegar este código en la consola del navegador en la página de login

console.log('🚨 INICIANDO FIX DE EMERGENCIA PARA MODO OFFLINE');

// 1. Limpiar flag de modo offline
try {
    localStorage.removeItem('__app_offline_mode');
    console.log('✅ Flag de modo offline eliminado');
} catch (error) {
    console.error('❌ Error eliminando flag offline:', error);
}

// 2. Verificar conectividad
console.log('🌐 Estado de conectividad:', navigator.onLine ? 'ONLINE' : 'OFFLINE');

// 3. Probar conexión con Supabase
async function testSupabaseConnection() {
    const url = 'https://uplfdvojvtnbzajncojc.supabase.co';
    const key = '***REMOVED-SUPABASE-ANON-KEY-OLD***';
    
    try {
        console.log('🔄 Probando conexión con Supabase...');
        const response = await fetch(`${url}/rest/v1/`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Conexión con Supabase OK');
            return true;
        } else {
            console.warn('⚠️ Respuesta de Supabase:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('❌ Error conectando con Supabase:', error);
        return false;
    }
}

// 4. Ejecutar prueba
testSupabaseConnection().then(success => {
    if (success) {
        console.log('✅ Todo listo - intenta recargar la página');
        if (confirm('Conexión restaurada. ¿Recargar la página para aplicar cambios?')) {
            window.location.reload();
        }
    } else {
        console.log('❌ Hay problemas de conectividad - revisa tu conexión a internet');
    }
});

// 5. Información de debug
console.log('📊 Estado del localStorage:');
console.log('- Modo offline:', localStorage.getItem('__app_offline_mode'));
console.log('- Email recordado:', localStorage.getItem('rememberedEmail'));

console.log('🔧 Si el problema persiste:');
console.log('1. Verifica tu conexión a internet');
console.log('2. Revisa que no hay bloqueadores de anuncios afectando Supabase');
console.log('3. Intenta desde modo incógnito');
console.log('4. Revisa la consola por errores adicionales');