const video = document.getElementById("qr-video");
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const resultDiv = document.getElementById("qr-result");

let scannerActive = false;
let stream = null;

// Запуск сканера
startButton.addEventListener("click", async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "environment" // Используем заднюю камеру
            } 
        });
        video.srcObject = stream;
        video.play();
        scannerActive = true;
        startButton.disabled = true;
        stopButton.disabled = false;
        scanQR();
    } catch (err) {
        console.error("Ошибка камеры:", err);
        alert("Не удалось получить доступ к камере");
    }
});

// Остановка сканера
stopButton.addEventListener("click", () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    scannerActive = false;
    startButton.disabled = false;
    stopButton.disabled = true;
});

// Распознавание QR-кода
function scanQR() {
    if (!scannerActive) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
        resultDiv.style.display = "block";
        setTimeout(() => {
            window.location.href = "ar.html"; // Переход на AR-страницу
        }, 1500);
    } else {
        requestAnimationFrame(scanQR);
    }
}