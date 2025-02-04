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

let selectedColor = null;
let tolerance = 50;
let threshold = 100;
let isTracking = false;
let players = [];
let raceSettings = { rounds: 10 };
let activeStream = null;

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

// 🎯 **Event listener til at vælge kamera**

useSelectedCameraButton.addEventListener("click", startSelectedCamera);



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

// 🎯 **Stop kameraet funktion (udenfor `savePlayerButton`!)**
function stopCamera() {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        activeStream = null;
        console.log("Kamera stoppet.");
    }

    // 🔴 **Stop tracking, hvis det stadig kører**
    isTracking = false;
    canvas.style.display = "none";
    toleranceControls.style.display = "none";
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
