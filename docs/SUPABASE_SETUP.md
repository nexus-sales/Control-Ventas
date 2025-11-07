# Configuración de Supabase para Control de Acceso

## 🔧 Configuraciones Necesarias en Supabase

### 1. 📋 Tabla de Perfiles (profiles)

Necesitas asegurarte de que la tabla `profiles` tenga los campos correctos:

```sql
-- Verificar/crear tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    rol TEXT DEFAULT 'user' CHECK (rol IN ('admin', 'user', 'pending', 'blocked')),
    activo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para admins (pueden ver todos los perfiles)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );
```

### 2. 📝 Tabla de Solicitudes de Acceso (access_requests)

Esta tabla reemplazará el almacenamiento local:

```sql
-- Crear tabla para solicitudes de acceso
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Anyone can create access requests" ON public.access_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own requests" ON public.access_requests
    FOR SELECT USING (email = auth.email());

-- Política para admins
CREATE POLICY "Admins can view all requests" ON public.access_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admins can update requests" ON public.access_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );
```

### 3. 🔐 Función para Crear Perfil Automáticamente

```sql
-- Función que se ejecuta cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'pending'; -- Por defecto pending
    is_active BOOLEAN := false;
BEGIN
    -- Verificar si el email está en la lista de admins
    IF NEW.email IN ('info@luzmatel.com', 'admin@luzmatel.com') THEN
        user_role := 'admin';
        is_active := true;
    -- Verificar si el email está en la lista de usuarios autorizados
    ELSIF NEW.email IN ('usuario1@empresa.com', 'usuario2@empresa.com') THEN
        user_role := 'user';
        is_active := true;
    END IF;

    -- Crear perfil
    INSERT INTO public.profiles (id, email, nombre, rol, activo)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
        user_role,
        is_active
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que ejecuta la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. 📊 Funciones de Utilidad

```sql
-- Función para aprobar solicitud de acceso
CREATE OR REPLACE FUNCTION public.approve_access_request(request_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verificar que el usuario actual es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND rol = 'admin'
    ) THEN
        RAISE EXCEPTION 'Solo los administradores pueden aprobar solicitudes';
    END IF;

    -- Actualizar solicitud
    UPDATE public.access_requests 
    SET 
        status = 'approved',
        processed_at = NOW(),
        processed_by = auth.uid()
    WHERE id = request_id;

    -- Crear o actualizar perfil del usuario
    INSERT INTO public.profiles (id, email, nombre, rol, activo)
    SELECT 
        gen_random_uuid(), -- Temporal, se actualizará cuando el usuario se registre
        email,
        name,
        'user',
        true
    FROM public.access_requests 
    WHERE id = request_id
    ON CONFLICT (email) DO UPDATE SET
        rol = 'user',
        activo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para rechazar solicitud
CREATE OR REPLACE FUNCTION public.reject_access_request(
    request_id UUID, 
    rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Verificar que el usuario actual es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND rol = 'admin'
    ) THEN
        RAISE EXCEPTION 'Solo los administradores pueden rechazar solicitudes';
    END IF;

    -- Actualizar solicitud
    UPDATE public.access_requests 
    SET 
        status = 'rejected',
        rejection_reason = reject_access_request.rejection_reason,
        processed_at = NOW(),
        processed_by = auth.uid()
    WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. 🔍 Vistas para Estadísticas

```sql
-- Vista para estadísticas de solicitudes
CREATE VIEW public.access_requests_stats AS
SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
    COUNT(DISTINCT email) as unique_requesters
FROM public.access_requests;

-- Política para la vista
CREATE POLICY "Admins can view stats" ON public.access_requests_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );
```

## 🚀 Pasos para Implementar

### 1. Ejecutar en SQL Editor de Supabase
1. Ve a tu proyecto en Supabase Dashboard
2. Dirígete a **SQL Editor**
3. Ejecuta cada script SQL en orden

### 2. Configurar Authentication
En **Authentication > Settings**:
- Habilitar **Email confirmations** si quieres verificación por email
- Configurar **Site URL** con tu dominio
- Configurar **Redirect URLs** para callbacks

### 3. Actualizar Variables de Entorno
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 4. Personalizar Lista de Usuarios Autorizados
Edita la función `handle_new_user()` para incluir los emails de tu organización.

## 📝 Configuraciones Adicionales Recomendadas

### Email Templates (Opcional)
En **Authentication > Email Templates**:
- Personalizar mensajes de confirmación
- Configurar templates para password recovery

### Webhooks (Opcional)
En **Database > Webhooks**:
- Configurar notificaciones cuando se crean solicitudes
- Enviar emails automáticos de aprobación/rechazo

### Rate Limiting
En **Authentication > Rate Limits**:
- Configurar límites para signup/signin
- Prevenir spam de solicitudes

¿Quieres que te ayude a ejecutar alguno de estos scripts o necesitas ayuda con alguna configuración específica?