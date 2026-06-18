# AI Secure QA

## Descripción del Proyecto

AI Secure QA es una plataforma web enfocada en el aseguramiento de calidad y la seguridad de aplicaciones desarrolladas con apoyo de Inteligencia Artificial.

La plataforma permitirá a los usuarios cargar código fuente localmente o analizar repositorios alojados en GitHub con el objetivo de identificar vulnerabilidades, malas prácticas de programación y posibles riesgos de seguridad antes de que el software sea desplegado en producción.

Uno de los componentes principales será un chatbot inteligente, integrado con modelos de lenguaje de gran escala (LLM), que permitirá interactuar directamente con el código analizado. Los usuarios podrán realizar preguntas sobre la estructura del proyecto, vulnerabilidades detectadas, posibles soluciones y recomendaciones de mejora, obteniendo respuestas contextualizadas basadas en el análisis realizado.

Además del análisis asistido por IA, la plataforma incorporará un conjunto de escáneres y pruebas locales automatizadas, permitiendo detectar problemas de seguridad sin depender exclusivamente de modelos de inteligencia artificial. Esto garantizará resultados más consistentes, reproducibles y verificables mediante reglas y validaciones predefinidas.

---

## Estructura del Proyecto

```
QA-Code/
├── backend
│   ├── app
│   │   ├── ai
│   │   │   ├── agents
│   │   │   │   └── recommendation_agent.py      # Agente que genera recomendaciones de remediación
│   │   │   ├── prompts
│   │   │   │   └── recommendation_prompt.py      # Prompt para generar recomendaciones
│   │   │   └── rag
│   │   │       ├── embedder.py                   # Genera embeddings de código
│   │   │       └── retriever.py                  # Busca chunks similares (RAG)
│   │   ├── api
│   │   ├── core
│   │   │   ├── config.py                         # Configuración general de la app
│   │   │   ├── deps.py                            # Dependencias (auth, DB, etc.)
│   │   │   ├── logger.py                          # Configuración de logs
│   │   │   ├── security.py                        # JWT (crear/decodificar tokens)
│   │   │   └── supported_languages.py             # Lenguajes soportados y su engine
│   │   ├── database
│   │   │   ├── models                             # Modelos de datos
│   │   │   ├── repositories                       # Acceso a datos (queries Mongo)
│   │   │   └── connection.py                       # Conexión a MongoDB
│   │   ├── routes
│   │   │   ├── auth.py                            # Rutas de autenticación
│   │   │   ├── chatbot.py                         # Rutas del chat con IA
│   │   │   ├── github.py                          # Rutas de integración con GitHub
│   │   │   ├── report.py                          # Rutas de reportes
│   │   │   └── scan.py                            # Rutas de escaneo
│   │   ├── scanners
│   │   │   ├── engines
│   │   │   │   ├── semgrep_engine.py              # Wrapper de Semgrep
│   │   │   │   ├── bandit_engine.py               # Wrapper de Bandit (Python)
│   │   │   │   ├── trivy_engine.py                # Wrapper de Trivy (deps/secrets)
│   │   │   │   ├── spotbugs_engine.py             # Wrapper de SpotBugs (Java)
│   │   │   │   └── security_scan_engine.py        # Wrapper de Security Code Scan (C#)
│   │   │   ├── language_detector.py               # Detecta lenguajes del repo
│   │   │   ├── scan_orchestrator.py                # Decide y ejecuta los engines
│   │   │   └── normalizer.py                       # Unifica resultados al schema vulnerabilities
│   │   ├── schemas
│   │   │   └── auth.py                            # Schemas Pydantic de auth
│   │   ├── services
│   │   │   ├── auth_service.py                    # Lógica de registro/login/oauth
│   │   │   ├── github_service.py                  # Llamadas a la API de GitHub
│   │   │   ├── repo_fetcher_service.py             # Clona/descomprime repo a escanear
│   │   │   ├── embedding_service.py                # Orquesta vectorización post-scan
│   │   │   ├── llm_service.py                      # Llamadas al modelo de IA
│   │   │   ├── report_service.py                   # Generación de reportes
│   │   │   └── scanner_service.py                  # Orquesta el flujo completo del scan
│   │   ├── utils
│   │   │   └── tempdir.py                          # Manejo y limpieza de carpetas temporales
│   │   ├── app.py                                  # Entry point de FastAPI
│   │   └── config.py                               # Configuración/env vars
│   ├── DB
│   │   ├── mongo-init
│   │   │   └── init.js                             # Script de inicialización de MongoDB
│   │   ├── db-schema.dbml                          # Esquema de la base de datos
│   │   └── docker-compose.yml                      # Levanta MongoDB local
│   ├── tests                                       # Pruebas del backend
│   ├── .env                                        # Variables de entorno (no se sube a git)
│   ├── Dockerfile                                  # Imagen del backend (runtimes + engines)
│   └── requirements.txt                            # Dependencias Python
├── frontend
│   ├── public
│   │   ├── favicon.svg                             # Ícono del sitio
│   │   ├── icons.svg                               # Sprite de íconos
│   │   └── Shield.png                              # Logo/imagen de marca
│   ├── src
│   │   ├── assets
│   │   │   ├── hero.png                            # Imagen de portada
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── components
│   │   │   ├── dashboard
│   │   │   │   ├── ActivityList.jsx                # Lista de actividad reciente
│   │   │   │   ├── SeverityBreakdown.jsx           # Gráfico de severidades
│   │   │   │   └── StatCard.jsx                    # Tarjeta de estadística
│   │   │   ├── layout
│   │   │   │   ├── AuthButtons.jsx                 # Botones de login/registro
│   │   │   │   ├── AuthModal.jsx                   # Modal de autenticación
│   │   │   │   ├── Card.jsx                        # Contenedor tipo card
│   │   │   │   ├── LogoIcon.jsx                    # Logo de la app
│   │   │   │   ├── PageHeader.jsx                  # Encabezado de página
│   │   │   │   └── Sidebar.jsx                     # Barra lateral de navegación
│   │   │   ├── scan
│   │   │   │   ├── RecentRepos.jsx                 # Lista de repos recientes
│   │   │   │   └── RepoInput.jsx                   # Input para agregar repo a escanear
│   │   │   └── ui
│   │   │       ├── Badge.jsx                       # Etiqueta visual
│   │   │       ├── Button.jsx                      # Botón reutilizable
│   │   │       ├── Dropdown.jsx                    # Menú desplegable
│   │   │       ├── Input.jsx                       # Input reutilizable
│   │   │       └── ProgressBar.jsx                 # Barra de progreso
│   │   ├── config
│   │   │   ├── Api.js                              # Cliente HTTP genérico
│   │   │   └── Authservice.js                      # Servicio de autenticación
│   │   ├── context
│   │   │   └── AuthContext.jsx                     # Contexto global de sesión
│   │   ├── lib
│   │   │   ├── firebase.js                         # Configuración de Firebase Auth
│   │   │   └── utils.js                            # Funciones utilitarias
│   │   ├── pages
│   │   │   ├── Dashboard.jsx                       # Página principal/resumen
│   │   │   └── ScanRepository.jsx                  # Página de escaneo de repositorios
│   │   ├── App.jsx                                 # Componente raíz
│   │   ├── index.css                               # Estilos globales
│   │   └── main.jsx                                # Entry point de React
│   ├── .env                                        # Variables de entorno del frontend
│   ├── .gitignore
│   ├── eslint.config.js                            # Configuración de linting
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── vite.config.js                              # Configuración de Vite
├── .gitignore
├── LICENSE
└── README.md
```
