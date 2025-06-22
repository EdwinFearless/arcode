// Проверяем поддержку WebXR
if (!navigator.xr) {
    alert("WebXR не поддерживается в вашем браузере. Попробуйте Chrome или Edge.");
}

const arButton = document.getElementById("ar-button");

// Запрос сессии AR
async function startAR() {
    const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"], // Для размещения объектов в реальном мире
    });
    
    // Настройка Three.js или другой 3D-библиотеки
    setupXR(session);
}

arButton.addEventListener("click", startAR);

// Пример с Three.js (нужно подключить библиотеку)
async function setupXR(session) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Добавляем 3D-объект (куб)
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.z = -0.5;
    scene.add(cube);
    
    // Цикл рендеринга
    function animate() {
        renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(animate);
}
