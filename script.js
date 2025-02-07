document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM er nu indlæst!");
    console.log("Tjekker element:", document.getElementById("currentLapsDisplay"));
});
 
const startScreen = document.getElementById("startScreen");
const colorSetupScreen = document.getElementById("colorSetupScreen");
const raceSetupScreen = document.getElementById("raceSetupScreen");

const addPlayerButton = document.getElementById("addPlayer");
const setupRaceButton = document.getElementById("setupRace");
const saveRaceButton = document.getElementById("saveRace");
const backToStartRaceButton = document.getElementById("backToStartRace");
 
const savePlayerButton = document.getElementById("savePlayer");
const backToStartButton = document.getElementById("backToStart");

const playerList = document.getElementById("playerList");
const roundsInput = document.getElementById("rounds");

const video = document.getElementById("video");
const canvas = document.getElementById("overlayCanvas");

const ctx = canvas.getContext("2d", { willReadFrequently: true });

const toleranceSlider = document.getElementById("tolerance");
const thresholdSlider = document.getElementById("threshold");
const colorDisplay = document.getElementById("selectedColor");
const playerNameInput = document.getElementById("playerName");

const toleranceValue = document.getElementById("toleranceValue");
const thresholdValue = document.getElementById("thresholdValue");
const toleranceControls = document.getElementById("toleranceControls");

const adjustToleranceButton = document.getElementById("adjustTolerance");
const adjustColorButton = document.getElementById("adjustColor");

const cameraSelect = document.getElementById("cameraSelect");
const useSelectedCameraButton = document.getElementById("useSelectedCamera");

// 🎯 **Hent referencer til race UI-elementer**
const startRaceButton = document.getElementById("startRace");
const raceScreen = document.getElementById("raceScreen");
const raceVideo = document.getElementById("raceVideo");
const currentPlayerDisplay = document.getElementById("currentPlayer");
const currentLapsDisplay = document.getElementById("currentLapsDisplay");
const backToSetupRaceButton = document.getElementById("backToSetupRace");


let editingPlayerIndex = null; // 🔥 Sporer om en spiller redigeres
let selectedColor = null;
let tolerance = 50;
let threshold = 100;
let isTracking = false;
let players = [];
let raceSettings = { rounds: 10 };
let activeStream = null;

let activeRacePlayer = null;
let lapsCompleted = 0;
let raceActive = false;
let lastDetectionTime = 0;

let editingPlayerId = null; // 🔥 Holder styr på den spiller, der redigeres

// 🎯 **Gem det valgte kamera til senere brug**
let selectedCameraId = null;

// 🎯 **Farvesporing – Sikrer, at kameraet er klar**
let trackingInterval = null; // 🔥 Stopper flere samtidige tracking-løkker

// 🎯 **Funktion til at styre skærmene**
function showScreen(targetScreen) {
    const screens = [startScreen, colorSetupScreen, raceSetupScreen, raceScreen];
    screens.forEach(screen => screen.style.display = "none");
    targetScreen.style.display = "block";
}


// 🎯 **Skift til farvevalg (hent kameraer kun, når brugeren trykker)**
addPlayerButton.addEventListener("click", () => {
    showScreen(colorSetupScreen);
    console.log("Tilføj spiller trykket - henter kameraer...");
    getCameras();
});


function addPlayer(name) {
    const newPlayer = {
        id: players.length + 1,
        name: name,
        laps: 0, // Start med 0 kørte runder
        totalLaps: 12 // Sæt det samlede antal runder
    };
    players.push(newPlayer);
    
    updateLeaderboard(); // Opdater leaderboardet
    
    console.log(`Spiller tilføjet: ${name}`);
}

// Funktion der opdaterer en spillers runder og opdaterer leaderboardet, Her sikrer vi, at en spillers runder aldrig overstiger det valgte antal runder:
function updatePlayerLaps(playerId) {
    let player = players.find(p => p.id === playerId);
    if (!player) return;

    if (player.laps < raceSettings.rounds) { 
        player.laps++;

        if (player.laps === raceSettings.rounds) {
            player.finishTime = player.finishTime || Date.now(); // 🎯 Registrerer tid, kun første gang
            console.log(`🏁 ${player.name} har FULDFØRT racet!`);
        }

        console.log(`🏎 ${player.name} har nu ${player.laps}/${raceSettings.rounds} runder!`);
        updateLeaderboard();
    } else {
        console.log(`⛔ ${player.name} har allerede fuldført racet.`);
    }

    // 🎯 **Stop tracking når alle spillere er færdige**
    if (players.every(p => p.laps >= raceSettings.rounds)) {
        console.log("🏁 ALLE spillere har fuldført racet! Stoppes tracking.");
        stopRace();
    }
}

function stopRace() {
    raceActive = false;
    console.log("🏁 Race afsluttet!");

    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }

    stopCamera();
}

function updateLeaderboard() {
    const leaderboardDiv = document.getElementById("leaderboard");

    if (!leaderboardDiv) {
        console.error("Fejl: Leaderboard-div ikke fundet!");
        return;
    }

    leaderboardDiv.innerHTML = "<h3>LEADERBOARD:</h3>"; // ✅ Bevarer overskrift

    // 🎖 Medaljer til de første tre spillere, der færdiggør løbet
    const medals = ["🥇", "🥈", "🥉"];
    let finishedPlayers = players.filter(p => p.laps >= raceSettings.rounds);
    
    // 🎯 Sortér færdige spillere efter afslutningstidspunkt
    finishedPlayers.sort((a, b) => a.finishTime - b.finishTime);

    // 🎯 Sortér ikke-færdige spillere efter antal runder
    let ongoingPlayers = players.filter(p => p.laps < raceSettings.rounds);
    ongoingPlayers.sort((a, b) => b.laps - a.laps);

    let sortedPlayers = [...finishedPlayers, ...ongoingPlayers];

    sortedPlayers.forEach((player, index) => {
        let playerEntry = document.createElement("div");
        playerEntry.classList.add("leaderboard-player");

        // 🎖 Tildel medalje KUN hvis spilleren har gennemført racet
        let medal = (index < medals.length && player.laps >= raceSettings.rounds) ? medals[index] : "";

        playerEntry.innerHTML = `
            <div class="playerColor" style="background-color: rgb(${player.color.r}, ${player.color.g}, ${player.color.b});"></div>
            <span class="player-name">${player.name}</span>
            <span class="player-laps">${player.laps}/${raceSettings.rounds}</span>
            <span class="medal">${medal}</span>
        `;

        leaderboardDiv.appendChild(playerEntry);
    });

    console.log("✅ Leaderboard opdateret:", sortedPlayers);
}

function updateExcludedColors() {
    players.forEach(player => {
        player.excludedColors = players
            .filter(other => other.id !== player.id) // Ekskluder sig selv
            .map(other => other.color); // Gem de andre spilleres farver
    });
    console.log("🚫 Opdateret eksklusionsfarver for hver spiller:", players);
}

// Forhindre kameraet i at blive påvirket, når en spiller tilføjes
function preventCameraRestart() {
    console.log("Kamera forbliver aktivt!");
}

// 🎯 **Skift til opsæt race**
setupRaceButton.addEventListener("click", () => {
    showScreen(raceSetupScreen);
    roundsInput.value = raceSettings.rounds;
});

// 🎯 **Skift tilbage til startskærm**
backToStartButton.addEventListener("click", () => {
    showScreen(startScreen);
    stopCamera();
});

backToStartRaceButton.addEventListener("click", () => {
    showScreen(startScreen);
});

startRaceButton.addEventListener("click", () => {
    console.log("🚀 Start Race trykket!");

    if (players.length === 0) {
        alert("Tilføj mindst én spiller før du starter racet!");
        return;
    }

    updateExcludedColors(); // 🚫 Opdater eksklusionsfarver inden start
    showScreen(raceScreen);
    console.log("🔍 raceScreen vist!");

    raceActive = true;
    console.log("🏁 Race er nu aktiv:", raceActive);

    updateLeaderboard(); // 🔥 Vis leaderboard fra start

    startRaceCamera();

    setTimeout(() => {
        console.log("🔥 Forsøger at starte detectColorInRace manuelt...");
        if (!trackingInterval) {
            detectColorInRace();
        } else {
            console.warn("⚠️ detectColorInRace kører allerede, starter ikke igen.");
        }
    }, 1000);
});

const observer = new MutationObserver(() => {
    let lapsDisplay = document.getElementById("currentLapsDisplay");

    if (!lapsDisplay) {
        console.warn("⚠️ currentLapsDisplay forsvandt! Opretter igen...");
        lapsDisplay = document.createElement("p");
        lapsDisplay.id = "currentLapsDisplay";
        lapsDisplay.textContent = `Runder: 0/${raceSettings.rounds}`;
        raceScreen.appendChild(lapsDisplay);
    }
});

// Overvåg raceScreen for ændringer i børneelementer
observer.observe(raceScreen, { childList: true, subtree: true });

// 🎯 **Tilbage til setup race**
backToSetupRaceButton.addEventListener("click", () => {
    console.log("🔙 Tilbage til startskærm trykket!");

    raceActive = false;
    stopCamera();

    showScreen(startScreen); // Gå direkte til startskærmen
});


// 🎯 **Gem race-indstillinger**
saveRaceButton.addEventListener("click", () => {
    const selectedRounds = parseInt(roundsInput.value);

    if (isNaN(selectedRounds) || selectedRounds < 1) {
        alert("Indtast et gyldigt antal runder!");
        return;
    }

    raceSettings.rounds = selectedRounds; // ✅ Gemmer det valgte antal runder

    console.log("Race gemt:", raceSettings); // Debugging for at se om det gemmes korrekt

    // 🚀 Skift tilbage til startskærmen
    raceSetupScreen.style.display = "none";
    startScreen.style.display = "block";
});

function getCameras() {
    console.log("getCameras() kaldt!");

    navigator.mediaDevices.getUserMedia({ video: true }) // Anmoder om adgang for at få deviceId
    .then(() => navigator.mediaDevices.enumerateDevices())
    .then(devices => {
        const videoDevices = devices.filter(device => device.kind === "videoinput");

        if (videoDevices.length === 0) {
            console.error("❌ Ingen kameraer fundet!");
            alert("Ingen kameraer fundet. Tjek din enhed.");
            return;
        }

        cameraSelect.innerHTML = ""; 

        videoDevices.forEach((device, index) => {
            let option = document.createElement("option");

            // Brug fallback hvis deviceId mangler
            let deviceId = device.deviceId || `fallback-${index}`;
            option.value = deviceId;
            option.textContent = device.label || `Kamera ${index + 1}`;
            cameraSelect.appendChild(option);

            console.log(`🎥 Kamera ${index + 1}: ${device.label || "Ukendt"} - ID: ${deviceId}`);
        });

        // Vælg første kamera, hvis intet er valgt
        if (!selectedCameraId && videoDevices[0]) {
            selectedCameraId = videoDevices[0].deviceId || `fallback-0`;
            console.log("📸 Første kamera valgt:", selectedCameraId);
        }
    })
    .catch(err => {
        console.error("⚠️ Fejl ved hentning af kameraer:", err);
        alert("Kunne ikke hente kameraer. Tjek kameraindstillinger.");
    });
}





// 🎯 **Start race-kamera – bruger det valgte kamera**
function startRaceCamera() {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        const videoDevices = devices.filter(device => device.kind === "videoinput");

        if (videoDevices.length === 0) {
            console.error("Ingen kameraer fundet!");
            alert("Ingen kameraer fundet. Tjek din enhed.");
            return;
        }

        const cameraId = selectedCameraId || videoDevices[0].deviceId;
        console.log(`Bruger kamera: ${cameraId}`);

        return navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: cameraId } }
        });
    })
    .then(stream => {
        if (!stream) return; 

        activeStream = stream;

        let hiddenVideo = document.getElementById("hiddenRaceVideo");
        if (!hiddenVideo) {
            hiddenVideo = document.createElement("video");
            hiddenVideo.id = "hiddenRaceVideo";
            hiddenVideo.style.display = "none"; 
            document.body.appendChild(hiddenVideo);
        }

        hiddenVideo.srcObject = stream;
        hiddenVideo.play();

        hiddenVideo.onloadedmetadata = () => {
            console.log("Race-video metadata indlæst!");
        };

        hiddenVideo.oncanplay = () => {
            console.log("Race-video kan nu afspilles i baggrunden!");
            setTimeout(() => {
                if (hiddenVideo.videoWidth > 0 && hiddenVideo.videoHeight > 0) {
                    console.log("Race-video er fuldt indlæst, starter farvesporing!");
                    
                    if (!trackingInterval) { 
                        detectColorInRace();
                    } else {
                        console.warn("⚠️ detectColorInRace kører allerede, undgår dobbelt-opstart.");
                    }
                } else {
                    console.error("Fejl: Race-video stadig ikke klar, prøver igen...");
                    setTimeout(startRaceCamera, 500);
                }
            }, 500);
        };
    })
    .catch(err => { // 🔴 Flyttet `catch()` udenfor `.then()`
        console.error("Fejl ved adgang til kamera", err);
        alert("Kunne ikke starte kameraet. Tjek kameraindstillinger.");
    });
}


function detectColorInRace() {
    if (trackingInterval !== null) {
        console.warn("⚠️ detectColorInRace kører allerede, undgår dobbelt-opstart.");
        return;
    }

    if (!raceActive || players.length === 0) {
        console.error("❌ Fejl: detectColorInRace starter ikke!", { raceActive, players });
        return;
    } else {
        console.log("✅ detectColorInRace starter!");
    }

    let hiddenVideo = document.getElementById("hiddenRaceVideo");
    if (!hiddenVideo) {
        console.error("❌ Fejl: Skjult kamera-video ikke fundet!");
        return;
    }

    trackingInterval = setInterval(() => {
        if (!raceActive) {
            console.warn("⏸ detectColorInRace stoppet, da raceActive er false.");
            clearInterval(trackingInterval);
            trackingInterval = null;
            return;
        }

        // 🎯 **Stop tracking hvis alle er færdige**
        if (players.every(p => p.laps >= raceSettings.rounds)) {
            console.log("🏁 Alle spillere er færdige! Stopper tracking.");
            stopRace();
            return;
        }

        const raceCanvas = document.createElement("canvas");
        raceCanvas.width = hiddenVideo.videoWidth;
        raceCanvas.height = hiddenVideo.videoHeight;
        const raceCtx = raceCanvas.getContext("2d");

        raceCtx.drawImage(hiddenVideo, 0, 0, raceCanvas.width, raceCanvas.height);
        const imageData = raceCtx.getImageData(0, 0, raceCanvas.width, raceCanvas.height);
        const data = imageData.data;

        let playerDetected = {}; 

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];

            players.forEach(player => {
                if (!playerDetected[player.id] && colorMatch(r, g, b, player.color, player.tolerance, player.excludedColors)) {

                    // 🚫 Hvis farven matcher en ekskluderet farve, spring over
                    if (player.excludedColors.some(excluded => colorMatch(r, g, b, excluded, player.tolerance))) {
                        console.warn(`🚫 ${player.name} ignorerede en forbudt farve!`);
                        return; // Spring denne iteration over
                    }
            
                    const now = Date.now();
            
                    if (!player.lastDetectionTime || now - player.lastDetectionTime > 1000) {
                        if (player.laps < raceSettings.rounds) {
                            player.laps++;
                            player.lastDetectionTime = now;
                            playerDetected[player.id] = true; 
            
                            console.log(`🏎 ${player.name} har nu ${player.laps} runder!`);
            
                            if (player.laps >= raceSettings.rounds && !player.finishTime) {
                                player.finishTime = now;
                                console.log(`🏁 ${player.name} er færdig med racet!`);
                            }
            
                            updateLeaderboard();
                        }
                    }
                }
            });
        }
    }, 100); // 🎯 **Opdatering hver 100ms**
}
// 🎯 **Start det valgte kamera**

function startSelectedCamera() {
    let selectedDeviceId = cameraSelect.value;

    if (!selectedDeviceId || selectedDeviceId.startsWith("fallback")) {
        alert("Ugyldigt kamera valgt! Prøv at vælge et andet.");
        return;
    }

    stopCamera(); // Luk eksisterende stream, hvis der er en

    console.log("🎬 Starter kamera:", selectedDeviceId);

    navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedDeviceId } }
    })
    .then(stream => {
        activeStream = stream;
        video.srcObject = stream;
        video.play();
    })
    .catch(err => {
        console.error("🚨 Fejl ved adgang til kamera:", err);
        alert("Kunne ikke starte kameraet. Prøv et andet kamera.");
    });
}


// 🎯 **Opdateret kameraopstart – gemmer valgte kamera**
useSelectedCameraButton.addEventListener("click", () => {
    if (!selectedCameraId) {
        alert("Vælg et kamera fra listen!");
        return;
    }

    startSelectedCamera();
});


// 🎯 **Vælg farve ved klik på video**
video.addEventListener("click", (event) => {
    if (!video.videoWidth || !video.videoHeight) {
        alert("Kameraet er ikke klar endnu. Prøv igen.");
        return;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    const rect = video.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (video.videoWidth / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (video.videoHeight / rect.height));

    const pixel = tempCtx.getImageData(x, y, 1, 1).data;
    selectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

    colorDisplay.style.backgroundColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
});

// 🎯 **Opdater tolerance live**
toleranceSlider.addEventListener("input", (e) => {
    tolerance = parseInt(e.target.value);
    toleranceValue.textContent = tolerance;
    if (isTracking) trackColor(); // Opdater visualisering live
});

// 🎯 **Opdater threshold live**
thresholdSlider.addEventListener("input", (e) => {
    threshold = parseInt(e.target.value);
    thresholdValue.textContent = threshold;
    if (isTracking) trackColor(); // Opdater visualisering live
});

// 🎯 **Start tolerance-justering**
adjustToleranceButton.addEventListener("click", () => {
    if (!selectedColor) {
        alert("Vælg en farve først!");
        return;
    }
    isTracking = true;
    toleranceControls.style.display = "block";
    canvas.style.display = "block";
    trackColor(); // Starter visualisering
});

// 🎯 **Stop tolerance-justering**
adjustColorButton.addEventListener("click", () => {
    isTracking = false;
    canvas.style.display = "none";
    toleranceControls.style.display = "none";
});

// 🎯 **Track farve og vis som sort/hvid (Tolerance & Threshold)**
function trackColor() {
    if (!selectedColor || !isTracking) return;

    // 🚀 **Tjek om video er klar**
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video er ikke klar, afventer...");
        requestAnimationFrame(trackColor);
        return;
    }

    // 📌 **Sæt canvas dimensioner korrekt**
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = (r + g + b) / 3; 

        if (colorMatch(r, g, b, selectedColor, tolerance) && brightness >= threshold) {
            data[i] = data[i + 1] = data[i + 2] = 255; // Hvid
        } else {
            data[i] = data[i + 1] = data[i + 2] = 0; // Sort
        }
    }

    ctx.putImageData(imageData, 0, 0);

    if (isTracking) {
        requestAnimationFrame(trackColor);
    }
}

// 🎯 **Matcher farver med tolerance**
function colorMatch(r, g, b, color, tol, excludedColors = []) {
    // 🚫 Tjek om farven er en ekskluderet farve
    for (let excluded of excludedColors) {
        if (Math.abs(r - excluded.r) < tol &&
            Math.abs(g - excluded.g) < tol &&
            Math.abs(b - excluded.b) < tol) {
            console.warn(`🚫 Ignoreret forbudt farve: rgb(${r}, ${g}, ${b})`);
            return false; // Farven må ikke registreres
        }
    }

    // ✅ Match på spillerens farve
    return Math.abs(r - color.r) < tol &&
           Math.abs(g - color.g) < tol &&
           Math.abs(b - color.b) < tol;
}

// 🎯 **Gem spiller og stop kameraet**
// 🎯 **Tilføj spiller og sørg for, at leaderboard bliver opdateret**


// 🎯 **Gem spiller – Undgå duplikater!**
savePlayerButton.onclick = function () {
    let playerName = playerNameInput.value.trim();
    if (!selectedColor || !playerName) {
        alert("Vælg en farve og indtast et navn!");
        return;
    }

    if (editingPlayerId !== null) {
        updatePlayer(editingPlayerId); // 🔄 Opdater eksisterende spiller
    } else {
        addNewPlayer(); // ➕ Tilføj ny spiller
    }

    editingPlayerId = null; // ✅ Nulstil redigeringstilstand
};


// 🎯 **Tilføj ny spiller – Nu kun én gang!**
function addNewPlayer() {
    let playerName = playerNameInput.value.trim();

    // ✅ Sørg for, at der ikke findes en spiller med samme navn
    let existingPlayer = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (existingPlayer) {
        console.warn(`⚠️ Spilleren "${playerName}" findes allerede!`);
        return;
    }

    // 🔥 Generér et unikt ID baseret på tidsstempel
    let newId = Date.now();

    let newPlayer = {
        id: newId,
        name: playerName,
        color: selectedColor,
        tolerance: tolerance,
        threshold: threshold,
        laps: 0
    };

    players.push(newPlayer);
    console.log("➕ Ny spiller tilføjet:", newPlayer);

    updatePlayerList();
    showScreen(startScreen);
}

function stopCamera() {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
        console.log("Kamera stoppet.");
    }

    let hiddenVideo = document.getElementById("hiddenRaceVideo");
    
    // 🎯 Sikrer at vi ikke forsøger at ændre et null-objekt
    if (hiddenVideo) {
        hiddenVideo.srcObject = null;
    }

    if (raceVideo) {
        raceVideo.srcObject = null;
    }

    // 🎯 Stop sort/hvid-tracking, så det ikke fortsætter efter en spiller tilføjes
    if (isTracking) {
        isTracking = false;
        canvas.style.display = "none";
        toleranceControls.style.display = "none";
        console.log("Tracking stoppet.");
    }
}

function updatePlayer(playerId) {
    let playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
        console.error(`❌ Fejl: Ingen spiller med ID ${playerId} fundet!`);
        return;
    }

    players[playerIndex].name = playerNameInput.value.trim();
    players[playerIndex].color = selectedColor;
    players[playerIndex].tolerance = tolerance;
    players[playerIndex].threshold = threshold;

    console.log(`✅ Spiller "${players[playerIndex].name}" opdateret! (ID: ${playerId})`);

    updatePlayerList();
    showScreen(startScreen);
}

function editPlayer(playerId) {
    let player = players.find(p => p.id === playerId);
    if (!player) {
        console.error(`❌ Kunne ikke finde spiller med ID ${playerId}`);
        return;
    }

    playerNameInput.value = player.name;
    selectedColor = player.color;
    tolerance = player.tolerance;
    threshold = player.threshold;

    editingPlayerId = playerId; // 🔥 Gem ID'et for den spiller, der redigeres
    showScreen(colorSetupScreen);

    console.log(`✏️ Redigerer spiller: ${player.name} (ID: ${playerId})`);
}


function deletePlayer(index) {
    if (confirm(`Er du sikker på, at du vil fjerne ${players[index].name}?`)) {
        players.splice(index, 1); // Fjern spilleren
        updatePlayerList(); // Opdater UI
        console.log("❌ Spiller fjernet!");
    }
}

// 🎯 **Opdater spillerliste med rediger/slet-knapper**
function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach(player => {
        let div = document.createElement("div");
        div.classList.add("player");
        div.innerHTML = `
            <div class="playerColor" style="background-color: rgb(${player.color.r}, ${player.color.g}, ${player.color.b});"></div>
            ${player.name} 
            <button onclick="editPlayer(${player.id})">Ret</button>
            <button onclick="removePlayer(${player.id})">Fjern</button>
        `;
        playerList.appendChild(div);
    });

    if (players.length > 0) {
        setupRaceButton.style.display = "block";
    }
}
// 🎯 **Slet spiller baseret på ID**
function removePlayer(playerId) {
    players = players.filter(p => p.id !== playerId);
    console.log(`❌ Spiller fjernet! (ID: ${playerId})`);
    updatePlayerList();
}
