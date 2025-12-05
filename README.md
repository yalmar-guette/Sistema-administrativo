# Sistema de Inventario y Contabilidad

Sistema completo de gestión de inventario, ventas, contabilidad y cierre de caja con soporte multi-organización.

## 🚀 Características

- **Multi-Organización**: Gestiona múltiples organizaciones con sus propios inventarios
- **Inventario**: Gestión de productos con unidades por caja
- **Ventas**: Registro de ventas con múltiples métodos de pago
- **Cierre de Caja**: Sistema de conteo físico y cálculo de diferencias
- **Contabilidad**: Libro diario con páginas y reportes
- **Reportes**: Visualización de datos y estadísticas
- **Multi-Inventario**: Cada organización puede tener múltiples inventarios

## 👥 Sistema de Usuarios y Roles

### Roles Globales
- **Superusuario**: Acceso total al sistema, puede crear organizaciones

### Roles por Organización
- **Owner (Dueño)**: Administrador de la organización
- **Admin (Administrador)**: Gestión completa del inventario y ventas
- **Employee (Empleado)**: Acceso a ventas y cierre de caja

## 📋 Configuración Inicial (Para Superusuario)

### 1. Crear Organizaciones
1. Ir a **Organizaciones** en el menú
2. Click en "Nueva Organización"
3. Ingresar nombre de la organización
4. Guardar

### 2. Crear Inventarios
1. Seleccionar la organización
2. Click en "Nuevo Inventario"
3. Ingresar nombre del inventario (ej: "Estadio", "Eventos")
4. Guardar

### 3. Asignar Usuarios a Organizaciones

**IMPORTANTE**: Los usuarios existentes no están asignados a ninguna organización automáticamente.

#### Método 1: API (Para desarrollo/migración)
```bash
# Ejemplo: Asignar usuario ID 2 a organización ID 1 como owner
curl -X POST http://localhost:3000/api/organizations/1/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "role": "owner"}'
```

#### Método 2: Directamente en la base de datos
```sql
-- Asignar usuario a organización
INSERT INTO user_organizations (user_id, organization_id, role) 
VALUES (2, 1, 'owner');

-- Ver usuarios sin organizaciones
SELECT u.id, u.username, u.email 
FROM users u
LEFT JOIN user_organizations uo ON u.id = uo.user_id
WHERE uo.id IS NULL AND u.is_superuser = FALSE;
```

#### Método 3: Recrear usuarios
Si los usuarios no tienen muchos datos asociados, es más simple:
1. Ir a **Usuarios**
2. Eliminar usuarios antiguos
3. Crear nuevos usuarios (se asignarán a la organización actual automáticamente)

## 🔄 Flujo de Trabajo

### Para Empleados
1. **Login** → Verán su organización e inventario asignado
2. **Dashboard** → Vista general del inventario
3. **Ventas** → Registrar ventas del día
4. **Cierre** → Realizar conteo físico al final del día

### Para Admins/Owners
- Todo lo de empleados +
- **Inventario** → Agregar/editar/eliminar productos
- **Reportes** → Ver estadísticas y reportes
- **Configuración** → Ajustar tasa de cambio

### Para Superusuario
- Todo lo anterior +
- **Organizaciones** → Crear/editar/eliminar organizaciones
- Acceso a todas las organizaciones e inventarios

## 📊 Cierre de Caja

1. Al final del día, ir a **Cierre**
2. Cada producto muestra:
   - Stock Sistema (lo que debería haber)
   - Conteo Físico (campos para ingresar cajas/unidades)
   - Diferencia (cálculo automático de ventas)
3. Muestra precio USD y Bs de cada producto
4. Calcula totales de ventas en ambas monedas
5. Click en "Guardar Cierre" actualiza el inventario

## ⚙️ Variables de Entorno

### Backend (.env)
```
DB_HOST=your-tidb-host
DB_PORT=4000
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=inventario
JWT_SECRET=your-secret-key
PORT=3000
```

### Frontend
```
VITE_API_URL=http://localhost:3000/api (desarrollo)
```

## 🔐 Seguridad

- Autenticación JWT
- Tokens expiran en 24 horas
- Contraseñas hasheadas con bcrypt
- Roles y permisos por organización
- Validación en frontend y backend

## 📦 Despliegue

El sistema está desplegado en:
- **Backend**: [Render](https://sistema-administrativo-backend.onrender.com)
- **Frontend**: [Render](https://sistema-administrativo-frontend.onrender.com)

### Credenciales por defecto
- Usuario: `superuser`
- Contraseña: `admin123`

**⚠️ IMPORTANTE: Cambiar la contraseña después del primer login**

## 🛠️ Tecnologías

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de Datos**: TiDB Cloud (MySQL compatible)
- **Autenticación**: JWT
- **Despliegue**: Render

## 📝 Notas de Migración

Si tienes usuarios y datos existentes del sistema antiguo:

1. Los productos necesitarán ser asignados a un inventario manualmente
2. Los usuarios necesitan ser asignados a organizaciones (ver sección "Asignar Usuarios")
3. Las ventas y cierres de caja se asociarán al inventario actual cuando se creen nuevos registros

## 🆘 Soporte

Para problemas o preguntas:
1. Verificar que el usuario esté asignado a una organización
2. Verificar que la organización tenga al menos un inventario
3. Verificar que el inventario esté seleccionado en el header
