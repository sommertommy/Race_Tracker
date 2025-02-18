document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM er nu indlæst!");
    getCameras();


    // 🎯 **DOM-elementer**
    const colorPickerOverlay = document.getElementById("colorPickerOverlay");
    const acceptColorSelectionButton = document.getElementById("acceptColorSelection");
    const videoElement = document.getElementById("video");
    const cameraPlaceholder = document.getElementById("cameraPlaceholder");
    const openColorPickerButton = document.getElementById("openColorPicker");
    const closeColorPickerButton = document.getElementById("closeColorPickerButton");
 
    // 🎥 **Kameravalg overlay**
    const openCameraOverlayButton = document.getElementById("openCameraSelectOverlay");
    const cameraSelectOverlay = document.getElementById("cameraSelectOverlay");
    const cameraList = document.getElementById("cameraList");
    const confirmCameraButton = document.getElementById("confirmCameraSelection");
    const closeCameraOverlayButton = document.getElementById("closeCameraOverlay");
    
    // RACING MODE SELECTOR   
    // RACING MODE SELECTOR
    // RACING MODE SELECTOR
    
    raceSettings.mode = document.getElementById("raceMode").value;
    const raceModeSelector = document.getElementById("raceMode");
    const raceModeLabel = document.getElementById("raceModeLabel");
    const raceModeInput = document.getElementById("raceModeInput");
    
    
   // 🎯 Funktion til at opdatere UI baseret på valgt race-mode
    function updateRaceModeUI() {
        if (raceModeSelector.value === "LapCounts") {
            raceModeLabel.textContent = "Indtast antal runder:";
            raceModeInput.setAttribute("min", "1");
            raceModeInput.value = 10; // Standardværdi for runder
        } else {
            raceModeLabel.textContent = "Indtast tid (sekunder):";
            raceModeInput.setAttribute("min", "10");
            raceModeInput.value = 60; // Standardværdi for tid
        }
    }
    
    // 🎯 Event listener for ændringer i dropdown-menuen
    raceModeSelector.addEventListener("change", () => {
        console.log(`🏁 Ræs-type ændret til: ${raceModeSelector.value}`);
        updateRaceModeUI();
    });
    
    // 🎯 Kør funktionen ved start for at vise det korrekte felt fra begyndelsen
    updateRaceModeUI();
    
    // 🎯 Gem race-indstillinger, når brugeren trykker på "Start Race"
        
        startRaceButton.addEventListener("click", () => {
            const selectedValue = parseInt(document.getElementById("raceModeInput").value);
        
            if (isNaN(selectedValue) || (raceModeSelector.value === "LapCounts" && selectedValue < 1) || 
                (raceModeSelector.value === "FastestLap" && selectedValue < 10)) {
                alert("Indtast en gyldig værdi!");
                return;
            }
        
            raceSettings = {
                mode: raceModeSelector.value,
                rounds: raceModeSelector.value === "LapCounts" ? selectedValue : null,
                timeLimit: raceModeSelector.value === "FastestLap" ? selectedValue : null
            };
        
            console.log("✅ Race gemt:", raceSettings);
        
            // 🔄 Udskift videoen med den nye countdown
            startCountdown();  

});
    // RACING MODE SELECTOR
    // RACING MODE SELECTOR
    // RACING MODE SELECTOR

    let selectedCameraId = localStorage.getItem("selectedCamera") || null;
    

    // 🎯 **Vent på acceptColorSelectionButton før eventListener tilføjes**
    function ensureAcceptButtonExists() {
        let button = document.getElementById("acceptColorSelection");
        if (!button) {
            console.warn("⏳ Knappen 'acceptColorSelection' ikke fundet endnu... Prøver igen om 500ms.");
            setTimeout(ensureAcceptButtonExists, 500);
        } else {
            console.log("✅ acceptColorSelectionButton fundet!");
            button.addEventListener("click", acceptColorHandler);
        }
    }
    ensureAcceptButtonExists();

    
    // 🎯 **Åbn kameraoverlay og hent kameraer**
     openCameraOverlayButton.addEventListener("click", () => {
         console.log("📸 Åbner kamera-valg overlay...");
        cameraSelectOverlay.style.display = "flex";
       getCameras();
   });

     //🎯 **Luk kameraoverlay**
     closeCameraOverlayButton.addEventListener("click", () => {
        console.log("❌ Lukker kamera overlay...");
       cameraSelectOverlay.style.display = "none";
     });

  // 🎯 **Bekræft valgte kamera**
    confirmCameraButton.addEventListener("click", () => {
      selectedCameraId = cameraList.value;
       console.log(`🎥 Valgt kamera: ${selectedCameraId}`);
        localStorage.setItem("selectedCamera", selectedCameraId);
         cameraSelectOverlay.style.display = "none";
     });

    



    
// 🎯 **Åbn kamera-overlay og hent kameraer**
// 🎯 **Åbn kamera-overlay og start kameraet**
openColorPickerButton.addEventListener("click", async () => {
    console.log("📸 Åbner farvevalg-overlay...");

    colorPickerOverlay.style.display = "flex";
    colorPickerOverlay.classList.add("show");
    setTimeout(() => {
        colorPickerOverlay.style.opacity = "1";
    }, 10);

    // ✅ **Stop eksisterende kamera først**
    await stopCamera();

    // ✅ **Hent kameraer og vent på opdatering af dropdown**
    const availableCameras = await getCameras();

    // ✅ **Hvis intet kamera er valgt, vælg automatisk det første**
    if (!selectedCameraId && availableCameras.length > 0) {
        selectedCameraId = availableCameras[0].deviceId;
        document.getElementById("cameraSelect").value = selectedCameraId; // Opdater dropdown
        console.log(`✅ Automatisk valgt første kamera: ${selectedCameraId}`);
    }

    // ✅ **Vent kort tid, og start kameraet**
    setTimeout(() => {
        if (selectedCameraId) {
            startSelectedCamera();
        } else {
            console.warn("⚠️ Intet kamera valgt – brugeren skal vælge et manuelt.");
        }
    }, 100); // 💡 Vent 100ms for at sikre korrekt værdi
});


   // 🎯 **Luk farvevælger-overlay**
closeColorPickerButton.addEventListener("click", async () => {
    console.log("❌ Lukker farvevalg-overlay...");
    colorPickerOverlay.style.opacity = "0";

    setTimeout(() => {
        colorPickerOverlay.classList.remove("show");
        colorPickerOverlay.style.display = "none";
    }, 300);

    // 🔥 **Tving stop af kamera**
    await stopCamera(); 

    // 🔄 **Nulstil video-element**
    const videoElement = document.getElementById("video");
    if (videoElement) {
        videoElement.srcObject = null;
        console.log("🔄 Video-element nulstillet!");
    }
});

});


// 🎯 **Hent DOM-elementer**
const canvas = document.getElementById("overlayCanvas");
const video = document.getElementById("video");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

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
const timeLimitInput = document.getElementById("timeLimitInput");
//const raceModeSelector = document.getElementById("raceMode");

const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const overlayCanvas = document.getElementById("overlayCanvas");

const toleranceSlider = document.getElementById("tolerance");
const thresholdSlider = document.getElementById("threshold");
const colorDisplay = document.getElementById("selectedColor");
const playerNameInput = document.getElementById("playerName");

const toleranceValue = document.getElementById("toleranceValue");
const thresholdValue = document.getElementById("thresholdValue");
const toleranceControls = document.getElementById("toleranceControls");

const adjustToleranceButton = document.getElementById("adjustTolerance");
const adjustColorButton = document.getElementById("adjustColor");

const useSelectedCameraButton = document.getElementById("useSelectedCamera");

// 🎯 **Hent referencer til race UI-elementer**
const startRaceButton = document.getElementById("startRace");
const raceScreen = document.getElementById("raceScreen");
const raceVideo = document.getElementById("raceVideo");
const currentPlayerDisplay = document.getElementById("currentPlayer");
const currentLapsDisplay = document.getElementById("currentLapsDisplay");
const backToSetupRaceButton = document.getElementById("backToSetupRace");

const openColorPickerButton = document.getElementById("openColorPicker");
const closeColorPickerButton = document.getElementById("closeColorPickerButton");
const colorPickerOverlay = document.getElementById("colorPickerOverlay");
const cameraSelect = document.getElementById("cameraSelect");

// 🎯 Opdater selectedCameraId, når brugeren vælger et nyt kamera i dropdown
cameraSelect.addEventListener("change", (event) => {
    selectedCameraId = event.target.value;
    console.log(`🎥 Valgt kamera ændret til: ${selectedCameraId}`);
});
// 🎯 **Globale variabler**

let waitingForVideo = false; // 🔥 Ny variabel
let raceTimer = null; // Gem timer reference

let activeStream = null;
let acceptColorSelectionButton; // Definer variablen globalt
let colorCounts = {}; // Holder styr på hvor mange gange hver farve er fundet
let editingPlayerIndex = null; // 🔥 Sporer om en spiller redigeres
let selectedColor = null;
let tolerance = 50;
let threshold = 100;
let isTracking = false;
let players = [];
let raceSettings = { rounds: 10 };

let raceStartTime = 0; // 🔥 Gem starttidspunkt
let raceActive = false;
let trackingInterval = null; // 🔥 Stopper flere samtidige tracking-løkker
let lastDetectionTime = 0;

let selectedProfilePicture = "Reddriver.png"; // Standardbillede
let editingPlayerId = null; // 🔥 Holder styr på den spiller, der redigeres
let cameraStarted = false;

// 🎥 **Tving kameraet til at stoppe**
function stopCamera() {
    return new Promise(resolve => {
        if (!activeStream) {
            //console.warn("⚠️ Ingen aktiv stream at stoppe!");
            return resolve();
        }

        console.log("📸 Stopper aktiv kamera-stream...");
        activeStream.getTracks().forEach(track => {
            console.log(`🚫 Stopper track: ${track.kind}`);
            track.stop();
        });

        activeStream = null;
        cameraActive = false;
        console.log("✅ Kamera er nu deaktiveret!");

        const videoElement = document.getElementById("video");
        if (videoElement) {
            console.log("🔄 Nulstiller videoElement.srcObject...");
            videoElement.srcObject = null;
        }

        resolve();
    });
}

 // 🎥 **Start det valgte kamera**
async function startSelectedCamera() {
    // ✅ **Brug gemt kamera fra localStorage, hvis muligt**
    if (!selectedCameraId) {
        selectedCameraId = localStorage.getItem("selectedCamera") || null;
    }

    if (!selectedCameraId) {
        alert("Vælg et kamera først!");
        return;
    }

    if (cameraActive) {
        console.warn("⚠️ Kameraet kører allerede.");
        return;
    }

    console.log("🎥 Prøver at starte kamera:", selectedCameraId);
    cameraActive = true;

    await stopCamera(); 

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: selectedCameraId } } });

        activeStream = stream;
        const videoElement = document.getElementById("video");

        if (!videoElement) {
            console.error("❌ Fejl: videoElement blev ikke fundet!");
            return;
        }

        videoElement.srcObject = stream;

        videoElement.oncanplay = () => {
            console.log("🎥 Kameraet er nu aktivt!");
            videoElement.style.display = "block";
            videoElement.play().catch(err => console.error("⚠️ Fejl ved videoafspilning:", err));
        };

        const cameraPlaceholder = document.getElementById("cameraPlaceholder");
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = "none";
        }

    } catch (err) {
        console.error("❌ Fejl ved kamera-tilgang:", err);
        cameraActive = false;
    }
}

let selectedCameraId = null;

// 🎥 **Forbedret kamera-detektion til ældre browsere**
async function getCameras() {
    try {
        // 🔥 **Tving adgang til kamera for at sikre, at enheder registreres**
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("✅ Kamera adgang givet!");

        // 🎥 **Hent tilgængelige enheder**
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");

        if (videoDevices.length === 0) {
            console.warn("🚨 Ingen kameraer fundet!");
            return [];
        }

        console.log("🎥 Fundne kameraer:", videoDevices);

        // 🎯 **Opdater dropdown med kameraer**
        const cameraSelect = document.getElementById("cameraSelect");
        cameraSelect.innerHTML = ""; // Rens dropdown først

        videoDevices.forEach((device, index) => {
            const option = document.createElement("option");
            option.value = device.deviceId;
            option.textContent = device.label || `Kamera ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        console.log("✅ Kamera-dropdown opdateret!");

        // ✅ **Vælg automatisk første kamera, hvis intet kamera er gemt i localStorage**
        if (!selectedCameraId) {
            selectedCameraId = videoDevices[0].deviceId;
            localStorage.setItem("selectedCamera", selectedCameraId); // Gem valg
            cameraSelect.value = selectedCameraId; // Opdater dropdown
            console.log(`✅ Automatisk valgt første kamera: ${selectedCameraId}`);
        }

        // 🔄 **Stop streamen igen for at frigøre ressourcer**
        stream.getTracks().forEach(track => track.stop());

        return videoDevices;
    } catch (err) {
        console.error("🚨 Fejl ved kameraadgang:", err);
    }
}

// 🎯 **Opdater selectedCameraId, når brugeren vælger et nyt kamera i dropdown**
document.getElementById("cameraSelect").addEventListener("change", (event) => {
    selectedCameraId = event.target.value;
    localStorage.setItem("selectedCamera", selectedCameraId); // Gem valg, så det huskes efter refresh
    console.log(`🎥 Valgt kamera ændret til: ${selectedCameraId}`);
});

// 🎯 **Funktion til at acceptere farvevalg**
function acceptColorHandler() {
    console.log("✅ Farvevalg accepteret:", selectedColor);

    // 🎯 **Sikre, at en farve er valgt**
    if (!selectedColor) {
        alert("Vælg en farve først!");
        return;
    }

    // 🎯 **Skjul farvevælger-overlayet korrekt**
    console.log("🛑 Lukker farvevælger-overlay...");
    colorPickerOverlay.classList.remove("show");
    colorPickerOverlay.style.opacity = "0";

    setTimeout(() => {
        colorPickerOverlay.style.display = "none";
    }, 300);

    // 🎯 **Stop kameraet korrekt**
    stopCamera();

    // 🎯 **Sørg for at tolerance-justering og overlayCanvas bliver skjult**
    if (toleranceControls) {
        console.log("🎚 Skjuler tolerance-controls...");
        toleranceControls.style.display = "none";
    }

    if (overlayCanvas) {
        console.log("🖼️ Skjuler overlayCanvas...");
        overlayCanvas.style.display = "none";
    }

    isTracking = false;

    if (typeof trackColor === "function") {
        console.log("⏹ Stopper trackColor()!");
        cancelAnimationFrame(trackColor);
    }

    console.log("✅ Farvevalg bekræftet og overlay lukket.");
}


function resetPlayerForm() {
    console.log("♻️ Nulstiller spilleroprettelse...");

    // 🎯 Nulstil spillerens navn i inputfeltet
    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) {
        playerNameInput.value = "";
        console.log("📝 Inputfeltet er nulstillet.");
    }

    // 🎯 Nulstil den valgte farve
    selectedColor = null;
    console.log("🎨 Farvevalget er nulstillet.");

    // 🎯 Opdater UI, så farveboksen ikke viser en gammel farve
    const colorDisplay = document.getElementById("selectedColor");
    if (colorDisplay) {
        colorDisplay.style.backgroundColor = "transparent";
    }

    // 🎯 Sørg for at tolerancejusteringen starter forfra
    tolerance = 50;
    threshold = 100;
}


function startCountdown() {
    const overlay = document.createElement("div");
    overlay.id = "countdownOverlay";
    overlay.innerHTML = `
        <div id="countdownContainer">
            <div id="lights"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    const lightsDiv = document.getElementById("lights");
    
    let count = 10;
    updateLights(count);

    // 🎵 Afspil baggrundslyd gennem hele countdown
    const startCarAudio = new Audio("startcar.wav");
    startCarAudio.loop = true;
    startCarAudio.play();
    
    const interval = setInterval(() => {
        count--;
        updateLights(count);

        // 🎵 Afspil startred.mp3 fra 9 til 4 sekunder
        if (count <= 9 && count >= 4) {
            new Audio("startred.mp3").play();
        }

        // 🎵 Afspil startgreen.mp3 ved 0 sekunder
        if (count === 0) {
            new Audio("startgreen.mp3").play();
        }

        if (count < 0) {
            clearInterval(interval);
            overlay.remove(); // Fjern overlay når countdown er færdig
            startCarAudio.pause(); // Stop baggrundslyden
            startCarAudio.currentTime = 0;
            startRace();
        }
    }, 1000);
}

function updateLights(count) {
    let lights = "⚪️ ⚪️ ⚪️ ⚪️ ⚪️ ⚪️".split(" ");
    
    if (count <= 9) lights[0] = "🔴";
    if (count <= 8) lights[1] = "🔴";
    if (count <= 7) lights[2] = "🔴";
    if (count <= 6) lights[3] = "🔴";
    if (count <= 5) lights[4] = "🔴";
    if (count <= 4) lights[5] = "🔴";
    if (count <= 3) lights.fill("🟡");
    if (count === 0) lights.fill("🟢");
    
    document.getElementById("lights").innerHTML = lights.join(" ");
}


// 🎯 **Funktion til at styre skærmene**
function showScreen(targetScreen) {
    const screens = [startScreen, colorSetupScreen, raceSetupScreen, raceScreen];
    screens.forEach(screen => screen.style.display = "none");

    // 🚀 Stop kameraet, når vi skifter væk fra en skærm
    stopCamera();

    targetScreen.style.display = "flex";
}







if (cameraPlaceholder) {
    cameraPlaceholder.style.display = "none"; // Skjul pladsholder
}

if (video) {
    video.style.display = "block";
} else {
    console.warn("⚠️ video-elementet blev ikke fundet!");
}

if (overlayCanvas) {
    overlayCanvas.style.display = "block";
} else {
    console.warn("⚠️ overlayCanvas-elementet blev ikke fundet!");
}

// 🎯 **Skift til farvevalg (hent kameraer kun, når brugeren trykker)**
addPlayerButton.addEventListener("click", () => {
    console.log("➕ Tilføjer ny spiller...");
    resetPlayerForm(); // 🚀 Nulstil input og farvevalg
    showScreen(colorSetupScreen);
    console.log("Tilføj spiller trykket - henter kameraer...");
    getCameras();
});

// 🎉 Funktion til at vise konfetti, når en spiller fuldfører racet
function launchConfetti() {
    // 🎶 Afspil lyd
    const applause = new Audio("applaus.mp3");
    applause.volume = 0.8; // Sæt volumen (0.0 - 1.0)
    applause.play().catch(error => console.warn("⚠️ Kunne ikke afspille lyd:", error));

    // 🎉 Skab konfetti
    const confettiContainer = document.createElement("div");
    confettiContainer.classList.add("confetti-container");
    document.body.appendChild(confettiContainer);

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.animationDuration = (Math.random() * 2 + 3) + "s";
        confetti.style.backgroundColor = ["#ff0", "#ff4500", "#ff1493", "#00ff7f", "#1e90ff", "#ff8c00"][Math.floor(Math.random() * 6)];
        confettiContainer.appendChild(confetti);
    }

    // Fjern konfettien efter 5 sekunder
    setTimeout(() => {
        confettiContainer.remove();
    }, 5000);
}

function playApplauseSound() {
    const applause = new Audio("applaus.mp3"); // Sørg for at filen findes i din mappe!
    applause.play().catch(error => {
        console.warn("⚠️ Kunne ikke afspille lyd:", error);
    });
}

function selectProfilePicture(imagePath) {
    selectedProfilePicture = imagePath;

    // Fjern tidligere markering
    document.querySelectorAll(".profile-pic-option").forEach(img => img.classList.remove("selected-profile"));

    // Marker det valgte billede
    document.querySelector(`img[src='${imagePath}']`).classList.add("selected-profile");
}

function updateCountdown(secondsRemaining) {
    const countdownElement = document.getElementById("countdownTimer");

    if (!countdownElement) {
        console.warn("⚠️ Countdown element ikke fundet!");
        return;
    }

    let minutes = Math.floor(secondsRemaining / 60);
    let seconds = secondsRemaining % 60;

    countdownElement.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function addPlayer(name) {
    const newPlayer = {
        id: players.length + 1,
        name: name,
        laps: 0, // Start med 0 kørte runder
        totalLaps: raceSettings.rounds, // Brug den valgte mængde runder
        lapTimes: [] // 🔥 Tilføj tom liste til rundetider
    };

    players.push(newPlayer);
    
    updateLeaderboard(); // Opdater leaderboardet
    
    console.log(`Spiller tilføjet: ${name}`);
}

// Funktion der opdaterer en spillers runder og opdaterer leaderboardet, Her sikrer vi, at en spillers runder aldrig overstiger det valgte antal runder:
function updatePlayerLaps(playerId) {
    let player = players.find(p => p.id === playerId);
    if (!player || player.finished) return;

    //console.log("🏁 Aktuelt raceMode:", raceSettings.mode);

    const now = Date.now();
    if (!player.lapTimes) {
        player.lapTimes = [];
    }

    let lapTime = player.lapTimes.length === 0 
        ? now - raceStartTime  
        : now - player.lastDetectionTime;

    player.lapTimes.push(lapTime);
    player.lastDetectionTime = now;

    console.log(`⏱ ${player.name} registrerede en omgang på ${lapTime}ms`);

    if (raceSettings.mode === "LapCounts") {
        player.laps++;

        if (player.laps >= raceSettings.rounds) {
            player.finishTime = now;
            player.finished = true;
            console.log(`🏁 ${player.name} har FULDFØRT racet! 🎉`);
            launchConfetti();
            playApplauseSound();
        }
    } else if (raceSettings.mode === "FastestLap") {
        let bestLap = Math.min(...player.lapTimes);
        console.log(`🏁 ${player.name} har ny bedste tid: ${formatTime(bestLap)}`);
    }

    if (raceSettings.mode === "FastestLap") {
        sortLeaderboardByFastestLap();
    }

    updateLeaderboard();
    updateLapTimesTable();
}

function sortLeaderboardByFastestLap() {
    players.sort((a, b) => {
        let fastestLapA = a.lapTimes.length > 0 ? Math.min(...a.lapTimes) : Infinity;
        let fastestLapB = b.lapTimes.length > 0 ? Math.min(...b.lapTimes) : Infinity;
        return fastestLapA - fastestLapB;
    });
}

function toggleLapTimes() {
    const overlay = document.getElementById("lapTimesOverlay");

    if (!overlay) {
        console.warn("⚠️ tidsoverbliks-overlay ikke fundet!");
        return;
    }

    if (!players || players.length === 0) {
        console.warn("❌ Ingen spillere til rådighed for rundetider!");
        return;
    }

    if (overlay.style.display === "none" || overlay.style.display === "") {
        overlay.style.display = "flex"; // Sørger for, at det vises
        setTimeout(() => overlay.classList.add("show"), 10); // Gør synligt med transition
        updateLapTimesTable();
    } else {
        overlay.classList.remove("show");
        setTimeout(() => overlay.style.display = "none", 300); // Skjuler efter transition
    }
}

function formatTime(ms) {
    let minutes = Math.floor(ms / 60000);
    let seconds = Math.floor((ms % 60000) / 1000);
    let milliseconds = Math.floor((ms % 1000) / 10); // Kun 2 decimaler

    if (minutes === 0) {
        return `${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;
    } else {
        return `${String(minutes)}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')} sek`;
    }
}



function updateLapTimesTable() {
    const tableBody = document.getElementById("lapTableBody");
    const tableHeader = document.getElementById("lapTableHeader");

    // 🚀 **Nulstil tabellen, hvis ingen spillere har tider endnu**
    if (!players || players.length === 0 || players.every(p => !p.lapTimes || p.lapTimes.length === 0)) {
        console.warn("❌ Ingen spillere fundet eller ingen tider registreret – rydder tabellen!");
        tableBody.innerHTML = "";
        tableHeader.innerHTML = "<th>Runde</th>";
        return;
    }

    console.log("📊 Opdaterer lap times tabel:", players);
    tableBody.innerHTML = "";
    tableHeader.innerHTML = "<th>Runde</th>";

    // 🎯 **Opret tabel-header med spillernavne**
    players.forEach(player => {
        let th = document.createElement("th");
        th.textContent = player.name;
        tableHeader.appendChild(th);
    });

    let maxRounds = Math.max(...players.map(p => (p.lapTimes ? p.lapTimes.length : 0)), 0);
    let fastestLaps = {};

    // 🎯 **Find hurtigste runde for hver spiller**
    players.forEach(player => {
        if (player.lapTimes && player.lapTimes.length > 0) {
            fastestLaps[player.id] = Math.min(...player.lapTimes);
        }
    });

    // 🎯 **Fyld tabellen med runde-tider**
    for (let i = 0; i < maxRounds; i++) {
        let row = document.createElement("tr");
        let roundCell = document.createElement("td");
        roundCell.textContent = i + 1;
        row.appendChild(roundCell);

        players.forEach(player => {
            let cell = document.createElement("td");

            if (player.lapTimes && player.lapTimes[i] !== undefined) {
                let lapTime = player.lapTimes[i];
                cell.textContent = formatTime(lapTime);

                // 🎯 **Marker hurtigste runde med grøn farve**
                if (lapTime === fastestLaps[player.id]) {
                    cell.style.backgroundColor = "lightgreen";
                    cell.style.fontWeight = "bold";
                }
            } else {
                cell.textContent = "--";
            }

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    }

    // 🎯 **Tilføj en ekstra række til total tid**
    let totalRow = document.createElement("tr");
    let totalCell = document.createElement("td");
    totalCell.textContent = "Total tid:";
    totalCell.style.fontWeight = "bold";
    totalRow.appendChild(totalCell);

    players.forEach(player => {
        let totalTimeCell = document.createElement("td");
        let totalTime = player.lapTimes ? player.lapTimes.reduce((acc, time) => acc + time, 0) : 0;
        totalTimeCell.textContent = formatTime(totalTime);
        totalTimeCell.style.fontWeight = "bold";
        totalRow.appendChild(totalTimeCell);
    });

    tableBody.appendChild(totalRow);
}






function resetRaceData() {
    console.log("♻️ Nulstiller race-data...");
    raceActive = false;

    players.forEach(player => {
        player.laps = 0;
        player.finishTime = null;
        player.finished = false;
        player.lastDetectionTime = null;
        player.firstDetectionSkipped = false; // 🔥 Sørg for at første registrering ignoreres i næste løb
        player.lapTimes = [];
        console.log(`♻️ ${player.name} nulstillet: laps=${player.laps}, lastDetectionTime=${player.lastDetectionTime}, firstDetectionSkipped=${player.firstDetectionSkipped}`);
    });

    updateLeaderboard();
    updateLapTimesTable();
}

async function stopRace() {
    raceActive = false;
    console.log("🏁 Race afsluttet!");
    console.log("🛑 stopRace() kaldt fra:", new Error().stack);

    // Stop timer hvis aktiv
    if (raceTimer) {
        clearInterval(raceTimer);
        raceTimer = null;
        console.log("⏹ Timer stoppet!");
    }

    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }

    isTracking = false;

    // 🚀 **Sluk kameraet korrekt**
    await stopCamera();

    // 🎯 **Opdater countdown-timer korrekt**
    const countdownElement = document.getElementById("countdownTimer");
    if (countdownElement) {
        if (raceSettings.mode === "FastestLap") {
            countdownElement.innerText = "Race is over"; // ❗ Skriv "Race is over"
            countdownElement.classList.add("race-over"); // Tilføj styling
            console.log("⏳ Countdown opdateret til 'Race is over'");
        } else {
            countdownElement.style.display = "none"; // ❗ Skjul kun i LapCounts mode
            console.log("⏳ Countdown skjult!");
        }
    }
}

function updateLeaderboard() {
    //console.log("✅ Leaderboard opdateret");
    const leaderboardDiv = document.getElementById("leaderboard");

    if (!leaderboardDiv) {
        console.error("❌ Fejl: Leaderboard-div ikke fundet!");
        return;
    }

    leaderboardDiv.innerHTML = "<h3>LEADERBOARD:</h3>";

    let finishedPlayers = players.filter(player => player.finishTime !== null);
    let ongoingPlayers = players.filter(player => player.finishTime === null);

    // 🎯 **Sortér færdige spillere efter afslutningstid**
    finishedPlayers.sort((a, b) => a.finishTime - b.finishTime);
    
    // 🎯 **Sortér spillere der stadig kører**
    if (raceSettings.mode === "LapCounts") {
        ongoingPlayers.sort((a, b) => b.laps - a.laps);
    } else if (raceSettings.mode === "FastestLap") {
        ongoingPlayers.sort((a, b) => {
            let bestLapA = a.lapTimes.length > 0 ? Math.min(...a.lapTimes) : Infinity;
            let bestLapB = b.lapTimes.length > 0 ? Math.min(...b.lapTimes) : Infinity;
            return bestLapA - bestLapB;
        });
    }

    let sortedPlayers = [...finishedPlayers, ...ongoingPlayers];

    let medalCount = 0;
    let medals = ["🥇", "🥈", "🥉"];

    sortedPlayers.forEach((player, index) => {
        let playerEntry = document.createElement("div");
        playerEntry.classList.add("leaderboard-player");

        let profileImage = player.profilePicture ? player.profilePicture : "default.png";

        let medal = "";
        if (player.finishTime !== null && medalCount < medals.length) {
            medal = medals[medalCount];
            medalCount++;
        }

        let playerInfo;
        if (raceSettings.mode === "LapCounts") {
            playerInfo = `${player.laps}/${raceSettings.rounds || 0}`;
        } else {
            let bestLap = player.lapTimes.length > 0 ? Math.min(...player.lapTimes) : null;
            playerInfo = bestLap !== null ? formatTime(bestLap) : "--:--";
        }

        // 💡 **NY STRUKTUR FOR BEDRE CSS**
        playerEntry.innerHTML = `
            <div class="player-container">
                <div class="player-left">
                    <img src="${profileImage}" alt="${player.name}" class="leaderboard-profile-pic">
                    <span class="player-name">${player.name}</span>
                </div>
                <div class="player-right">
                    <span class="player-laps">${playerInfo}</span>
                    <span class="medal">${medal}</span>
                </div>
            </div>
        `;

        leaderboardDiv.appendChild(playerEntry);
    });
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



backToStartRaceButton.addEventListener("click", () => {
    console.log("🔙 Tilbage til startskærm trykket!");

    // 🚫 Stop tracking hvis det stadig kører
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
        console.log("⏹ Tracking stoppet.");
    }

    // 🛑 Stop race-status
    raceActive = false;

    // 🎯 Nulstil ALLE spillere
    players.forEach(player => {
        player.laps = 0;
        player.finishTime = null;
        player.lastDetectionTime = null;
    });

    // 🚀 Opret en ny tom spiller-liste for at sikre, at gamle data ikke hænger ved
    players = JSON.parse(JSON.stringify(players));

    console.log("🔄 Race nulstillet! Spillere:", players);

    // 🏁 Opdater leaderboard med nulstillet data
    updateLeaderboard();

    // 📺 Skift tilbage til startskærm
    showScreen(startScreen);
});





async function startRace() {
    resetRaceData();
    raceStartTime = Date.now();
    
    console.log("🚀 Start Race!");
    console.log(`🚀 RaceMode ved start: ${raceSettings.mode}`);

    updateExcludedColors();
    showScreen(raceScreen);
    console.log("🔍 raceScreen vist!");

    raceActive = true;
    console.log(`🏁 Race er nu aktiv i mode: ${raceSettings.mode}`);

    updateLeaderboard();
    startRaceCamera();

    const countdownElement = document.getElementById("countdownTimer");

    // ✅ **Nulstil countdown UI**
    countdownElement.style.display = "block"; // Sørg for at den er synlig
    countdownElement.innerText = ""; // ❗ Slet evt. gammel tekst!
    countdownElement.classList.remove("race-over"); // Fjern styling fra forrige løb

    // **FASTEST LAP MODE - START COUNTDOWN**
    if (raceSettings.mode === "FastestLap") {
        const selectedTimeLimit = raceSettings.timeLimit || 120;
        console.log(`⏳ FastestLap mode med tidsgrænse: ${selectedTimeLimit} sekunder.`);

        updateCountdown(selectedTimeLimit); // ✅ Brug din originale funktion

        let secondsRemaining = selectedTimeLimit;

        // **Start nedtælling**
        raceTimer = setInterval(() => {
            secondsRemaining--;

            if (secondsRemaining >= 0) {
                updateCountdown(secondsRemaining); // ✅ Brug `secondsRemaining` korrekt
            } else {
                console.log("⏳ Tid er gået! Race stoppes.");
                clearInterval(raceTimer);
                stopRace();

                // 🔥 Skift countdown-tekst til "Race is over"
                countdownElement.innerText = "Race is over";
                countdownElement.classList.add("race-over");
            }
        }, 1000);
    } else {
        countdownElement.style.display = "none"; // Skjul countdown i LapCounts
    }

    // **Start farvesporing kun hvis ikke allerede aktiv**
    setTimeout(() => {
        if (!trackingInterval && raceActive) {
            detectColorInRace();
        } else {
            console.warn("⚠️ detectColorInRace kører allerede eller race er stoppet.");
        }
    }, 1000);
}

function playCountdownVideo() {
    return new Promise((resolve) => {
        console.log("⏳ Starter 10 sekunders nedtælling...");

        let countdownOverlay = document.createElement("div");
        countdownOverlay.id = "countdownOverlay";
        countdownOverlay.style.position = "fixed";
        countdownOverlay.style.top = "0";
        countdownOverlay.style.left = "0";
        countdownOverlay.style.width = "100vw";
        countdownOverlay.style.height = "100vh";
        countdownOverlay.style.background = "black";
        countdownOverlay.style.display = "flex";
        countdownOverlay.style.alignItems = "center";
        countdownOverlay.style.justifyContent = "center";
        countdownOverlay.style.zIndex = "1000";

        let countdownVideo = document.createElement("video");
        countdownVideo.id = "countdownVideo";
        countdownVideo.src = "countdownlight.mp4";
        countdownVideo.style.width = "100%";
        countdownVideo.style.height = "100%";
        countdownVideo.style.objectFit = "cover";
        countdownVideo.autoplay = true;
        countdownVideo.muted = false;
        countdownVideo.playsInline = true;

        countdownOverlay.appendChild(countdownVideo);
        document.body.appendChild(countdownOverlay);

        countdownVideo.play().then(() => {
            console.log("🎬 Countdown video startet!");
        }).catch(error => {
            console.error("⚠️ Kunne ikke afspille video:", error);
        });

        // Når videoen slutter, fjern overlay og start racet
        countdownVideo.onended = () => {
            console.log("🏁 Countdown færdig – starter racet!");
            document.body.removeChild(countdownOverlay);
            resolve(); // 🚀 Sig til `startRace();`, at vi nu kan fortsætte!
        };
    });
}


const observer = new MutationObserver(() => {
    let lapsDisplay = document.getElementById("currentLapsDisplay");

    if (!lapsDisplay) {
        //console.warn("⚠️ currentLapsDisplay forsvandt! Opretter igen...");
        lapsDisplay = document.createElement("p");
        lapsDisplay.id = "currentLapsDisplay";
        lapsDisplay.textContent = `Runder: 0/${raceSettings.rounds}`;
        raceScreen.appendChild(lapsDisplay);
    }
});

// Overvåg raceScreen for ændringer i børneelementer
observer.observe(raceScreen, { childList: true, subtree: true });

// 🎯 **Tilbage til setup race**
backToSetupRaceButton.addEventListener("click", async () => {
    console.log("🔙 Tilbage til startskærm trykket!");
    raceActive = false;
    await stopCamera(); // 🔥 Luk kameraet korrekt
    showScreen(startScreen);
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




function startRaceCamera() {
    if (activeStream) {
        console.warn("⚠️ Kameraet er allerede aktivt – undgår dobbelt-opstart.");
        return;
    }

    console.log("📸 Henter tilgængelige kameraer...");

    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        const videoDevices = devices.filter(device => device.kind === "videoinput");

        if (videoDevices.length === 0) {
            console.error("❌ Ingen kameraer fundet!");
            alert("Ingen kameraer fundet. Tjek din enhed.");
            return;
        }

        const cameraId = selectedCameraId || videoDevices[0].deviceId;
        console.log(`🎥 Bruger kamera: ${cameraId}`);

        return navigator.mediaDevices.getUserMedia({
            video: { 
                deviceId: { exact: cameraId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: "environment"
            }
        });
    })
    .then(stream => {
        if (!stream) {
            console.error("❌ Fejl: Ingen videostream modtaget!");
            alert("Kunne ikke starte kameraet.");
            return;
        }

        console.log("📷 Kamera stream modtaget!", stream);

        // **Stop tidligere stream hvis den eksisterer**
        if (activeStream) {
            console.log("📸 Stopper tidligere kamera-stream...");
            activeStream.getTracks().forEach(track => track.stop());
        }

        activeStream = stream;

        let hiddenVideo = document.getElementById("hiddenRaceVideo");
        if (!hiddenVideo) {
            hiddenVideo = document.createElement("video");
            hiddenVideo.id = "hiddenRaceVideo";
            hiddenVideo.style.display = "none";
            document.body.appendChild(hiddenVideo);
        }

        hiddenVideo.srcObject = stream;

        hiddenVideo.onloadedmetadata = () => {
            console.log("🎥 Race-video metadata indlæst!");

            // **Tving browseren til at afspille videoen ordentligt**
            setTimeout(() => {
                hiddenVideo.play()
                .then(() => console.log("✅ Video afspilles korrekt"))
                .catch(err => console.error("❌ Fejl: Video kunne ikke afspilles", err));
            }, 200);
        };

        hiddenVideo.oncanplay = () => {
            console.log("✅ Race-video kan nu afspilles i baggrunden!");

            setTimeout(() => {
                if (hiddenVideo.videoWidth > 0 && hiddenVideo.videoHeight > 0) {
                    console.log("🏁 Race-video er fuldt indlæst, starter farvesporing!");

                    if (!trackingInterval) { 
                        detectColorInRace();
                    } else {
                        console.warn("⚠️ detectColorInRace kører allerede, undgår dobbelt-opstart.");
                    }
                } else {
                    console.error("❌ Fejl: Race-video stadig ikke klar, prøver igen...");
                    setTimeout(startRaceCamera, 500);
                }
            }, 500);
        };
    })
    .catch(err => {
        console.error("❌ Fejl ved adgang til kamera", err);
        alert("Kunne ikke starte kameraet. Tjek kameraindstillinger.");
    });
}



function detectColorInRace() {
    console.log("🔄 trackingInterval status før start:", trackingInterval);

    if (trackingInterval !== null) {
        //console.warn("⚠️ detectColorInRace kører allerede, undgår dobbelt-opstart.");
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

    // 🔄 Nulstil trackingdata for alle spillere, når nyt ræs starter
    players.forEach(player => {
        console.log(`♻️ Nulstiller trackingdata for ${player.name}:`);
        player.lastDetectionTime = null;
        player.firstDetectionSkipped = false;
        //console.log(`   ⏳ lastDetectionTime: ${player.lastDetectionTime}`);
        //console.log(`   🔍 firstDetectionSkipped: ${player.firstDetectionSkipped}`);
    });

    trackingInterval = setInterval(() => {
        if (!raceActive) {
            console.warn("⏸ detectColorInRace stoppet, da raceActive er false.");
            clearInterval(trackingInterval);
            trackingInterval = null;
            console.log("⏹ trackingInterval ryddet!");
            return;
        }

        if (raceSettings.mode === "LapCounts" && players.every(p => p.laps >= raceSettings.rounds)) {
            console.log("🏁 Alle spillere er færdige! Stopper tracking.");
            stopRace();
            return;
        }

        const raceCanvas = document.createElement("canvas");
        raceCanvas.width = hiddenVideo.videoWidth;
        raceCanvas.height = hiddenVideo.videoHeight;
        const raceCtx = raceCanvas.getContext("2d");

        // **Drej billedet korrekt**
        raceCtx.save();
        raceCtx.translate(raceCanvas.width / 2, raceCanvas.height / 2);
        raceCtx.rotate(Math.PI / 2); // 🔄 Roter 90 grader
        raceCtx.drawImage(hiddenVideo, -raceCanvas.width / 2, -raceCanvas.height / 2, raceCanvas.width, raceCanvas.height);
        raceCtx.restore();

        const imageData = raceCtx.getImageData(0, 0, raceCanvas.width, raceCanvas.height);
        const data = imageData.data;

        let colorCounts = {}; 
        let totalPixels = raceCanvas.width * raceCanvas.height;

        players.forEach(player => {
            colorCounts[player.id] = 0;
        });

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];

            players.forEach(player => {
                if (colorMatch(r, g, b, player.color, player.tolerance)) {
                    colorCounts[player.id]++;
                }
            });
        }

        if (raceCanvas.width === 0 || raceCanvas.height === 0) {
            //console.error("🚨 Kameraet er ikke klar – prøver igen...");
            return;
        }

        Object.keys(colorCounts).forEach(playerId => {
            let player = players.find(p => p.id == playerId);
            let percentage = (colorCounts[playerId] / totalPixels) * 100;

            //console.log(`🎯 ${player.name}: ${percentage.toFixed(2)}% af billedet matcher`);

            if (percentage < 0.1) return; 

            const now = Date.now();
            //console.log(`⏳ ${player.name} - Tid siden sidste registrering: ${now - (player.lastDetectionTime || 0)} ms`);

            //console.log(`🔍 ${player.name} - Første registrering status:`, player.firstDetectionSkipped);
            //console.log(`⏳ ${player.name} - Sidste registreringstid før opdatering:`, player.lastDetectionTime);

            if (!player.firstDetectionSkipped) {
    player.firstDetectionSkipped = true;
    player.lastDetectionTime = now;  // ✅ Opdater tidspunktet her!
    console.log(`✅ Første registrering ignoreret for ${player.name}`);
    return;
}

        if (!player.lastDetectionTime || now - player.lastDetectionTime > 2000) {
            //console.log(`🆕 ${player.name} registreret!`);
            updatePlayerLaps(player.id);
            
            player.lastDetectionTime = now;  // ✅ Opdater her, så vi ikke får gentagne registreringer for hurtigt
        
            if (raceSettings.mode === "LapCounts" && player.laps >= raceSettings.rounds && !player.finishTime) {
                player.finishTime = now;
                console.log(`🏁 ${player.name} har FULDFØRT racet! 🎉`);
                launchConfetti();
                playApplauseSound();
            }
        }

            //console.log(`⏳ ${player.name} - Sidste registreringstid efter opdatering:`, player.lastDetectionTime);
        });

    }, 100);
}


function ensureVideoReady(callback) {
    const hiddenVideo = document.getElementById("hiddenRaceVideo");

    if (!hiddenVideo || hiddenVideo.videoWidth === 0 || hiddenVideo.videoHeight === 0) {
        console.warn("⏳ Video ikke klar, prøver igen...");
        setTimeout(() => ensureVideoReady(callback), 100); // 🔄 Prøv igen efter 100ms
    } else {
        console.log("✅ Video er klar, starter farvesporing!");
        callback();
    }
}



// 🎯 **Start det valgte kamera**

let cameraActive = false;




// 🎬 **Start valgte kamera**
useSelectedCameraButton.addEventListener("click", () => {
    if (!cameraSelect.value) {
        alert("Vælg et kamera fra listen!");
        return;
    }

    console.log(`🎥 Starter kamera: ${cameraSelect.value}`);

    stopCamera(); // Luk eksisterende kamera først
    selectedCameraId = cameraSelect.value; // Gem det valgte kamera
    startSelectedCamera();
});


function updateCanvasSize() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("overlayCanvas");

    if (!video || !canvas) {
        console.warn("⚠️ Video eller canvas ikke fundet!");
        return;
    }

    // Tjek om video er klar
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("⏳ Video ikke klar, prøver igen...");
        
        // Prøv igen maks 10 gange
        if (!updateCanvasSize.retryCount) {
            updateCanvasSize.retryCount = 0;
        }

        if (updateCanvasSize.retryCount < 10) {
            updateCanvasSize.retryCount++;
            setTimeout(updateCanvasSize, 500);
        } else {
            console.error("❌ Video kunne ikke loade efter 10 forsøg.");
        }
        return;
    }

    // Reset retryCount efter succes
    updateCanvasSize.retryCount = 0;

    // Opdater canvas størrelse til at matche video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log(`📏 Canvas opdateret til: ${canvas.width}x${canvas.height}`);
}

// 🚀 **Kør funktionen, når videoen er klar**
document.getElementById("video").addEventListener("loadedmetadata", updateCanvasSize);
window.addEventListener("resize", updateCanvasSize);

// 🎯 **Vælg farve ved klik på video**
video.addEventListener("click", (event) => {
    if (!video || !video.videoWidth || !video.videoHeight) {
        alert("Kameraet er ikke klar endnu. Prøv igen.");
        return;
    }

    // 📏 **Hent videoens viste størrelse på skærmen**
    const rect = video.getBoundingClientRect();

    // 📐 **Beregn præcis skalering for begge akser**
    const scaleX = video.videoWidth / rect.width;
    const scaleY = video.videoHeight / rect.height;

    // 📍 **Find korrekt klikkoordinat baseret på videoens faktiske opløsning**
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    // 🎨 **Opret en canvas for at hente farven**
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext("2d");

    // 🔄 **Vent kort før vi tegner billedet, for at sikre korrekt synkronisering**
    setTimeout(() => {
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        const pixel = tempCtx.getImageData(x, y, 1, 1).data;
        selectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

        // 🎯 **Opdater UI med den valgte farve**
        if (colorDisplay) {
            colorDisplay.style.backgroundColor = `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`;
        } else {
            console.warn("⚠️ colorDisplay ikke fundet!");
        }

        // 📝 **Debugging for at bekræfte præcisionen**
        console.log(`📌 Klik: Skærmkoordinater = X:${event.clientX}, Y:${event.clientY}`);
        console.log(`🎯 Justerede videokoordinater = X:${x}, Y:${y}`);
        console.log(`🎨 Valgt farve: RGB(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`);
    }, 10); // 🚀 Lidt forsinkelse kan sikre mere præcise data på ældre hardware.
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

    if (!isTracking) {
        // 🔥 Start tolerance-justering (vis sort/hvid)
        isTracking = true;
        toleranceControls.style.display = "block";
        overlayCanvas.style.display = "block";
        video.style.display = "none"; // Skjul normal kameravisning

        adjustToleranceButton.textContent = "Gå tilbage til farvevalg"; // Opdater knaptekst

        trackColor(); // Start visualisering

    } else {
        // 🔄 Gå tilbage til normal kameravisning
        isTracking = false;
        overlayCanvas.style.display = "none"; // Skjul sort/hvid visualisering
        video.style.display = "block"; // Vis normal kamera
        toleranceControls.style.display = "none"; // Skjul tolerance-kontrol

        adjustToleranceButton.textContent = "Juster tolerance"; // Skift tilbage til standardknap
    }
});

// 🎯 **Stop tolerance-justering**
adjustColorButton.addEventListener("click", () => {
    isTracking = false;
    canvas.style.display = "none";
    toleranceControls.style.display = "none";
});

// 🎯 **Track farve og vis som sort/hvid (Tolerance & Threshold)**
function trackColor() {
    if (!selectedColor || !isTracking) {
        //console.warn("⏹ trackColor() stoppet – ingen farve valgt eller tracking inaktiv.");
        return;
    }

    if (!video.srcObject) {
        console.warn("⏹ Ingen aktiv videostream, stopper tracking.");
        isTracking = false;
        return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("⏹ Video ikke klar, forsøger igen...");
        setTimeout(trackColor, 100);
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = (r + g + b) / 3;

        if (colorMatch(r, g, b, selectedColor, tolerance) && brightness >= threshold) {
            data[i] = data[i + 1] = data[i + 2] = 255;
        } else {
            data[i] = data[i + 1] = data[i + 2] = 0;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // **🚀 Stop tracking korrekt ved at afbryde animationFrame**
    if (!isTracking) {
        console.warn("⏹ trackColor() stoppet – tracking blev deaktiveret.");
        return;
    }

    requestAnimationFrame(trackColor);
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
savePlayerButton.onclick = async function () {
    let playerName = playerNameInput.value.trim();
    if (!selectedColor || !playerName) {
        alert("Vælg en farve og indtast et navn!");
        return;
    }

    if (editingPlayerId !== null) {
        updatePlayer(editingPlayerId);
    } else {
        addNewPlayer();
    }

    editingPlayerId = null;
    await stopCamera();  // 🔥 Kameraet slukkes efter spiller er gemt
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
        profilePicture: selectedProfilePicture, // 🔥 Gem billedevalg
        laps: 0
    };

    players.push(newPlayer);
    console.log("➕ Ny spiller tilføjet:", newPlayer);

    updatePlayerList();
    showScreen(startScreen);
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

    //if (players.length > 0) {
    //    setupRaceButton.style.display = "block";
    //}
}
// 🎯 **Slet spiller baseret på ID**
function removePlayer(playerId) {
    players = players.filter(p => p.id !== playerId);
    console.log(`❌ Spiller fjernet! (ID: ${playerId})`);
    updatePlayerList();
}
