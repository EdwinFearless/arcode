const canvas = document.getElementById("ar-canvas");
const arButton = document.getElementById("ar-button");
const ctx = canvas.getContext("webgl", { antialias: true });

let xrSession = null;

// Проверяем поддержку WebXR
if (navigator.xr) {
    navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
            arButton.style.display = "block";
        } else {
            arButton.textContent = "AR not supported";
        }
    });
} else {
    arButton.textContent = "WebXR not available";
}

// Запуск AR-сессии
arButton.addEventListener("click", async () => {
    try {
        xrSession = await navigator.xr.requestSession("immersive-ar", {
            optionalFeatures: ["local-floor", "hand-tracking"]
        });

        xrSession.updateRenderState({
            baseLayer: new XRWebGLLayer(xrSession, ctx)
        });

        xrSession.requestAnimationFrame(onXRFrame);
        arButton.style.display = "none";
    } catch (error) {
        console.error("AR session failed:", error);
        arButton.textContent = "AR Error";
    }
});

// Отрисовка AR-сцены
function onXRFrame(time, xrFrame) {
    const pose = xrFrame.getViewerPose(xrSession.referenceSpace);

    if (pose) {
        for (const view of pose.views) {
            // Очищаем canvas
            ctx.clearColor(0, 0, 0, 0);
            ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

            // Здесь можно добавить 3D-объекты
            // Например, с использованием Three.js или Babylon.js
        }
    }

    if (xrSession) {
        xrSession.requestAnimationFrame(onXRFrame);
    }
}
