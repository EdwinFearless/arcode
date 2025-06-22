let scene, camera, renderer, model, hitTestSource;
let xrSession = null;
let isModelPlaced = false;
let canMoveModel = false;
const arButton = document.getElementById("ar-button");
const loadingText = document.getElementById("loading");

// Инициализация
init();

async function init() {
    // 1. Проверяем поддержку WebXR
    if (!navigator.xr) {
        arButton.textContent = "WebXR не поддерживается";
        return;
    }

    // 2. Создаем сцену Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 3. Загружаем модель
    const loader = new THREE.GLTFLoader();
    try {
        const gltf = await loader.loadAsync("model/skeleton.glb");
        model = gltf.scene;
        model.scale.set(0.3, 0.3, 0.3);
        model.visible = false; // Сначала скрываем
        scene.add(model);
        loadingText.style.display = "none";
        arButton.style.display = "block";
    } catch (error) {
        console.error("Ошибка загрузки модели:", error);
        loadingText.textContent = "Ошибка загрузки модели";
    }

    // 4. Проверяем AR и настраиваем кнопку
    if (await navigator.xr.isSessionSupported("immersive-ar")) {
        arButton.addEventListener("click", startAR);
    } else {
        arButton.textContent = "AR не поддерживается";
    }
}

// Запуск AR-сессии
async function startAR() {
    try {
        xrSession = await navigator.xr.requestSession("immersive-ar", {
            optionalFeatures: ["hit-test", "dom-overlay"],
            domOverlay: { root: document.body }
        });

        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType("local-floor");

        // Обработка касаний для перемещения модели
        document.addEventListener("touchstart", onTouchStart, { passive: false });
        document.addEventListener("touchmove", onTouchMove, { passive: false });

        // Основной цикл рендеринга
        renderer.setAnimationLoop(onXRFrame);
        arButton.style.display = "none";
    } catch (error) {
        console.error("Ошибка AR:", error);
        arButton.textContent = "Ошибка: " + error.message;
    }
}

// Обработка касаний
function onTouchStart(e) {
    e.preventDefault();
    canMoveModel = isModelPlaced;
}

function onTouchMove(e) {
    e.preventDefault();
    if (!canMoveModel || !model) return;

    // Получаем координаты касания
    const touch = e.touches[0];
    const mouse = new THREE.Vector2(
        (touch.clientX / window.innerWidth) * 2 - 1,
        -(touch.clientY / window.innerHeight) * 2 + 1
    );

    // Определяем новую позицию через Raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        model.position.copy(intersects[0].point);
    }
}

// Основной цикл AR
function onXRFrame(time, xrFrame) {
    if (!xrFrame) return;

    // Поиск поверхностей для размещения модели
    const hitTest = xrFrame.getHitTestResults(hitTestSource);
    if (hitTest.length > 0 && !isModelPlaced) {
        const pose = hitTest[0].getPose(renderer.xr.getReferenceSpace());
        model.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
        model.visible = true;
        isModelPlaced = true;
    }

    renderer.render(scene, camera);
}

// Адаптация под экран
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
