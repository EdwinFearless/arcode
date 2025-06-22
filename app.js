// Проверяем поддержку WebXR
if (navigator.xr) {
    console.log("WebXR supported!");
} else {
    alert("WebXR не поддерживается в вашем браузере. Попробуйте Chrome или Firefox Reality.");
}

// Инициализация Three.js + WebXR
let scene, camera, renderer, cube;

init();
animate();

function init() {
    // Сцена
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Камера
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;  // Включаем WebXR
    document.body.appendChild(renderer.domElement);

    // Куб (тестовый объект)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Кнопка для запуска AR
    const button = document.createElement('button');
    button.textContent = 'START AR';
    button.style.position = 'absolute';
    button.style.top = '20px';
    button.style.left = '50%';
    button.style.transform = 'translateX(-50%)';
    button.addEventListener('click', startAR);
    document.body.appendChild(button);
}

function startAR() {
    if (navigator.xr) {
        navigator.xr.requestSession('immersive-ar').then((session) => {
            renderer.xr.setSession(session);
            session.addEventListener('end', () => window.location.reload());
        }).catch(console.error);
    } else {
        alert("AR не поддерживается!");
    }
}

function animate() {
    renderer.setAnimationLoop(() => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    });
}
