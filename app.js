// Основные переменные
let scene, camera, renderer, model;
let xrSession = null;
let initialDistance = null;
let scale = 1;
const arButton = document.getElementById('ar-button');
const loadingText = document.getElementById('loading');
const hint = document.getElementById('hint');

// Инициализация
init();

async function init() {
    // 1. Создаем сцену Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('ar-container').appendChild(renderer.domElement);

    // 2. Проверяем поддержку WebXR
    if (!navigator.xr) {
        showError("WebXR не поддерживается в вашем браузере");
        return;
    }

    const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!isARSupported) {
        showError("AR не поддерживается на вашем устройстве");
        return;
    }

    // 3. Загружаем 3D-модель
    await loadModel();

    // 4. Настраиваем кнопку AR
    arButton.addEventListener('click', startAR);
    window.addEventListener('resize', onWindowResize);
}

// Загрузка 3D-модели
async function loadModel() {
    const loader = new THREE.GLTFLoader();
    try {
        const gltf = await loader.loadAsync('model/skeleton.glb');
        model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        scene.add(model);
        loadingText.style.display = 'none';
        arButton.style.display = 'block';
    } catch (error) {
        showError("Ошибка загрузки модели");
        console.error(error);
    }
}

// Запуск AR-сессии
async function startAR() {
    try {
        xrSession = await navigator.xr.requestSession('immersive-ar', {
            optionalFeatures: ['local-floor', 'hit-test']
        });

        // Настройка WebXR
        await renderer.xr.setSession(xrSession);
        renderer.xr.enabled = true;

        // Добавляем обработчики жестов
        const canvas = renderer.domElement;
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

        // Показываем подсказку
        hint.style.display = 'block';

        // Запускаем рендеринг
        renderer.setAnimationLoop(() => {
            if (model) model.scale.set(scale, scale, scale);
            renderer.render(scene, camera);
        });

        arButton.style.display = 'none';
    } catch (error) {
        showError("Ошибка запуска AR: " + error.message);
        console.error(error);
    }
}

// Обработка жестов масштабирования
function handleTouchStart(e) {
    if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches[0], e.touches[1]);
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 2 && initialDistance !== null) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        scale = Math.min(Math.max(scale * (currentDistance / initialDistance), 0.3), 3);
        initialDistance = currentDistance;
    }
}

// Вспомогательные функции
function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function showError(message) {
    loadingText.textContent = message;
    arButton.style.display = 'none';
}
