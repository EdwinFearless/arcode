let scene, camera, renderer, model;
let xrSession = null;
const arButton = document.getElementById("ar-button");
const loadingText = document.getElementById("loading");

// Проверяем поддержку WebXR
async function checkARSupport() {
    if (!navigator.xr) {
        arButton.textContent = "WebXR не поддерживается";
        return false;
    }
    const isSupported = await navigator.xr.isSessionSupported("immersive-ar");
    if (!isSupported) {
        arButton.textContent = "AR не работает на вашем устройстве";
    }
    return isSupported;
}

// Инициализация Three.js
function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
}

// Загрузка 3D-модели
async function loadModel() {
    const loader = new THREE.GLTFLoader();
    try {
        const gltf = await loader.loadAsync("model/skeleton.glb");
        model = gltf.scene;
        model.scale.set(0.3, 0.3, 0.3);
        scene.add(model);
        loadingText.style.display = "none";
        arButton.style.display = "block";
    } catch (error) {
        console.error("Ошибка загрузки модели:", error);
        loadingText.textContent = "Ошибка загрузки 3D-модели";
    }
}

// Запуск AR
async function startAR() {
    try {
        xrSession = await navigator.xr.requestSession("immersive-ar", {
            optionalFeatures: ["local-floor", "hit-test"]
        });
        
        // Настройка WebXR + Three.js
        await renderer.xr.setSession(xrSession);
        renderer.xr.enabled = true;
        
        // Отрисовка кадра
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
        
        arButton.style.display = "none";
    } catch (error) {
        console.error("Ошибка AR:", error);
        arButton.textContent = "Ошибка: " + error.message;
    }
}

// Основная функция
async function init() {
    initThreeJS();
    const arSupported = await checkARSupport();
    if (arSupported) {
        await loadModel();
        arButton.addEventListener("click", startAR);
    }
}

// Запуск приложения
init();

// Адаптация под экран
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
