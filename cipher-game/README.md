# CIPHER — Sistema de Recuperación de Datos

Juego serio educativo del Semillero ThinkIOT · Institución Universitaria Colegio Mayor del Cauca

## Qué es

CIPHER enseña plano cartesiano, desplazamientos y álgebra básica a través de dos
juegos conectados:

- **Coordinados** — sigilo top-down: el jugador escribe coordenadas o
  desplazamientos para mover a su agente sin ser detectado por drones.
- **SIGMA Matrix** — apuestas con preguntas de matemáticas, donde el
  conocimiento reduce el riesgo y el multiplicador premia la certeza.

El flujo alterna un nivel de cada juego, con dificultad creciente:

```
Coordinados N1 → SIGMA Matrix R1 → Coordinados N2 → SIGMA Matrix R2 →
Coordinados N3 → SIGMA Matrix R3 → Victoria final
```

## Stack

- **Frontend:** HTML, CSS, JS puro (sin frameworks)
- **Backend:** Node.js + Express, con capa de controladores separada de las rutas
- **Base de datos:** Supabase (PostgreSQL)
- **Despliegue:** Vercel (gratuito)

## Cómo desplegar paso a paso

### 1. Supabase
1. Crear cuenta en supabase.com
2. Crear proyecto nuevo
3. Ir a **SQL Editor** → pegar y ejecutar `supabase/schema.sql`
4. Ir a **Project Settings → API** → copiar `Project URL` y `service_role key`
5. Los dos admins iniciales (`admin@cipher.edu.co`, `thinkiot@cipher.edu.co`)
   quedan con contraseña de relleno — genera un hash real en
   bcrypt-generator.com y actualízalo con `UPDATE usuarios SET password_hash = '...' WHERE correo = '...'`
   antes de poder entrar al panel de admin.

### 2. Variables de entorno
Dentro de `backend/` crear el archivo `.env` (nunca lo subas a git, ya está en `.gitignore`):
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=cualquier_texto_largo_y_secreto
PORT=3000
```

### 3. Correr en local
```bash
cd backend
npm install
npm start        # backend en localhost:3000
```
En otra terminal, sirve `frontend/` con Live Server (o cualquier servidor
estático) y entra por la raíz del proyecto — `index.html` redirige
automáticamente a `frontend/pages/login.html` sin importar qué carpeta
abriste en el servidor.

### 4. Vercel (producción)
1. Crear cuenta en vercel.com
2. Importar este repositorio desde GitHub
3. En **Settings → Environment Variables** agregar las mismas 3 variables del `.env`
4. Deploy → el juego queda en `tu-proyecto.vercel.app`

## Estructura del proyecto

```
cipher-game/
├── .gitignore
├── vercel.json          ← configuración de despliegue
├── index.html           ← redirección automática a frontend/pages/login.html
├── supabase/
│   └── schema.sql       ← ejecutar una sola vez en Supabase
├── backend/
│   ├── server.js        ← entrada del API
│   ├── supabase.js      ← cliente de base de datos
│   ├── middleware/
│   │   └── auth.js      ← verificación de JWT y de rol admin
│   ├── controllers/      ← toda la lógica de negocio vive aquí
│   │   ├── authController.js
│   │   ├── pretestController.js
│   │   ├── partidasController.js
│   │   ├── ruletaController.js
│   │   └── adminController.js
│   └── routes/            ← solo define endpoints, delega en controllers/
│       ├── auth.js
│       ├── pretest.js
│       ├── partidas.js
│       ├── ruleta.js
│       └── admin.js
└── frontend/
    ├── index.html        ← hub principal (requiere login)
    ├── css/
    │   ├── global.css
    │   ├── pretest.css
    │   └── admin.css
    ├── js/
    │   ├── api.js               ← cliente HTTP (detecta local vs. producción)
    │   ├── auth.js              ← manejo de sesión (rutas siempre correctas)
    │   └── preguntas-pretest.js ← banco de 16 preguntas diagnósticas
    ├── pages/
    │   ├── login.html
    │   ├── registro.html
    │   ├── pretest.html
    │   └── admin.html
    ├── coordinados/       ← Nivel de sigilo (3 niveles, dificultad creciente)
    │   ├── css/estilos.css
    │   ├── js/
    │   │   ├── config.js
    │   │   ├── habitaciones.js   ← definición de los 3 niveles
    │   │   ├── entidades.js
    │   │   ├── audio.js
    │   │   ├── sprites.js
    │   │   ├── juego.js
    │   │   └── ui.js
    │   └── sprites/
    └── ruleta/            ← SIGMA Matrix (3 rondas, un tema nuevo por ronda)
        ├── css/
        └── js/
            ├── estado.js         ← configuración de rondas y multiplicadores
            ├── casillas.js
            ├── problemas.js      ← preguntas por ronda
            ├── ruleta.js
            ├── sonidos.js
            ├── ui.js
            └── main.js
```

## Convenciones de código

- **Backend:** las rutas (`routes/`) nunca contienen lógica de negocio — solo
  declaran endpoints y delegan en su controlador correspondiente
  (`controllers/`). Esto facilita testear la lógica sin levantar el servidor
  HTTP y mantiene cada archivo enfocado en una sola responsabilidad.
- **Frontend Coordinados:** scripts tradicionales (sin módulos ES) para
  simplicidad; todo vive en el scope global del documento.
- **Frontend SIGMA Matrix:** módulos ES (`import`/`export`) para mantener el
  estado y la lógica de juego encapsulados.
- **sessionStorage** es el mecanismo de traspaso de progreso entre
  Coordinados y SIGMA Matrix (`cipher_nivel`, `cipher_fichas_totales`,
  `cipher_partida_id`, `monedasRobadas`) — se limpia por completo al ganar o
  perder, garantizando el comportamiento roguelike (perder reinicia desde
  el nivel 1).
