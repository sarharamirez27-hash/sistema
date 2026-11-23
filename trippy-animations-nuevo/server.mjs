import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { emptyState, validateState } from "./state-validation.mjs";

const scrypt = promisify(scryptCallback);
const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const publicRoot = resolve(projectRoot, "public");
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const bodyLimitBytes = 6 * 1024 * 1024;
const setupUsername = "sarharf";
const legacyUsernames = new Set([setupUsername, "alejovg"]);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

export function accountsFromEnvironment(env = process.env) {
  const username = env.TRIPPY_USER ?? env.TRIPPY_USER_1 ?? setupUsername;
  const password = env.TRIPPY_PASSWORD ?? env.TRIPPY_PASSWORD_1;
  if (username !== setupUsername || typeof password !== "string" || password.length < 8) {
    throw new Error(`Configura TRIPPY_PASSWORD para el usuario ${setupUsername}; debe tener al menos 8 caracteres.`);
  }
  return [{ username, password }];
}

function jsonResponse(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
    throw Object.assign(new Error("Se esperaba una solicitud JSON."), { status: 415 });
  }

  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > bodyLimitBytes) {
      throw Object.assign(new Error("El archivo enviado supera el tamaño permitido."), { status: 413 });
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("El contenido JSON no es válido."), { status: 400 });
  }
}

function getCookie(request, name) {
  const cookies = request.headers.cookie?.split(";") ?? [];
  const entry = cookies.map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left, right) {
  return left.length === right.length && timingSafeEqual(left, right);
}

async function deriveCredentials(accounts) {
  if (!Array.isArray(accounts) || accounts.length !== 1) {
    throw new Error("La aplicación solo admite una cuenta.");
  }
  const { username, password } = accounts[0];
  if (username !== setupUsername || typeof password !== "string"
      || password.length < 8 || password.length > 1024) {
    throw new Error("La cuenta configurada no es válida.");
  }
  const salt = randomBytes(16);
  return [{ username, salt, hash: await scrypt(password, salt, 64) }];
}

async function readCredentialStore(file) {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    if (parsed.version !== 1 || !Array.isArray(parsed.accounts)
        || parsed.accounts.length < 1 || parsed.accounts.length > 2) {
      throw new Error("El archivo local de cuentas no tiene un formato válido.");
    }
    const records = parsed.accounts.map((account) => ({
      username: account.username,
      salt: Buffer.from(account.salt, "base64"),
      hash: Buffer.from(account.hash, "base64"),
    }));
    if (records.some((record) => !legacyUsernames.has(record.username)
        || record.salt.length !== 16 || record.hash.length !== 64)
        || new Set(records.map((record) => record.username)).size !== records.length) {
      throw new Error("El archivo local de cuentas está incompleto o dañado.");
    }
    const primary = records.find((record) => record.username === setupUsername) ?? records[0];
    const migrated = { ...primary, username: setupUsername };
    if (records.length !== 1 || primary.username !== setupUsername) {
      await writeCredentialStore(file, [migrated]);
    }
    return [migrated];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeCredentialStore(file, credentials) {
  const temporary = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  await mkdir(dirname(file), { recursive: true });
  try {
    await writeFile(temporary, JSON.stringify({
      version: 1,
      accounts: credentials.map(({ username, salt, hash }) => ({
        username,
        salt: salt.toString("base64"),
        hash: hash.toString("base64"),
      })),
    }, null, 2), { mode: 0o600 });
    await rename(temporary, file);
  } catch (error) {
    try {
      await unlink(temporary);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") throw cleanupError;
    }
    throw error;
  }
}

function sameOrigin(request, configuredOrigin) {
  const supplied = request.headers.origin;
  if (!supplied) return false;
  try {
    const expected = configuredOrigin ?? `http://${request.headers.host}`;
    return new URL(supplied).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}

function stateFile(dataDir, username) {
  return resolve(dataDir, `${Buffer.from(username, "utf8").toString("hex")}.json`);
}

export async function createAppServer({
  accounts = null,
  accountStorePath = null,
  setupKey = null,
  dataDir = resolve(projectRoot, "data"),
  publicOrigin = null,
  secureCookie = false,
  logger = console,
}) {
  let credentials;
  if (Array.isArray(accounts) && accounts.length === 1) {
    credentials = await deriveCredentials(accounts);
  } else if (accounts === null && accountStorePath) {
    credentials = await readCredentialStore(accountStorePath);
  } else {
    throw new Error("La aplicación requiere la cuenta configurada.");
  }
  if (!credentials.length && !setupKey) {
    throw new Error("No hay cuentas guardadas ni una clave habilitada para la configuración inicial.");
  }
  const dummySalt = randomBytes(16);
  const dummyHash = await scrypt(randomBytes(32), dummySalt, 64);
  const sessions = new Map();
  const failedLogins = new Map();
  const stateCache = new Map();
  const writeQueues = new Map();
  let setupInProgress = false;

  async function loadState(username) {
    if (stateCache.has(username)) return structuredClone(stateCache.get(username));
    const file = stateFile(dataDir, username);
    try {
      const serialized = await readFile(file, "utf8");
      const parsed = validateState(JSON.parse(serialized));
      if (parsed.error) throw new Error(parsed.error);
      stateCache.set(username, parsed.state);
      return structuredClone(parsed.state);
    } catch (error) {
      if (error.code === "ENOENT") {
        const fresh = emptyState();
        stateCache.set(username, fresh);
        return structuredClone(fresh);
      }
      throw error;
    }
  }

  async function saveState(username, state) {
    const previous = writeQueues.get(username) ?? Promise.resolve();
    const next = previous.catch(() => {}).then(async () => {
      const file = stateFile(dataDir, username);
      const temporary = `${file}.${randomBytes(6).toString("hex")}.tmp`;
      await mkdir(dataDir, { recursive: true });
      try {
        await writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
        await rename(temporary, file);
      } catch (error) {
        try {
          await unlink(temporary);
        } catch (cleanupError) {
          if (cleanupError.code !== "ENOENT") logger.error("No se pudo limpiar un archivo temporal:", cleanupError);
        }
        throw error;
      }
      stateCache.set(username, state);
    });
    writeQueues.set(username, next);
    try {
      await next;
    } finally {
      if (writeQueues.get(username) === next) writeQueues.delete(username);
    }
  }

  function currentUser(request) {
    const token = getCookie(request, "trippy_session");
    if (!token) return null;
    const key = sha256(token);
    const session = sessions.get(key);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      sessions.delete(key);
      return null;
    }
    return session.username;
  }

  function cookieHeader(value, maxAge) {
    const parts = [`trippy_session=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${maxAge}`];
    if (secureCookie) parts.push("Secure");
    return parts.join("; ");
  }

  async function handleApi(request, response, url) {
    const method = request.method ?? "GET";
    if (["POST", "PUT", "DELETE"].includes(method) && !sameOrigin(request, publicOrigin)) {
      jsonResponse(response, 403, { error: "La solicitud no proviene de este sitio." });
      return;
    }

    if (url.pathname === "/api/status" && method === "GET") {
      jsonResponse(response, 200, { requiresSetup: credentials.length === 0 });
      return;
    }

    if (url.pathname === "/api/setup" && method === "POST") {
      if (!accountStorePath || !setupKey || credentials.length) {
        jsonResponse(response, 409, { error: "La configuración inicial ya se completó." });
        return;
      }
      const providedKey = request.headers["x-kora-setup-key"];
      if (typeof providedKey !== "string"
          || !safeEqual(Buffer.from(providedKey), Buffer.from(setupKey))) {
        jsonResponse(response, 403, { error: "No se autorizó la configuración inicial." });
        return;
      }
      if (setupInProgress) {
        jsonResponse(response, 409, { error: "La configuración inicial ya está en curso." });
        return;
      }
      const payload = await readJsonBody(request);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)
          || !Array.isArray(payload.accounts) || payload.accounts.length !== 1
          || payload.accounts[0]?.username !== setupUsername) {
        jsonResponse(response, 400, { error: `Debes configurar la cuenta ${setupUsername}.` });
        return;
      }
      if (payload.accounts.some((account) => typeof account.password !== "string"
          || account.password.length < 8 || account.password.length > 1024)) {
        jsonResponse(response, 400, { error: "Cada contraseña debe tener entre 8 y 1024 caracteres." });
        return;
      }
      setupInProgress = true;
      try {
        const newCredentials = await deriveCredentials(payload.accounts);
        await writeCredentialStore(accountStorePath, newCredentials);
        credentials = newCredentials;
        jsonResponse(response, 201, { ok: true });
      } finally {
        setupInProgress = false;
      }
      return;
    }

    if (url.pathname === "/api/login" && method === "POST") {
      if (!credentials.length) {
        jsonResponse(response, 503, { error: "Completa la configuración inicial antes de iniciar sesión." });
        return;
      }
      const address = request.socket.remoteAddress ?? "desconocido";
      const now = Date.now();
      const bucket = failedLogins.get(address);
      if (bucket && bucket.resetAt <= now) failedLogins.delete(address);
      const activeBucket = failedLogins.get(address);
      if (activeBucket && activeBucket.count >= 8) {
        jsonResponse(response, 429, { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." }, {
          "Retry-After": String(Math.ceil((activeBucket.resetAt - now) / 1000)),
        });
        return;
      }

      const payload = await readJsonBody(request);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        jsonResponse(response, 400, { error: "El formulario de acceso no es válido." });
        return;
      }
      const username = typeof payload.username === "string" ? payload.username : "";
      const password = typeof payload.password === "string" ? payload.password : "";
      if (username.length > 48 || password.length > 1024) {
        jsonResponse(response, 401, { error: "Usuario o contraseña incorrectos." });
        return;
      }
      const account = credentials.find((item) => item.username === username);
      const salt = account?.salt ?? dummySalt;
      const expectedHash = account?.hash ?? dummyHash;
      const candidate = await scrypt(password, salt, 64);
      const accepted = account !== undefined && safeEqual(candidate, expectedHash);

      if (!accepted) {
        const prior = failedLogins.get(address);
        failedLogins.set(address, {
          count: (prior?.count ?? 0) + 1,
          resetAt: prior?.resetAt > now ? prior.resetAt : now + 15 * 60 * 1000,
        });
        if (failedLogins.size > 1000) {
          for (const [ip, entry] of failedLogins) {
            if (entry.resetAt <= now) failedLogins.delete(ip);
          }
        }
        jsonResponse(response, 401, { error: "Usuario o contraseña incorrectos." });
        return;
      }

      failedLogins.delete(address);
      for (const [sessionKey, session] of sessions) {
        if (session.expiresAt <= now) sessions.delete(sessionKey);
      }
      const token = randomBytes(32).toString("base64url");
      sessions.set(sha256(token), { username, expiresAt: now + sessionLifetimeMs });
      jsonResponse(response, 200, { user: { username } }, {
        "Set-Cookie": cookieHeader(token, sessionLifetimeMs / 1000),
      });
      return;
    }

    if (url.pathname === "/api/logout" && method === "POST") {
      const token = getCookie(request, "trippy_session");
      if (token) sessions.delete(sha256(token));
      jsonResponse(response, 200, { ok: true }, { "Set-Cookie": cookieHeader("", 0) });
      return;
    }

    if (url.pathname === "/api/me" && method === "GET") {
      const username = currentUser(request);
      if (!username) {
        jsonResponse(response, 401, { error: "Inicia sesión para continuar." });
        return;
      }
      jsonResponse(response, 200, { user: { username } });
      return;
    }

    if (url.pathname === "/api/state" && method === "GET") {
      const username = currentUser(request);
      if (!username) {
        jsonResponse(response, 401, { error: "Inicia sesión para continuar." });
        return;
      }
      jsonResponse(response, 200, await loadState(username));
      return;
    }

    if (url.pathname === "/api/state" && method === "PUT") {
      const username = currentUser(request);
      if (!username) {
        jsonResponse(response, 401, { error: "La sesión terminó. Vuelve a ingresar." });
        return;
      }
      const payload = await readJsonBody(request);
      const result = validateState(payload);
      if (result.error) {
        jsonResponse(response, 400, { error: result.error });
        return;
      }
      await saveState(username, result.state);
      jsonResponse(response, 200, { ok: true });
      return;
    }

    jsonResponse(response, 404, { error: "La ruta solicitada no existe." });
  }

  async function serveStatic(request, response, url) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      jsonResponse(response, 405, { error: "Método no permitido." }, { Allow: "GET, HEAD" });
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    } catch {
      jsonResponse(response, 400, { error: "La ruta solicitada no es válida." });
      return;
    }
    const file = resolve(publicRoot, `.${pathname}`);
    if (file !== publicRoot && !file.startsWith(`${publicRoot}${sep}`)) {
      jsonResponse(response, 403, { error: "Acceso denegado." });
      return;
    }
    try {
      const content = await readFile(file);
      response.writeHead(200, {
        "Content-Type": mimeTypes.get(extname(file).toLowerCase()) ?? "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "EISDIR") {
        jsonResponse(response, 404, { error: "El recurso solicitado no existe." });
        return;
      }
      throw error;
    }
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url);
      } else {
        await serveStatic(request, response, url);
      }
    } catch (error) {
      logger.error("Error al procesar una solicitud:", error);
      if (!response.headersSent) {
        jsonResponse(response, error.status ?? 500, {
          error: error.status ? error.message : "Ocurrió un error interno. Revisa el registro del servidor.",
        });
      } else {
        response.destroy();
      }
    }
  });

  server.requiresAccountSetup = () => credentials.length === 0;
  return server;
}

async function start() {
  const accounts = accountsFromEnvironment();
  const port = Number(process.env.TRIPPY_PORT ?? 4173);
  const host = process.env.TRIPPY_HOST ?? "127.0.0.1";
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("TRIPPY_PORT debe ser un puerto válido.");
  }
  const server = await createAppServer({
    accounts,
    dataDir: resolve(process.env.TRIPPY_DATA_DIR ?? "data"),
    publicOrigin: process.env.TRIPPY_PUBLIC_ORIGIN || null,
    secureCookie: process.env.TRIPPY_SECURE_COOKIE === "true",
  });
  server.listen(port, host, () => {
    console.log(`KORA · Trippy Animations disponible en http://${host}:${port}`);
    console.log("Las credenciales se leen del archivo .env y nunca se envían al navegador.");
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await start();
}
