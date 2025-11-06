# Seguridad: Cabeceras HTTP recomendadas

Para proteger tu aplicación en producción, configura las siguientes cabeceras HTTP en tu servidor web (Nginx, Apache, Vercel, Netlify, etc.). Estas cabeceras ayudan a prevenir ataques comunes y mejoran la privacidad de los usuarios.

## Ejemplo de configuración para Nginx

```
add_header Content-Security-Policy "default-src 'self'" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

## Ejemplo de configuración para Apache

```
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "default-src 'self'"
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>
```

## Notas

- Si usas Vercel, Netlify o similar, consulta su documentación para añadir cabeceras personalizadas.
- Ajusta la política de Content-Security-Policy según los recursos externos que uses (APIs, fuentes, etc.).
- Estas cabeceras deben aplicarse solo en producción.
