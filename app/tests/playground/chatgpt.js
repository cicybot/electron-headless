(async () => {

    function useIndexedDB(dbName, storeName) {
        return {
            openDB: function () {
                return new Promise((resolve, reject) => {
                    // ⬇️ FIXED: removed explicit version
                    const request = indexedDB.open(dbName);

                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                        }
                    };

                    request.onsuccess = (event) => resolve(event.target.result);
                    request.onerror = (event) => reject(event.target.error);
                });
            },

            addItem: async function (item) {
                const db = await this.openDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const request = store.add(item);

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            },

            getItem: async function (id) {
                const db = await this.openDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const request = store.get(id);

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            },

            getAllItems: async function () {
                const db = await this.openDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const request = store.getAll();

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }
        };
    }

    const db = useIndexedDB('ConversationsDatabase', 'conversations');

    const allItems = await db.getAllItems();
    function getChats(chat){
        const {id,messages,title,updateTime} = chat
        const rows = []
        for (let i = 0; i < messages.length; i++) {
            const {text} = messages[i]
            rows.push(text)
        }
        rows.reverse()
        let reply = null
        if(rows.length > 0){
            reply = rows[0]
        }
        return {
            id,title,reply,updateTime,messages:rows
        }
    }

    const chat =  getChats(allItems[0])
    console.log(chat,allItems[0]); // ⬅️ browsers ignore "return" in IIFE in console, so log it instead
    return chat
})();
