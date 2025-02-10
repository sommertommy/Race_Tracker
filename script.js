document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM er nu indlæst!");

    const videoElement = document.getElementById("video");
    const overlayCanvas = document.getElementById("overlayCanvas");
    const cameraPlaceholder = document.getElementById("cameraPlaceholder");
    const colorPickerOverlay = document.getElementById("colorPickerOverlay");

    if (colorPickerOverlay) {
        colorPickerOverlay.classList.remove("show");
        colorPickerOverlay.style.display = "none";
    }

    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = "flex";
    }

    if (!videoElement) {
        console.error("⚠️ Fejl: Video-elementet findes ikke i DOM'en!");
    }

    if (!overlayCanvas) {
        console.error("⚠️ Fejl: OverlayCanvas findes ikke i DOM'en!");
    }
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
const raceModeSelector = document.getElementById("raceMode");

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
const closeColorPickerButton = document.getElementById("closeColorPicker");
const colorPickerOverlay = document.getElementById("colorPickerOverlay");
const cameraSelect = document.getElementById("cameraSelect");

// 🎯 **Globale variabler**
let raceMode = "LapCounts"; // Standardmode
let raceTimer = null; // Gem timer reference
let selectedCameraId = null;
let activeStream = null;

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


// 🎯 **Funktion til at styre skærmene**
function showScreen(targetScreen) {
    const screens = [startScreen, colorSetupScreen, raceSetupScreen, raceScreen];
    screens.forEach(screen => screen.style.display = "none");
    targetScreen.style.display = "block";
}

document.getElementById("raceMode").addEventListener("change", function () {
    raceMode = this.value;
    console.log(`🏁 Ræs-type ændret til: ${raceMode}`);
});


// 🎯 Sikrer, at overlayet er skjult fra starten
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM indlæst – sikrer at overlayet er skjult");

    const colorPickerOverlay = document.getElementById("colorPickerOverlay");
    colorPickerOverlay.classList.remove("show");
    colorPickerOverlay.style.display = "none"; // Tving skjult ved load
});

// 🎨 **Åbn farvevælger-overlay**
openColorPickerButton.addEventListener("click", () => {
    console.log("📸 Åbner kamera-overlay...");
    colorPickerOverlay.classList.add("show");
    colorPickerOverlay.style.display = "flex";

    // ✅ Vis pladsholder, skjul kamera-elementer indtil de er klar
    cameraPlaceholder.style.display = "flex";
    video.style.display = "none";
    overlayCanvas.style.display = "none";

    if (cameraSelect.options.length === 0) {
        getCameras();
    }
});

// ❌ **Luk farvevælger-overlay**
closeColorPickerButton.addEventListener("click", () => {
    console.log("❌ Lukker kamera-overlay...");
    colorPickerOverlay.classList.remove("show");
    colorPickerOverlay.style.display = "none";
});


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
    if (!player) return;

    const now = Date.now();

    // ✅ Sørg for, at `lapTimes` eksisterer
    if (!player.lapTimes) {
        player.lapTimes = [];
        console.warn(`🔧 Oprettede lapTimes for ${player.name}`);
    }

    let lapTime = player.lapTimes.length === 0 
        ? now - raceStartTime  // Første omgang starter fra race start
        : now - player.lastDetectionTime; // Tid siden sidste omgang

    player.lapTimes.push(lapTime); // 🎯 GEM rundetiden!
    player.lastDetectionTime = now; // Opdater seneste omgang

    if (raceMode === "LapCounts") {
        player.laps++;

        console.log(`⏱ ${player.name} rundetid: ${lapTime}ms`);

        if (player.laps === raceSettings.rounds) {
            player.finishTime = now;
            console.log(`🏁 ${player.name} har FULDFØRT racet! 🎉`);

            console.log("🎉 Udløser konfetti!");
            launchConfetti();

            console.log("🔊 Afspiller applaus!");
            playApplauseSound();
        }
    } else if (raceMode === "FastestLap") {
        console.log(`⏱ ${player.name} registrerede en omgang på ${lapTime}ms`);

        // 🎯 **Sortér leaderboard efter hurtigste runde**
        sortLeaderboardByFastestLap();
    }

    updateLeaderboard();
    updateLapTimesTable(); // 📌 Opdater tabellen, når der kommer en ny tid
}

function sortLeaderboardByFastestLap() {
    players.sort((a, b) => {
        let fastestLapA = a.lapTimes.length > 0 ? Math.min(...a.lapTimes) : Infinity;
        let fastestLapB = b.lapTimes.length > 0 ? Math.min(...b.lapTimes) : Infinity;
        return fastestLapA - fastestLapB;
    });

    updateLeaderboard();
}

function toggleLapTimes() {
    const overlay = document.getElementById("lapTimesOverlay");

    if (!players || players.length === 0) {
        console.warn("❌ Ingen spillere til rådighed for rundetider!");
        return;
    }

    overlay.style.display = overlay.style.display === "flex" ? "none" : "flex";

    if (overlay.style.display === "flex") {
        updateLapTimesTable();
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
        player.lastDetectionTime = null;
        player.firstDetectionSkipped = false; // 🔥 Sørg for at første registrering ignoreres i næste løb
        player.lapTimes = [];
    });

    updateLeaderboard();
    updateLapTimesTable();
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

    leaderboardDiv.innerHTML = "<h3>LEADERBOARD:</h3>";

    let sortedPlayers = [];

    if (raceMode === "LapCounts") {
        // 🎯 **Lap Counts mode: Sortér efter flest runder**
        sortedPlayers = [...players].sort((a, b) => b.laps - a.laps);
    } else {
        // 🎯 **Fastest Lap mode: Sortér efter hurtigste omgangstid**
        sortedPlayers = [...players].sort((a, b) => {
            let bestLapA = a.lapTimes.length > 0 ? Math.min(...a.lapTimes) : Infinity;
            let bestLapB = b.lapTimes.length > 0 ? Math.min(...b.lapTimes) : Infinity;
            return bestLapA - bestLapB; // Den laveste tid først
        });
    }

    sortedPlayers.forEach((player, index) => {
        let playerEntry = document.createElement("div");
        playerEntry.classList.add("leaderboard-player");

        let medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

        playerEntry.innerHTML = `
            <div class="player-profile">
                <img src="${player.profilePicture}" class="leaderboard-profile-pic">
                <span class="player-name">${player.name}</span>
                <span class="player-laps">${raceMode === "LapCounts" ? `${player.laps}/${raceSettings.rounds}` : formatTime(player.lapTimes.length > 0 ? Math.min(...player.lapTimes) : 0)}</span>
                <span class="medal">${medal}</span>
            </div>
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



startRaceButton.addEventListener("click", () => {
    if (players.length === 0) {
        alert("Tilføj mindst én spiller før du starter racet!");
        return;
    }

    // 🎥 Start countdown video
    playCountdownVideo();
});

function startRace() {
    resetRaceData();
    raceStartTime = Date.now();
    console.log("🚀 Start Race!");

    updateExcludedColors();
    showScreen(raceScreen);
    console.log("🔍 raceScreen vist!");

    raceActive = true;
    console.log("🏁 Race er nu aktiv:", raceActive);

    updateLeaderboard();
    startRaceCamera();

    // 🔥 Hvis Fastest Lap mode, start en timer
    if (raceMode === "FastestLap") {
        raceTimer = setTimeout(() => {
            console.log("⏳ Tid er gået! Race stoppes.");
            stopRace();
        }, 2 * 60 * 1000); // 2 minutter (2 * 60 * 1000 ms)
    }

    setTimeout(() => {
        if (!trackingInterval) {
            detectColorInRace();
        } else {
            console.warn("⚠️ detectColorInRace kører allerede.");
        }
    }, 1000);
}

function playCountdownVideo() {
    console.log("⏳ Starter 10 sekunders nedtælling...");

    // Opret en video-container
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
    countdownOverlay.style.zIndex = "1000"; // Sørg for, at den er øverst

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

    // 🚀 Start video og vent til den er færdig
    countdownVideo.play().then(() => {
        console.log("🎬 Countdown video startet!");
    }).catch(error => {
        console.error("⚠️ Kunne ikke afspille video:", error);
    });

    // Når videoen slutter, start racet
    countdownVideo.onended = () => {
        console.log("🏁 Countdown færdig – starter racet!");
        document.body.removeChild(countdownOverlay); // Fjern videooverlay
        startRace(); // Kald funktionen, der starter racet
    };
}


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

// 🎥 **Hent kameraer dynamisk**
function getCameras() {
    console.log("📸 Henter tilgængelige kameraer...");

    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const videoDevices = devices.filter(device => device.kind === "videoinput");

            if (videoDevices.length === 0) {
                console.error("❌ Ingen kameraer fundet!");
                alert("Ingen kameraer fundet. Tjek din enhed.");
                return;
            }

            cameraSelect.innerHTML = ""; // Ryd dropdown før tilføjelse

            videoDevices.forEach((device, index) => {
                let option = document.createElement("option");
                option.value = device.deviceId;
                option.textContent = device.label || `Kamera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            console.log(`🎥 Fundne kameraer:`, videoDevices);
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

        let colorCounts = {}; // 🎯 Holder styr på farveantal
        let totalPixels = raceCanvas.width * raceCanvas.height;

        players.forEach(player => {
            colorCounts[player.id] = 0;
        });

        // 🎯 **Gå igennem hvert pixel i billedet**
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];

            players.forEach(player => {
                if (colorMatch(r, g, b, player.color, player.tolerance)) {
                    colorCounts[player.id]++; // 🎯 Tæl farven for denne spiller
                }
            });
        }

        raceCanvas.width = hiddenVideo.videoWidth || 640;
        raceCanvas.height = hiddenVideo.videoHeight || 480;
        
        if (raceCanvas.width === 0 || raceCanvas.height === 0) {
            console.error("🚨 Kameraet er ikke klar – prøver igen...");
            return;
        }

        // 🎯 **Beregn procentdel for hver farve**
        Object.keys(colorCounts).forEach(playerId => {
            let player = players.find(p => p.id == playerId);
            let percentage = (colorCounts[playerId] / totalPixels) * 100;

            if (percentage < 0.1) {
                console.log(`❌ ${player.name} registreres ikke – kun ${percentage.toFixed(2)}% af billedet.`);
                return; // 🚫 Kun registrer hvis mindst 2% af billedet er farven
            }

            const now = Date.now();

            // 🎯 **Ignorer første registrering for hver spiller**
            if (!player.firstDetectionSkipped) {
                player.firstDetectionSkipped = true;
                player.lastDetectionTime = now; // **Sæt 2 sekunders pause efter første registrering**
                console.log(`✅ Første registrering ignoreret for ${player.name}`);
                return;
            }

            // 🎯 **Opdater spillerens omgang via `updatePlayerLaps()`**
            // 🎯 **Opdater spillerens omgang via `updatePlayerLaps()`**
            if (!player.lastDetectionTime || now - player.lastDetectionTime > 2000) { // 2 sekunders delay
                if (raceMode === "LapCounts" && player.laps < raceSettings.rounds) {
                    updatePlayerLaps(player.id);
                    player.lastDetectionTime = now; // Opdater sidste registreringstid
            
                    // 🎉 **Check om spilleren har fuldført racet (kun i LapCounts)**
                    if (player.laps >= raceSettings.rounds && !player.finishTime) {
                        player.finishTime = now;
                        console.log(`🏁 ${player.name} har FULDFØRT racet! 🎉`);
            
                        // 🚀 **Start confetti og lyd (kun i LapCounts)**
                        launchConfetti();
                        playApplauseSound();
                    }
                } else if (raceMode === "FastestLap") {
                    updatePlayerLaps(player.id);
                    player.lastDetectionTime = now;
                }
            }

        });

    }, 100); // 🎯 **Opdatering hver 100ms**
}






// 🎯 **Start det valgte kamera**


function startSelectedCamera() {
    if (!selectedCameraId) {
        alert("Vælg et kamera først!");
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: selectedCameraId } } })
        .then(stream => {
            activeStream = stream;
            const videoElement = document.getElementById("video");
            const overlayCanvas = document.getElementById("overlayCanvas");
            const cameraPlaceholder = document.getElementById("cameraPlaceholder");

            console.log("🔍 Tjekker DOM-elementer i startSelectedCamera():");
            console.log("   🎥 videoElement:", videoElement);
            console.log("   🖼️ overlayCanvas:", overlayCanvas);
            console.log("   📷 cameraPlaceholder:", cameraPlaceholder);

            if (!videoElement || !overlayCanvas) {
                console.error("❌ Fejl: Video eller overlayCanvas blev ikke fundet i DOM'en!");
                return;
            }

            videoElement.srcObject = stream;
            videoElement.play();

            videoElement.onloadedmetadata = () => {
                console.log("🎥 Kameraet er nu aktivt!");

                if (cameraPlaceholder) {
                    cameraPlaceholder.style.display = "none";
                }

                if (videoElement) {
                    console.log("✅ Viser videoElement");
                    videoElement.style.display = "block";
                }

                if (overlayCanvas) {
                    console.log("✅ Viser overlayCanvas");
                    overlayCanvas.style.display = "block";
                }
            };
        })
        .catch(err => {
            console.error("❌ Fejl ved start af kamera:", err);
            alert("Kunne ikke starte kameraet. Prøv et andet kamera.");
        });
}


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


// 🎯 **Vælg farve ved klik på video**
video.addEventListener("click", (event) => {
    if (!video || !video.videoWidth || !video.videoHeight) {
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
    console.log("📌 Debugging: Hvilket element mangler?");
    console.log("   🎥 Video:", document.getElementById("video"));
    console.log("   🖼️ Canvas:", document.getElementById("overlayCanvas"));
    console.log("   📷 Kamera-pladsholder:", document.getElementById("cameraPlaceholder"));
    console.log("   🔲 ColorPickerOverlay:", document.getElementById("colorPickerOverlay"));
    console.log("   🎯 Detaljer om fejl-linje:", event);
    colorDisplay.style.backgroundColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

    if (colorDisplay) {
        colorDisplay.style.backgroundColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    } else {
        console.warn("⚠️ colorDisplay ikke fundet!");
    }
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
        profilePicture: selectedProfilePicture, // 🔥 Gem billedevalg
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
        console.log("📸 Kamera stoppet.");
    }

    video.srcObject = null;
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
