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
├── LICENSE
├── README.md
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── DB/
│   │   ├── db-schema.dbml
│   │   ├── docker-compose.yml
│   │   └── mongo-init/
│   │       └── init.js
│   └── app/
│       ├── app.py
│       ├── config.py
│       ├── ai/
│       │   ├── agents/
│       │   ├── prompts/
│       │   └── rag/
│       ├── api/
│       ├── core/
│       │   ├── config.py
│       │   ├── deps.py
│       │   ├── logger.py
│       │   └── security.py
│       ├── database/
│       │   ├── connection.py
│       │   ├── models/
│       │   └── repositories/
│       ├── routes/
│       │   ├── auth.py
│       │   ├── chatbot.py
│       │   ├── github.py
│       │   ├── report.py
│       │   └── scan.py
│       ├── scanners/
│       │   ├── auth_scanner.py
│       │   ├── dependency_scanner.py
│       │   ├── normalizer.py
│       │   ├── owasp_scanner.py
│       │   ├── scan_orchestrator.py
│       │   ├── secrets_detector.py
│       │   ├── sql_detector.py
│       │   ├── xss_detector.py
│       │   └── engines/
│       │       └── bandit_engine.py
│       ├── schemas/
│       │   └── auth.py
│       └── services/
│           ├── auth_service.py
│           ├── github_service.py
│           ├── llm_service.py
│           ├── report_service.py
│           ├── repo_fetcher_service.py
│           └── scanner_service.py
└── frontend/
    ├── .env
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── README.md
    ├── public/
    │   ├── favicon.svg
    │   ├── icons.svg
    │   └── Shield.png
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── assets/
        │   ├── hero.png
        │   ├── react.svg
        │   └── vite.svg
        ├── components/
        │   ├── dashboard/
        │   │   ├── ActivityList.jsx
        │   │   ├── SeverityBreakdown.jsx
        │   │   └── StatCard.jsx
        │   ├── layout/
        │   │   ├── AuthButtons.jsx
        │   │   ├── AuthModal.jsx
        │   │   ├── Card.jsx
        │   │   ├── LogoIcon.jsx
        │   │   └── PageHeader.jsx
        │   ├── reports/
        │   │   ├── ReportCard.jsx
        │   │   ├── ReportList.jsx
        │   │   └── SeverityBadge.jsx
        │   ├── scan/
        │   │   ├── RecentRepos.jsx
        │   │   └── RepoInput.jsx
        │   ├── settings/
        │   │   ├── SettingRow.jsx
        │   │   ├── SettingsSection.jsx
        │   │   └── Toggle.jsx
        │   ├── sidebar/
        │   │   ├── Sidebar.jsx
        │   │   ├── sidebar.styles.js
        │   │   ├── SidebarDesktop.jsx
        │   │   ├── SidebarMobile.jsx
        │   │   └── SidebarNav.jsx
        │   ├── ui/
        │   │   ├── Badge.jsx
        │   │   ├── Button.jsx
        │   │   ├── Dropdown.jsx
        │   │   ├── Input.jsx
        │   │   └── ProgressBar.jsx
        │   └── upload/
        │       ├── Dropzone.jsx
        │       └── FileQueue.jsx
        ├── config/
        │   └── Api.js
        ├── context/
        │   └── AuthContext.jsx
        ├── lib/
        │   ├── date.js
        │   ├── firebase.js
        │   └── utils.js
        └── pages/
            ├── Dashboard.jsx
            ├── Reports.jsx
            ├── ScanRepository.jsx
            ├── Settings.jsx
            └── UploadCode.jsx
```
