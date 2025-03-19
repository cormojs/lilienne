import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as url from "url";

let mainWindow: Electron.BrowserWindow;

function createWindow() {
  let mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    webPreferences: {
      webSecurity: false,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "html/index.html"),
      protocol: "file:",
      slashes: true,
    }),
  );
  mainWindow.webContents.openDevTools();
  mainWindow.on("close", () => {
    mainWindow = <any>null;
  });
}

app.on("ready", createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

process.chdir(__dirname);
