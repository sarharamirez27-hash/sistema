const app = document.querySelector("#app");
const setupKey = new URLSearchParams(window.location.search).get("setup") ?? "";
const modalRoot = document.createElement("div");
modalRoot.id = "modal-root";
app.after(modalRoot);

const colorOptions = [
  ["violeta", "Violeta"], ["menta", "Menta"], ["coral", "Coral"], ["azul", "Azul"],
  ["ambar", "Ámbar"], ["rosa", "Rosa"], ["lila", "Lila"], ["turquesa", "Turquesa"],
];
const themes = [
  ["original", "Original"], ["oscuro", "Oscuro"], ["claro", "Claro"], ["lavanda", "Lavanda"],
  ["oceano", "Oceánico"], ["naturaleza", "Naturaleza"], ["atardecer", "Atardecer"],
  ["pastel", "Pastel"], ["monocromatico", "Monocromático"], ["aurora", "Aurora"],
  ["nebulosa", "Nebulosa"], ["sol-acido", "Sol ácido"], ["calmo", "Calmo"],
];
const themeColors = {
  original: ["#00e5a8", "#a58aff", "#ff63b2"],
  oscuro: ["#9c83ff", "#5de3c1", "#ff78b9"],
  claro: ["#087c68", "#7051c9", "#c53779"],
  lavanda: ["#d3a9ff", "#83e3d4", "#ff83c8"],
  oceano: ["#58e3dd", "#75b9ff", "#ff8fbe"],
  naturaleza: ["#a8e68a", "#82d8c0", "#f5ca75"],
  atardecer: ["#ffb06e", "#e893dc", "#ff76a7"],
  pastel: ["#b7f0dc", "#c6b3ff", "#ffb9d1"],
  monocromatico: ["#b8e3dc", "#a5c5e0", "#c4bfd9"],
  aurora: ["#80f3a5", "#48ded7", "#438ef5"],
  nebulosa: ["#6787ff", "#ac77ff", "#ff77bd"],
  "sol-acido": ["#f3ed50", "#ffae42", "#ff705e"],
  calmo: ["#89a99a", "#9aa9bd", "#c1a8a0"],
};
const themePreviewBases = {
  original: ["#0b1c29", "#102437", "#f3fbff"],
  oscuro: ["#0a0c12", "#171a24", "#f7f5ff"],
  claro: ["#f4f2fb", "#ffffff", "#211d31"],
  lavanda: ["#160f25", "#251b36", "#f7efff"],
  oceano: ["#061822", "#0c2b3a", "#eafaff"],
  naturaleza: ["#0c1912", "#192f20", "#f1f8ed"],
  atardecer: ["#21121c", "#351e2b", "#fff2eb"],
  pastel: ["#191827", "#2b2940", "#faf4ff"],
  monocromatico: ["#10171b", "#202e34", "#f0f7f8"],
  aurora: ["#071b1c", "#123333", "#effff7"],
  nebulosa: ["#15102a", "#292044", "#fbf3ff"],
  "sol-acido": ["#211b0d", "#39301a", "#fff8de"],
  calmo: ["#f1f4ef", "#ffffff", "#25322c"],
};
const codeLanguages = [
  ["javascript", "JavaScript"], ["typescript", "TypeScript"], ["python", "Python"],
  ["html", "HTML"], ["css", "CSS"], ["sql", "SQL"], ["java", "Java"],
  ["csharp", "C#"], ["php", "PHP"], ["bash", "Bash"], ["json", "JSON"], ["text", "Texto"],
];
const fontSizes = ["pequeno", "normal", "grande", "muyGrande", "extraGrande", "maximo"];
const defaults = {
  theme: "original",
  calm: false,
  contrast: false,
  vision: "ninguno",
  fontSize: "normal",
  underline: false,
  spacing: false,
  legibility: true,
  highlight: false,
};
const state = {
  user: null,
  data: null,
  view: "dashboard",
  selectedNotebookId: null,
  noteSearch: "",
  notebookSearch: "",
  globalSearch: "",
  searchSuggestionsOpen: false,
  codeSearch: "",
  errorSearch: "",
  errorFilter: "all",
  studyTopic: "Todos",
  studyCardId: null,
  studyCardRevealed: false,
  studyRandom: false,
  activeQuizId: null,
  quizReview: null,
  codeUndo: [],
  codeRedo: [],
  codePreviousValue: "",
  preferences: { ...defaults },
  lastFocused: null,
  startupError: "",
  loginNotice: "",
  setupRequired: false,
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function highlightText(value, query) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return escapeHtml(value);
  const pattern = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return String(value).split(pattern).map((part) => terms.some((term) => term.toLocaleLowerCase() === part.toLocaleLowerCase())
    ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)).join("");
}

function highlightCode(value, language) {
  const keywords = {
    javascript: "async await break case catch class const continue debugger default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while yield",
    typescript: "any as async await boolean break case catch class const continue debugger default delete do else enum export extends false finally for from function if implements import in interface instanceof let namespace new null number of private protected public readonly return static string super switch this throw true try type typeof undefined var void while yield",
    python: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield",
    java: "abstract boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while",
    csharp: "abstract as async await bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw try typeof uint ulong unchecked unsafe ushort using virtual void volatile while",
    php: "abstract and array as break callable case catch class const continue declare default do else elseif empty endfor endforeach endif endswitch endwhile eval exit extends final finally for foreach function global if implements include instanceof interface namespace new or private protected public require return static switch throw trait try use var while xor",
    sql: "add all alter and as asc begin between by case cast check column commit constraint create cross current_date current_time database default delete desc distinct drop else end exists false fetch from full grant group having in index inner insert into is join key left like limit not null offset on or order outer primary procedure references right rollback select set table then true union unique update use values view when where with",
    bash: "case do done elif else esac fi for function if in select then time until while",
    html: "a article aside body button code div footer form h1 h2 h3 head header html input label li link main meta nav ol option p script section select small span strong style table tbody td textarea th thead title tr ul",
    css: "align-items background background-color border border-radius box-shadow color display flex font-family font-size gap grid height justify-content margin max-width min-height overflow padding position transform width",
    json: "false null true",
  };
  const languageKeywords = new Set((keywords[language] ?? "").split(" "));
  const tokens = String(value).match(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|\s+|./g) ?? [];
  return tokens.map((token, index) => {
    let tokenClass = "";
    if (token.startsWith("<!--") || token.startsWith("/*") || token.startsWith("//")
        || (token.startsWith("#") && ["python", "bash", "php"].includes(language))) tokenClass = "token-comment";
    else if (/^(["'`])/.test(token)) tokenClass = "token-string";
    else if (/^\d/.test(token)) tokenClass = "token-number";
    else if (languageKeywords.has(token)) tokenClass = "token-keyword";
    else if (/^[A-Za-z_$][\w$]*$/.test(token) && tokens.slice(index + 1).find((next) => next.trim()) === "(") tokenClass = "token-function";
    return tokenClass ? `<span class="${tokenClass}">${escapeHtml(token)}</span>` : escapeHtml(token);
  }).join("");
}

function globalSearchResults(query) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const results = [];
  const add = (kind, items, fields, titleField, excerptField) => {
    for (const item of items) {
      const text = fields(item).join(" ").toLocaleLowerCase();
      if (terms.every((term) => text.includes(term))) {
        results.push({
          kind,
          id: item.id,
          title: String(titleField(item) || "Sin título"),
          excerpt: String(excerptField(item) || "").replace(/\s+/g, " ").slice(0, 180),
        });
      }
    }
  };
  add("note", state.data.notes, (note) => [
    note.title, note.bodyMd, ...note.tags,
    state.data.notebooks.find((notebook) => notebook.id === note.notebookId)?.name ?? "",
  ], (note) => note.title, (note) => note.bodyMd);
  add("code", state.data.codeSnippets, (item) => [
    item.title, item.description, item.code, item.explanation, item.comments,
    item.category, item.topic, ...item.tags,
  ], (item) => item.title, (item) => item.description || item.code);
  add("error", state.data.errors, (item) => [
    item.title, item.description, item.code, item.message, item.solution,
    item.fixedCode, item.category, item.topic, ...item.tags,
  ], (item) => item.title, (item) => item.message || item.solution || item.description);
  add("flashcard", state.data.flashcards, (item) => [item.front, item.back, item.topic],
    (item) => item.front, (item) => item.back);
  add("quiz", state.data.quizzes, (item) => [
    item.title, item.topic, ...item.questions.map((question) => `${question.prompt} ${question.explanation} ${question.options.join(" ")}`),
  ], (item) => item.title, (item) => `${item.topic} · ${item.questions.length} preguntas`);
  return results;
}

function searchKindLabel(kind) {
  return ({ note: "Apunte", code: "Código", error: "Error", flashcard: "Tarjeta", quiz: "Cuestionario" })[kind] ?? "Contenido";
}

function searchKindPlural(kind) {
  return ({ note: "Apuntes", code: "Códigos", error: "Errores y soluciones", flashcard: "Tarjetas", quiz: "Cuestionarios" })[kind] ?? "Contenido";
}

function safeMarkdown(value) {
  const lines = escapeHtml(value).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let listType = "";
  let listItems = [];
  const inline = (text) => text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
  const flushParagraph = () => {
    if (paragraph.length) blocks.push(`<p>${paragraph.map(inline).join("<br>")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (listItems.length) blocks.push(`<${listType}>${listItems.map((item) => `<li>${inline(item)}</li>`).join("")}</${listType}>`);
    listType = "";
    listItems = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^[ \t]*```/.test(line)) {
      flushParagraph();
      flushList();
      const codeLines = [];
      while (index + 1 < lines.length && !/^[ \t]*```/.test(lines[index + 1])) {
        index += 1;
        codeLines.push(lines[index]);
      }
      if (index + 1 < lines.length) index += 1;
      blocks.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const unorderedItem = line.match(/^[ \t]*[-*+][ \t]+(.+)$/);
    const orderedItem = line.match(/^[ \t]*\d+\.[ \t]+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (line.startsWith("&gt; ")) {
      flushParagraph();
      flushList();
      blocks.push(`<blockquote>${inline(line.slice(5))}</blockquote>`);
    } else if (unorderedItem || orderedItem) {
      flushParagraph();
      const nextType = orderedItem ? "ol" : "ul";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((orderedItem ?? unorderedItem)[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks.join("");
}

function notePreview(markdown) {
  const content = String(markdown).trim();
  if (!content) return `<p class="note-preview-empty">Este apunte todavía no tiene contenido.</p>`;
  const lines = content.split(/\r?\n/);
  let preview = "";
  for (const line of lines) {
    const next = preview ? `${preview}\n${line}` : line;
    if (next.length > 480) break;
    preview = next;
  }
  if (!preview && lines[0]) preview = lines[0].slice(0, 480);
  const truncated = preview.length < content.length;
  return `${safeMarkdown(preview)}${truncated ? '<span class="note-preview-more" aria-hidden="true">…</span>' : ""}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(value));
}

function readPreferences(username) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`kora:preferences:${username}`) ?? "{}");
    return { ...defaults, ...parsed };
  } catch (error) {
    console.error("No se pudieron leer las preferencias guardadas.", error);
    return { ...defaults };
  }
}

function applyPreferences() {
  const prefs = state.preferences;
  document.documentElement.dataset.theme = themes.some(([value]) => value === prefs.theme) ? prefs.theme : "original";
  const fontScales = { pequeno: "0.9", normal: "1", grande: "1.15", muyGrande: "1.3", extraGrande: "1.5", maximo: "1.7" };
  app.dataset.calm = String(Boolean(prefs.calm));
  app.dataset.contrast = String(Boolean(prefs.contrast));
  app.dataset.vision = ["protanopia", "deuteranopia", "tritanopia", "grayscale"].includes(prefs.vision) ? prefs.vision : "ninguno";
  app.dataset.spacing = String(Boolean(prefs.spacing));
  app.dataset.underline = String(Boolean(prefs.underline));
  app.dataset.legibility = String(Boolean(prefs.legibility));
  app.dataset.highlight = String(Boolean(prefs.highlight));
  document.documentElement.style.setProperty("--font-scale", fontScales[prefs.fontSize] ?? "1");
}

function persistPreferences() {
  try {
    localStorage.setItem(`kora:preferences:${state.user.username}`, JSON.stringify(state.preferences));
    applyPreferences();
  } catch (error) {
    console.error("No se pudieron guardar las preferencias de accesibilidad.", error);
    notify("No se pudieron guardar las preferencias en este navegador.", "error");
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(path === "/api/setup" && setupKey ? { "X-Kora-Setup-Key": setupKey } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `La solicitud falló (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function notify(message, kind = "info") {
  const region = document.querySelector("#toast-region");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.kind = kind;
  toast.setAttribute("role", kind === "error" ? "alert" : "status");
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 4800);
}

function activeNotebook() {
  return state.data?.notebooks.find((notebook) => notebook.id === state.selectedNotebookId) ?? null;
}

function noteCount(notebookId) {
  return state.data.notes.filter((note) => note.notebookId === notebookId).length;
}

function pageTitle() {
  if (state.view === "notebooks") return "Cuadernos";
  if (state.view === "progress") return "Tu progreso";
  if (state.view === "accessibility") return "Accesibilidad";
  if (state.view === "data") return "Mis datos";
  if (state.view === "search") return "Buscador general";
  if (state.view === "code") return "Código";
  if (state.view === "errors") return "Errores y soluciones";
  if (state.view === "study") return "Estudiar y repasar";
  if (state.view === "trash") return "Papelera";
  if (state.view === "quiz-player") return "Cuestionario";
  if (state.view === "notebook") return activeNotebook()?.name ?? "Cuaderno";
  return "Resumen";
}

function navButton(view, icon, label) {
  return `<button class="nav-button" data-view="${view}" aria-current="${state.view === view || (view === "notebooks" && state.view === "notebook") ? "page" : "false"}">
    <span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span>
  </button>`;
}

function renderLogin(errorMessage = state.startupError) {
  app.innerHTML = `<main class="login-shell">
    <div class="login-orb" aria-hidden="true"></div>
    <section class="login-card" aria-labelledby="login-title">
      <div class="login-brand">
        <span class="brand-mark" aria-hidden="true">K</span>
        <span><span class="brand-name">KORA</span><span class="brand-caption">Trippy Animations</span></span>
      </div>
      <p class="eyebrow">Tu espacio creativo</p>
      <h1 id="login-title">Qué bueno verte.</h1>
      <p>Ingresa a tus cuadernos, ideas y sesiones de estudio.</p>
      <form id="login-form" novalidate>
        <div class="field">
          <label for="login-username">Usuario</label>
          <input id="login-username" name="username" autocomplete="username" required maxlength="48" autofocus>
        </div>
        <div class="field">
          <label for="login-password">Contraseña</label>
          <div class="password-wrap">
            <input id="login-password" name="password" type="password" autocomplete="current-password" required>
            <button class="password-toggle" type="button" data-action="toggle-password" aria-label="Mostrar contraseña" aria-pressed="false">Mostrar</button>
          </div>
        </div>
        <p class="login-error" id="login-error" role="alert">${escapeHtml(errorMessage)}</p>
        <p class="login-notice" role="status">${escapeHtml(state.loginNotice)}</p>
        <button class="button" type="submit">Entrar a KORA <span aria-hidden="true">↗</span></button>
      </form>
      <p class="login-security">Acceso privado · Las credenciales se validan en el servidor.</p>
    </section>
  </main>`;
  app.querySelector("#login-username").focus();
}

function renderSetup(errorMessage = "") {
  app.innerHTML = `<main class="login-shell">
    <div class="login-orb" aria-hidden="true"></div>
    <section class="login-card setup-card" aria-labelledby="setup-title">
      <div class="login-brand">
        <span class="brand-mark" aria-hidden="true">K</span>
        <span><span class="brand-name">KORA</span><span class="brand-caption">Trippy Animations</span></span>
      </div>
      <p class="eyebrow">Primera ejecución</p>
      <h1 id="setup-title">Configura tu cuenta.</h1>
      <p>Define una contraseña privada para habilitar el acceso en este equipo. No se guarda en texto legible.</p>
      <form id="setup-form" novalidate>
        <section class="setup-account" aria-labelledby="setup-user-one"><h2 id="setup-user-one">Usuario: sarharf</h2>
          <div class="field"><label for="setup-password-one">Contraseña</label><input id="setup-password-one" name="passwordOne" type="password" autocomplete="new-password" minlength="8" maxlength="1024" required></div>
          <div class="field"><label for="setup-confirm-one">Repite la contraseña</label><input id="setup-confirm-one" name="confirmOne" type="password" autocomplete="new-password" required></div>
        </section>
        <p class="modal-error" id="setup-error" role="alert">${escapeHtml(errorMessage)}</p>
        <button class="button" type="submit">Guardar configuración</button>
      </form>
      <p class="login-security">Se guardan verificadores criptográficos locales; el servidor no conserva las contraseñas.</p>
    </section>
  </main>`;
  app.querySelector("#setup-password-one").focus();
}

function renderStats() {
  const notebooks = state.data.notebooks.length;
  const notes = state.data.notes.length;
  const mastered = state.data.notes.filter((note) => note.status === "dominado").length;
  const inReview = state.data.notes.filter((note) => note.status === "repaso").length;
  const cards = [
    ["Cuadernos", notebooks, notebooks ? "Espacios organizados para tus ideas" : "Crea tu primer espacio"],
    ["Apuntes", notes, notes ? "Ideas guardadas en tu biblioteca" : "Todo empieza con una nota"],
    ["En repaso", inReview, "Contenido que quieres reforzar"],
    ["Dominados", mastered, "Apuntes que ya tienes claros"],
  ];
  return `<div class="stats-grid">${cards.map(([label, value, note]) => `<article class="stat-card">
    <span class="stat-label">${label}</span><strong class="stat-value">${value}</strong><span class="stat-note">${note}</span>
  </article>`).join("")}</div>`;
}

function notebookCard(notebook) {
  const count = noteCount(notebook.id);
  return `<article class="notebook-card color-${notebook.color}">
    <div class="notebook-card-top">
      <button class="notebook-glyph" type="button" data-action="open-notebook" data-id="${escapeHtml(notebook.id)}" aria-label="Abrir cuaderno ${escapeHtml(notebook.name)}">✦</button>
      <div class="notebook-actions">
        <button class="icon-button" type="button" data-action="edit-notebook" data-id="${escapeHtml(notebook.id)}" aria-label="Editar ${escapeHtml(notebook.name)}">✎</button>
        <button class="icon-button" type="button" data-action="delete-notebook" data-id="${escapeHtml(notebook.id)}" aria-label="Eliminar ${escapeHtml(notebook.name)}">×</button>
      </div>
    </div>
    <button class="button-quiet" type="button" data-action="open-notebook" data-id="${escapeHtml(notebook.id)}" style="display:block;width:100%;padding:0;text-align:left">
      <h3 class="notebook-title">${escapeHtml(notebook.name)}</h3>
    </button>
    <span class="notebook-meta">${count} ${count === 1 ? "apunte" : "apuntes"} · Actualizado ${formatDate(notebook.updatedAt)}</span>
  </article>`;
}

function renderNotebookGrid(notebooks = state.data.notebooks) {
  if (!notebooks.length) {
    return `<div class="empty-state"><div><span class="empty-state-mark" aria-hidden="true">✦</span>
      <h3>Aún no hay cuadernos</h3><p>Crea un espacio para organizar tus apuntes, asignarle un color y empezar a construir tu biblioteca.</p>
      <button class="button" type="button" data-action="new-notebook">Crear mi primer cuaderno</button></div></div>`;
  }
  return `<div class="notebook-grid" id="notebook-grid">${notebooks.map(notebookCard).join("")}</div>`;
}

function noteCard(note, compact = false) {
  const notebook = state.data.notebooks.find((item) => item.id === note.notebookId);
  return `<article class="note-card ${notebook ? `color-${notebook.color}` : ""}">
    <div class="note-card-header">
      <div class="note-card-copy">
        <button class="note-title-button" type="button" data-action="edit-note" data-id="${escapeHtml(note.id)}"><h3 class="note-title">${escapeHtml(note.title)}</h3></button>
        <section class="note-preview" aria-label="Vista previa del apunte">
          <span class="note-preview-label">Vista previa</span>
          <div class="note-preview-content">${notePreview(note.bodyMd)}</div>
        </section>
      </div>
      ${compact ? "" : `<div class="toolbar"><button class="button button-secondary button-small" type="button" data-action="edit-note" data-id="${escapeHtml(note.id)}">Editar</button><button class="button button-secondary button-small" type="button" data-action="card-from-note" data-id="${escapeHtml(note.id)}">＋ Tarjeta</button><button class="button button-danger button-small" type="button" data-action="delete-note" data-id="${escapeHtml(note.id)}">Eliminar</button></div>`}
    </div>
    <div class="note-meta">
      ${notebook ? `<span class="pill color-${notebook.color}">${escapeHtml(notebook.name)}</span>` : ""}
      <span class="pill status-${note.status}"><span class="status-dot"></span>${note.status === "repaso" ? "En repaso" : note.status === "dominado" ? "Dominado" : "Nuevo"}</span>
      ${note.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}
      <span>Actualizado ${formatDate(note.updatedAt)}</span>
    </div>
  </article>`;
}

function renderDashboard() {
  const recent = [...state.data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
  return `<section class="hero-panel">
    <div class="hero-copy"><span class="eyebrow">Tu estudio, a tu manera</span>
      <h1>Hola, ${escapeHtml(state.user.username)}.</h1>
      <p>Un espacio para ordenar lo que aprendes y dejar que las ideas encuentren su propio ritmo.</p>
      <div class="toolbar" style="margin-top:20px"><button class="button" type="button" data-action="new-notebook">Crear cuaderno <span aria-hidden="true">＋</span></button><button class="button button-secondary" type="button" data-view="notebooks">Ver cuadernos</button></div>
    </div><div class="hero-spark" aria-hidden="true"></div>
  </section>
  ${renderStats()}
  <div class="section-row"><div><h2>Tus espacios</h2><p>Elige un cuaderno para continuar.</p></div><button class="button button-secondary button-small" type="button" data-view="notebooks">Ver todos</button></div>
  ${renderNotebookGrid(state.data.notebooks.slice(0, 3))}
  <div class="section-row"><div><h2>Apuntes recientes</h2><p>Lo último que has estado trabajando.</p></div></div>
  ${recent.length ? `<div class="note-list">${recent.map((note) => noteCard(note, true)).join("")}</div>` : `<div class="empty-state"><div><span class="empty-state-mark" aria-hidden="true">✎</span><h3>Tus ideas empiezan aquí</h3><p>Crea un cuaderno y guarda tu primer apunte.</p></div></div>`}`;
}

function renderNotebooks() {
  const filter = state.notebookSearch.trim().toLocaleLowerCase();
  const notebooks = state.data.notebooks.filter((notebook) => notebook.name.toLocaleLowerCase().includes(filter));
  const results = !state.data.notebooks.length
    ? renderNotebookGrid([])
    : notebooks.length
      ? `<div class="notebook-grid">${notebooks.map(notebookCard).join("")}</div>`
      : `<div class="empty-state"><div><h3>No hay coincidencias</h3><p>Prueba con otro nombre de cuaderno.</p></div></div>`;
  return `<div class="page-heading"><div><span class="eyebrow">Organiza tus ideas</span><h1>Cuadernos</h1><p>Crea espacios separados para cada materia, proyecto o curiosidad.</p></div><button class="button" type="button" data-action="new-notebook">＋ Nuevo cuaderno</button></div>
    <div class="toolbar" style="margin-bottom:18px"><label class="visually-hidden" for="notebook-search">Buscar cuadernos</label><input id="notebook-search" class="form-control" type="search" placeholder="Buscar cuaderno…" value="${escapeHtml(state.notebookSearch)}"></div>
    <div id="notebook-results">${results}</div>`;
}

function renderNotebookDetail() {
  const notebook = activeNotebook();
  if (!notebook) return renderNotebooks();
  const filter = state.noteSearch.trim().toLocaleLowerCase();
  const notes = state.data.notes.filter((note) => note.notebookId === notebook.id
    && `${note.title} ${note.bodyMd} ${note.tags.join(" ")}`.toLocaleLowerCase().includes(filter))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return `<div class="page-heading"><div><span class="eyebrow">Cuaderno</span><h1 class="color-${notebook.color}">${escapeHtml(notebook.name)}</h1><p>${notes.length} ${notes.length === 1 ? "apunte" : "apuntes"} en este espacio.</p></div>
      <div class="toolbar"><button class="button button-secondary" type="button" data-action="edit-notebook" data-id="${escapeHtml(notebook.id)}">Editar cuaderno</button><button class="button" type="button" data-action="new-note">＋ Nuevo apunte</button></div></div>
    <div class="toolbar" style="margin-bottom:18px"><label class="visually-hidden" for="note-search">Buscar apuntes en este cuaderno</label><input id="note-search" class="form-control" type="search" placeholder="Buscar en este cuaderno…" value="${escapeHtml(state.noteSearch)}"></div>
    <div id="note-results">${notes.length ? `<div class="note-list">${notes.map((note) => noteCard(note)).join("")}</div>` : `<div class="empty-state"><div><span class="empty-state-mark" aria-hidden="true">✎</span><h3>Este cuaderno está vacío</h3><p>Guarda la primera idea aquí. Los apuntes de otros cuadernos permanecerán separados.</p><button class="button" type="button" data-action="new-note">Crear primer apunte</button></div></div>`}</div>`;
}

function chartDonut() {
  const counts = [
    state.data.notes.filter((note) => note.status === "nuevo").length,
    state.data.notes.filter((note) => note.status === "repaso").length,
    state.data.notes.filter((note) => note.status === "dominado").length,
  ];
  const total = counts.reduce((sum, count) => sum + count, 0);
  let offset = 0;
  const classes = ["donut-new", "donut-review", "donut-mastered"];
  const segments = counts.map((count, index) => {
    const percentage = total ? (count / total) * 100 : 0;
    const segment = `<circle class="${classes[index]}" cx="21" cy="21" r="15.915" stroke-dasharray="${percentage} ${100 - percentage}" stroke-dashoffset="${-offset}"></circle>`;
    offset += percentage;
    return segment;
  }).join("");
  return `<div class="donut-layout"><svg class="donut" viewBox="0 0 42 42" role="img" aria-label="Distribución de estados de tus apuntes">
    <circle class="donut-track" cx="21" cy="21" r="15.915"></circle>${segments}<text class="donut-center" x="21" y="22">${total}</text>
  </svg><div class="legend">
    <div class="legend-item"><span class="legend-dot"></span><span><strong>${counts[0]}</strong>Nuevos</span></div>
    <div class="legend-item"><span class="legend-dot"></span><span><strong>${counts[1]}</strong>En repaso</span></div>
    <div class="legend-item"><span class="legend-dot"></span><span><strong>${counts[2]}</strong>Dominados</span></div>
  </div></div>`;
}

function renderProgress() {
  const maxNotes = Math.max(1, ...state.data.notebooks.map((notebook) => noteCount(notebook.id)));
  const bars = state.data.notebooks.length
    ? state.data.notebooks.map((notebook) => {
      const count = noteCount(notebook.id);
      const width = Math.round((count / maxNotes) * 100);
      return `<div class="bar-row"><span>${escapeHtml(notebook.name)}</span><div class="bar-track" aria-hidden="true"><div class="bar-fill color-${notebook.color}" style="width:${width}%"></div></div><strong class="bar-number">${count}</strong></div>`;
    }).join("")
    : `<p class="setting-footnote">Crea cuadernos y apuntes para comenzar a ver actividad.</p>`;
  return `<div class="page-heading"><div><span class="eyebrow">Lo que vas construyendo</span><h1>Tu progreso</h1><p>Indicadores calculados a partir de tus cuadernos y apuntes guardados.</p></div></div>
    <div class="chart-grid">
      <section class="chart-card"><h2>Estado de tus apuntes</h2><p>Distribución según tu estado de estudio.</p>${chartDonut()}</section>
      <section class="chart-card"><h2>Apuntes por cuaderno</h2><p>Compara de un vistazo el contenido de cada espacio.</p><div class="bar-chart">${bars}</div></section>
    </div>
    <div class="callout" style="margin-top:16px">Estos gráficos representan tus datos guardados. Al comenzar, es normal que los indicadores estén vacíos.</div>`;
}

function settingToggle(key, label, description = "") {
  return `<label class="setting-control"><span>${label}${description ? `<small class="setting-footnote">${description}</small>` : ""}</span><input type="checkbox" data-pref="${key}" ${state.preferences[key] ? "checked" : ""}></label>`;
}

function renderAccessibility() {
  const fontLabels = { pequeno: "Pequeño", normal: "Normal", grande: "Grande", muyGrande: "Muy grande", extraGrande: "Extra grande", maximo: "Máximo" };
  const themeCards = themes.map(([value, label]) => {
    const [accent, accentTwo, pink] = themeColors[value];
    const [page, surface, text] = themePreviewBases[value];
    return `<button class="theme-card" type="button" data-theme-select="${value}" aria-pressed="${state.preferences.theme === value}">
      <span class="theme-preview" style="--preview-accent:${accent};--preview-secondary:${accentTwo};--preview-pink:${pink};--preview-bg:${page};--preview-surface:${surface};--preview-text:${text}">
        <span class="theme-mini-sidebar"><i></i><i></i><i></i></span>
        <span class="theme-mini-main"><i class="theme-mini-top"></i><i class="theme-mini-panel"><b></b><b></b></i><i class="theme-mini-button"></i></span>
      </span>
      <span class="theme-card-footer"><span><strong>${label}</strong><small>${value === "calmo" ? "Suave y claro" : value === "aurora" ? "Verdes, turquesas y azules" : value === "nebulosa" ? "Azules, violetas y rosa" : value === "sol-acido" ? "Amarillos y tonos cálidos" : "Paleta para toda la interfaz"}</small></span><span class="theme-selected" aria-hidden="true">${state.preferences.theme === value ? "✓" : ""}</span></span>
    </button>`;
  }).join("");
  return `<div class="page-heading"><div><span class="eyebrow">Ajusta tu experiencia</span><h1>Accesibilidad</h1><p>Combina tema, lectura y movimiento. Tus preferencias se guardan en este navegador y perfil.</p></div></div>
    <div class="settings-grid">
      <section class="setting-card"><h2>Color y ambiente</h2><p>Paletas equilibradas que cambian fondos, superficies, texto, botones y gráficos.</p>
        <div class="theme-grid" aria-label="Temas visuales">${themeCards}</div>
        ${settingToggle("calm", "Modo calmo", "Reduce animaciones y transiciones sin cambiar la paleta.")}
        ${settingToggle("contrast", "Alto contraste", "Refuerza la diferencia entre texto, fondo y bordes.")}
        <label class="setting-control" for="pref-vision"><span>Filtro de color</span><select id="pref-vision" data-pref="vision">
          <option value="ninguno" ${state.preferences.vision === "ninguno" ? "selected" : ""}>Sin filtro</option>
          <option value="protanopia" ${state.preferences.vision === "protanopia" ? "selected" : ""}>Protanopia</option>
          <option value="deuteranopia" ${state.preferences.vision === "deuteranopia" ? "selected" : ""}>Deuteranopia</option>
          <option value="tritanopia" ${state.preferences.vision === "tritanopia" ? "selected" : ""}>Tritanopia</option>
          <option value="grayscale" ${state.preferences.vision === "grayscale" ? "selected" : ""}>Escala de grises</option>
        </select></label>
        <p class="setting-footnote">Los filtros de color son una ayuda visual; no sustituyen una evaluación clínica.</p>
      </section>
      <section class="setting-card"><h2>Lectura y enfoque</h2><p>Elige un tamaño cómodo y reduce obstáculos visuales.</p>
        <div class="setting-control font-setting"><span>Tamaño del texto<small class="setting-footnote">Nivel actual: ${fontLabels[state.preferences.fontSize] ?? "Normal"}</small></span>
          <div class="font-size-controls"><button class="button button-secondary button-small" type="button" data-action="font-smaller" aria-label="Disminuir tamaño del texto">A−</button><button class="button button-secondary button-small" type="button" data-action="font-larger" aria-label="Aumentar tamaño del texto">A+</button><button class="button button-quiet button-small" type="button" data-action="font-reset">Restablecer</button></div>
        </div>
        ${settingToggle("underline", "Subrayar enlaces")}
        ${settingToggle("spacing", "Aumentar espacio entre textos")}
        ${settingToggle("legibility", "Tipografía de alta legibilidad")}
        ${settingToggle("highlight", "Resaltar el foco del teclado")}
      </section>
    </div>`;
}

function searchResultButton(result, query, compact = false) {
  return `<button class="search-result" type="button" data-action="open-search-result" data-kind="${result.kind}" data-id="${escapeHtml(result.id)}">
    <span class="search-result-kind">${searchKindLabel(result.kind)}</span>
    <strong>${highlightText(result.title, query)}</strong>
    ${compact ? "" : `<small>${highlightText(result.excerpt, query)}</small>`}
  </button>`;
}

function renderSearchSuggestions(query) {
  if (!state.searchSuggestionsOpen) return "";
  const results = globalSearchResults(query).slice(0, 6);
  if (!query.trim()) return "";
  return `<div class="search-suggestions" role="listbox" aria-label="Sugerencias de búsqueda">
    ${results.length ? results.map((item) => searchResultButton(item, query, true)).join("") : `<p class="search-no-results">No hay sugerencias para «${escapeHtml(query.trim())}».</p>`}
    <button class="search-all-button" type="button" data-action="show-search-results">Ver todos los resultados</button>
  </div>`;
}

function renderSearchPage() {
  const query = state.globalSearch.trim();
  const results = globalSearchResults(query);
  if (!query) {
    return `<div class="page-heading"><div><span class="eyebrow">Todo KORA en un solo lugar</span><h1>Buscador general</h1><p>Busca títulos, contenido, fragmentos de código, soluciones, temas y etiquetas.</p></div></div>
      <div class="empty-state"><div><span class="empty-state-mark">⌕</span><h3>Escribe para empezar</h3><p>Usa el campo de búsqueda de la barra superior para encontrar contenido guardado.</p></div></div>`;
  }
  const kinds = ["note", "code", "error", "flashcard", "quiz"];
  const groups = kinds.map((kind) => {
    const items = results.filter((item) => item.kind === kind);
    if (!items.length) return "";
    return `<section class="search-group"><div class="section-row"><div><h2>${searchKindPlural(kind)}</h2><p>${items.length} resultado${items.length === 1 ? "" : "s"}</p></div></div>
      <div class="search-result-list">${items.map((item) => searchResultButton(item, query)).join("")}</div></section>`;
  }).join("");
  return `<div class="page-heading"><div><span class="eyebrow">Resultados de búsqueda</span><h1>${results.length} coincidencia${results.length === 1 ? "" : "s"}</h1><p>Resultados para «${highlightText(query, query)}» en el contenido guardado.</p></div></div>
    ${results.length ? groups : `<div class="empty-state"><div><span class="empty-state-mark">⌕</span><h3>No encontramos resultados</h3><p>Prueba con otros términos o revisa tus etiquetas y categorías.</p></div></div>`}`;
}

function renderData() {
  const notebookCount = state.data.notebooks.length;
  const noteTotal = state.data.notes.length;
  const codeTotal = state.data.codeSnippets.length;
  const errorTotal = state.data.errors.length;
  return `<div class="page-heading"><div><span class="eyebrow">Tus copias y privacidad</span><h1>Mis datos</h1><p>Exporta una copia JSON o restaura una copia anterior de tu cuenta.</p></div></div>
    <section class="panel" style="padding:22px">
      <div class="backup-row"><div><strong>Exportar copia</strong><span>Incluye cuadernos, apuntes, código, errores, papelera y material de estudio (${notebookCount} cuadernos, ${noteTotal} apuntes, ${codeTotal} códigos, ${errorTotal} errores).</span></div><button class="button" type="button" data-action="export-data">Descargar JSON</button></div>
      <div class="backup-row"><div><strong>Importar copia</strong><span>La importación reemplaza los datos actuales de esta cuenta, incluidos códigos, errores y estudio.</span></div><button class="button button-secondary" type="button" data-action="import-data">Elegir archivo</button></div>
      <input id="import-file" class="visually-hidden" type="file" accept="application/json,.json" aria-label="Seleccionar archivo JSON de copia">
      <div class="callout">Los datos se guardan en archivos JSON dentro de la carpeta de datos del servidor, separados por cuenta. Crea respaldos y protege esa carpeta.</div>
    </section>`;
}

function languageLabel(language) {
  return codeLanguages.find(([value]) => value === language)?.[1] ?? "Texto";
}

function renderCodeCard(item) {
  return `<article class="library-card">
    <div class="library-card-heading"><div><span class="pill">${languageLabel(item.language)}</span>${item.category ? `<span class="pill">${escapeHtml(item.category)}</span>` : ""}<h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description || "Sin descripción.")}</p></div></div>
    <pre class="code-preview"><code>${escapeHtml(item.code.slice(0, 900))}${item.code.length > 900 ? "\n…" : ""}</code></pre>
    ${item.explanation ? `<p class="library-explanation">${escapeHtml(item.explanation.slice(0, 240))}</p>` : ""}
    <div class="note-meta">${item.topic ? `<span class="pill">Tema: ${escapeHtml(item.topic)}</span>` : ""}${item.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}<span>${item.versions.length} ${item.versions.length === 1 ? "versión anterior" : "versiones anteriores"}</span><span>Actualizado ${formatDate(item.updatedAt)}</span></div>
    <div class="toolbar library-actions"><button class="button button-secondary button-small" type="button" data-action="edit-code" data-id="${escapeHtml(item.id)}">Abrir editor</button><button class="button button-secondary button-small" type="button" data-action="error-from-code" data-id="${escapeHtml(item.id)}">＋ Registrar error</button><button class="button button-danger button-small" type="button" data-action="delete-code" data-id="${escapeHtml(item.id)}">A papelera</button></div>
  </article>`;
}

function renderCodeLibrary() {
  const filter = state.codeSearch.trim().toLocaleLowerCase();
  const snippets = state.data.codeSnippets.filter((item) => [
    item.title, item.description, item.code, item.explanation, item.comments, item.category, item.topic, item.language, ...item.tags,
  ].join(" ").toLocaleLowerCase().includes(filter));
  return `<div class="page-heading"><div><span class="eyebrow">Tu laboratorio personal</span><h1>Código</h1><p>Escribe, explica, versiona y organiza fragmentos de programación. El editor no ejecuta el código.</p></div><button class="button" type="button" data-action="new-code">＋ Nuevo fragmento</button></div>
    <div class="toolbar library-filter"><label class="visually-hidden" for="code-search">Buscar código</label><input id="code-search" class="form-control" type="search" placeholder="Buscar título, lenguaje, categoría o contenido…" value="${escapeHtml(state.codeSearch)}"><span class="pill">${snippets.length} de ${state.data.codeSnippets.length}</span></div>
    <div id="code-results">${snippets.length ? `<div class="library-grid">${snippets.map(renderCodeCard).join("")}</div>` : `<div class="empty-state"><div><span class="empty-state-mark">&lt;/&gt;</span><h3>${state.data.codeSnippets.length ? "No hay coincidencias" : "Aún no guardas código"}</h3><p>${state.data.codeSnippets.length ? "Prueba con otros términos." : "Crea un fragmento, agrega su explicación y vuelve a consultarlo cuando estudies."}</p><button class="button" type="button" data-action="new-code">Crear fragmento</button></div></div>`}</div>`;
}

function renderErrorCard(item) {
  return `<article class="library-card error-card">
    <div class="library-card-heading"><div><span class="pill error-status-${item.status}">${item.status === "solved" ? "Solucionado" : "Pendiente"}</span><span class="pill">${languageLabel(item.language)}</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description || item.message || "Sin descripción.")}</p></div></div>
    ${item.message ? `<div class="error-message"><strong>Mensaje</strong><pre>${escapeHtml(item.message)}</pre></div>` : ""}
    ${item.solution ? `<p class="library-explanation"><strong>Solución:</strong> ${escapeHtml(item.solution.slice(0, 360))}</p>` : ""}
    <div class="note-meta">${item.category ? `<span class="pill">${escapeHtml(item.category)}</span>` : ""}${item.topic ? `<span class="pill">Tema: ${escapeHtml(item.topic)}</span>` : ""}${item.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}<span>Creado ${formatDate(item.createdAt)}</span></div>
    <div class="toolbar library-actions"><button class="button button-secondary button-small" type="button" data-action="edit-error" data-id="${escapeHtml(item.id)}">Ver / editar</button><button class="button button-secondary button-small" type="button" data-action="toggle-error-status" data-id="${escapeHtml(item.id)}">${item.status === "solved" ? "Reabrir" : "Marcar solucionado"}</button><button class="button button-danger button-small" type="button" data-action="delete-error" data-id="${escapeHtml(item.id)}">A papelera</button></div>
  </article>`;
}

function renderErrorsLibrary() {
  const filter = state.errorSearch.trim().toLocaleLowerCase();
  const items = state.data.errors.filter((item) => (state.errorFilter === "all" || item.status === state.errorFilter)
    && [item.title, item.description, item.code, item.message, item.solution, item.fixedCode, item.language, item.category, item.topic, ...item.tags]
      .join(" ").toLocaleLowerCase().includes(filter));
  return `<div class="page-heading"><div><span class="eyebrow">Aprender de cada tropiezo</span><h1>Errores y soluciones</h1><p>Registra el problema, el mensaje, el código y la solución para consultarlos cuando vuelvan a aparecer.</p></div><button class="button" type="button" data-action="new-error">＋ Registrar error</button></div>
    <div class="toolbar library-filter"><label class="visually-hidden" for="error-search">Buscar errores</label><input id="error-search" class="form-control" type="search" placeholder="Buscar error, lenguaje, solución o etiqueta…" value="${escapeHtml(state.errorSearch)}"><label class="visually-hidden" for="error-filter">Filtrar por estado</label><select id="error-filter" class="form-control"><option value="all" ${state.errorFilter === "all" ? "selected" : ""}>Todos los estados</option><option value="pending" ${state.errorFilter === "pending" ? "selected" : ""}>Pendientes</option><option value="solved" ${state.errorFilter === "solved" ? "selected" : ""}>Solucionados</option></select><span class="pill">${items.length} registros</span></div>
    <div id="error-results">${items.length ? `<div class="library-grid">${items.map(renderErrorCard).join("")}</div>` : `<div class="empty-state"><div><span class="empty-state-mark">!</span><h3>${state.data.errors.length ? "No hay coincidencias" : "Tu bitácora está vacía"}</h3><p>Guarda el contexto del problema y la solución aplicada para construir una biblioteca útil.</p><button class="button" type="button" data-action="new-error">Registrar el primer error</button></div></div>`}</div>`;
}

function studyTopics() {
  const topics = new Set(["Todos"]);
  const add = (value) => { if (typeof value === "string" && value.trim()) topics.add(value.trim()); };
  for (const notebook of state.data.notebooks) add(notebook.name);
  for (const item of [...state.data.codeSnippets, ...state.data.errors]) {
    add(item.topic);
    add(item.category);
    item.tags.forEach(add);
  }
  for (const item of state.data.flashcards) add(item.topic);
  for (const item of state.data.quizzes) add(item.topic);
  for (const note of state.data.notes) {
    add(state.data.notebooks.find((notebook) => notebook.id === note.notebookId)?.name);
    note.tags.forEach(add);
  }
  return [...topics];
}

function topicMatches(topic, values) {
  return topic === "Todos" || values.filter(Boolean).some((value) => value === topic);
}

function renderFlashcardReview(cards) {
  if (!cards.length) return `<div class="empty-state compact-empty"><div><h3>No hay tarjetas para este tema</h3><p>Crea una tarjeta desde un apunte o desde el botón de esta sección.</p><button class="button" type="button" data-action="new-flashcard">＋ Crear tarjeta</button></div></div>`;
  let card = cards.find((item) => item.id === state.studyCardId);
  if (!card) {
    card = cards[0];
    state.studyCardId = card.id;
    state.studyCardRevealed = false;
  }
  return `<div class="flashcard-review">
    <div class="flashcard-top"><span class="pill">${escapeHtml(card.topic || "Sin tema")}</span><span>${cards.findIndex((item) => item.id === card.id) + 1} / ${cards.length}</span><button class="button button-quiet button-small" type="button" data-action="shuffle-card">${state.studyRandom ? "Orden aleatorio: sí" : "Orden aleatorio: no"}</button></div>
    <button class="flashcard-face" type="button" data-action="flip-card" aria-label="${state.studyCardRevealed ? "Mostrar pregunta" : "Voltear para ver respuesta"}">
      <span class="eyebrow">${state.studyCardRevealed ? "Respuesta" : "Pregunta / concepto"}</span><strong>${escapeHtml(state.studyCardRevealed ? card.back : card.front)}</strong><small>Toca para ${state.studyCardRevealed ? "volver al frente" : "voltear la tarjeta"}</small>
    </button>
    <div class="toolbar flashcard-controls"><button class="button button-secondary" type="button" data-action="card-needs-review" data-id="${escapeHtml(card.id)}">Necesito repasar</button><button class="button" type="button" data-action="card-known" data-id="${escapeHtml(card.id)}">Lo conozco</button></div>
  </div>`;
}

function renderStudyPage() {
  const topic = studyTopics().includes(state.studyTopic) ? state.studyTopic : "Todos";
  state.studyTopic = topic;
  const cards = state.data.flashcards.filter((item) => topicMatches(topic, [item.topic]));
  const notes = state.data.notes.filter((item) => topicMatches(topic, [
    state.data.notebooks.find((notebook) => notebook.id === item.notebookId)?.name, ...item.tags,
  ]));
  const snippets = state.data.codeSnippets.filter((item) => item.explanation.trim()
    && topicMatches(topic, [item.topic, item.category, ...item.tags]));
  const quizzes = state.data.quizzes.filter((item) => topicMatches(topic, [item.topic]));
  const known = cards.filter((item) => item.status === "known").length;
  const pending = cards.filter((item) => item.status !== "known").length;
  const recentResults = [...state.data.quizResults].sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 5);
  const topicOptions = studyTopics().map((item) => `<option value="${escapeHtml(item)}" ${item === topic ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
  return `<div class="page-heading"><div><span class="eyebrow">Aprendizaje activo</span><h1>Estudiar y repasar</h1><p>Combina apuntes, explicaciones de código, tarjetas y cuestionarios guardados por ti.</p></div><label class="topic-picker"><span>Tema de repaso</span><select id="study-topic" class="form-control">${topicOptions}</select></label></div>
    <div class="stats-grid study-stats"><article class="stat-card"><span class="stat-label">Tarjetas</span><strong class="stat-value">${cards.length}</strong><span class="stat-note">${pending} por repasar · ${known} conocidas</span></article><article class="stat-card"><span class="stat-label">Apuntes</span><strong class="stat-value">${notes.length}</strong><span class="stat-note">Material relacionado con este tema</span></article><article class="stat-card"><span class="stat-label">Cuestionarios</span><strong class="stat-value">${quizzes.length}</strong><span class="stat-note">${recentResults.length} resultados recientes</span></article><article class="stat-card"><span class="stat-label">Explicaciones</span><strong class="stat-value">${snippets.length}</strong><span class="stat-note">Fragmentos comentados para estudiar</span></article></div>
    <section class="study-section"><div class="section-row"><div><h2>Tarjetas de estudio</h2><p>Voltea cada tarjeta y marca tu nivel de confianza.</p></div><button class="button button-secondary button-small" type="button" data-action="new-flashcard">＋ Nueva tarjeta</button></div>${renderFlashcardReview(cards)}
      ${cards.length ? `<div class="study-library">${cards.map((item) => `<article class="study-list-item"><div><strong>${escapeHtml(item.front)}</strong><small>${escapeHtml(item.topic || "Sin tema")} · ${item.status === "known" ? "Conocida" : item.status === "review" ? "Por repasar" : "Nueva"}</small></div><div class="toolbar"><button class="button button-quiet button-small" type="button" data-action="edit-flashcard" data-id="${escapeHtml(item.id)}">Editar</button><button class="button button-quiet button-small" type="button" data-action="delete-flashcard" data-id="${escapeHtml(item.id)}">Eliminar</button></div></article>`).join("")}</div>` : ""}</section>
    <section class="study-section"><div class="section-row"><div><h2>Cuestionarios</h2><p>Practica con selección múltiple y verdadero o falso.</p></div><button class="button button-secondary button-small" type="button" data-action="new-quiz">＋ Crear cuestionario</button></div>
      ${quizzes.length ? `<div class="library-grid">${quizzes.map((quiz) => `<article class="library-card"><span class="pill">${escapeHtml(quiz.topic || "Sin tema")}</span><h2>${escapeHtml(quiz.title)}</h2><p>${quiz.questions.length} preguntas · ${recentResults.filter((item) => item.quizId === quiz.id).length} intentos</p><div class="toolbar library-actions"><button class="button" type="button" data-action="start-quiz" data-id="${escapeHtml(quiz.id)}">Empezar / repetir</button><button class="button button-secondary button-small" type="button" data-action="edit-quiz" data-id="${escapeHtml(quiz.id)}">Editar</button><button class="button button-danger button-small" type="button" data-action="delete-quiz" data-id="${escapeHtml(quiz.id)}">Eliminar</button></div></article>`).join("")}</div>` : `<div class="empty-state compact-empty"><div><h3>Aún no hay cuestionarios</h3><p>Diseña preguntas propias y guarda tus intentos para seguir tu avance.</p></div></div>`}</section>
    <section class="study-section"><div class="section-row"><div><h2>Material para repasar</h2><p>Contenido relacionado con «${escapeHtml(topic)}».</p></div></div>
      ${notes.length || snippets.length ? `<div class="study-material-grid">${notes.map((note) => `<button class="study-material" type="button" data-action="edit-note" data-id="${escapeHtml(note.id)}"><span class="pill">Apunte</span><strong>${escapeHtml(note.title)}</strong><small>${escapeHtml(note.bodyMd.replace(/[#>*`]/g, "").slice(0, 160))}</small><span class="study-material-action">Abrir y revisar ↗</span></button>`).join("")}${snippets.map((item) => `<button class="study-material" type="button" data-action="edit-code" data-id="${escapeHtml(item.id)}"><span class="pill">Código · ${languageLabel(item.language)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.explanation.slice(0, 180))}</small><span class="study-material-action">Ver explicación ↗</span></button>`).join("")}</div>` : `<div class="empty-state compact-empty"><div><h3>Sin material relacionado</h3><p>Elige otro tema o añade etiquetas, explicaciones y tarjetas para crear una ruta de repaso.</p></div></div>`}</section>
    <section class="study-section"><div class="section-row"><div><h2>Intentos recientes</h2><p>Resultados guardados localmente en tu cuenta.</p></div></div>
      ${recentResults.length ? `<div class="study-library">${recentResults.map((item) => `<article class="study-list-item"><div><strong>${escapeHtml(state.data.quizzes.find((quiz) => quiz.id === item.quizId)?.title ?? "Cuestionario eliminado")}</strong><small>${item.score} de ${item.total} · ${formatDate(item.completedAt)}</small></div><button class="button button-quiet button-small" type="button" data-action="repeat-quiz" data-id="${escapeHtml(item.quizId)}">Repetir</button></article>`).join("")}</div>` : `<p class="setting-footnote">Completa un cuestionario para guardar aquí tu primer resultado.</p>`}
    </section>`;
}

function renderQuizPlayer() {
  const quiz = state.data.quizzes.find((item) => item.id === state.activeQuizId);
  if (!quiz) return `<div class="empty-state"><div><h2>No se encontró el cuestionario</h2><button class="button" type="button" data-view="study">Volver a estudiar</button></div></div>`;
  const result = state.quizReview;
  return `<div class="page-heading"><div><span class="eyebrow">${escapeHtml(quiz.topic || "Repaso")}</span><h1>${escapeHtml(quiz.title)}</h1><p>${quiz.questions.length} preguntas · tus respuestas se guardan al finalizar.</p></div><button class="button button-secondary" type="button" data-view="study">Volver a estudiar</button></div>
    ${result ? `<section class="quiz-result-panel"><p class="eyebrow">Resultado guardado</p><h2>${result.score} / ${result.total}</h2><p>${Math.round((result.score / result.total) * 100)} % de respuestas correctas</p></section>` : ""}
    <div class="quiz-question-list">${quiz.questions.map((question, index) => {
      const selected = result?.answers[index] ?? -1;
      const correct = selected === question.correctIndex;
      return `<fieldset class="quiz-question"><legend><span class="pill">Pregunta ${index + 1} · ${question.type === "true-false" ? "Verdadero o falso" : "Selección múltiple"}</span><strong>${escapeHtml(question.prompt)}</strong></legend>
        <div class="quiz-options">${question.options.map((option, optionIndex) => `<label class="quiz-option ${result && optionIndex === question.correctIndex ? "is-correct" : ""} ${result && selected === optionIndex && !correct ? "is-wrong" : ""}"><input type="radio" name="quiz-answer-${index}" value="${optionIndex}" ${selected === optionIndex ? "checked" : ""} ${result ? "disabled" : ""}><span>${escapeHtml(option)}</span>${result && optionIndex === question.correctIndex ? `<small>Correcta</small>` : ""}</label>`).join("")}</div>
        ${result ? `<p class="quiz-explanation">${correct ? "✓ Respuesta correcta." : selected < 0 ? "Sin respuesta." : "Respuesta incorrecta."} ${escapeHtml(question.explanation || (correct ? "" : `La respuesta correcta es: ${question.options[question.correctIndex]}.`))}</p>` : ""}
      </fieldset>`;
    }).join("")}</div>
    <div class="form-actions">${result ? `<button class="button" type="button" data-action="repeat-quiz" data-id="${escapeHtml(quiz.id)}">Repetir cuestionario</button>` : `<button class="button" type="button" data-action="submit-quiz">Finalizar y guardar resultado</button>`}</div>`;
}

function renderTrash() {
  const entries = [...state.data.trash].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  const labels = { note: "Apunte", code: "Código", error: "Error", notebook: "Cuaderno" };
  return `<div class="page-heading"><div><span class="eyebrow">Recupera antes de perder</span><h1>Papelera</h1><p>Los apuntes, fragmentos, errores y cuadernos se conservan aquí hasta que los elimines definitivamente.</p></div>${entries.length ? `<button class="button button-danger" type="button" data-action="empty-trash">Vaciar papelera</button>` : ""}</div>
    ${entries.length ? `<div class="trash-list">${entries.map((entry) => {
      const title = entry.kind === "code" || entry.kind === "error" ? entry.item.title : entry.item.name ?? entry.item.title;
      const extraCount = entry.kind === "notebook" && Array.isArray(entry.item.notes) ? entry.item.notes.length : 0;
      return `<article class="trash-item"><div class="trash-item-copy"><span class="pill">${labels[entry.kind]}</span><h2>${escapeHtml(title || "Elemento sin título")}</h2><p>Eliminado ${formatDate(entry.deletedAt)}${extraCount ? ` · contiene ${extraCount} apuntes` : ""}</p></div><div class="toolbar"><button class="button button-secondary button-small" type="button" data-action="restore-trash" data-id="${escapeHtml(entry.id)}">Restaurar</button><button class="button button-danger button-small" type="button" data-action="confirm-permanent-delete" data-id="${escapeHtml(entry.id)}">Eliminar definitivamente</button></div></article>`;
    }).join("")}</div>` : `<div class="empty-state"><div><span class="empty-state-mark">♲</span><h3>La papelera está vacía</h3><p>Cuando envíes apuntes, código o errores a la papelera, aparecerán aquí con su fecha de eliminación.</p></div></div>`}`;
}

function renderCurrentView() {
  if (state.view === "notebooks") return renderNotebooks();
  if (state.view === "notebook") return renderNotebookDetail();
  if (state.view === "progress") return renderProgress();
  if (state.view === "accessibility") return renderAccessibility();
  if (state.view === "data") return renderData();
  if (state.view === "search") return renderSearchPage();
  if (state.view === "code") return renderCodeLibrary();
  if (state.view === "errors") return renderErrorsLibrary();
  if (state.view === "study") return renderStudyPage();
  if (state.view === "trash") return renderTrash();
  if (state.view === "quiz-player") return renderQuizPlayer();
  return renderDashboard();
}

function render() {
  applyPreferences();
  if (state.setupRequired) {
    renderSetup(state.startupError);
    return;
  }
  if (!state.user || !state.data) {
    renderLogin(state.startupError);
    return;
  }
  app.innerHTML = `<div class="app-shell">
    <div class="ambient ambient-one" aria-hidden="true"></div><div class="ambient ambient-two" aria-hidden="true"></div>
    <aside class="sidebar" id="sidebar" data-open="false" aria-label="Navegación principal">
      <div class="brand"><span class="brand-mark" aria-hidden="true">K</span><span><span class="brand-name">KORA</span><span class="brand-caption">Trippy Animations</span></span></div>
      <p class="nav-label">Tu espacio</p><nav class="main-nav nav-scroll">
        ${navButton("dashboard", "⌂", "Resumen")}
        ${navButton("search", "⌕", "Buscador")}
        ${navButton("notebooks", "▤", "Cuadernos")}
        ${navButton("code", '<svg class="nav-code-icon" viewBox="0 0 24 24"><path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 4l-4 16"/></svg>', "Código")}
        ${navButton("errors", "!", "Errores y soluciones")}
        ${navButton("study", "✧", "Estudiar y repasar")}
        ${navButton("trash", "♲", "Papelera")}
        ${navButton("progress", "◔", "Progreso")}
      </nav>
      <p class="nav-label" style="margin-top:20px">Preferencias</p><nav class="main-nav">
        ${navButton("accessibility", "✧", "Accesibilidad")}
        ${navButton("data", "↗", "Mis datos")}
      </nav>
      <div class="sidebar-bottom">
        <div class="sidebar-tip"><strong>Un ritmo propio</strong>Pequeños pasos también construyen grandes ideas.</div>
        <div class="sidebar-profile"><span class="avatar" aria-hidden="true">${escapeHtml(state.user.username.slice(0, 1))}</span>
          <span class="profile-meta"><span class="profile-name">${escapeHtml(state.user.username)}</span><span class="profile-label">Cuenta privada</span></span>
          <button class="icon-button" type="button" data-action="logout" aria-label="Cerrar sesión">↪</button>
        </div>
      </div>
    </aside>
    <section class="workspace">
      <header class="topbar"><div class="topbar-start">
        <button class="icon-button mobile-menu-button" type="button" data-action="toggle-sidebar" aria-label="Abrir menú" aria-expanded="false">☰</button>
        <div><span class="topbar-kicker">KORA · espacio de estudio</span><p class="topbar-title">${escapeHtml(pageTitle())}</p></div>
      </div><div class="topbar-actions">
        <div class="global-search-wrap"><label class="visually-hidden" for="global-search">Buscar en todo KORA</label><input id="global-search" class="form-control global-search" type="search" placeholder="Buscar en KORA…" autocomplete="off" role="combobox" aria-expanded="${Boolean(state.searchSuggestionsOpen && state.globalSearch.trim())}" aria-controls="search-suggestions" value="${escapeHtml(state.globalSearch)}"><div id="search-suggestions">${renderSearchSuggestions(state.globalSearch)}</div></div>
        <button class="button button-secondary button-small" type="button" data-view="accessibility">✧ Accesibilidad</button></div></header>
      <main class="content" id="main-content">${renderCurrentView()}</main>
    </section>
  </div>`;
}

function openModal(content) {
  state.lastFocused = document.activeElement;
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true">${content}</section></div>`;
  const title = modalRoot.querySelector("h2");
  if (title) {
    title.id = "modal-title";
    modalRoot.querySelector('[role="dialog"]').setAttribute("aria-labelledby", title.id);
  }
  modalRoot.querySelector("button, input, select, textarea")?.focus();
}

function closeModal() {
  modalRoot.innerHTML = "";
  state.lastFocused?.focus?.();
}

function colorSelector(selected) {
  return `<div class="field"><span class="field-help">Color identificador</span><div class="color-options">${colorOptions.map(([value, label]) => `<span class="color-option">
    <input id="color-${value}" name="color" type="radio" value="${value}" ${value === selected ? "checked" : ""} required>
    <label for="color-${value}" class="color-${value}" title="${label}" aria-label="${label}"></label>
  </span>`).join("")}</div></div>`;
}

function openNotebookForm(notebook = null) {
  openModal(`<button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Cerrar">×</button>
    <p class="eyebrow">${notebook ? "Personaliza tu espacio" : "Nuevo espacio"}</p><h2>${notebook ? "Editar cuaderno" : "Crear cuaderno"}</h2>
    <p class="modal-description">Elige un nombre y un color para reconocerlo rápidamente.</p>
    <form id="notebook-form" data-id="${notebook ? escapeHtml(notebook.id) : ""}">
      <div class="field"><label for="notebook-name">Nombre</label><input class="form-control" id="notebook-name" name="name" maxlength="80" required value="${notebook ? escapeHtml(notebook.name) : ""}" placeholder="Ej. Biología, Ideas, Proyecto…"></div>
      ${colorSelector(notebook?.color ?? "violeta")}
      <p class="modal-error" id="modal-error" role="alert"></p>
      <div class="form-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancelar</button><button class="button" type="submit">${notebook ? "Guardar cambios" : "Crear cuaderno"}</button></div>
    </form>`);
}

function openNoteForm(note = null) {
  const notebookOptions = state.data.notebooks.map((notebook) => `<option value="${escapeHtml(notebook.id)}" ${(note?.notebookId ?? state.selectedNotebookId) === notebook.id ? "selected" : ""}>${escapeHtml(notebook.name)}</option>`).join("");
  openModal(`<button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Cerrar">×</button>
    <p class="eyebrow">${note ? "Edita y ordena tus ideas" : "Nuevo apunte"}</p><h2>${note ? "Editar apunte" : "Guarda una idea"}</h2>
    <p class="modal-description">Elige a qué cuaderno pertenece. El contenido admite Markdown básico.</p>
    <form id="note-form" data-id="${note ? escapeHtml(note.id) : ""}">
      <div class="field"><label for="note-title">Título</label><input id="note-title" name="title" maxlength="160" required value="${note ? escapeHtml(note.title) : ""}" placeholder="Una idea para recordar"></div>
      <div class="field"><label for="note-notebook">Cuaderno</label><select id="note-notebook" name="notebookId" required>${notebookOptions}</select></div>
      <div class="field"><label for="note-body">Contenido</label><textarea id="note-body" name="bodyMd" maxlength="200000" placeholder="Escribe aquí tus ideas…">${note ? escapeHtml(note.bodyMd) : ""}</textarea><span class="field-help">Puedes usar títulos con #, **negrita**, *cursiva* y código en línea.</span></div>
      <div class="field"><label for="note-status">Estado de estudio</label><select id="note-status" name="status">
        <option value="nuevo" ${note?.status === "nuevo" || !note ? "selected" : ""}>Nuevo</option>
        <option value="repaso" ${note?.status === "repaso" ? "selected" : ""}>En repaso</option>
        <option value="dominado" ${note?.status === "dominado" ? "selected" : ""}>Dominado</option>
      </select></div>
      <div class="field"><label for="note-tags">Etiquetas</label><input id="note-tags" name="tags" maxlength="480" value="${note ? escapeHtml(note.tags.join(", ")) : ""}" placeholder="Ej. parcial, ideas (separadas por coma)"></div>
      <p class="modal-error" id="modal-error" role="alert"></p>
      <div class="form-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancelar</button><button class="button" type="submit">${note ? "Guardar cambios" : "Guardar apunte"}</button></div>
    </form>`);
}

function openCodeForm(item = null) {
  const languageOptions = codeLanguages.map(([value, label]) => `<option value="${value}" ${item?.language === value || (!item && value === "javascript") ? "selected" : ""}>${label}</option>`).join("");
  const versions = item?.versions ?? [];
  state.codeUndo = [];
  state.codeRedo = [];
  state.codePreviousValue = item?.code ?? "";
  openModal(`<button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Cerrar">×</button>
    <p class="eyebrow">${item ? "Biblioteca de programación" : "Nuevo material de estudio"}</p><h2>${item ? "Editar fragmento" : "Guardar código"}</h2>
    <form id="code-form" data-id="${item ? escapeHtml(item.id) : ""}">
      <div class="form-grid-two"><div class="field"><label for="code-title">Título</label><input id="code-title" name="title" maxlength="160" required value="${escapeHtml(item?.title ?? "")}" placeholder="Ej. Ordenamiento por selección"></div><div class="field"><label for="code-language">Lenguaje</label><select id="code-language" name="language">${languageOptions}</select></div></div>
      <div class="field"><label for="code-description">Descripción breve</label><input id="code-description" name="description" maxlength="2000" value="${escapeHtml(item?.description ?? "")}" placeholder="Qué problema resuelve este fragmento"></div>
      <div class="form-grid-two"><div class="field"><label for="code-category">Categoría</label><input id="code-category" name="category" maxlength="80" value="${escapeHtml(item?.category ?? "")}" placeholder="Ej. Algoritmos"></div><div class="field"><label for="code-topic">Tema de estudio</label><input id="code-topic" name="topic" maxlength="80" value="${escapeHtml(item?.topic ?? "")}" placeholder="Ej. Estructuras de datos"></div></div>
      <div class="field"><label for="code-tags">Etiquetas</label><input id="code-tags" name="tags" maxlength="800" value="${escapeHtml(item?.tags.join(", ") ?? "")}" placeholder="búsqueda, arrays, práctica (separadas por coma)"></div>
      <div class="code-toolbar">
        <button class="button button-secondary button-small" type="button" data-action="code-undo">Deshacer</button><button class="button button-secondary button-small" type="button" data-action="code-redo">Rehacer</button><button class="button button-secondary button-small" type="button" data-action="copy-code">Copiar</button><button class="button button-secondary button-small" type="button" data-action="download-code">Exportar</button>
        <div class="code-find"><label class="visually-hidden" for="code-find-input">Buscar dentro del código</label><input id="code-find-input" class="form-control" type="search" placeholder="Buscar en código"><button class="button button-quiet button-small" type="button" data-action="find-code">Buscar</button></div>
      </div>
      <div class="code-editor" id="code-editor"><div class="code-gutter" id="code-gutter" aria-hidden="true">1</div><div class="code-visual"><pre class="code-highlight" id="code-highlight" aria-hidden="true"><code></code></pre><textarea id="code-input" class="code-input" name="code" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" maxlength="200000" aria-label="Editor de código">${escapeHtml(item?.code ?? "")}</textarea></div></div>
      <span class="field-help">Tab inserta espacios; Enter conserva la indentación. El código se guarda como texto y no se ejecuta.</span>
      ${versions.length ? `<div class="field"><label for="code-version">Versiones anteriores</label><select id="code-version"><option value="">Selecciona una versión guardada</option>${versions.map((version, index) => `<option value="${index}">${formatDate(version.createdAt)} · versión ${index + 1}</option>`).join("")}</select><span class="field-help">Al guardar cambios se conserva el código anterior; elegirlo lo carga como borrador para restaurarlo.</span></div>` : ""}
      <div class="field"><label for="code-explanation">Explicación del código</label><textarea id="code-explanation" name="explanation" maxlength="20000" placeholder="Explica qué hace cada función, variable o bloque y cómo se relacionan.">${escapeHtml(item?.explanation ?? "")}</textarea></div>
      <div class="field"><label for="code-comments">Comentarios y notas</label><textarea id="code-comments" name="comments" maxlength="12000" placeholder="Anota decisiones, advertencias o preguntas sobre este fragmento.">${escapeHtml(item?.comments ?? "")}</textarea></div>
      <p class="modal-error" id="modal-error" role="alert"></p>
      <div class="form-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancelar</button>${item ? `<button class="button button-secondary" type="button" data-action="error-from-code" data-id="${escapeHtml(item.id)}">Registrar error</button>` : ""}<button class="button" type="submit">${item ? "Guardar cambios" : "Guardar fragmento"}</button></div>
    </form>`);
  updateCodeEditor();
  modalRoot.querySelector("#code-title").focus();
}

function openErrorForm(item = null, sourceCode = null) {
  const initialCode = item?.code ?? sourceCode?.code ?? "";
  const initialLanguage = item?.language ?? sourceCode?.language ?? "javascript";
  const languageOptions = codeLanguages.map(([value, label]) => `<option value="${value}" ${initialLanguage === value ? "selected" : ""}>${label}</option>`).join("");
  openModal(`<button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Cerrar">×</button>
    <p class="eyebrow">Bitácora de programación</p><h2>${item ? "Editar registro" : "Documentar un error"}</h2>
    <form id="error-form" data-id="${item ? escapeHtml(item.id) : ""}" data-source-code-id="${escapeHtml(item?.sourceCodeId ?? sourceCode?.id ?? "")}">
      <div class="field"><label for="error-title">Nombre o título</label><input id="error-title" name="title" maxlength="160" required value="${escapeHtml(item?.title ?? (sourceCode ? `Error en ${sourceCode.title}` : ""))}" placeholder="Ej. Referencia nula al recorrer la lista"></div>
      <div class="field"><label for="error-description">Descripción del problema</label><textarea id="error-description" name="description" maxlength="8000" placeholder="¿Qué estabas haciendo y qué esperabas que ocurriera?">${escapeHtml(item?.description ?? "")}</textarea></div>
      <div class="field"><label for="error-message">Mensaje de error</label><textarea id="error-message" name="message" maxlength="8000" placeholder="Pega el mensaje tal como aparece.">${escapeHtml(item?.message ?? "")}</textarea></div>
      <div class="form-grid-two"><div class="field"><label for="error-language">Lenguaje</label><select id="error-language" name="language">${languageOptions}</select></div><div class="field"><label for="error-category">Categoría</label><input id="error-category" name="category" maxlength="80" value="${escapeHtml(item?.category ?? sourceCode?.category ?? "")}" placeholder="Ej. Tipos"></div></div>
      <div class="field"><label for="error-topic">Tema</label><input id="error-topic" name="topic" maxlength="80" value="${escapeHtml(item?.topic ?? sourceCode?.topic ?? "")}" placeholder="Ej. Funciones"></div>
      <div class="field"><label for="error-code">Código que produjo el error</label><textarea id="error-code" name="code" maxlength="200000" class="mono-area" placeholder="Pega el fragmento problemático.">${escapeHtml(initialCode)}</textarea></div>
      <div class="field"><label for="error-solution">Solución aplicada</label><textarea id="error-solution" name="solution" maxlength="20000" placeholder="Describe los pasos que resolvieron el problema.">${escapeHtml(item?.solution ?? "")}</textarea></div>
      <div class="field"><label for="error-fixed-code">Código corregido</label><textarea id="error-fixed-code" name="fixedCode" maxlength="200000" class="mono-area" placeholder="Pega la versión corregida, si aplica.">${escapeHtml(item?.fixedCode ?? "")}</textarea></div>
      <div class="form-grid-two"><div class="field"><label for="error-tags">Etiquetas</label><input id="error-tags" name="tags" maxlength="800" value="${escapeHtml(item?.tags.join(", ") ?? "")}" placeholder="error, depuración"></div><div class="field"><label for="error-status">Estado</label><select id="error-status" name="status"><option value="pending" ${item?.status !== "solved" ? "selected" : ""}>Pendiente</option><option value="solved" ${item?.status === "solved" ? "selected" : ""}>Solucionado</option></select></div></div>
      <p class="modal-error" id="modal-error" role="alert"></p><div class="form-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancelar</button><button class="button" type="submit">${item ? "Guardar cambios" : "Guardar error"}</button></div>
    </form>`);
}

function openFlashcardForm(item = null, source = {}) {
  const front = item?.front ?? source.front ?? "";
  const back = item?.back ?? source.back ?? "";
  const topic = item?.topic ?? source.topic ?? "";
  openModal(`<button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Cerrar">×</button>
    <p class="eyebrow">Material de repaso</p><h2>${item ? "Editar tarjeta" : "Crear tarjeta"}</h2>
    <form id="flashcard-form" data-id="${item ? escapeHtml(item.id) : ""}" data-source-note-id="${escapeHtml(item?.sourceNoteId ?? source.sourceNoteId ?? "")}" data-source-snippet-id="${escapeHtml(item?.sourceSnippetId ?? source.sourceSnippetId ?? "")}">
      <div class="field"><label for="flashcard-front">Frente · pregunta o concepto</label><textarea id="flashcard-front" name="front" maxlength="4000" required>${escapeHtml(front)}</textarea></div>
      <div class="field"><label for="flashcard-back">Reverso · respuesta o explicación</label><textarea id="flashcard-back" name="back" maxlength="10000" required>${escapeHtml(back)}</textarea></div>
      <div class="field"><label for="flashcard-topic">Tema</label><input id="flashcard-topic" name="topic" maxlength="80" value="${escapeHtml(topic)}" placeholder="Ej. Biología celular"></div>
      <p class="modal-error" id="modal-error" role="alert"></p><div class="form-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancelar</button><button class="button" type="submit">${item ? "Guardar tarjeta" : "Crear tarjeta"}</button></div>
    </form>`);
}

function quizQuestionEditor(question = {}, index = 0) {
  const isTrueFalse = question.type === "true-false";
  const options = isTrueFalse ? ["Verdadero", "Falso"] : question.options ?? ["", "", "", ""];
  const correctIndex = Number.isInteger(question.correctIndex) ? question.correctIndex : 0;
  return `<fieldset class="quiz-question-editor" data-question-index="${index}" data-question-id="${escapeHtml(question.id ?? "")}"><legend>Pregunta ${index + 1}</legend>
    <div class="field"><label>Enunciado</label><textarea data-question-prompt maxlength="2000" required>${escapeHtml(question.prompt ?? "")}</textarea></div>
    <div class="field"><label>Tipo de pregunta</label><select data-question-type><option value="multiple" ${!isTrueFalse ? "selected" : ""}>Selección múltiple</option><option value="true-false" ${isTrueFalse ? "selected" : ""}>Verdadero o falso</option></select></div>
    <div class="quiz-editor-options">${options.map((option, optionIndex) => `<label class="quiz-editor-option"><input type="radio" name="quiz-correct-${index}" value="${optionIndex}" ${correctIndex === optionIndex ? "checked" : ""} aria-label="Marcar opción ${optionIndex + 1} como correcta"><input class="form-control" data-question-option value="${escapeHtml(option)}" maxlength="300" aria-label="Opción ${optionIndex + 1}"></label>`).join("")}</div>
    <div class="field"><label>Explicación de la respuesta</label><textarea data-question-explanation maxlength="4000" placeholder="Explica por qué esa respuesta es correcta.">${escapeHtml(question.explanation ?? "")}</textarea></div>
    <button class="button button-quiet button-small" type="button" data-action="remove-quiz-question" data-index="${index}">Quitar pregunta</button>
  </fieldset>`;
}

function openQuizForm(quiz = null) {
  const questions = quiz?.questions ?? [{ type: "multiple", options: ["", "", "", ""], correctIndex: 0 }];
  openModal(`<button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Cerrar">×</button>
    <p class="eyebrow">Cuestionarios personalizados</p><h2>${quiz ? "Editar cuestionario" : "Crear cuestionario"}</h2>
    <form id="quiz-form" data-id="${quiz ? escapeHtml(quiz.id) : ""}">
      <div class="form-grid-two"><div class="field"><label for="quiz-title">Título</label><input id="quiz-title" name="title" maxlength="160" required value="${escapeHtml(quiz?.title ?? "")}" placeholder="Repaso de funciones"></div><div class="field"><label for="quiz-topic">Tema</label><input id="quiz-topic" name="topic" maxlength="80" value="${escapeHtml(quiz?.topic ?? "")}" placeholder="Programación"></div></div>
      <div class="quiz-question-edit-list">${questions.map((question, index) => quizQuestionEditor(question, index)).join("")}</div>
      <button class="button button-secondary button-small" type="button" data-action="add-quiz-question">＋ Añadir pregunta</button>
      <p class="modal-error" id="modal-error" role="alert"></p><div class="form-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancelar</button><button class="button" type="submit">${quiz ? "Guardar cuestionario" : "Crear cuestionario"}</button></div>
    </form>`);
}

function confirmDeleteNotebook(notebook) {
  const count = noteCount(notebook.id);
  openModal(`<p class="eyebrow">Confirmar eliminación</p><h2>¿Eliminar «${escapeHtml(notebook.name)}»?</h2>
    <p class="modal-description">${count ? `El cuaderno y sus ${count} ${count === 1 ? "apunte asociado" : "apuntes asociados"} se moverán a la papelera y podrás restaurarlos.` : "El cuaderno se moverá a la papelera."}</p>
    <div class="form-actions"><button class="button button-secondary" type="button" data-action="close-modal">Conservar cuaderno</button>
      <button class="button button-danger" type="button" data-action="confirm-delete-notebook" data-id="${escapeHtml(notebook.id)}">Eliminar cuaderno</button></div>`);
}

async function replaceServerState(nextState) {
  await api("/api/state", { method: "PUT", body: JSON.stringify(nextState) });
  state.data = nextState;
  render();
}

async function updateState(mutator) {
  const previous = structuredClone(state.data);
  const next = structuredClone(state.data);
  mutator(next);
  try {
    await replaceServerState(next);
    return true;
  } catch (error) {
    state.data = previous;
    render();
    notify(error.message || "No se pudieron guardar los cambios.", "error");
    return false;
  }
}

function updateCodeEditor() {
  const editor = modalRoot.querySelector("#code-input");
  if (!editor) return;
  const lines = editor.value.split("\n").length;
  const gutter = modalRoot.querySelector("#code-gutter");
  gutter.textContent = Array.from({ length: lines }, (_, index) => index + 1).join("\n");
  gutter.scrollTop = editor.scrollTop;
  const highlight = modalRoot.querySelector("#code-highlight code");
  highlight.innerHTML = `${highlightCode(editor.value, modalRoot.querySelector("#code-language").value)}\n`;
  modalRoot.querySelector("#code-highlight").scrollTop = editor.scrollTop;
  modalRoot.querySelector("#code-highlight").scrollLeft = editor.scrollLeft;
}

function handleCodeEditorInput() {
  const editor = modalRoot.querySelector("#code-input");
  if (!editor) return;
  if (editor.value !== state.codePreviousValue) {
    state.codeUndo.push(state.codePreviousValue);
    if (state.codeUndo.length > 100) state.codeUndo.shift();
    state.codeRedo = [];
    state.codePreviousValue = editor.value;
  }
  updateCodeEditor();
}

function setCodeEditorValue(value, recordUndo = true) {
  const editor = modalRoot.querySelector("#code-input");
  if (!editor) return;
  if (recordUndo && editor.value !== value) {
    state.codeUndo.push(editor.value);
    state.codeRedo = [];
  }
  editor.value = value;
  state.codePreviousValue = value;
  updateCodeEditor();
  editor.focus();
}

function undoCode() {
  const editor = modalRoot.querySelector("#code-input");
  if (!editor || !state.codeUndo.length) return;
  state.codeRedo.push(editor.value);
  setCodeEditorValue(state.codeUndo.pop(), false);
}

function redoCode() {
  const editor = modalRoot.querySelector("#code-input");
  if (!editor || !state.codeRedo.length) return;
  state.codeUndo.push(editor.value);
  setCodeEditorValue(state.codeRedo.pop(), false);
}

function handleCodeEditorKeydown(event) {
  const editor = event.target;
  if (editor.id !== "code-input") return;
  if (event.key === "Tab") {
    event.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (event.shiftKey) {
      const lineStart = editor.value.lastIndexOf("\n", start - 1) + 1;
      if (editor.value.slice(lineStart, lineStart + 2) === "  ") {
        editor.setRangeText("", lineStart, lineStart + 2, "preserve");
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } else {
      editor.setRangeText("  ", start, end, "end");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return;
  }
  if (event.key !== "Enter") return;
  event.preventDefault();
  const lineStart = editor.value.lastIndexOf("\n", editor.selectionStart - 1) + 1;
  const indent = editor.value.slice(lineStart, editor.selectionStart).match(/^\s*/)?.[0] ?? "";
  const previous = editor.value.slice(0, editor.selectionStart).trimEnd();
  const extraIndent = /[{\[(]$/.test(previous) ? "  " : "";
  editor.setRangeText(`\n${indent}${extraIndent}`, editor.selectionStart, editor.selectionEnd, "end");
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function findInCode() {
  const editor = modalRoot.querySelector("#code-input");
  const query = modalRoot.querySelector("#code-find-input").value;
  if (!editor || !query) return;
  const start = editor.selectionEnd;
  const match = editor.value.toLocaleLowerCase().indexOf(query.toLocaleLowerCase(), start);
  const index = match >= 0 ? match : editor.value.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index < 0) {
    notify("No se encontró esa palabra en el código.", "error");
    return;
  }
  editor.focus();
  editor.setSelectionRange(index, index + query.length);
}

async function copyCode() {
  const editor = modalRoot.querySelector("#code-input");
  if (!editor) return;
  try {
    await navigator.clipboard.writeText(editor.value);
    notify("Código copiado.");
  } catch (error) {
    console.error("No se pudo copiar el código.", error);
    editor.select();
    const copied = document.execCommand("copy");
    editor.setSelectionRange(editor.value.length, editor.value.length);
    if (copied) notify("Código copiado.");
    else notify("El navegador no permitió copiar el código.", "error");
  }
}

function downloadCode() {
  const editor = modalRoot.querySelector("#code-input");
  const title = modalRoot.querySelector("#code-title").value.trim() || "fragmento";
  const language = modalRoot.querySelector("#code-language").value;
  const extensions = { javascript: "js", typescript: "ts", python: "py", html: "html", css: "css", sql: "sql", java: "java", csharp: "cs", php: "php", bash: "sh", json: "json", text: "txt" };
  const filename = `${title.toLocaleLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "fragmento"}.${extensions[language]}`;
  const url = URL.createObjectURL(new Blob([editor.value], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Fragmento exportado.");
}

function renumberQuizQuestions() {
  const nodes = [...modalRoot.querySelectorAll(".quiz-question-editor")];
  nodes.forEach((node, index) => {
    node.dataset.questionIndex = String(index);
    node.querySelector("legend").textContent = `Pregunta ${index + 1}`;
    node.querySelectorAll('input[type="radio"]').forEach((input) => { input.name = `quiz-correct-${index}`; });
  });
}

function splitTags(value) {
  return String(value ?? "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
}

function saveCode(form) {
  const formData = new FormData(form);
  const title = String(formData.get("title") ?? "").trim();
  const code = String(formData.get("code") ?? "");
  const language = String(formData.get("language") ?? "");
  if (!title || !codeLanguages.some(([value]) => value === language)) {
    form.querySelector("#modal-error").textContent = "Escribe un título y selecciona un lenguaje válido.";
    return;
  }
  const id = form.dataset.id;
  const now = new Date().toISOString();
  void updateState((data) => {
    const existing = data.codeSnippets.find((item) => item.id === id);
    const next = {
      id: id || crypto.randomUUID(),
      title,
      description: String(formData.get("description") ?? "").trim(),
      language,
      code,
      category: String(formData.get("category") ?? "").trim(),
      topic: String(formData.get("topic") ?? "").trim(),
      tags: splitTags(formData.get("tags")),
      explanation: String(formData.get("explanation") ?? ""),
      comments: String(formData.get("comments") ?? ""),
      versions: existing?.versions ?? [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) {
      if (existing.code !== code) {
        next.versions = [...existing.versions, { id: crypto.randomUUID(), code: existing.code, createdAt: now }].slice(-30);
      }
      Object.assign(existing, next);
    } else data.codeSnippets.push(next);
  }).then((saved) => {
    if (!saved) return;
    closeModal();
    state.view = "code";
    render();
    notify(id ? "Fragmento y versión guardados." : "Fragmento de código guardado.");
  });
}

function saveError(form) {
  const formData = new FormData(form);
  const title = String(formData.get("title") ?? "").trim();
  const language = String(formData.get("language") ?? "");
  if (!title || !codeLanguages.some(([value]) => value === language)) {
    form.querySelector("#modal-error").textContent = "Escribe un título y selecciona un lenguaje válido.";
    return;
  }
  const id = form.dataset.id;
  const now = new Date().toISOString();
  const record = {
    id: id || crypto.randomUUID(),
    title,
    description: String(formData.get("description") ?? ""),
    code: String(formData.get("code") ?? ""),
    message: String(formData.get("message") ?? ""),
    language,
    solution: String(formData.get("solution") ?? ""),
    fixedCode: String(formData.get("fixedCode") ?? ""),
    category: String(formData.get("category") ?? "").trim(),
    topic: String(formData.get("topic") ?? "").trim(),
    tags: splitTags(formData.get("tags")),
    status: String(formData.get("status") ?? "pending"),
    sourceCodeId: form.dataset.sourceCodeId ?? "",
    createdAt: now,
    updatedAt: now,
  };
  void updateState((data) => {
    const existing = data.errors.find((item) => item.id === id);
    if (existing) Object.assign(existing, record, { createdAt: existing.createdAt });
    else data.errors.push(record);
  }).then((saved) => {
    if (!saved) return;
    closeModal();
    state.view = "errors";
    render();
    notify(id ? "Registro de error actualizado." : "Error documentado.");
  });
}

function saveFlashcard(form) {
  const formData = new FormData(form);
  const front = String(formData.get("front") ?? "").trim();
  const back = String(formData.get("back") ?? "").trim();
  if (!front || !back) {
    form.querySelector("#modal-error").textContent = "Completa la pregunta y la respuesta.";
    return;
  }
  const id = form.dataset.id;
  const now = new Date().toISOString();
  void updateState((data) => {
    const existing = data.flashcards.find((item) => item.id === id);
    const card = {
      id: id || crypto.randomUUID(),
      front,
      back,
      topic: String(formData.get("topic") ?? "").trim(),
      status: existing?.status ?? "new",
      sourceNoteId: form.dataset.sourceNoteId ?? "",
      sourceSnippetId: form.dataset.sourceSnippetId ?? "",
      reviewedAt: existing?.reviewedAt ?? "",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) Object.assign(existing, card);
    else data.flashcards.push(card);
  }).then((saved) => {
    if (!saved) return;
    closeModal();
    state.view = "study";
    state.studyCardId = id || state.data.flashcards[state.data.flashcards.length - 1]?.id;
    state.studyCardRevealed = false;
    render();
    notify(id ? "Tarjeta actualizada." : "Tarjeta creada.");
  });
}

function saveQuiz(form) {
  const title = String(new FormData(form).get("title") ?? "").trim();
  const topic = String(new FormData(form).get("topic") ?? "").trim();
  const questionNodes = [...form.querySelectorAll(".quiz-question-editor")];
  if (!title || !questionNodes.length) {
    form.querySelector("#modal-error").textContent = "Escribe un título y agrega al menos una pregunta.";
    return;
  }
  const questions = [];
  for (const [index, node] of questionNodes.entries()) {
    const prompt = node.querySelector("[data-question-prompt]").value.trim();
    const type = node.querySelector("[data-question-type]").value;
    let options = [...node.querySelectorAll("[data-question-option]")].map((input) => input.value.trim());
    const selected = Number(node.querySelector(`input[name="quiz-correct-${index}"]:checked`)?.value);
    let correctIndex = selected;
    if (!Number.isInteger(selected)) {
      form.querySelector("#modal-error").textContent = `Marca la respuesta correcta de la pregunta ${index + 1}.`;
      return;
    }
    if (type === "true-false") options = ["Verdadero", "Falso"];
    else {
      if (!options[selected] || options.slice(0, selected).some((option) => !option)) {
        form.querySelector("#modal-error").textContent = `Completa la respuesta correcta y las opciones anteriores de la pregunta ${index + 1}.`;
        return;
      }
      options = options.filter(Boolean);
      correctIndex = selected;
    }
    if (!prompt || options.length < 2 || correctIndex < 0 || correctIndex >= options.length) {
      form.querySelector("#modal-error").textContent = `Completa la pregunta ${index + 1}, al menos dos opciones y marca la respuesta correcta.`;
      return;
    }
    questions.push({
      id: node.dataset.questionId || crypto.randomUUID(),
      prompt,
      type,
      options,
      correctIndex,
      explanation: node.querySelector("[data-question-explanation]").value.trim(),
    });
  }
  const id = form.dataset.id;
  const now = new Date().toISOString();
  void updateState((data) => {
    const existing = data.quizzes.find((item) => item.id === id);
    const quiz = { id: id || crypto.randomUUID(), title, topic, questions, createdAt: existing?.createdAt ?? now, updatedAt: now };
    if (existing) Object.assign(existing, quiz);
    else data.quizzes.push(quiz);
  }).then((saved) => {
    if (!saved) return;
    closeModal();
    state.view = "study";
    render();
    notify(id ? "Cuestionario actualizado." : "Cuestionario creado.");
  });
}

async function softDelete(kind, id) {
  const collection = { note: "notes", code: "codeSnippets", error: "errors" }[kind];
  const item = state.data[collection]?.find((entry) => entry.id === id);
  if (!item) return;
  const saved = await updateState((data) => {
    data.trash.push({ id: crypto.randomUUID(), kind, item: structuredClone(item), deletedAt: new Date().toISOString() });
    data[collection] = data[collection].filter((entry) => entry.id !== id);
  });
  if (saved) notify("Elemento enviado a la papelera.");
}

function confirmPermanentDelete(entry) {
  const title = entry.item.title ?? entry.item.name ?? "este elemento";
  openModal(`<p class="eyebrow">Acción permanente</p><h2>¿Eliminar «${escapeHtml(title)}» definitivamente?</h2><p class="modal-description">No podrás restaurarlo después de esta acción.</p>
    <div class="form-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancelar</button><button class="button button-danger" type="button" data-action="delete-trash-item" data-id="${escapeHtml(entry.id)}">Eliminar definitivamente</button></div>`);
}

function restoreTrashEntry(id) {
  const entry = state.data.trash.find((item) => item.id === id);
  if (!entry) return;
  if (entry.kind === "note" && !state.data.notebooks.some((notebook) => notebook.id === entry.item.notebookId)) {
    notify("Restaura primero el cuaderno al que pertenece este apunte.", "error");
    return;
  }
  void updateState((data) => {
    if (entry.kind === "notebook") {
      const { notes = [], ...notebook } = entry.item;
      data.notebooks.push(notebook);
      for (const note of notes) {
        if (data.notebooks.some((item) => item.id === note.notebookId)) data.notes.push(note);
      }
    } else {
      const collection = { note: "notes", code: "codeSnippets", error: "errors" }[entry.kind];
      if (!data[collection].some((item) => item.id === entry.item.id)) data[collection].push(entry.item);
    }
    data.trash = data.trash.filter((item) => item.id !== id);
  }).then((saved) => { if (saved) notify("Elemento restaurado."); });
}

function openSearchResult(kind, id) {
  const collections = { note: "notes", code: "codeSnippets", error: "errors", flashcard: "flashcards", quiz: "quizzes" };
  const item = state.data[collections[kind]]?.find((entry) => entry.id === id);
  if (!item) return;
  if (kind === "note") openNoteForm(item);
  else if (kind === "code") openCodeForm(item);
  else if (kind === "error") openErrorForm(item);
  else if (kind === "flashcard") openFlashcardForm(item);
  else {
    state.activeQuizId = item.id;
    state.quizReview = null;
    state.view = "quiz-player";
    render();
  }
}

function markFlashcard(id, status) {
  const now = new Date().toISOString();
  void updateState((data) => {
    const card = data.flashcards.find((item) => item.id === id);
    if (card) Object.assign(card, { status, reviewedAt: now, updatedAt: now });
  }).then((saved) => {
    if (!saved) return;
    const available = state.data.flashcards.filter((item) => topicMatches(state.studyTopic, [item.topic]) && item.id !== id);
    if (available.length) {
      state.studyCardId = state.studyRandom
        ? available[Math.floor(Math.random() * available.length)].id
        : available[(cardsIndex(state.data.flashcards, id) + 1) % available.length]?.id ?? available[0].id;
    } else state.studyCardId = null;
    state.studyCardRevealed = false;
    render();
    notify(status === "known" ? "Tarjeta marcada como conocida." : "Tarjeta añadida al repaso.");
  });
}

function cardsIndex(cards, id) {
  return Math.max(0, cards.findIndex((item) => item.id === id));
}

function submitQuiz() {
  const quiz = state.data.quizzes.find((item) => item.id === state.activeQuizId);
  if (!quiz) return;
  const answers = quiz.questions.map((_, index) => {
    const selected = document.querySelector(`input[name="quiz-answer-${index}"]:checked`);
    return selected ? Number(selected.value) : -1;
  });
  const result = {
    id: crypto.randomUUID(),
    quizId: quiz.id,
    answers,
    total: quiz.questions.length,
    score: answers.reduce((sum, answer, index) => sum + (answer === quiz.questions[index].correctIndex ? 1 : 0), 0),
    completedAt: new Date().toISOString(),
  };
  void updateState((data) => {
    data.quizResults.push(result);
    if (data.quizResults.length > 10000) data.quizResults.shift();
  }).then((saved) => {
    if (!saved) return;
    state.quizReview = result;
    render();
    notify(`Resultado guardado: ${result.score} de ${result.total}.`);
  });
}

function saveNotebook(form) {
  const formData = new FormData(form);
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "");
  const id = form.dataset.id;
  if (!name || name.length > 80 || !colorOptions.some(([value]) => value === color)) {
    form.querySelector("#modal-error").textContent = "Escribe un nombre válido y selecciona un color.";
    return;
  }
  const now = new Date().toISOString();
  void updateState((data) => {
    const existing = data.notebooks.find((notebook) => notebook.id === id);
    if (existing) {
      existing.name = name;
      existing.color = color;
      existing.updatedAt = now;
    } else {
      data.notebooks.push({ id: crypto.randomUUID(), name, color, createdAt: now, updatedAt: now });
    }
  }).then((saved) => {
    if (!saved) return;
    closeModal();
    notify(id ? "Cuaderno actualizado." : "Cuaderno creado.");
  });
}

function saveNote(form) {
  const formData = new FormData(form);
  const title = String(formData.get("title") ?? "").trim();
  const bodyMd = String(formData.get("bodyMd") ?? "");
  const notebookId = String(formData.get("notebookId") ?? "");
  const status = String(formData.get("status") ?? "nuevo");
  const tags = String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12);
  const id = form.dataset.id;
  if (!title || !state.data.notebooks.some((notebook) => notebook.id === notebookId)) {
    form.querySelector("#modal-error").textContent = "Completa un título y selecciona un cuaderno.";
    return;
  }
  const now = new Date().toISOString();
  void updateState((data) => {
    const existing = data.notes.find((note) => note.id === id);
    if (existing) {
      Object.assign(existing, { title, bodyMd, notebookId, status, tags, updatedAt: now });
    } else {
      data.notes.push({ id: crypto.randomUUID(), notebookId, title, bodyMd, status, tags, createdAt: now, updatedAt: now });
    }
  }).then((saved) => {
    if (!saved) return;
    state.selectedNotebookId = notebookId;
    state.view = "notebook";
    closeModal();
    render();
    notify(id ? "Apunte actualizado." : "Apunte guardado.");
  });
}

function downloadBackup() {
  const backup = { format: "kora-backup", version: 1, exportedAt: new Date().toISOString(), data: state.data };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `kora-copia-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Copia JSON descargada.");
}

async function restoreBackup(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    notify("La copia supera el límite de 5 MB.", "error");
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    if (!payload || typeof payload !== "object" || Array.isArray(payload)
        || payload.format !== "kora-backup" || payload.version !== 1 || !payload.data) {
      throw new Error("El archivo no tiene el formato de copia KORA esperado.");
    }
    if (!window.confirm("Importar esta copia reemplazará los cuadernos y apuntes actuales de esta cuenta. ¿Deseas continuar?")) return;
    await api("/api/state", { method: "PUT", body: JSON.stringify(payload.data) });
    state.data = await api("/api/state");
    state.view = "dashboard";
    state.selectedNotebookId = null;
    render();
    notify("Copia importada correctamente.");
  } catch (error) {
    notify(error.message || "No se pudo importar la copia.", "error");
  }
}

async function login(form) {
  const errorNode = form.querySelector("#login-error");
  const button = form.querySelector('button[type="submit"]');
  errorNode.textContent = "";
  button.disabled = true;
  try {
    const formData = new FormData(form);
    const result = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: formData.get("username"), password: formData.get("password") }),
    });
    state.user = result.user;
    state.startupError = "";
    state.loginNotice = "";
    state.preferences = readPreferences(state.user.username);
    state.data = await api("/api/state");
    state.view = "dashboard";
    applyPreferences();
    render();
  } catch (error) {
    errorNode.textContent = error.message || "No se pudo iniciar sesión.";
    button.disabled = false;
  }
}

async function setupAccounts(form) {
  const formData = new FormData(form);
  const passwordOne = String(formData.get("passwordOne") ?? "");
  const confirmOne = String(formData.get("confirmOne") ?? "");
  const errorNode = form.querySelector("#setup-error");
  const button = form.querySelector('button[type="submit"]');
  errorNode.textContent = "";
  if (!setupKey) {
    errorNode.textContent = "No se encontró la clave temporal. Cierra y vuelve a abrir el ejecutable.";
    return;
  }
  if (passwordOne.length < 8 || passwordOne.length > 1024 || passwordOne !== confirmOne) {
    errorNode.textContent = "Usa una contraseña de al menos 8 caracteres y confírmala correctamente.";
    return;
  }
  button.disabled = true;
  try {
    await api("/api/setup", {
      method: "POST",
      body: JSON.stringify({
        accounts: [{ username: "sarharf", password: passwordOne }],
      }),
    });
    state.setupRequired = false;
    state.startupError = "";
    state.loginNotice = "Cuenta configurada. Inicia sesión para continuar.";
    window.history.replaceState(null, "", window.location.pathname);
    render();
  } catch (error) {
    errorNode.textContent = error.message || "No se pudo guardar la configuración.";
    button.disabled = false;
  }
}

async function logout() {
  try {
    await api("/api/logout", { method: "POST", body: "{}" });
    state.user = null;
    state.data = null;
    state.selectedNotebookId = null;
    render();
    notify("Sesión cerrada.");
  } catch (error) {
    notify(error.message || "No se pudo cerrar la sesión.", "error");
  }
}

document.addEventListener("submit", (event) => {
  if (event.target.id === "setup-form") {
    event.preventDefault();
    void setupAccounts(event.target);
  } else if (event.target.id === "login-form") {
    event.preventDefault();
    void login(event.target);
  } else if (event.target.id === "notebook-form") {
    event.preventDefault();
    saveNotebook(event.target);
  } else if (event.target.id === "note-form") {
    event.preventDefault();
    saveNote(event.target);
  } else if (event.target.id === "code-form") {
    event.preventDefault();
    saveCode(event.target);
  } else if (event.target.id === "error-form") {
    event.preventDefault();
    saveError(event.target);
  } else if (event.target.id === "flashcard-form") {
    event.preventDefault();
    saveFlashcard(event.target);
  } else if (event.target.id === "quiz-form") {
    event.preventDefault();
    saveQuiz(event.target);
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action], [data-view], [data-theme-select]");
  if (!button) return;
  const { action, view, id } = button.dataset;
  if (view) {
    state.searchSuggestionsOpen = false;
    state.view = view;
    state.selectedNotebookId = null;
    state.noteSearch = "";
    document.querySelector("#sidebar")?.setAttribute("data-open", "false");
    render();
    return;
  }
  if (!button.closest(".search-suggestions")) state.searchSuggestionsOpen = false;
  if (button.dataset.themeSelect) {
    state.preferences.theme = button.dataset.themeSelect;
    persistPreferences();
    render();
  } else if (action === "toggle-password") {
    const input = app.querySelector("#login-password");
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    button.textContent = visible ? "Ocultar" : "Mostrar";
    button.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
    button.setAttribute("aria-pressed", String(visible));
  } else if (action === "new-notebook") {
    openNotebookForm();
  } else if (action === "edit-notebook") {
    const notebook = state.data.notebooks.find((item) => item.id === id);
    if (notebook) openNotebookForm(notebook);
  } else if (action === "open-notebook") {
    state.selectedNotebookId = id;
    state.view = "notebook";
    state.noteSearch = "";
    render();
  } else if (action === "delete-notebook") {
    const notebook = state.data.notebooks.find((item) => item.id === id);
    if (notebook) confirmDeleteNotebook(notebook);
  } else if (action === "confirm-delete-notebook") {
    const notebook = state.data.notebooks.find((item) => item.id === id);
    void updateState((data) => {
      if (notebook) {
        const relatedNotes = data.notes.filter((note) => note.notebookId === id);
        data.trash.push({
          id: crypto.randomUUID(),
          kind: "notebook",
          item: { ...structuredClone(notebook), notes: structuredClone(relatedNotes) },
          deletedAt: new Date().toISOString(),
        });
      }
      data.notebooks = data.notebooks.filter((item) => item.id !== id);
      data.notes = data.notes.filter((note) => note.notebookId !== id);
    }).then((saved) => {
      if (!saved) return;
      state.view = "notebooks";
      state.selectedNotebookId = null;
      closeModal();
      render();
      notify("Cuaderno y apuntes enviados a la papelera.");
    });
  } else if (action === "new-note") {
    if (state.data.notebooks.length) openNoteForm();
    else notify("Crea un cuaderno antes de guardar apuntes.", "error");
  } else if (action === "edit-note") {
    const note = state.data.notes.find((item) => item.id === id);
    if (note) openNoteForm(note);
  } else if (action === "delete-note") {
    if (window.confirm("¿Mover este apunte a la papelera? Podrás restaurarlo después.")) {
      void softDelete("note", id);
    }
  } else if (action === "card-from-note") {
    const note = state.data.notes.find((item) => item.id === id);
    if (note) {
      const notebook = state.data.notebooks.find((item) => item.id === note.notebookId);
      openFlashcardForm(null, { front: note.title, back: note.bodyMd, topic: notebook?.name ?? "", sourceNoteId: note.id });
    }
  } else if (action === "close-modal") {
    closeModal();
  } else if (action === "toggle-sidebar") {
    const sidebar = document.querySelector("#sidebar");
    const open = sidebar.dataset.open !== "true";
    sidebar.dataset.open = String(open);
    button.setAttribute("aria-expanded", String(open));
  } else if (action === "logout") {
    void logout();
  } else if (action === "export-data") {
    downloadBackup();
  } else if (action === "import-data") {
    app.querySelector("#import-file").click();
  } else if (action === "show-search-results") {
    state.searchSuggestionsOpen = false;
    state.view = "search";
    render();
  } else if (action === "open-search-result") {
    state.searchSuggestionsOpen = false;
    openSearchResult(button.dataset.kind, id);
  } else if (action === "new-code") {
    openCodeForm();
  } else if (action === "edit-code") {
    const item = state.data.codeSnippets.find((entry) => entry.id === id);
    if (item) openCodeForm(item);
  } else if (action === "delete-code") {
    void softDelete("code", id);
  } else if (action === "error-from-code") {
    const source = state.data.codeSnippets.find((item) => item.id === id);
    if (source) openErrorForm(null, source);
  } else if (action === "new-error") {
    openErrorForm();
  } else if (action === "edit-error") {
    const item = state.data.errors.find((entry) => entry.id === id);
    if (item) openErrorForm(item);
  } else if (action === "delete-error") {
    void softDelete("error", id);
  } else if (action === "toggle-error-status") {
    void updateState((data) => {
      const item = data.errors.find((entry) => entry.id === id);
      if (item) {
        item.status = item.status === "solved" ? "pending" : "solved";
        item.updatedAt = new Date().toISOString();
      }
    }).then((saved) => { if (saved) notify("Estado del error actualizado."); });
  } else if (action === "new-flashcard") {
    openFlashcardForm();
  } else if (action === "edit-flashcard") {
    const item = state.data.flashcards.find((entry) => entry.id === id);
    if (item) openFlashcardForm(item);
  } else if (action === "delete-flashcard") {
    if (window.confirm("¿Eliminar esta tarjeta de estudio definitivamente?")) {
      void updateState((data) => { data.flashcards = data.flashcards.filter((item) => item.id !== id); })
        .then((saved) => { if (saved) notify("Tarjeta eliminada."); });
    }
  } else if (action === "flip-card") {
    state.studyCardRevealed = !state.studyCardRevealed;
    render();
  } else if (action === "shuffle-card") {
    state.studyRandom = !state.studyRandom;
    const cards = state.data.flashcards.filter((item) => topicMatches(state.studyTopic, [item.topic]));
    if (state.studyRandom && cards.length) state.studyCardId = cards[Math.floor(Math.random() * cards.length)].id;
    state.studyCardRevealed = false;
    render();
  } else if (action === "card-known") {
    markFlashcard(id, "known");
  } else if (action === "card-needs-review") {
    markFlashcard(id, "review");
  } else if (action === "new-quiz") {
    openQuizForm();
  } else if (action === "edit-quiz") {
    const item = state.data.quizzes.find((entry) => entry.id === id);
    if (item) openQuizForm(item);
  } else if (action === "delete-quiz") {
    if (window.confirm("¿Eliminar este cuestionario? Los resultados anteriores se conservarán.")) {
      void updateState((data) => { data.quizzes = data.quizzes.filter((item) => item.id !== id); })
        .then((saved) => { if (saved) notify("Cuestionario eliminado."); });
    }
  } else if (action === "start-quiz" || action === "repeat-quiz") {
    state.activeQuizId = id;
    state.quizReview = null;
    state.view = "quiz-player";
    render();
  } else if (action === "submit-quiz") {
    submitQuiz();
  } else if (action === "add-quiz-question") {
    const list = modalRoot.querySelector(".quiz-question-edit-list");
    const index = list.children.length;
    list.insertAdjacentHTML("beforeend", quizQuestionEditor({ type: "multiple", options: ["", "", "", ""], correctIndex: 0 }, index));
  } else if (action === "remove-quiz-question") {
    const list = modalRoot.querySelector(".quiz-question-edit-list");
    if (list.children.length <= 1) notify("El cuestionario debe conservar al menos una pregunta.", "error");
    else {
      button.closest(".quiz-question-editor").remove();
      renumberQuizQuestions();
    }
  } else if (action === "restore-trash") {
    restoreTrashEntry(id);
  } else if (action === "confirm-permanent-delete") {
    const entry = state.data.trash.find((item) => item.id === id);
    if (entry) confirmPermanentDelete(entry);
  } else if (action === "delete-trash-item") {
    void updateState((data) => { data.trash = data.trash.filter((item) => item.id !== id); })
      .then((saved) => { if (saved) { closeModal(); notify("Elemento eliminado definitivamente."); } });
  } else if (action === "empty-trash") {
    openModal(`<p class="eyebrow">Acción permanente</p><h2>¿Vaciar toda la papelera?</h2><p class="modal-description">Se eliminarán definitivamente ${state.data.trash.length} elementos. No podrás restaurarlos.</p><div class="form-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancelar</button><button class="button button-danger" type="button" data-action="empty-trash-confirm">Vaciar papelera</button></div>`);
  } else if (action === "empty-trash-confirm") {
    void updateState((data) => { data.trash = []; })
      .then((saved) => { if (saved) { closeModal(); notify("Papelera vaciada."); } });
  } else if (action === "code-undo") {
    undoCode();
  } else if (action === "code-redo") {
    redoCode();
  } else if (action === "copy-code") {
    void copyCode();
  } else if (action === "download-code") {
    downloadCode();
  } else if (action === "find-code") {
    findInCode();
  } else if (action === "font-smaller" || action === "font-larger" || action === "font-reset") {
    const current = Math.max(0, fontSizes.indexOf(state.preferences.fontSize));
    const next = action === "font-reset" ? fontSizes.indexOf("normal")
      : Math.max(0, Math.min(fontSizes.length - 1, current + (action === "font-larger" ? 1 : -1)));
    state.preferences.fontSize = fontSizes[next];
    persistPreferences();
    render();
  }
});

app.addEventListener("input", (event) => {
  if (event.target.id === "notebook-search") {
    state.notebookSearch = event.target.value;
    const filter = state.notebookSearch.trim().toLocaleLowerCase();
    const matches = state.data.notebooks.filter((notebook) => notebook.name.toLocaleLowerCase().includes(filter));
    const results = app.querySelector("#notebook-results");
    if (results) {
      results.innerHTML = !state.data.notebooks.length
        ? renderNotebookGrid([])
        : matches.length
          ? `<div class="notebook-grid">${matches.map(notebookCard).join("")}</div>`
          : `<div class="empty-state"><div><h3>No hay coincidencias</h3><p>Prueba con otro nombre de cuaderno.</p></div></div>`;
    }
  } else if (event.target.id === "note-search") {
    state.noteSearch = event.target.value;
    const notebook = activeNotebook();
    const filter = state.noteSearch.trim().toLocaleLowerCase();
    const notes = state.data.notes.filter((note) => note.notebookId === notebook?.id
      && `${note.title} ${note.bodyMd} ${note.tags.join(" ")}`.toLocaleLowerCase().includes(filter))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const results = app.querySelector("#note-results");
    if (results) results.innerHTML = notes.length
      ? `<div class="note-list">${notes.map((note) => noteCard(note)).join("")}</div>`
      : `<div class="empty-state"><div><h3>No hay coincidencias</h3><p>Prueba otra palabra.</p></div></div>`;
  } else if (event.target.id === "global-search") {
    state.globalSearch = event.target.value;
    state.searchSuggestionsOpen = true;
    const suggestions = app.querySelector("#search-suggestions");
    if (suggestions) suggestions.innerHTML = renderSearchSuggestions(state.globalSearch);
    event.target.setAttribute("aria-expanded", String(Boolean(state.globalSearch.trim())));
  } else if (event.target.id === "code-search") {
    state.codeSearch = event.target.value;
    const snippets = state.data.codeSnippets.filter((item) => [
      item.title, item.description, item.code, item.explanation, item.comments, item.category, item.topic, item.language, ...item.tags,
    ].join(" ").toLocaleLowerCase().includes(state.codeSearch.trim().toLocaleLowerCase()));
    const results = app.querySelector("#code-results");
    if (results) results.innerHTML = snippets.length
      ? `<div class="library-grid">${snippets.map(renderCodeCard).join("")}</div>`
      : `<div class="empty-state"><div><h3>No hay coincidencias</h3><p>Prueba con otros términos de búsqueda.</p></div></div>`;
  } else if (event.target.id === "error-search") {
    state.errorSearch = event.target.value;
    const filter = state.errorSearch.trim().toLocaleLowerCase();
    const items = state.data.errors.filter((item) => (state.errorFilter === "all" || item.status === state.errorFilter)
      && [item.title, item.description, item.code, item.message, item.solution, item.fixedCode, item.language, item.category, item.topic, ...item.tags]
        .join(" ").toLocaleLowerCase().includes(filter));
    const results = app.querySelector("#error-results");
    if (results) results.innerHTML = items.length
      ? `<div class="library-grid">${items.map(renderErrorCard).join("")}</div>`
      : `<div class="empty-state"><div><h3>No hay coincidencias</h3><p>Prueba con otros términos o cambia el filtro de estado.</p></div></div>`;
  }
});

app.addEventListener("change", (event) => {
  const key = event.target.dataset.pref;
  if (key) {
    state.preferences[key] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    persistPreferences();
  }
  if (event.target.id === "import-file") {
    void restoreBackup(event.target.files?.[0]);
    event.target.value = "";
  } else if (event.target.id === "study-topic") {
    state.studyTopic = event.target.value;
    state.studyCardId = null;
    state.studyCardRevealed = false;
    render();
  } else if (event.target.id === "error-filter") {
    state.errorFilter = event.target.value;
    const filter = state.errorSearch.trim().toLocaleLowerCase();
    const items = state.data.errors.filter((item) => (state.errorFilter === "all" || item.status === state.errorFilter)
      && [item.title, item.description, item.code, item.message, item.solution, item.fixedCode, item.language, item.category, item.topic, ...item.tags]
        .join(" ").toLocaleLowerCase().includes(filter));
    const results = app.querySelector("#error-results");
    if (results) results.innerHTML = items.length
      ? `<div class="library-grid">${items.map(renderErrorCard).join("")}</div>`
      : `<div class="empty-state"><div><h3>No hay coincidencias</h3><p>Prueba con otros términos o cambia el filtro de estado.</p></div></div>`;
  }
});

modalRoot.addEventListener("input", (event) => {
  if (event.target.id === "code-input") handleCodeEditorInput();
});

modalRoot.addEventListener("change", (event) => {
  if (event.target.id === "code-language") {
    updateCodeEditor();
  } else if (event.target.id === "code-version") {
    const index = Number(event.target.value);
    const form = modalRoot.querySelector("#code-form");
    const item = state.data.codeSnippets.find((snippet) => snippet.id === form?.dataset.id);
    if (event.target.value && item && Number.isInteger(index) && item.versions[index]) {
      setCodeEditorValue(item.versions[index].code);
      notify("Versión anterior cargada como borrador; guarda para restaurarla.");
    }
  } else if (event.target.matches("[data-question-type]")) {
    const question = event.target.closest(".quiz-question-editor");
    if (event.target.value === "true-false") {
      const options = question.querySelectorAll("[data-question-option]");
      options[0].value = "Verdadero";
      options[1].value = "Falso";
      options[0].disabled = true;
      options[1].disabled = true;
      const correct = question.querySelector('input[type="radio"]:checked');
      if (!correct || Number(correct.value) > 1) question.querySelector('input[type="radio"][value="0"]').checked = true;
      options.forEach((option, index) => {
        if (index > 1) option.parentElement.hidden = true;
      });
    } else {
      question.querySelectorAll("[data-question-option]").forEach((option) => {
        option.disabled = false;
        option.parentElement.hidden = false;
      });
    }
  }
});

modalRoot.addEventListener("scroll", (event) => {
  if (event.target.id === "code-input") updateCodeEditor();
}, true);

document.addEventListener("keydown", (event) => {
  if (event.target.id === "code-input") handleCodeEditorKeydown(event);
  if (event.target.id === "global-search" && event.key === "Enter") {
    event.preventDefault();
    state.globalSearch = event.target.value;
    state.searchSuggestionsOpen = false;
    state.view = "search";
    render();
    app.querySelector("#global-search")?.focus();
    app.querySelector("#global-search")?.select();
  }
  if (event.key === "Escape" && modalRoot.firstElementChild) closeModal();
  const modal = modalRoot.querySelector('[role="dialog"]');
  if (event.key !== "Tab" || !modal) return;
  const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')];
  if (!focusable.length) return;
  if (event.shiftKey && document.activeElement === focusable[0]) {
    event.preventDefault();
    focusable.at(-1).focus();
  } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
    event.preventDefault();
    focusable[0].focus();
  }
});

async function boot() {
  try {
    const status = await api("/api/status");
    state.setupRequired = status.requiresSetup;
    if (state.setupRequired) {
      render();
      return;
    }
    const result = await api("/api/me");
    state.user = result.user;
    state.preferences = readPreferences(state.user.username);
    state.data = await api("/api/state");
  } catch (error) {
    state.user = null;
    state.data = null;
    state.setupRequired = false;
    state.startupError = error.status === 401 ? "" : "No se pudo conectar con el servidor de KORA. Revisa que la aplicación esté ejecutándose.";
  }
  render();
  if (state.startupError) {
    const errorNode = app.querySelector("#login-error");
    if (errorNode) errorNode.textContent = state.startupError;
  }
}

void boot();
