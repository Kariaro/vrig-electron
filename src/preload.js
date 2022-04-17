const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('Access', {
    test: (param) => {
        ipcRenderer.invoke('test', param);
    }
});
