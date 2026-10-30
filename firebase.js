// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, COL_RECORDS } from "./config.js";
import { state } from "./state.js";

export async function initFirebase(onDataUpdate) {
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        
        await signInAnonymously(auth);
        const rechazosRef = collection(db, COL_RECORDS);

        onSnapshot(rechazosRef, (snapshot) => {
            let rawRecords = [];
            snapshot.forEach(docSnap => rawRecords.push({ id: docSnap.id, ...docSnap.data() }));
            state.allRecords = rawRecords;
            
            const st = document.getElementById('sync-status');
            if (st) {
                st.textContent = 'DATA LIVE'; 
                st.style.color = '#10b981';
            }
            const dot = document.getElementById('live-dot-indicator');
            if (dot) dot.style.backgroundColor = '#10b981';
            
            if (onDataUpdate) onDataUpdate();
        }, (error) => {
            console.error(error);
            const st = document.getElementById('sync-status');
            if (st) {
                st.textContent = 'OFFLINE';
                st.style.color = '#ef4444';
            }
            const dot = document.getElementById('live-dot-indicator');
            if (dot) dot.style.backgroundColor = '#ef4444';
        });
    } catch (error) {
        console.error(error);
        const st = document.getElementById('sync-status');
        if (st) st.textContent = 'ERROR DB';
    }
}
