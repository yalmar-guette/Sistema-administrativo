# Instrucciones de Instalación

## ⚠️ IMPORTANTE: Usar Command Prompt (cmd.exe)

Windows está bloqueando la ejecución de npm en PowerShell. **Debes usar Command Prompt en su lugar**.

### Pasos para ejecutar:

1. **Abre Command Prompt** (cmd.exe):
   - Presiona `Win + R`
   - Escribe `cmd` y presiona Enter

2. **Instala dependencias del BACKEND**:
   ```cmd
   cd c:\Users\PB\Desktop\inventario-api\server
   npm install
   ```

3. **Instala dependencias del FRONTEND** (ya hecho, pero si necesitas):
   ```cmd
   cd c:\Users\PB\Desktop\inventario-api\client
   npm install
   ```

4. **Inicia el BACKEND** (en una ventana de cmd):
   ```cmd
   cd c:\Users\PB\Desktop\inventario-api\server
   npm run dev
   ```
   Deberías ver:
   ```
   ✓ Super user created: superuser / admin123
   ✓ Basic accounts created
   ✓ Database initialized
   ✓ Server running on http://localhost:3000
   ```

5. **Inicia el FRONTEND** (en OTRA ventana de cmd):
   ```cmd
   cd c:\Users\PB\Desktop\inventario-api\client
   npm run dev
   ```
   Deberías ver:
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

6. **Abre tu navegador** en: http://localhost:5173

## ✅ Cambios Realizados

He cambiado de `better-sqlite3` a `sqlite3` para evitar el problema de compilación.

Todos los archivos han sido actualizados:
- ✅ `server/package.json` - Actualizado a sqlite3
- ✅ `server/src/db.js` - Reescrito con API asíncrona
- ✅ `server/src/routes/authRoutes.js` - Actualizado
- ✅ `server/src/routes/inventoryRoutes.js` - Actualizado
- ✅ `server/src/routes/accountingRoutes.js` - Actualizado
- ✅ `server/src/routes/usersRoutes.js` - Actualizado

## 🔐 Credenciales de Acceso

- **Usuario**: `superuser`
- **Contraseña**: `admin123`
