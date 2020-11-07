import  {app, BrowserWindow} from "electron";

app.on("ready", () => {
    let win = new BrowserWindow();
    win.setBounds({ x: 0, y: 0, width: 800, height: 600 });
});
