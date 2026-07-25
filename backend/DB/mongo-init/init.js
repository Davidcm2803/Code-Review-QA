// AI SECURE QA — MongoDB Init Script


db = db.getSiblingDB("ai_secure_qa");

db.createUser({
  user: "aisecure_user",
  pwd:  "aisecure1234",
  roles: [{ role: "readWrite", db: "ai_secure_qa" }]
});

db.createCollection("rag_usage");
db.rag_usage.createIndex({ user_id: 1, date: 1 }, { unique: true });

// users 
// email unico para evitar duplicados en registro manual 
db.createCollection("users");
db.users.createIndex({ email: 1 },     { unique: true });
db.users.createIndex({ github_id: 1 }, { unique: true, sparse: true }); 

// repositories 
db.createCollection("repositories");
db.repositories.createIndex({ user_id: 1 });
db.repositories.createIndex({ user_id: 1, name: 1 }); 

// scans 
db.createCollection("scans");
db.scans.createIndex({ repository_id: 1 });
db.scans.createIndex({ user_id: 1 });
db.scans.createIndex({ status: 1 });
db.scans.createIndex({ repository_id: 1, created_at: -1 }); // último scan por repo

// scan_events 
db.createCollection("scan_events");
db.scan_events.createIndex({ scan_id: 1, created_at: 1 });

// vulnerabilities 
db.createCollection("vulnerabilities");
db.vulnerabilities.createIndex({ scan_id: 1 });
db.vulnerabilities.createIndex({ repository_id: 1 });
db.vulnerabilities.createIndex({ scan_id: 1, severity: 1 });
db.vulnerabilities.createIndex({ status: 1 }); 

// chat_sessions
db.createCollection("chat_sessions");
db.chat_sessions.createIndex({ user_id: 1 });
db.chat_sessions.createIndex({ user_id: 1, status: 1 });
db.chat_sessions.createIndex({ repository_id: 1 }, { sparse: true });
db.chat_sessions.createIndex({ scan_id: 1 },       { sparse: true });

// chat_messages 
db.createCollection("chat_messages");
db.chat_messages.createIndex({ session_id: 1, created_at: 1 });

// code_embeddings 
// Indice por repository_id para traer todos los chunks de un repo
// Indice con file path para buscar un chunk específico por archivo y posicion
// Hay que configurar el sistema vectorial para Atlas Vector Search desde la UI de Atlas o via Atlas CLI  no aplica en Docker local
// En local la busqueda de similitud se hace en Python con coseno.
db.createCollection("code_embeddings");
db.code_embeddings.createIndex({ repository_id: 1 });
db.code_embeddings.createIndex({ repository_id: 1, file_path: 1, chunk_index: 1 });


// Datos hardcodeaos

const userId      = new ObjectId();
const adminId     = new ObjectId();
const repoId      = new ObjectId();
const repo2Id     = new ObjectId();
const scanId      = new ObjectId();
const scan2Id     = new ObjectId();
const sessionId   = new ObjectId();

// users 
// Un admin y un usuario normal, password es bcrypt de "test1234"
db.users.insertMany([
  {
    _id:           userId,
    email:         "dev@aisecureqa.com",
    password_hash: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    name:          "Dev User",
    role:          "user",
    created_at:    new Date(),
    updated_at:    new Date()
  },
  {
    _id:           adminId,
    email:         "admin@aisecureqa.com",
    password_hash: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
    name:          "Admin",
    role:          "admin",
    created_at:    new Date(),
    updated_at:    new Date()
  }
]);

// repositories
// Un repo de GitHub y uno de upload local
db.repositories.insertMany([
  {
    _id:             repoId,
    user_id:         userId,
    name:            "vulnerable-api",
    source_type:     "github",
    github_url:      "https://github.com/devuser/vulnerable-api",
    github_metadata: {
      owner:     "devuser",
      branch:    "main",
      clone_url: "https://github.com/devuser/vulnerable-api.git"
    },
    last_scan_id:    scanId,
    created_at:      new Date(),
    updated_at:      new Date()
  },
  {
    _id:             repo2Id,
    user_id:         userId,
    name:            "ecommerce-backend",
    source_type:     "local_upload",
    github_url:      null,
    github_metadata: null,
    last_scan_id:    scan2Id,
    created_at:      new Date(),
    updated_at:      new Date()
  }
]);

// scans 
// Un scan completado con reporte y uno en estado failed
db.scans.insertMany([
  {
    _id:                 scanId,
    repository_id:       repoId,
    user_id:             userId,
    status:              "completed",
    security_score:      42,
    metrics:             { critical: 2, high: 3, medium: 5, low: 8 },
    ai_analysis:         "El repositorio presenta vulnerabilidades críticas de SQL Injection en el módulo de autenticación y exposición de secrets en variables de entorno. Se recomienda priorizar el fix de auth.py antes del próximo deploy.",
    executive_summary:   "Se detectaron 18 vulnerabilidades de seguridad en el repositorio vulnerable-api. 2 son críticas y requieren atención inmediata. El score de seguridad es 42/100.",
    report_generated_at: new Date(),
    started_at:          new Date(Date.now() - 1000 * 60 * 5),
    completed_at:        new Date(),
    created_at:          new Date()
  },
  {
    _id:                 scan2Id,
    repository_id:       repo2Id,
    user_id:             userId,
    status:              "failed",
    security_score:      null,
    metrics:             null,
    ai_analysis:         null,
    executive_summary:   null,
    report_generated_at: null,
    started_at:          new Date(Date.now() - 1000 * 60 * 10),
    completed_at:        null,
    created_at:          new Date()
  }
]);

// scan_events
// Progreso completo del scan exitoso para ver el flujo en Compass
db.scan_events.insertMany([
  {
    _id:        new ObjectId(),
    scan_id:    scanId,
    type:       "started",
    message:    "Iniciando análisis de vulnerable-api...",
    created_at: new Date(Date.now() - 1000 * 60 * 5)
  },
  {
    _id:        new ObjectId(),
    scan_id:    scanId,
    type:       "progress",
    message:    "Analizando auth.py...",
    created_at: new Date(Date.now() - 1000 * 60 * 4)
  },
  {
    _id:        new ObjectId(),
    scan_id:    scanId,
    type:       "progress",
    message:    "Analizando database.py...",
    created_at: new Date(Date.now() - 1000 * 60 * 3)
  },
  {
    _id:        new ObjectId(),
    scan_id:    scanId,
    type:       "progress",
    message:    "Analizando routes/users.js...",
    created_at: new Date(Date.now() - 1000 * 60 * 2)
  },
  {
    _id:        new ObjectId(),
    scan_id:    scanId,
    type:       "completed",
    message:    "Scan completado — 18 vulnerabilidades encontradas",
    created_at: new Date()
  }
]);

// vulnerabilities 
// Mix de severidades y detectores para ver el breakdown en el dashboard
db.vulnerabilities.insertMany([
  {
    _id:                        new ObjectId(),
    scan_id:                    scanId,
    repository_id:              repoId,
    title:                      "SQL Injection en login",
    description:                "La query de autenticación concatena directamente el input del usuario sin sanitizar.",
    severity:                   "critical",
    detector_source:            "semgrep",
    file_path:                  "app/auth.py",
    line_start:                 34,
    line_end:                   34,
    vulnerable_code:            "query = f\"SELECT * FROM users WHERE email='{email}' AND password='{password}'\"",
    remediation_recommendation: "Usar prepared statements o un ORM. Nunca concatenar inputs del usuario en queries SQL.",
    status:                     "open",
    created_at:                 new Date()
  },
  {
    _id:                        new ObjectId(),
    scan_id:                    scanId,
    repository_id:              repoId,
    title:                      "API Key expuesta en código",
    description:                "Una clave de API de terceros está hardcodeada directamente en el código fuente.",
    severity:                   "critical",
    detector_source:            "trufflehog",
    file_path:                  "services/payment.py",
    line_start:                 12,
    line_end:                   12,
    vulnerable_code:            "STRIPE_KEY = \"sk_live_REDACTED_FOR_DEMO_ONLY\"",
    remediation_recommendation: "Mover a variables de entorno. Rotar la key inmediatamente en el dashboard de Stripe.",
    status:                     "open",
    created_at:                 new Date()
  },
  {
    _id:                        new ObjectId(),
    scan_id:                    scanId,
    repository_id:              repoId,
    title:                      "XSS reflejado en búsqueda",
    description:                "El parámetro de búsqueda se renderiza sin escapar en la respuesta HTML.",
    severity:                   "high",
    detector_source:            "semgrep",
    file_path:                  "routes/search.js",
    line_start:                 28,
    line_end:                   28,
    vulnerable_code:            "res.send(`<h1>Resultados para: ${req.query.q}</h1>`)",
    remediation_recommendation: "Escapar el output con DOMPurify o usar un template engine con auto-escaping.",
    status:                     "acknowledged",
    created_at:                 new Date()
  },
  {
    _id:                        new ObjectId(),
    scan_id:                    scanId,
    repository_id:              repoId,
    title:                      "Uso de eval() con input externo",
    description:                "Se usa eval() con datos provenientes del usuario, permitiendo ejecución arbitraria de código.",
    severity:                   "high",
    detector_source:            "bandit",
    file_path:                  "utils/parser.py",
    line_start:                 67,
    line_end:                   67,
    vulnerable_code:            "result = eval(user_input)",
    remediation_recommendation: "Reemplazar eval() con ast.literal_eval() para datos simples o rediseñar la lógica.",
    status:                     "open",
    created_at:                 new Date()
  },
  {
    _id:                        new ObjectId(),
    scan_id:                    scanId,
    repository_id:              repoId,
    title:                      "Contraseñas en texto plano en logs",
    description:                "El sistema loguea credenciales del usuario en texto plano.",
    severity:                   "high",
    detector_source:            "semgrep",
    file_path:                  "app/auth.py",
    line_start:                 89,
    line_end:                   89,
    vulnerable_code:            "logger.info(f\"Login attempt: {username} / {password}\")",
    remediation_recommendation: "Nunca loguear credenciales. Loguear solo el username y el resultado del intento.",
    status:                     "resolved",
    created_at:                 new Date()
  },
  {
    _id:                        new ObjectId(),
    scan_id:                    scanId,
    repository_id:              repoId,
    title:                      "CORS configurado con wildcard",
    description:                "La configuración de CORS permite requests desde cualquier origen.",
    severity:                   "medium",
    detector_source:            "semgrep",
    file_path:                  "app/main.py",
    line_start:                 15,
    line_end:                   15,
    vulnerable_code:            "app.add_middleware(CORSMiddleware, allow_origins=[\"*\"])",
    remediation_recommendation: "Restringir allow_origins a los dominios específicos del frontend en producción.",
    status:                     "open",
    created_at:                 new Date()
  }
]);

// chat_sessions
// Una sesión vinculada al scan completado
db.chat_sessions.insertOne({
  _id:           sessionId,
  user_id:       userId,
  repository_id: repoId,
  scan_id:       scanId,
  title:         "Análisis de vulnerable-api",
  status:        "active",
  context_mode:  "scan",
  created_at:    new Date(),
  updated_at:    new Date()
});

// chat_messages
// Conversación de ejemplo sobre las vulnerabilidades del scan
db.chat_messages.insertMany([
  {
    _id:             new ObjectId(),
    session_id:      sessionId,
    role:            "user",
    content:         "¿Cuáles son las vulnerabilidades más críticas de este scan?",
    tokens_used:     null,
    rag_chunks_used: null,
    created_at:      new Date(Date.now() - 1000 * 60 * 2)
  },
  {
    _id:             new ObjectId(),
    session_id:      sessionId,
    role:            "assistant",
    content:         "El scan detectó 2 vulnerabilidades críticas: una inyección SQL en app/auth.py línea 34 donde se concatena directamente el input del usuario en la query, y una API key de Stripe hardcodeada en services/payment.py línea 12. Ambas requieren atención inmediata antes del próximo deploy.",
    tokens_used:     87,
    rag_chunks_used: [],
    created_at:      new Date(Date.now() - 1000 * 60 * 1)
  },
  {
    _id:             new ObjectId(),
    session_id:      sessionId,
    role:            "user",
    content:         "¿Cómo arreglo el SQL injection?",
    tokens_used:     null,
    rag_chunks_used: null,
    created_at:      new Date()
  },
  {
    _id:             new ObjectId(),
    session_id:      sessionId,
    role:            "assistant",
    content:         "En app/auth.py línea 34 reemplaza la query concatenada por un prepared statement. Si usas SQLAlchemy: `db.execute(text('SELECT * FROM users WHERE email=:email AND password=:pwd'), {'email': email, 'pwd': password})`. Si usas psycopg2: `cursor.execute('SELECT * FROM users WHERE email=%s AND password=%s', (email, password))`. Nunca concatenes inputs del usuario directamente en una query.",
    tokens_used:     124,
    rag_chunks_used: [],
    created_at:      new Date()
  }
]);

// code_embeddings 
// Dos chunks de ejemplo, el embedding es un vector pequeño de prueba
// En producción estos vectores hay que revisar el tamaño 
db.code_embeddings.insertMany([
  {
    _id:           new ObjectId(),
    repository_id: repoId,
    file_path:     "app/auth.py",
    chunk_index:   0,
    chunk_text:    "def login(email: str, password: str):\n    query = f\"SELECT * FROM users WHERE email='{email}' AND password='{password}'\"\n    result = db.execute(query)\n    return result.fetchone()",
    embedding:     [0.12, 0.45, 0.78, 0.23, 0.56],
    model_used:    "all-MiniLM-L6-v2",
    created_at:    new Date()
  },
  {
    _id:           new ObjectId(),
    repository_id: repoId,
    file_path:     "services/payment.py",
    chunk_index:   0,
    chunk_text:    "STRIPE_KEY = \"sk_live_REDACTED_FOR_DEMO_ONLY\"\n\ndef charge_card(amount, token):\n    stripe.api_key = STRIPE_KEY\n    return stripe.Charge.create(amount=amount, source=token)",
    embedding:     [0.34, 0.67, 0.12, 0.89, 0.45],
    model_used:    "all-MiniLM-L6-v2",
    created_at:    new Date()
  }
]);

print("AI Secure QA — DB inicializada correctamente");
print("   DB:       ai_secure_qa");
print("   Usuario:  aisecure_user");
print("   Colecciones creadas: users, repositories, scans, scan_events,");
print("                        vulnerabilities, chat_sessions, chat_messages,");
print("                        code_embeddings");
print("   Seed data insertada: 2 users, 2 repos, 2 scans, 5 events,");
print("                        6 vulnerabilities, 1 session, 4 messages, 2 embeddings");