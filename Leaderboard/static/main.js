        // 1. OBS-Modus erkennen (blendet das Dashboard aus)
        const isOBS = new URLSearchParams(window.location.search).has('obs');
        if (isOBS) {
            document.getElementById('control-panel').style.display = 'none';
            document.getElementById('Test').style.display = 'block';
        } else {
            document.getElementById('Test').style.display = 'none';
            // Fix: Damit background-repeat auch hier greift, setzen wir es explizit
            document.body.style.background = 'linear-gradient(38deg, #382148, #482121)'; 
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundPosition = 'center';
        }
        //Server Conection
        const host = window.location.host;
        const ws = new WebSocket(`ws://${host}/ws`);
        
        let state = true //updates müssen an server
        let PlayerPoint = [
            {"Player": "zitrone", "DisplayName": "Zitrone_2010", "Points": 0},
            {"Player": "luma", "DisplayName": "LuMa_369", "Points": 0},
            {"Player": "kai", "DisplayName": "Kaiomatiko", "Points": 0},
            {"Player": "arong", "DisplayName": "Arongforce", "Points": 0},
            {"Player": "solaris", "DisplayName": "Solaris", "Points": 0},
            {"Player": "void", "DisplayName": "Void", "Points": 0},
            {"Player": "blacksource", "DisplayName": "Blacksource", "Points": 0}
        ]

function renderLeaderboard() {
    const leaderboardDiv = document.getElementById("leaderboard");
    if (!leaderboardDiv) return;

    const sortedPlayers = [...PlayerPoint].sort((a, b) => b.Points - a.Points);

    let html = '<ul style="list-style: none; padding: 0;">';
    
    sortedPlayers.forEach((player, index) => {
        let medal = "";
        if (index === 0) medal = " 🥇";
        else if (index === 1) medal = " 🥈";
        else if (index === 2) medal = " 🥉";
        else medal = "";    
        
        // Nutze hier player.DisplayName statt player.Player
        html += `
            <li class="task-item" style="margin-bottom: 8px; font-size: 1.2em; display: flex; justify-content: space-between;">
                <span><strong>${index + 1}. ${player.DisplayName}</strong>${medal}</span>
                <span style="color: #9146FF; font-weight: bold;">${player.Points}</span>
            </li>
        `;
    });

    html += '</ul>';
    leaderboardDiv.innerHTML = html;
}

// Message Events anpassen
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Daten empfangen:", data);

    if (data.State !== undefined) {
        state = data.State;
        const container = document.getElementById("leaderboard-container");
        if (container) {
            // Logik umkehren oder beibehalten, je nachdem wie dein Toggle funktioniert
            container.style.display = state ? "" : "none"; 
        }
    }
    
    if (data.PlayerList !== undefined) {
        PlayerPoint = data.PlayerList;
        renderLeaderboard(); // <--- NEU: UI aktualisieren
    }
}
        

        //Ein und Aus blende funktion
        
        function BlendInOut() {
            if (state == true){
                document.getElementById("leaderboard-container").style.display = "none"
                state = false
                ws.send(JSON.stringify({
                    State:state
                }))
            }
            else if(state == false){
                document.getElementById("leaderboard-container").style.display = ""
                state = true
                ws.send(JSON.stringify({
                    State:state
                }))
            }
            else {
                alert("Fehler: Unerwarteter Zustand in BlendInOut Funktion.");
                state = true; // Reset auf sicheren Zustand
            }
            
        }
        

        // Hilfsfunktion für den Button-Klick
        function handleManualAdd() {
            const inputField = document.getElementById("CustomPTInput");
            const points = parseInt(inputField.value);

            if (!isNaN(points)) {
                AddPoint(points);
                inputField.value = ""; // Feld nach dem Hinzufügen leeren
            } else {
                alert("Bitte gib eine gültige Zahl ein!");
            }
        }

        // Die eigentliche Logik
        function AddPoint(pointsAdded) {
            const person = document.getElementById("Dropdown").value;
            const index = PlayerPoint.findIndex(p => p.Player === person);

            if (index !== -1) {
                PlayerPoint[index].Points += pointsAdded;
                console.log(pointsAdded + " Punkte wurden zu " + person + " hinzugefügt.\n" +
                    "Gesamtstand: " + PlayerPoint[index].Points);
                    ws.send(JSON.stringify({
                        PlayerList:PlayerPoint
                    }))
                
            } else {
                alert("Spieler nicht gefunden!");
            }
            
        }
        //Clear points
        function Clear(){
            if (confirm("Achtung: Alle Punkte werden zurückgesetzt! Bist du sicher?")) {
                PlayerPoint = [
                    {"Player": "zitrone", "DisplayName": "Zitrone_2010", "Points": 0},
                    {"Player": "luma", "DisplayName": "LuMa_369", "Points": 0},
                    {"Player": "kai", "DisplayName": "Kaiomatiko", "Points": 0},
                    {"Player": "arong", "DisplayName": "Arongforce", "Points": 0},
                    {"Player": "solaris", "DisplayName": "Solaris", "Points": 0},
                    {"Player": "void", "DisplayName": "Void", "Points": 0},
                    {"Player": "blacksource", "DisplayName": "Blacksource", "Points": 0}
                ],
                ws.send(JSON.stringify({
                    PlayerList:PlayerPoint
                }))
                console.warn("Punkte wurden zurückgesetzt.");
            }
        }

        // Reset all (clear Points + blend in)
        function ResetAll() {
            if (confirm("Achtung: Alle Punkte werden zurückgesetzt und das Leaderboard wird ausgeblendet. Bist du dir sicher?")) {
                
                // 1. Daten im lokalen Array auf 0 setzen
                PlayerPoint = [
                    {"Player": "zitrone","Points":0},
                    {"Player": "luma","Points":0},
                    {"Player": "kai","Points":0},
                    {"Player": "arong","Points":0},
                    {"Player": "solaris","Points":0},
                    {"Player": "void","Points":0},
                    {"Player": "blacksource","Points":0}
                ]
                
                // 2. State auf false setzen (damit es eingeblendet wird)
                state = true; 
                
                // 3. Sofortige visuelle Rückmeldung für den Admin
                document.getElementById("leaderboard-container").style.display = "none";
                
                // 4. Den Reset an den Server senden
                ws.send(JSON.stringify({
                    State: state,
                    PlayerList: PlayerPoint
                }));

                console.log("Reset erfolgreich: Punkte genullt und an Server gesendet.");
                
                // Optional: Falls du eine Funktion hast, die die Tabelle im Admin-Panel zeichnet:
                // updateTableUI(); 
            }
        }

        function ResendData() {
            // 1. Die Abfrage vorschalten
            if (confirm("Möchtest du den aktuellen Stand (Punkte & Sichtbarkeit) wirklich manuell an alle Clients pushen?\n\nDies kann helfen, wenn Daten nicht korrekt geladen wurden oder es Desync-Probleme gibt.")) {
                
                // 2. Prüfen, ob die Verbindung steht
                if (ws.readyState === WebSocket.OPEN) {
                    console.info("Resend Data: Manueller Push wird ausgeführt.");
                    
                    const payload = {
                        State: state,
                        PlayerList: PlayerPoint
                    };

                    ws.send(JSON.stringify(payload));
                    
                    // Kleiner Hinweis in der Konsole zur Bestätigung
                    console.log("Daten erfolgreich gesendet:", payload);
                } else {
                    alert("Fehler: Keine Verbindung zum Server! Bitte Seite neu laden.");
                    console.error("WebSocket ist nicht offen. Status:", ws.readyState);
                }
            } else {
                // Falls der Nutzer auf "Abbrechen" klickt
                console.log("Resend Data: Vom Nutzer abgebrochen.");
            }
        }