const canvas = document.getElementById("ar-canvas");
const arButton = document.getElementById("ar-button");
let xrSession = null;
let model = null;

// Инициализация Three.js
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Сцена и камера (настройки для AR)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

// Загрузка 3D-модели
const loader = new THREE.GLTFLoader();
loader.load(
    "./assets/model.glb",  // Путь к модели
    (gltf) => {
        model = gltf.scene;
        scene.add(model);
        console.log("3D Model loaded!");
    },
    undefined,
    (error) => {
        console.error("Error loading model:", error);
    }
);

// Проверка поддержки WebXR
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
        xrSession = await navigator.xr.requestSession("immersive-ar");
        await renderer.xr.setSession(xrSession);
        
        // Настройка AR-пространства
        const referenceSpace = await xrSession.requestReferenceSpace("local");
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpace(referenceSpace);
        
        // Запуск рендеринга
        renderer.setAnimationLoop(onXRFrame);
        arButton.style.display = "none";
    } catch (error) {
        console.error("AR session failed:", error);
        arButton.textContent = "AR Error";
    }
});

// Отрисовка кадра в AR
function onXRFrame() {
    renderer.render(scene, camera);
}
