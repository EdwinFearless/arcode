// Элементы интерфейса
const arButton = document.getElementById("ar-button");
const loadingIndicator = document.getElementById("loading");
const container = document.getElementById("ar-container");

// Инициализация Three.js
let scene, camera, renderer, model;

async function init() {
    // 1. Проверка поддержки WebXR
    if (!navigator.xr) {
        showError("WebXR не поддерживается в этом браузере");
        return;
    }

    const isARSupported = await navigator.xr.isSessionSupported("immersive-ar");
    if (!isARSupported) {
        showError("AR режим не поддерживается");
        return;
    }

    // 2. Настройка Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 3. Загрузка модели
    try {
        const loader = new THREE.GLTFLoader();
        const gltf = await loader.loadAsync("model/skeleton.glb");
        model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        scene.add(model);
        
        loadingIndicator.style.display = "none";
        arButton.style.display = "block";
    } catch (error) {
        showError("Ошибка загрузки модели: " + error.message);
    }

    // 4. Запуск AR
    arButton.addEventListener("click", startAR);
}

async function startAR() {
    try {
        const xrSession = await navigator.xr.requestSession("immersive-ar", {
            optionalFeatures: ["local-floor"]
        });

        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType("local-floor");
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        arButton.style.display = "none";
    } catch (error) {
        showError("Ошибка AR: " + error.message);
    }
}

function showError(message) {
    console.error(message);
    loadingIndicator.textContent = message;
    arButton.style.display = "none";
}

// Запуск приложения
init();
window.addEventListener("resize", () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
