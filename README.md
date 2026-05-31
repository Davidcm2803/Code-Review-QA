# AI Secure QA

## Descripción del Proyecto

AI Secure QA es una plataforma web enfocada en el aseguramiento de calidad y la seguridad de aplicaciones desarrolladas con apoyo de Inteligencia Artificial.

La plataforma permitirá a los usuarios cargar código fuente localmente o analizar repositorios alojados en GitHub con el objetivo de identificar vulnerabilidades, malas prácticas de programación y posibles riesgos de seguridad antes de que el software sea desplegado en producción.

Uno de los componentes principales será un chatbot inteligente, integrado con modelos de lenguaje de gran escala (LLM), que permitirá interactuar directamente con el código analizado. Los usuarios podrán realizar preguntas sobre la estructura del proyecto, vulnerabilidades detectadas, posibles soluciones y recomendaciones de mejora, obteniendo respuestas contextualizadas basadas en el análisis realizado.

Además del análisis asistido por IA, la plataforma incorporará un conjunto de escáneres y pruebas locales automatizadas, permitiendo detectar problemas de seguridad sin depender exclusivamente de modelos de inteligencia artificial. Esto garantizará resultados más consistentes, reproducibles y verificables mediante reglas y validaciones predefinidas.

---

## Estructura del Proyecto

```
ai-secure-qa/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── chat/
│   │   │   ├── reports/
│   │   │   ├── github/
│   │   │   └── dashboard/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ScanRepository.jsx
│   │   │   ├── UploadCode.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── ChatAssistant.jsx
│   │   │   └── Settings.jsx
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── github.js
│   │   │   ├── scan.js
│   │   │   └── chat.js
│   │   ├── routes/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── auth.py
│   │   │       ├── scan.py
│   │   │       ├── github.py
│   │   │       ├── report.py
│   │   │       └── chatbot.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   ├── models/
│   │   │   └── repositories/
│   │   │
│   │   ├── services/
│   │   │   ├── github_service.py
│   │   │   ├── scanner_service.py
│   │   │   ├── report_service.py
│   │   │   └── llm_service.py
│   │   │
│   │   ├── scanners/
│   │   │   ├── xss_detector.py
│   │   │   ├── sql_detector.py
│   │   │   ├── secrets_detector.py
│   │   │   ├── dependency_scanner.py
│   │   │   ├── auth_scanner.py
│   │   │   └── owasp_scanner.py
│   │   │
│   │   ├── ai/
│   │   │   ├── prompts/
│   │   │   ├── rag/
│   │   │   └── agents/
│   │   │
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── main.py
│   │
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── mongo/
│   │   │   └── init.js
│   │   └── volumes/
│   │
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
│
├── .gitignore
├── README.md
└── LICENSE
```
