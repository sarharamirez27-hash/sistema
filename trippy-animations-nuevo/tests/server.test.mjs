import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import { after, before, test } from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAppServer } from "../server.mjs";

const accounts = [{ username: "sarharf", password: "unit-test-password-one" }];
const dataDir = await mkdtemp(join(tmpdir(), "kora-test-"));
const server = await createAppServer({ accounts, dataDir, logger: { error() {} } });

let origin;
let sessionOne;

before(async () => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  origin = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await rm(dataDir, { recursive: true, force: true });
});

async function postJson(path, payload, cookie) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(payload),
  });
  return response;
}

async function login(account) {
  const response = await postJson("/api/login", account);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  return { response, cookie };
}

test("la interfaz se sirve con una política de seguridad y sin exponer datos", async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
  assert.match(await response.text(), /KORA · Trippy Animations/);
});

test("valida las credenciales y mantiene una sesión de servidor HttpOnly", async () => {
  const invalid = await postJson("/api/login", { username: accounts[0].username, password: "incorrecta" });
  assert.equal(invalid.status, 401);
  const secondary = await postJson("/api/login", { username: "alejovg", password: "unit-test-password-two" });
  assert.equal(secondary.status, 401);

  const result = await login(accounts[0]);
  assert.equal(result.response.status, 200);
  assert.match(result.response.headers.get("set-cookie"), /HttpOnly/);
  sessionOne = result.cookie;

  const profile = await fetch(`${origin}/api/me`, { headers: { Cookie: sessionOne } });
  assert.deepEqual(await profile.json(), { user: { username: accounts[0].username } });
});

test("guarda los cuadernos y apuntes de la cuenta autenticada", async () => {
  const saved = await fetch(`${origin}/api/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: origin, Cookie: sessionOne },
    body: JSON.stringify({
      version: 1,
      notebooks: [{ id: "n-1", name: "Biología", color: "menta" }],
      notes: [{ id: "note-1", notebookId: "n-1", title: "Células", bodyMd: "Membrana", status: "nuevo", tags: [] }],
    }),
  });
  assert.equal(saved.status, 200);

  const ownState = await fetch(`${origin}/api/state`, { headers: { Cookie: sessionOne } });
  const body = await ownState.json();
  assert.equal(body.notebooks[0].color, "menta");
  assert.equal(body.notes[0].notebookId, body.notebooks[0].id);
  assert.deepEqual(body.codeSnippets, []);
  assert.deepEqual(body.flashcards, []);
});

test("valida y persiste código, errores, papelera y material de estudio", async () => {
  const state = {
    version: 1,
    notebooks: [{ id: "n-study", name: "Programación", color: "azul" }],
    notes: [{ id: "note-study", notebookId: "n-study", title: "Funciones", bodyMd: "Una función reutiliza instrucciones.", status: "nuevo", tags: ["js"] }],
    codeSnippets: [{
      id: "code-1", title: "Saludo", description: "Función de ejemplo", language: "javascript",
      code: "function saludo() {}", category: "Funciones", topic: "JavaScript", tags: ["funciones"],
      explanation: "Declara una función.", comments: "Sin efectos secundarios.", versions: [],
    }],
    errors: [{
      id: "error-1", title: "Función no definida", description: "Se llamó una función inexistente.",
      code: "saludo()", message: "ReferenceError", language: "javascript", solution: "Declarar la función.",
      fixedCode: "function saludo() {}", category: "Referencia", topic: "JavaScript", tags: ["scope"],
      status: "pending", sourceCodeId: "code-1",
    }],
    flashcards: [{
      id: "card-1", front: "¿Qué es una función?", back: "Un bloque reutilizable de instrucciones.",
      topic: "JavaScript", status: "new", sourceNoteId: "note-study",
    }],
    quizzes: [{
      id: "quiz-1", title: "Fundamentos", topic: "JavaScript",
      questions: [{
        id: "question-1", prompt: "¿Una función puede reutilizarse?", type: "true-false",
        options: ["Verdadero", "Falso"], correctIndex: 0, explanation: "Se invoca cada vez que se necesita.",
      }],
    }],
    quizResults: [{ id: "result-1", quizId: "quiz-1", score: 1, total: 1, answers: [0] }],
    trash: [{ id: "trash-1", kind: "code", item: { id: "deleted-code", title: "Código guardado" } }],
  };
  const response = await fetch(`${origin}/api/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: origin, Cookie: sessionOne },
    body: JSON.stringify(state),
  });
  assert.equal(response.status, 200);
  const saved = await fetch(`${origin}/api/state`, { headers: { Cookie: sessionOne } });
  const body = await saved.json();
  assert.equal(body.codeSnippets[0].versions.length, 0);
  assert.equal(body.errors[0].status, "pending");
  assert.equal(body.flashcards[0].sourceNoteId, "note-study");
  assert.equal(body.quizzes[0].questions[0].correctIndex, 0);
  assert.equal(body.quizResults[0].score, 1);
  assert.equal(body.trash[0].kind, "code");
  const disk = JSON.parse(await readFile(join(dataDir, "73617268617266.json"), "utf8"));
  assert.equal(disk.codeSnippets[0].code, "function saludo() {}");
});

test("rechaza datos inválidos en las nuevas colecciones", async () => {
  const response = await fetch(`${origin}/api/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: origin, Cookie: sessionOne },
    body: JSON.stringify({
      version: 1, notebooks: [], notes: [],
      codeSnippets: [{ id: "invalid-code", title: "Código", language: "ruby", code: "", versions: [] }],
    }),
  });
  assert.equal(response.status, 400);

  const invalidTrueFalse = await fetch(`${origin}/api/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: origin, Cookie: sessionOne },
    body: JSON.stringify({
      version: 1, notebooks: [], notes: [],
      quizzes: [{
        id: "invalid-quiz", title: "Cuestionario",
        questions: [{
          id: "invalid-question", prompt: "¿Es verdadero?", type: "true-false",
          options: ["Verdadero", "Falso", "Otra opción"], correctIndex: 0,
        }],
      }],
    }),
  });
  assert.equal(invalidTrueFalse.status, 400);
});

test("rechaza apuntes que no pertenecen a un cuaderno existente", async () => {
  const response = await fetch(`${origin}/api/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: origin, Cookie: sessionOne },
    body: JSON.stringify({
      version: 1,
      notebooks: [],
      notes: [{ id: "orphan", notebookId: "missing", title: "Sin cuaderno", bodyMd: "", status: "nuevo", tags: [] }],
    }),
  });
  assert.equal(response.status, 400);
});

test("rechaza modificaciones con un origen ajeno", async () => {
  const response = await fetch(`${origin}/api/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: "https://otro.example", Cookie: sessionOne },
    body: JSON.stringify({ version: 1, notebooks: [], notes: [] }),
  });
  assert.equal(response.status, 403);
});

test("normaliza fechas inválidas al guardar una copia", async () => {
  const response = await fetch(`${origin}/api/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: origin, Cookie: sessionOne },
    body: JSON.stringify({
      version: 1,
      notebooks: [{ id: "n-date", name: "Notas", color: "violeta", createdAt: "fecha-inválida" }],
      notes: [],
    }),
  });
  assert.equal(response.status, 200);
  const saved = await fetch(`${origin}/api/state`, { headers: { Cookie: sessionOne } });
  const body = await saved.json();
  assert.match(body.notebooks[0].createdAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("cerrar sesión invalida la cookie existente", async () => {
  const logout = await postJson("/api/logout", {}, sessionOne);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  const profile = await fetch(`${origin}/api/me`, { headers: { Cookie: sessionOne } });
  assert.equal(profile.status, 401);
});

test("configura una cuenta una sola vez y persiste solo hashes", async () => {
  const setupDir = await mkdtemp(join(tmpdir(), "kora-setup-test-"));
  const setupStore = join(setupDir, "accounts.json");
  const setupServer = await createAppServer({
    accountStorePath: setupStore,
    dataDir: join(setupDir, "data"),
    setupKey: "test-only-setup-token-123456789",
    logger: { error() {} },
  });
  try {
    await new Promise((resolve, reject) => {
      setupServer.once("error", reject);
      setupServer.listen(0, "127.0.0.1", resolve);
    });
    const address = setupServer.address();
    const setupOrigin = `http://127.0.0.1:${address.port}`;
    const status = await fetch(`${setupOrigin}/api/status`);
    assert.deepEqual(await status.json(), { requiresSetup: true });

    const configured = await fetch(`${setupOrigin}/api/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: setupOrigin,
        "X-Kora-Setup-Key": "test-only-setup-token-123456789",
      },
      body: JSON.stringify({
        accounts: [{ username: "sarharf", password: "temporary-unit-password-one" }],
      }),
    });
    assert.equal(configured.status, 201);
    const stored = await readFile(setupStore, "utf8");
    assert.equal(stored.includes("temporary-unit-password-one"), false);
    assert.deepEqual(JSON.parse(stored).accounts.map(({ username }) => username), ["sarharf"]);

    const secondStatus = await fetch(`${setupOrigin}/api/status`);
    assert.deepEqual(await secondStatus.json(), { requiresSetup: false });
    const repeatedSetup = await fetch(`${setupOrigin}/api/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: setupOrigin,
        "X-Kora-Setup-Key": "test-only-setup-token-123456789",
      },
      body: JSON.stringify({ accounts: [] }),
    });
    assert.equal(repeatedSetup.status, 409);

    const login = await fetch(`${setupOrigin}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: setupOrigin },
      body: JSON.stringify({ username: "sarharf", password: "temporary-unit-password-one" }),
    });
    assert.equal(login.status, 200);

    const secondaryLogin = await fetch(`${setupOrigin}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: setupOrigin },
      body: JSON.stringify({ username: "alejovg", password: "temporary-unit-password-one" }),
    });
    assert.equal(secondaryLogin.status, 401);
  } finally {
    await new Promise((resolve, reject) => setupServer.close((error) => error ? reject(error) : resolve()));
    await rm(setupDir, { recursive: true, force: true });
  }
});

test("migra el almacén anterior conservando una sola credencial", async () => {
  const migrationDir = await mkdtemp(join(tmpdir(), "kora-migration-test-"));
  const migrationStore = join(migrationDir, "accounts.json");
  const primarySalt = Buffer.alloc(16, 1);
  const secondarySalt = Buffer.alloc(16, 2);
  await writeFile(migrationStore, JSON.stringify({
    version: 1,
    accounts: [
      {
        username: "sarharf",
        salt: primarySalt.toString("base64"),
        hash: scryptSync("legacy-primary-password", primarySalt, 64).toString("base64"),
      },
      {
        username: "alejovg",
        salt: secondarySalt.toString("base64"),
        hash: scryptSync("legacy-secondary-password", secondarySalt, 64).toString("base64"),
      },
    ],
  }));
  const migrationServer = await createAppServer({
    accountStorePath: migrationStore,
    dataDir: join(migrationDir, "data"),
    logger: { error() {} },
  });
  try {
    await new Promise((resolve, reject) => {
      migrationServer.once("error", reject);
      migrationServer.listen(0, "127.0.0.1", resolve);
    });
    const address = migrationServer.address();
    const migrationOrigin = `http://127.0.0.1:${address.port}`;
    const stored = JSON.parse(await readFile(migrationStore, "utf8"));
    assert.deepEqual(stored.accounts.map(({ username }) => username), ["sarharf"]);

    const primaryLogin = await fetch(`${migrationOrigin}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: migrationOrigin },
      body: JSON.stringify({ username: "sarharf", password: "legacy-primary-password" }),
    });
    assert.equal(primaryLogin.status, 200);
    const secondaryLogin = await fetch(`${migrationOrigin}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: migrationOrigin },
      body: JSON.stringify({ username: "alejovg", password: "legacy-secondary-password" }),
    });
    assert.equal(secondaryLogin.status, 401);
  } finally {
    await new Promise((resolve, reject) => migrationServer.close((error) => error ? reject(error) : resolve()));
    await rm(migrationDir, { recursive: true, force: true });
  }
});
