// Инициализация сцены, камеры и рендерера
let scene, camera, renderer, model;
let xrSession = null;
let controllers = [];
let hitTestSource = null;
let isModelPlaced = false;
let selectedModel = null;
let initialDistance = null;
let initialScale = 1;

const container = document.getElementById("ar-container");
const arButton = document.getElementById("ar-button");
const loadingIndicator = document.getElementById("loading");

init();

async function init() {
    // 1. Проверяем поддержку WebXR
    if (!navigator.xr) {
        arButton.textContent = "WebXR не поддерживается";
        loadingIndicator.textContent = "Ваш браузер не поддерживает WebXR";
        return;
    }

    // 2. Создаем сцену Three.js
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 3. Добавляем свет
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 4. Загружаем 3D-модель (каркас)
    const loader = new THREE.GLTFLoader();
    try {
        const gltf = await loader.loadAsync("model/skeleton.glb");
        model = gltf.scene;
        
        // Настраиваем модель
        model.scale.set(0.5, 0.5, 0.5);
        model.visible = false; // Сначала скрываем
        scene.add(model);
        
        loadingIndicator.style.display = "none";
        arButton.style.display = "block";
    } catch (error) {
        console.error("Ошибка загрузки модели:", error);
        loadingIndicator.textContent = "Ошибка загрузки модели";
    }

    // 5. Проверяем поддержку AR
    const isARSupported = await navigator.xr.isSessionSupported("immersive-ar");
    if (!isARSupported) {
        arButton.textContent = "AR не поддерживается";
        loadingIndicator.textContent = "AR не поддерживается на вашем устройстве";
        return;
    }

    // 6. Настройка кнопки AR
    arButton.addEventListener("click", startAR);
}

// Запуск AR-сессии
async function startAR() {
    try {
        xrSession = await navigator.xr.requestSession("immersive-ar", {
            optionalFeatures: ["local-floor", "hit-test", "dom-overlay"],
            domOverlay: { root: document.body }
        });

        // Настраиваем Three.js для WebXR
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType("local-floor");
        
        // Создаем контроллеры для управления
        setupControllers();
        
        // Запускаем рендеринг
        renderer.setAnimationLoop(onXRFrame);

        arButton.style.display = "none";
    } catch (error) {
        console.error("Ошибка AR:", error);
        arButton.textContent = "Ошибка AR";
    }
}

// Настройка контроллеров (для управления моделью)
function setupControllers() {
    controllers = [];
    
    for (let i = 0; i < 2; i++) {
        const controller = renderer.xr.getController(i);
        controller.addEventListener("selectstart", onSelectStart);
        controller.addEventListener("selectend", onSelectEnd);
        scene.add(controller);
        controllers.push(controller);
    }
}

// Обработка касаний (перемещение/масштабирование)
function onSelectStart(event) {
    const controller = event.target;
    
    // Проверяем, есть ли пересечение с моделью
    const intersections = getIntersections(controller);
    if (intersections.length > 0) {
        selectedModel = model;
        initialDistance = null;
    }
}

function onSelectEnd() {
    selectedModel = null;
    initialDistance = null;
}

// Получение пересечений луча контроллера с моделью
function getIntersections(controller) {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    
    const rayCaster = new THREE.Raycaster();
    rayCaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    rayCaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    return rayCaster.intersectObject(model, true);
}

// Основной цикл рендеринга AR
function onXRFrame(time, xrFrame) {
    if (!xrFrame) return;

    // Обновление контроллеров
    for (const controller of controllers) {
        controller.updateMatrixWorld();
    }

    // Если модель не размещена, используем hit-test для размещения
    if (!isModelPlaced) {
        const hitTestResults = xrFrame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
            const hitPose = hitTestResults[0].getPose(renderer.xr.getReferenceSpace());
            model.position.set(
                hitPose.transform.position.x,
                hitPose.transform.position.y,
                hitPose.transform.position.z
            );
            model.visible = true;
            isModelPlaced = true;
        }
    }

    // Управление моделью (если выбрана)
    if (selectedModel && controllers.length === 2) {
        const controller1 = controllers[0];
        const controller2 = controllers[1];
        
        // Масштабирование (двумя пальцами)
        const distance = controller1.position.distanceTo(controller2.position);
        if (initialDistance === null) {
            initialDistance = distance;
            initialScale = selectedModel.scale.x;
        } else {
            const scale = initialScale * (distance / initialDistance);
            selectedModel.scale.set(scale, scale, scale);
        }
        
        // Перемещение (среднее положение между контроллерами)
        selectedModel.position.lerpVectors(
            controller1.position,
            controller2.position,
            0.5
        );
    }

    renderer.render(scene, camera);
}

// Адаптация под размер экрана
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
