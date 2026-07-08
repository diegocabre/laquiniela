# ⚽ La Quiniela App — Plataforma Premium de Apuestas Deportivas por Fases

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Hosted-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

**La Quiniela App** es una plataforma web premium de pronósticos y apuestas deportivas al estilo "Prode/Pool/Polla", diseñada bajo un enfoque modular por fases. El proyecto destaca por una interfaz oscura inmersiva, actualizaciones automáticas de puntajes mediante triggers de base de datos relacional y flujos de seguridad anti-trampas tanto en el frontend como en el backend.

---

## 🚀 Características Clave

### 👤 Experiencia del Usuario (UX/UI Premium)
* **Diseño Inmersivo**: Interfaz fluida con estética oscura premium (*Dark Mode*), efectos de *glassmorphism*, gradientes vibrantes y adaptabilidad móvil total.
* **Autenticación Omnicanal**: Registro e inicio de sesión seguros mediante correo/contraseña y **Google OAuth** (priorizando la captura automática de nombres completos y avatars verificados).
* **Pozos del Momento**: El Hero de la Landing Page calcula y despliega dinámicamente los pozos acumulados reales de todas las fases abiertas según los participantes aprobados.
* **Predicciones con Auto-Bloqueo**: Formulario interactivo para registrar pronósticos de marcadores exactos. Cuenta con bloqueo automático de edición 1 minuto antes del inicio de cada partido.
* **Tablas de Posiciones Interactivas**: Clasificación en tiempo real de cada torneo por fase, destacando al ganador con una tarjeta dorada conmemorativa.

### 🛡️ Seguridad y Robustez de Datos
* **Row Level Security (RLS)**: Políticas estrictas en PostgreSQL que impiden que los usuarios alteren o lean pronósticos de otros participantes antes de tiempo.
* **Esquema Relacional Cascading**: Limpieza automática de datos mediante claves foráneas en cascada (`ON DELETE CASCADE`) entre competiciones, fases, partidos y pronósticos.
* **Cálculo Automatizado de Puntos**: Motor de base de datos programado en PL/pgSQL. Al finalizar un partido, un trigger calcula de forma segura (`SECURITY DEFINER`) los aciertos de todos los usuarios:
  * **+1 Punto**: Acierto simple (ganador o empate).
  * **+4 Puntos**: Marcador exacto.

### ⚙️ Panel de Administración Avanzado
* **Gestión de Torneos**: Creación, edición y eliminación de competiciones y fases.
* **Fase Destacada Exclusiva**: Botón para destacar el ganador de una fase en el Hero principal. Un trigger en la base de datos asegura que solo exista una fase destacada activa a la vez.
* **Visualización Segura de Pronósticos**: Dashboard para que el administrador audite y verifique los pronósticos de los participantes de un partido **únicamente después de que el juego haya comenzado**, evitando cualquier tipo de filtración.
* **Notificaciones Instantáneas**: Alertas asíncronas vía **Telegram Bot API** y **Resend Email API** enviadas al celular del administrador cada vez que un nuevo participante registra una inscripción de pago.

---

## 🛠️ Stack Tecnológico

* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
* **Backend**: Next.js Route Handlers (Serverless API).
* **Base de Datos**: Supabase / PostgreSQL (Triggers, Store Procedures, RLS, DB Migrations).
* **Comunicaciones**: Resend API (Emails), Telegram Bot API (Mensajería Push).
* **Despliegue & Hosting**: Vercel (Frontend/API) y Supabase Cloud (Base de Datos).

---

## 📁 Arquitectura del Proyecto

```bash
├── app/                        # Next.js App Router (Páginas y API Routes)
│   ├── (auth)/                 # Rutas de Autenticación (Login, Registro)
│   ├── (dashboard)/            # Dashboard del Jugador, Tabla de Posiciones y Admin
│   ├── api/                    # Endpoints Serverless (Admin, Inscripciones, Notificaciones)
│   └── page.tsx                # Landing Page Dinámica con Pozos en Vivo
├── components/                 # Componentes React Reutilizables (UI y Tablas)
├── lib/                        # Clientes de Servicios (Supabase, Utils, Formateadores)
├── supabase/                   # Archivos de Base de Datos
│   └── migrations/             # Migraciones SQL controladas por versión (RLS, Triggers, Functions)
├── types/                      # Declaración de Interfaces TypeScript del Dominio
└── README.md                   # Documentación del Proyecto
```

---

## ⚙️ Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key # Requerida para operaciones administrativas seguras

# Resend Email Configuration
RESEND_API_KEY=re_tu_api_key
RESEND_FROM_EMAIL=La Quiniela <soporte@tudominio.cl> # Opcional (por defecto usa onboarding@resend.dev)

# Telegram Bot Integration
TELEGRAM_BOT_TOKEN=tu_token_de_bot_telegram
TELEGRAM_CHAT_ID=tu_chat_id_personal

# App Environment
NEXT_PUBLIC_APP_URL=https://laquiniela.vercel.app
```

---

## 🛠️ Instrucciones de Instalación y Uso

1. **Clonar el Repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/quiniela.git
   cd quiniela
   ```

2. **Instalar Dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar el Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```

4. **Compilar para Producción**:
   ```bash
   npm run build
   ```

---

## ⚡ Estructura Clave de la Base de Datos (PostgreSQL Triggers)

### Trigger de Cálculo de Puntos Automático (`SECURITY DEFINER`)
Cuando el administrador registra el marcador final de un partido, este trigger se ejecuta a nivel de base de datos para comparar el pronóstico de cada usuario con el resultado real del partido:

```sql
CREATE OR REPLACE FUNCTION public.calculate_prediction_points()
RETURNS TRIGGER AS $$
DECLARE
    v_points INTEGER;
BEGIN
    -- Evaluar marcador exacto (+4 puntos)
    IF NEW.home_score = home_prediction AND NEW.away_score = away_prediction THEN
        v_points := 4;
    -- Evaluar acierto simple de ganador/empate (+1 punto)
    ELSIF (NEW.home_score > NEW.away_score AND home_prediction > away_prediction) OR
          (NEW.home_score < NEW.away_score AND home_prediction < away_prediction) OR
          (NEW.home_score = NEW.away_score AND home_prediction = away_prediction) THEN
        v_points := 1;
    ELSE
        v_points := 0;
    END IF;

    -- Actualizar tabla de pronósticos y acumular en la tabla de inscripciones
    ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 👨‍💻 Autor

Desarrollado y mantenido con estándares modernos de ingeniería de software. Si estás interesado en mi trabajo o quieres conocer más sobre esta arquitectura, no dudes en contactarme.
