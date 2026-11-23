const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const { randomBytes } = require("node:crypto");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

app.setName("KORA Trippy Animations");
const userDataPath = path.join(app.getPath("appData"), "KORA-Trippy-Animations");
app.setPath("userData", userDataPath);

let server;
let mainWindow;
let appUrl;
let appOrigin;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 600,
    title: "KORA · Trippy Animations",
    backgroundColor: "#07121c",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (/^https?:/.test(url) && new URL(url).origin !== appOrigin) shell.openExternal(url);
    } catch (error) {
      console.error("No se pudo validar el enlace solicitado.", error);
    }
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    try {
      if (new URL(url).origin !== appOrigin) event.preventDefault();
    } catch {
      event.preventDefault();
    }
  });
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
  win.loadURL(appUrl).catch((error) => {
    console.error("No se pudo abrir la interfaz de KORA.", error);
    dialog.showErrorBox("KORA no pudo iniciar", "No se pudo cargar la interfaz. Revisa los archivos de la aplicación.");
  });
  mainWindow = win;
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  const { createAppServer } = await import(pathToFileURL(path.join(__dirname, "server.mjs")).href);
  const setupKey = randomBytes(32).toString("base64url");
  server = await createAppServer({
    accountStorePath: path.join(userDataPath, "accounts.json"),
    dataDir: path.join(userDataPath, "data"),
    setupKey,
    logger: console,
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  appOrigin = `http://127.0.0.1:${address.port}`;
  const setupQuery = server.requiresAccountSetup() ? `?setup=${encodeURIComponent(setupKey)}` : "";
  appUrl = `${appOrigin}/${setupQuery}`;
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error("No se pudo iniciar KORA.", error);
  dialog.showErrorBox("KORA no pudo iniciar", error.message || "Ocurrió un error inesperado.");
  app.quit();
});

app.on("before-quit", () => {
  if (server?.listening) server.close((error) => {
    if (error) console.error("No se pudo cerrar el servidor local de KORA.", error);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
