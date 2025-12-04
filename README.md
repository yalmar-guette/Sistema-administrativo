# 📦 Sistema de Inventario y Contabilidad

Sistema completo de gestión de inventario, ventas y contabilidad con soporte multi-moneda (Bs/$) diseñado para Venezuela.

## ✨ Características

- 🏪 **Gestión de Inventario**: Control completo de productos
- 💰 **Sistema de Ventas**: Múltiples métodos de pago (Pago Móvil, POS, Efectivo, Zelle, Binance)
- 📊 **Contabilidad**: Registro de ingresos y gastos
- 📈 **Reportes Diarios**: Exportables en Excel/PDF
- 💱 **Multi-moneda**: Soporte para Bs y $ con tasa configurable
- 👥 **Roles de Usuario**: Superuser, Owner, Admin, Empleado
- 🌙 **Dark Mode**: Tema claro y oscuro
- 📱 **Responsive**: Funciona en desktop, tablet y móvil

## 🚀 Tecnologías

### Backend
- Node.js + Express
- SQLite
- JWT Authentication
- Bcrypt

### Frontend
- React + Vite
- Tailwind CSS
- Lucide Icons
- Axios

## 📥 Instalación

### Requisitos Previos
- Node.js 16+
- npm

### Backend

```bash
cd server
npm install
npm run dev
```

El servidor correrá en `http://localhost:3000`

### Frontend

```bash
cd client
npm install
npm run dev
```

El cliente correrá en `http://localhost:5173`

## 🔐 Credenciales por Defecto

- **Usuario**: `superuser`
- **Contraseña**: `admin123`

## 🌐 Acceso en Red Local

Para acceder desde otras computadoras en la misma red WiFi:

1. Obtén tu IP local:
   ```cmd
   ipconfig
   ```

2. Accede desde otro dispositivo:
   ```
   http://TU_IP:5173
   ```

## 📝 Variables de Entorno

Crea un archivo `.env` en la carpeta `server/`:

```env
JWT_SECRET=tu_secreto_super_seguro_aqui
PORT=3000
```

## 🎯 Métodos de Pago Soportados

- 📱 Pago Móvil (Bs)
- 💳 Punto de Venta / POS (Bs)
- 💵 Efectivo Bs
- 💵 Efectivo $
- 💸 Zelle ($)
- ₿ Binance ($)

## 👥 Roles y Permisos

| Rol | Dashboard | Inventario | Ventas | Contabilidad | Reportes | Configuración | Usuarios |
|-----|-----------|------------|--------|--------------|----------|---------------|----------|
| **Empleado** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Superuser** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 📄 Licencia

MIT

## 👨‍💻 Autor

Desarrollado con ❤️ para gestión empresarial
