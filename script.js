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
const currentLapsDisplay = document.getElementById("currentLaps");
const backToSetupRaceButton = document.getElementById("backToSetupRace");

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


// 🎯 **Skift til farvevalg (hent kameraer kun, når brugeren trykker)**
addPlayerButton.addEventListener("click", () => {
    startScreen.style.display = "none";
    colorSetupScreen.style.display = "block";

    console.log("Tilføj spiller trykket - henter kameraer...");
    getCameras();
});

// 🎯 **Skift til opsæt race**
setupRaceButton.addEventListener("click", () => {
    startScreen.style.display = "none";
    raceSetupScreen.style.display = "block";
    roundsInput.value = raceSettings.rounds;
});

// 🎯 **Skift tilbage til startskærm**
backToStartButton.addEventListener("click", () => {
    colorSetupScreen.style.display = "none";
    startScreen.style.display = "block";
    stopCamera();
});

backToStartRaceButton.addEventListener("click", () => {
    raceSetupScreen.style.display = "none";
    startScreen.style.display = "block";
});

// 🎯 **Start Race**
startRaceButton.addEventListener("click", () => {
    if (players.length === 0) {
        alert("Tilføj mindst én spiller før du starter racet!");
        return;
    }

    // Skift til race-skærm
    raceSetupScreen.style.display = "none";
    raceScreen.style.display = "block";

    // Vælg første spiller
    activeRacePlayer = players[0];
    lapsCompleted = 0;
    raceActive = true;

    // Opdater UI
    currentPlayerDisplay.textContent = `Spiller: ${activeRacePlayer.name}`;
    currentLapsDisplay.textContent = `Runder: 0/${raceSettings.rounds}`;

    // Start kamera
    startRaceCamera();
});

// 🎯 **Tilbage til setup race**
backToSetupRaceButton.addEventListener("click", () => {
    raceScreen.style.display = "none";
    raceSetupScreen.style.display = "block";
    raceActive = false;
    stopCamera();
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

// 🎯 **Hent kameraer og tilføj dem til dropdown**
function getCameras() {
    console.log("getCameras() kaldt!");

    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const videoDevices = devices.filter(device => device.kind === "videoinput");

            if (videoDevices.length === 0) {
                alert("Ingen kameraer fundet!");
                return;
            }

            cameraSelect.innerHTML = ""; 

            videoDevices.forEach((device, index) => {
                let option = document.createElement("option");
                option.value = device.deviceId;
                option.textContent = device.label || `Kamera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            console.log("Fundne kameraer:", videoDevices);
        })
        .catch(err => {
            console.error("Fejl ved hentning af kameraer:", err);
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

        // Brug 'selectedCameraId', hvis det findes, ellers brug første kamera
        const cameraId = selectedCameraId || videoDevices[0].deviceId;
        console.log(`Bruger kamera: ${cameraId}`);

        return navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: cameraId } }
        });
    })
    .then(stream => {
        if (!stream) return; // Hvis ingen stream returneres, stop her.

        activeStream = stream;
        raceVideo.srcObject = stream;

        raceVideo.onloadedmetadata = () => {
            console.log("Race-video metadata indlæst!");
        };

        raceVideo.oncanplay = () => {
            console.log("Race-video kan nu afspilles!");
            raceVideo.play();
            setTimeout(() => {
                if (raceVideo.videoWidth > 0 && raceVideo.videoHeight > 0) {
                    console.log("Race-video er fuldt indlæst, starter farvesporing!");
                    detectColorInRace();
                } else {
                    console.error("Fejl: Race-video stadig ikke klar, prøver igen...");
                    setTimeout(startRaceCamera, 500);
                }
            }, 500);
        };
    })
    .catch(err => {
        console.error("Fejl ved adgang til kamera", err);
        alert("Kunne ikke starte kameraet. Tjek kameraindstillinger.");
    });
}


// 🎯 **Farvedetektion – Sikrer, at kameraet er klar**
function detectColorInRace() {
    if (trackingInterval !== null) {
        console.warn("detectColorInRace kører allerede, undgår dobbelt-opstart.");
        return;
    }

    if (!raceActive || !activeRacePlayer) {
        console.warn("Race er ikke aktiv eller spiller ikke valgt.");
        return;
    }

    trackingInterval = setInterval(() => {
        if (raceVideo.videoWidth === 0 || raceVideo.videoHeight === 0) {
            console.warn("Video stadig ikke klar, prøver igen...");
            return;
        }

        const raceCanvas = document.createElement("canvas");
        raceCanvas.width = raceVideo.videoWidth;
        raceCanvas.height = raceVideo.videoHeight;
        const raceCtx = raceCanvas.getContext("2d");

        raceCtx.drawImage(raceVideo, 0, 0, raceCanvas.width, raceCanvas.height);
        const imageData = raceCtx.getImageData(0, 0, raceCanvas.width, raceCanvas.height);
        const data = imageData.data;

        let detected = false;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];

            if (colorMatch(r, g, b, activeRacePlayer.color, activeRacePlayer.tolerance)) {
                const now = Date.now();

                if (now - lastDetectionTime > 1000) { // 1 sek pause før ny registrering
                    lapsCompleted++;
                    currentLapsDisplay.textContent = `Runder: ${lapsCompleted}/${raceSettings.rounds}`;
                    lastDetectionTime = now;
                }

                detected = true;
                break;
            }
        }

        if (lapsCompleted >= raceSettings.rounds) {
            alert(`${activeRacePlayer.name} har fuldført racet!`);
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

    if (!selectedDeviceId) {
        alert("Vælg et kamera fra listen!");
        return;
    }

    // 🔥 Stop eksisterende stream, hvis det allerede kører
    stopCamera();

    console.log("Starter kamera:", selectedDeviceId);

    navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedDeviceId } }
    })
    .then(stream => {
        activeStream = stream;
        video.srcObject = stream;
        video.play();
    })
    .catch(err => {
        console.error("Fejl ved adgang til kamera", err);
        alert("Kunne ikke starte kameraet. Prøv et andet kamera.");
    });
}

// 🎯 **Opdateret kameraopstart – gemmer valgte kamera**
useSelectedCameraButton.addEventListener("click", () => {
    selectedCameraId = cameraSelect.value; // 🔥 Gem kameraet til senere brug
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
        threshold: threshold
    };
    
    players.push(player);
    updatePlayerList();

    // 🎯 **Stop kameraet, når spilleren gemmes**
    stopCamera();

    // Skift tilbage til startskærm
    colorSetupScreen.style.display = "none";
    startScreen.style.display = "block";

    console.log("Spiller gemt:", player);
});

// 🎯 **Stop tracking når nødvendigt**
function stopCamera() {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        raceVideo.srcObject = null;
        activeStream = null;
        console.log("Kamera stoppet.");
    }

    if (trackingInterval !== null) {
        clearInterval(trackingInterval);
        trackingInterval = null;
        console.log("Tracking stoppet.");
    }
}
// 🎯 **Opdater spillerliste på forsiden**
function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach(player => {
        let div = document.createElement("div");
        div.classList.add("player");
        div.innerHTML = `
            <div class="playerColor" style="background-color: rgb(${player.color.r}, ${player.color.g}, ${player.color.b});"></div>
            ${player.name}
        `;
        playerList.appendChild(div);
    });

    if (players.length > 0) {
        setupRaceButton.style.display = "block";
    }
}
