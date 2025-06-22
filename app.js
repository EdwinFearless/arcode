// Основные переменные
let scene, camera, renderer, model;
let xrSession = null;
let hitTestSource = null;
let isModelPlaced = false;
let isDragging = false;
let controller;

// Элементы интерфейса
const arButton = document.getElementById('ar-button');
const loadingText = document.getElementById('loading');
const instructions = document.getElementById('instructions');

// Инициализация
init();

async function init() {
    // 1. Проверка поддержки WebXR
    if (!navigator.xr) {
        showError("Ваш браузер не поддерживает WebXR");
        return;
    }

    // 2. Создание сцены Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 3. Загрузка 3D-модели
    try {
        const loader = new THREE.GLTFLoader();
        const gltf = await loader.loadAsync('model/skeleton.glb');
        model = gltf.scene;
        model.scale.set(0.3, 0.3, 0.3);
        model.visible = false;
        scene.add(model);
        
        loadingText.style.display = 'none';
        arButton.style.display = 'block';
    } catch (error) {
        showError("Ошибка загрузки модели");
        console.error(error);
    }

    // 4. Проверка AR и настройка кнопки
    if (await navigator.xr.isSessionSupported('immersive-ar')) {
        arButton.addEventListener('click', startAR);
    } else {
        showError("AR не поддерживается на вашем устройстве");
    }

    // Обработка ресайза
    window.addEventListener('resize', onWindowResize);
}

// Запуск AR-сессии
async function startAR() {
    try {
        // Запрос AR-сессии
        xrSession = await navigator.xr.requestSession('immersive-ar', {
            optionalFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
        });

        // Настройка Three.js для AR
        renderer.xr.enabled = true;
        await renderer.xr.setSession(xrSession);
        
        // Создание контроллера
        setupXRController();

        // Обработчики касаний
        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);

        // Основной цикл рендеринга
        renderer.setAnimationLoop(onXRFrame);
        
        // Скрытие интерфейса
        arButton.style.display = 'none';
        instructions.style.display = 'none';
    } catch (error) {
        showError("Ошибка запуска AR: " + error.message);
    }
}

// Настройка XR-контроллера
function setupXRController() {
    controller = renderer.xr.getController(0);
    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('selectend', onSelectEnd);
    scene.add(controller);
}

// Обработка касаний
function onTouchStart(e) {
    if (!isModelPlaced) return;
    e.preventDefault();
    isDragging = true;
}

function onTouchMove(e) {
    if (e.touches.length == 2) {
    const pinchDist = /* расчет расстояния между пальцами */
    model.scale.setScalar(pinchDist * 0.01);
}
    
    // Получаем координаты касания
    const touch = e.touches[0];
    const mouse = new THREE.Vector2(
        (touch.clientX / window.innerWidth) * 2 - 1,
        -(touch.clientY / window.innerHeight) * 2 + 1
    );

    // Определяем новую позицию через Raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([model]);
    
    if (intersects.length > 0) {
        model.position.copy(intersects[0].point);
    }
}

function onTouchEnd() {
    isDragging = false;
}

// Основной цикл AR
function onXRFrame(time, xrFrame) {
    if (!xrFrame) return;

    // Получаем Hit Test результаты
    const referenceSpace = renderer.xr.getReferenceSpace();
    const hitTestResults = xrFrame.getHitTestResults(hitTestSource);
    
    // Размещение модели при первом касании
    if (hitTestResults.length > 0 && !isModelPlaced) {
        const pose = hitTestResults[0].getPose(referenceSpace);
        model.position.set(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z
        );
        model.visible = true;
        isModelPlaced = true;
        instructions.innerHTML = "✋ Тащите модель пальцем";
    }

    // Обновление Hit Test источника
    if (!hitTestSource && xrSession) {
        xrSession.requestReferenceSpace('viewer').then((refSpace) => {
            xrSession.requestHitTestSource({ space: refSpace }).then((source) => {
                hitTestSource = source;
            });
        });
    }

    renderer.render(scene, camera);
}

// Вспомогательные функции
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function showError(message) {
    loadingText.textContent = message;
    loadingText.style.color = "#ff4444";
    arButton.style.display = "none";
}
