let scene, camera, renderer, model;

init();

async function init() {
    // 1. Создаем сцену Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById("ar-container").appendChild(renderer.domElement);

    // 2. Загружаем 3D-модель
    const loader = new THREE.GLTFLoader();
    try {
        const gltf = await loader.loadAsync("model/skeleton.glb");
        model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        scene.add(model);
    } catch (error) {
        console.error("Ошибка загрузки модели:", error);
    }

    // 3. Проверяем поддержку WebXR AR
    if (navigator.xr) {
        const isARSupported = await navigator.xr.isSessionSupported("immersive-ar");
        if (isARSupported) {
            startAR();
        } else {
            alert("AR не поддерживается на вашем устройстве");
        }
    } else {
        alert("WebXR не поддерживается");
    }
}

async function startAR() {
    const session = await navigator.xr.requestSession("immersive-ar", {
        optionalFeatures: ["local-floor"]
    });

    renderer.xr.enabled = true;
    renderer.xr.setSession(session);
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
}
