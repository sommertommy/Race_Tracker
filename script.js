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

// 🎯 **Optimeret canvas kontekst for hurtigere getImageData()**
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

// 🎯 **Skift til farvevalg (og hent kameraer, når brugeren går ind)**
addPlayerButton.addEventListener("click", () => {
    startScreen.style.display = "none";
    colorSetupScreen.style.display = "block";

    // 🚀 Hent kameraer kun når brugeren går til farvevælgeren
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
    stopTracking();
});

backToStartRaceButton.addEventListener("click", () => {
    raceSetupScreen.style.display = "none";
    startScreen.style.display = "block";
});

// 🎯 **Hent kameraer og tilføj dem til dropdown**
function getCameras() {
    navigator.mediaDevices.getUserMedia({ video: true }) // 🛠 Anmod om kameraadgang FØRST
        .then(stream => {
            // 🛠 Stop straks streamen, da vi kun vil have adgang til enhedsinformation
            stream.getTracks().forEach(track => track.stop());

            // 🛠 Nu kan vi hente enhedsoplysninger
            return navigator.mediaDevices.enumerateDevices();
        })
        .then(devices => {
            const videoDevices = devices.filter(device => device.kind === "videoinput");

            if (videoDevices.length === 0) {
                alert("Ingen kameraer fundet!");
                return;
            }

            cameraSelect.innerHTML = ""; // Ryd dropdown

            videoDevices.forEach((device, index) => {
                let option = document.createElement("option");
                option.value = device.deviceId;
                option.textContent = device.label || `Kamera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            if (videoDevices.length > 1) {
                alert("Vælg dit ønskede kamera i dropdown-menuen.");
            } else {
                cameraSelect.value = videoDevices[0].deviceId;
            }

            console.log("Fundne kameraer:", videoDevices);
        })
        .catch(err => {
            console.error("Fejl ved hentning af kameraer:", err);
            alert("Kunne ikke hente kameraer. Tjek kameraindstillinger og giv browseren adgang.");
        });
}

let activeStream = null; // Holder styr på det aktive kamerastream

// 🎯 **Start det valgte kamera (kun når brugeren vælger det)**
function startSelectedCamera() {
    let selectedDeviceId = cameraSelect.value;

    if (!selectedDeviceId) {
        alert("Vælg et kamera fra listen!");
        return;
    }

    // 🛠 Stop eksisterende kamerastream, hvis det kører
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
    }

    console.log("Starter kamera:", selectedDeviceId);

    navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedDeviceId } }
    })
    .then(stream => {
        activeStream = stream; // Gem det aktive stream
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

// 🎯 **Hent kameraer, når siden loader**
document.addEventListener("DOMContentLoaded", getCameras);

// 🎯 **Vælg farve ved klik på video (forhindrer frysen af kameraet)**
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

    colorDisplay.style.backgroundColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`; // ✅ Fixet syntax
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

    // Opsæt canvas dimensioner
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = (r + g + b) / 3; // Beregn lysstyrke

        if (colorMatch(r, g, b, selectedColor, tolerance) && brightness >= threshold) {
            data[i] = data[i + 1] = data[i + 2] = 255; // Hvid
        } else {
            data[i] = data[i + 1] = data[i + 2] = 0; // Sort
        }
    }

    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(trackColor); // Kør kontinuerligt
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

    // Ryd felter
    playerNameInput.value = "";
    selectedColor = null;
    colorDisplay.style.backgroundColor = "transparent";

    // 🎯 **Stop kameraet, når spilleren gemmes**
    stopCamera();

    // Skift tilbage til startskærm
    colorSetupScreen.style.display = "none";
    startScreen.style.display = "block";

    console.log("Spiller gemt:", player);
});

// 🎯 **Stop kameraet, når spilleren gemmes**
function stopCamera() {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop()); // Stop alle aktive kameratracks
        video.srcObject = null; // Fjern stream fra video-elementet
        activeStream = null; // Nulstil aktiv stream
        console.log("Kamera stoppet.");
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
