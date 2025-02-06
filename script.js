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

// Funktion der opdaterer en spillers runder og opdaterer leaderboardet
function updatePlayerLaps(playerId) {
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.laps++;
        updateLeaderboard();
    }
}

// 🎯 **Opdater leaderboard ved at vise alle spillere korrekt**
function updateLeaderboard() {
    const leaderboardDiv = document.getElementById("leaderboard");

    if (!leaderboardDiv) {
        console.error("Fejl: Leaderboard-div ikke fundet!");
        return;
    }

    leaderboardDiv.innerHTML = "<h3>LEADERBOARD:</h3>"; // Tilføj overskrift

    // 🎯 **Sortér spillere efter antal runder kørt (højest først)**
    players.sort((a, b) => b.laps - a.laps);

    // 🎯 **Vis opdaterede spillerrunder i leaderboardet**
    players.forEach(player => {
        let playerEntry = document.createElement("p");
        playerEntry.textContent = `${player.name} - ${player.laps}/${raceSettings.rounds} runder`;
        leaderboardDiv.appendChild(playerEntry);
    });

    console.log("Leaderboard opdateret:", players);
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

    showScreen(raceScreen);
    console.log("🔍 raceScreen vist!");

    raceActive = true;
    console.log("🏁 Race er nu aktiv:", raceActive);

    // 🎯 **Start kameraet (uden synlig visning af video)**
    startRaceCamera();

    // 🎯 **Start detectColorInRace hvis det ikke allerede kører**
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

    let maxAttempts = 50; // Undgå uendelig gentagelse
    let attempts = 0;

    trackingInterval = setInterval(() => {
        if (!raceActive) {
            console.warn("⏸ detectColorInRace stoppet, da raceActive er false.");
            clearInterval(trackingInterval);
            trackingInterval = null;
            return;
        }

        if (!hiddenVideo || hiddenVideo.videoWidth === 0 || hiddenVideo.videoHeight === 0) {
            attempts++;
            if (attempts >= maxAttempts) {
                console.error("⛔ Video kunne ikke startes efter flere forsøg. Stopper detectColorInRace.");
                clearInterval(trackingInterval);
                trackingInterval = null;
            } else {
                console.warn("⏳ Video stadig ikke klar, prøver igen...");
            }
            return;
        }

        const raceCanvas = document.createElement("canvas");
        raceCanvas.width = hiddenVideo.videoWidth;
        raceCanvas.height = hiddenVideo.videoHeight;
        const raceCtx = raceCanvas.getContext("2d");

        raceCtx.drawImage(hiddenVideo, 0, 0, raceCanvas.width, raceCanvas.height);
        const imageData = raceCtx.getImageData(0, 0, raceCanvas.width, raceCanvas.height);
        const data = imageData.data;

        let playerDetected = {}; // Holder styr på, hvilke spillere der er registreret

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];

            players.forEach(player => {
                if (!playerDetected[player.id] && colorMatch(r, g, b, player.color, player.tolerance)) {
                    const now = Date.now();

                    if (!player.lastDetectionTime || now - player.lastDetectionTime > 1000) {
                        player.laps++; // 🎯 Opdater spillerens runder
                        player.lastDetectionTime = now;
                        playerDetected[player.id] = true; // Markér spilleren som registreret denne frame

                        console.log(`🏎 ${player.name} har nu ${player.laps} runder!`);

                        // Opdater UI for den specifikke spiller
                        updateLeaderboard();
                    }
                }
            });
        }

        // Tjek om alle spillere er færdige
        if (players.every(player => player.laps >= raceSettings.rounds)) {
            alert("🏁 Alle spillere har fuldført racet!");
            clearInterval(trackingInterval);
            trackingInterval = null;
            raceActive = false;
            stopCamera();
        }
    }, 100); // Opdatering hver 100ms
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
function colorMatch(r, g, b, color, tol) {
    return Math.abs(r - color.r) < tol &&
           Math.abs(g - color.g) < tol &&
           Math.abs(b - color.b) < tol;
}

// 🎯 **Gem spiller og stop kameraet**
// 🎯 **Tilføj spiller og sørg for, at leaderboard bliver opdateret**
savePlayerButton.addEventListener("click", () => {
    if (!selectedColor || !playerNameInput.value.trim()) {
        alert("Vælg en farve og indtast et navn!");
        return;
    }

    let player = {
        id: players.length + 1,
        name: playerNameInput.value.trim(),
        color: selectedColor,
        tolerance: tolerance,
        threshold: threshold,
        laps: 0 // Start med 0 kørte runder
    };

    players.push(player);
    updatePlayerList();
    updateLeaderboard(); // 🎯 Opdater leaderboard når en spiller tilføjes

    // 🎯 **Stop kameraet korrekt, så sort/hvid mode ikke starter igen**
    stopCamera();

    // 🎯 **Skift tilbage til startskærm**
    colorSetupScreen.style.display = "none";
    startScreen.style.display = "block";

    console.log("Spiller gemt:", player);
});

savePlayerButton.onclick = function() {
    if (editingPlayerIndex !== null) {
        updatePlayer(editingPlayerIndex);
    } else {
        addNewPlayer();
    }

    editingPlayerIndex = null; // Nulstil redigeringstilstand
};

function addNewPlayer() {
    if (editingPlayerIndex !== null) {
        console.warn("⚠️ Forsøger at tilføje ny spiller, men er i redigeringstilstand. Stopper!");
        return;
    }

    // 🚨 Stopper, hvis spilleren allerede eksisterer
    if (players.some(player => player.name === playerNameInput.value.trim())) {
        console.warn("⚠️ Spilleren eksisterer allerede! Undgår duplikat.");
        return;
    }

    let newPlayer = {
        id: players.length + 1,
        name: playerNameInput.value.trim(),
        color: selectedColor,
        tolerance: tolerance,
        threshold: threshold,
        laps: 0
    };

    players.push(newPlayer);
    console.log("➕ Ny spiller tilføjet:", newPlayer);

    // ✅ Kun én UI-opdatering
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

function updatePlayer(index) {
    if (index === null || index >= players.length) {
        console.error("Fejl: Ugyldigt spiller-index ved opdatering!");
        return;
    }

    let player = players[index];

    player.name = playerNameInput.value.trim();
    player.color = selectedColor;
    player.tolerance = tolerance;
    player.threshold = threshold;

    console.log(`✅ Spiller "${player.name}" opdateret!`);

    // 🎯 Opdater UI én gang
    updatePlayerList();
    showScreen(startScreen);

    editingPlayerIndex = null;
}

function editPlayer(index) {
    let player = players[index];
    editingPlayerIndex = index; // 🔥 Husk hvilket indeks vi redigerer

    // 🎯 Indsæt spillerens data i inputfelter
    playerNameInput.value = player.name;
    selectedColor = player.color;
    tolerance = player.tolerance;
    threshold = player.threshold;

    // 🎨 Opdater UI
    colorDisplay.style.backgroundColor = `rgb(${player.color.r}, ${player.color.g}, ${player.color.b})`;
    toleranceSlider.value = tolerance;
    thresholdSlider.value = threshold;
    toleranceValue.textContent = tolerance;
    thresholdValue.textContent = threshold;

    // 🎥 Start kameraet, så man kan justere farvevalg
    startSelectedCamera();

    // 🔄 Skift til oprettelsesskærmen
    showScreen(colorSetupScreen);

    console.log(`✏️ Redigerer spiller: ${player.name}`);
}

function deletePlayer(index) {
    if (confirm(`Er du sikker på, at du vil fjerne ${players[index].name}?`)) {
        players.splice(index, 1); // Fjern spilleren
        updatePlayerList(); // Opdater UI
        console.log("❌ Spiller fjernet!");
    }
}

// 🎯 **Opdater spillerliste på forsiden med redigeringsmuligheder**
function updatePlayerList() {
    playerList.innerHTML = ""; // Ryd liste før ny opdatering

    players.forEach((player, index) => {
        let div = document.createElement("div");
        div.classList.add("player");

        // 🎨 Farveboks
        let colorBox = document.createElement("div");
        colorBox.classList.add("playerColor");
        colorBox.style.backgroundColor = `rgb(${player.color.r}, ${player.color.g}, ${player.color.b})`;

        // 📝 Spillernavn
        let nameSpan = document.createElement("span");
        nameSpan.textContent = ` ${player.name} `;

        // ✏️ "Ret" knap
        let editButton = document.createElement("button");
        editButton.textContent = "Ret";
        editButton.onclick = () => editPlayer(index);

        // ❌ "Fjern" knap
        let deleteButton = document.createElement("button");
        deleteButton.textContent = "Fjern";
        deleteButton.onclick = () => deletePlayer(index);

        // 📌 Tilføj elementer til spiller-div
        div.appendChild(colorBox);
        div.appendChild(nameSpan);
        div.appendChild(editButton);
        div.appendChild(deleteButton);

        playerList.appendChild(div);
    });

    if (players.length > 0) {
        setupRaceButton.style.display = "block"; // Vis "Opsæt Race"-knap hvis spillere findes
    } else {
        setupRaceButton.style.display = "none"; // Skjul knappen hvis ingen spillere er tilbage
    }
}
