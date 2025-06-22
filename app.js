// Инициализация сцены, камеры и рендерера
let scene, camera, renderer, model;
let xrSession = null;
const container = document.getElementById("ar-container");
const arButton = document.getElementById("ar-button");
const loadingIndicator = document.getElementById("loading");

init();

async function init() {
    // 1. Проверяем поддержку WebXR
    if (!navigator.xr) {
        arButton.textContent = "WebXR не поддерживается";
        return;
    }

    // 2. Создаем сцену Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 3. Загружаем 3D-модель (каркас)
    const loader = new THREE.GLTFLoader();
    try {
        const gltf = await loader.loadAsync("model/skeleton.glb");
        model = gltf.scene;
        
        // Настраиваем модель
        model.scale.set(0.5, 0.5, 0.5);
        model.position.set(0, -1, -2);
        scene.add(model);
        
        loadingIndicator.style.display = "none";
        arButton.style.display = "block";
    } catch (error) {
        console.error("Ошибка загрузки модели:", error);
        loadingIndicator.textContent = "Ошибка загрузки модели";
    }

    // 4. Проверяем поддержку AR
    const isARSupported = await navigator.xr.isSessionSupported("immersive-ar");
    if (!isARSupported) {
        arButton.textContent = "AR не поддерживается";
        return;
    }

    // 5. Настройка кнопки AR
    arButton.addEventListener("click", startAR);
}

// Запуск AR-сессии
async function startAR() {
    try {
        xrSession = await navigator.xr.requestSession("immersive-ar", {
            optionalFeatures: ["local-floor"]
        });

        // Настраиваем Three.js для WebXR
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType("local-floor");
        
        // Запускаем рендеринг
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        arButton.style.display = "none";
    } catch (error) {
        console.error("Ошибка AR:", error);
        arButton.textContent = "Ошибка AR";
    }
}

// Адаптация под размер экрана
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
