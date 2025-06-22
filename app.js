let scene, camera, renderer, model;
let xrSession = null;
let hitTestSource = null;
let isModelPlaced = false;
let isDragging = false;
const arButton = document.getElementById('ar-button');
const loadingText = document.getElementById('loading');
const instructions = document.getElementById('instructions');

// Инициализация
async function init() {
    // 1. Проверка поддержки WebXR
    if (!navigator.xr) {
        showError("WebXR не поддерживается в вашем браузере");
        return;
    }

    // 2. Настройка Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('ar-container').appendChild(renderer.domElement);

    // 3. Загрузка модели
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

    // 4. Проверка AR
    if (await navigator.xr.isSessionSupported('immersive-ar')) {
        arButton.addEventListener('click', startAR);
    } else {
        showError("AR не поддерживается на вашем устройстве");
    }
}

// Запуск AR
async function startAR() {
    try {
        xrSession = await navigator.xr.requestSession('immersive-ar', {
            optionalFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
        });

        renderer.xr.enabled = true;
        await renderer.xr.setSession(xrSession);

        // Настройка управления
        setupTouchControls();
        instructions.style.display = 'block';
        arButton.style.display = 'none';

        // Основной цикл
        renderer.setAnimationLoop(onXRFrame);
    } catch (error) {
        showError("Ошибка AR: " + error.message);
    }
}

// Управление касаниями
function setupTouchControls() {
    let touchStartPos = null;

    document.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!touchStartPos || !model) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartPos.x;
        const deltaY = touch.clientY - touchStartPos.y;

        if (!isModelPlaced) {
            // Размещение модели при первом касании
            placeModel(touch.clientX, touch.clientY);
            isModelPlaced = true;
        } else if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            // Перемещение модели
            moveModel(touch.clientX, touch.clientY);
        }
    });

    document.addEventListener('touchend', () => {
        touchStartPos = null;
    });
}

// Размещение модели
function placeModel(clientX, clientY) {
    const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        model.position.copy(intersects[0].point);
        model.visible = true;
    }
}

// Перемещение модели
function moveModel(clientX, clientY) {
    const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
    );

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
    renderer.render(scene, camera);
}

// Обработка ошибок
function showError(message) {
    loadingText.textContent = message;
    loadingText.style.color = '#ff4444';
}

// Запуск приложения
init();

// Адаптация к размеру экрана
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
