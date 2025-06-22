let camera, scene, renderer, model;
let xrSession = null;
const container = document.getElementById("ar-container");
const arButton = document.getElementById("ar-button");
const loadingText = document.getElementById("loading");

// Инициализация
init();

async function init() {
    // 1. Проверяем поддержку WebXR
    if (!navigator.xr) {
        arButton.textContent = "AR не поддерживается в вашем браузере";
        return;
    }

    // 2. Создаем сцену Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 3. Загружаем 3D-модель (каркас)
    const loader = new THREE.GLTFLoader();
    try {
        const gltf = await loader.loadAsync("model/skeleton.glb");
        model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        scene.add(model);
        loadingText.style.display = "none";
    } catch (error) {
        console.error("Ошибка загрузки модели:", error);
        loadingText.textContent = "Ошибка загрузки модели";
    }

    // 4. Проверяем поддержку AR
    const isARSupported = await navigator.xr.isSessionSupported("immersive-ar");
    if (!isARSupported) {
        arButton.textContent = "AR не поддерживается на вашем устройстве";
        return;
    }

    // 5. Настраиваем кнопку запуска AR
    arButton.addEventListener("click", startAR);
}

// Запуск AR-сессии
async function startAR() {
    try {
        // Запрашиваем AR-сессию
        xrSession = await navigator.xr.requestSession("immersive-ar", {
            optionalFeatures: ["local-floor", "hit-test"]
        });

        // Настраиваем Three.js для AR
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType("local-floor");
        
        // Запускаем рендеринг
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        // Скрываем кнопку после запуска
        arButton.style.display = "none";
    } catch (error) {
        console.error("Ошибка AR:", error);
        arButton.textContent = "Ошибка запуска AR";
    }
}

// Адаптация под размер экрана
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
