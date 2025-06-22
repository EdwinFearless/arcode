let scene, camera, renderer, model, hitTestSource;
let xrSession = null;
let isPlacing = true; // Режим размещения модели
let isMoving = false; // Режим перемещения
let currentScale = 0.3; // Начальный масштаб

// Элементы UI
const scanningMessage = document.getElementById("scanning-message");
const controls = document.getElementById("controls");
const scaleUpBtn = document.getElementById("scale-up");
const scaleDownBtn = document.getElementById("scale-down");
const moveBtn = document.getElementById("move-btn");

// Инициализация
init();

async function init() {
    // 1. Создаем сцену с освещением
    scene = new THREE.Scene();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 2. Настройка камеры и рендерера
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // 3. Загружаем модель
    await loadModel();

    // 4. Проверяем поддержку AR
    if (await checkARSupport()) {
        // 5. Настройка кнопок управления
        scaleUpBtn.addEventListener("click", () => updateScale(0.1));
        scaleDownBtn.addEventListener("click", () => updateScale(-0.1));
        moveBtn.addEventListener("click", () => {
            isMoving = !isMoving;
            moveBtn.style.background = isMoving ? "#f44336" : "#4CAF50";
        });

        // 6. Запускаем AR
        startAR();
    }
}

// Загрузка модели
async function loadModel() {
    const loader = new THREE.GLTFLoader();
    try {
        const gltf = await loader.loadAsync("model/skeleton.glb");
        model = gltf.scene;
        model.scale.set(currentScale, currentScale, currentScale);
        model.visible = false; // Сначала скрываем
        scene.add(model);
    } catch (error) {
        console.error("Ошибка загрузки модели:", error);
    }
}

// Проверка поддержки AR
async function checkARSupport() {
    if (!navigator.xr) {
        scanningMessage.textContent = "WebXR не поддерживается";
        return false;
    }
    return await navigator.xr.isSessionSupported("immersive-ar");
}

// Запуск AR-сессии
async function startAR() {
    try {
        xrSession = await navigator.xr.requestSession("immersive-ar", {
            optionalFeatures: ["hit-test", "dom-overlay"],
            domOverlay: { root: document.body }
        });

        // Настройка Hit Test для обнаружения поверхностей
        const space = await xrSession.requestReferenceSpace("viewer");
        hitTestSource = await xrSession.requestHitTestSource({ space });

        // Отрисовка кадра
        renderer.setAnimationLoop((time, frame) => {
            if (frame) {
                const hitTestResults = frame.getHitTestResults(hitTestSource);
                if (hitTestResults.length > 0 && isPlacing) {
                    const pose = hitTestResults[0].getPose(space);
                    model.position.setFromMatrixPosition(pose.transform.matrix);
                    model.visible = true;
                    scanningMessage.style.display = "none";
                    controls.style.display = "flex";
                    isPlacing = false;
                }
                
                // Режим перемещения
                if (isMoving && hitTestResults.length > 0) {
                    const pose = hitTestResults[0].getPose(space);
                    model.position.setFromMatrixPosition(pose.transform.matrix);
                }
            }
            renderer.render(scene, camera);
        });
    } catch (error) {
        console.error("Ошибка AR:", error);
    }
}

// Изменение масштаба
function updateScale(step) {
    currentScale = Math.max(0.1, currentScale + step);
    model.scale.set(currentScale, currentScale, currentScale);
}

// Адаптация под экран
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
