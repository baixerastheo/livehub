import { app, BrowserWindow, shell, Menu, ipcMain, nativeImage } from "electron";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import http from "http";

const isDev = process.env.NODE_ENV === "development";
const DEV_URL = "http://localhost:3000";
const PROD_PORT = 3000;

let mainWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | null = null;

function createWindow(url: string) {
  Menu.setApplicationMenu(null);

  const iconPath = path.join(__dirname, "..", "assets", "icon.png");

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#ffffff",
      symbolColor: "#0f172a",
      height: 45,
    },
    show: false,
  });

  mainWindow.loadURL(url);

  // Make the navbar draggable and reserve space for native window controls
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.insertCSS(`
      :root { --app-navbar-height: 46px !important; }
      body > header {
        -webkit-app-region: drag;
        padding-right: calc(100vw - env(titlebar-area-width, 100vw) + 16px) !important;
        height: 46px !important;
        min-height: 46px !important;
      }
      body > header * {
        -webkit-app-region: no-drag;
      }
    `);
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Open external links in the default browser instead of Electron
  mainWindow.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    shell.openExternal(openUrl);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function waitForServer(url: string, retries = 30, delay = 500): Promise<void> {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else {
            retry();
          }
        })
        .on("error", () => retry());
    };

    const retry = () => {
      if (retries-- <= 0) {
        reject(new Error("Next.js server did not start in time"));
        return;
      }
      setTimeout(attempt, delay);
    };

    attempt();
  });
}

async function startProdServer(): Promise<string> {
  const serverPath = path.join(
    app.getAppPath(),
    "../frontend-standalone/server.js",
  );

  nextServer = spawn("node", [serverPath], {
    env: { ...process.env, PORT: String(PROD_PORT) },
    stdio: "inherit",
  });

  const url = `http://localhost:${PROD_PORT}`;
  await waitForServer(url);
  return url;
}

app.setAppUserModelId("com.livehub.app");

ipcMain.on("set-badge", (_event, count: number) => {
  if (process.platform === "darwin") {
    app.setBadgeCount(count);
  } else if (process.platform === "win32" && mainWindow) {
    if (count === 0) {
      mainWindow.setOverlayIcon(null, "");
    } else {
      const badgeIcon = nativeImage
        .createFromPath(path.join(__dirname, "..", "assets", "badge.png"))
        .resize({ width: 16, height: 16 });
      mainWindow.setOverlayIcon(badgeIcon, `${count} notification(s)`);
    }
  }
});

app.whenReady().then(async () => {
  try {
    const url = isDev ? DEV_URL : await startProdServer();
    if (isDev) {
      await waitForServer(url);
    }
    createWindow(url);
  } catch (err) {
    console.error("Failed to start:", err);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(isDev ? DEV_URL : `http://localhost:${PROD_PORT}`);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    nextServer?.kill();
    app.quit();
  }
});

app.on("before-quit", () => {
  nextServer?.kill();
});
