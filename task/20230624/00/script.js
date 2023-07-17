import * as THREE from "../../../lib/three.module.js";
import { OrbitControls } from "../../../lib/OrbitControls.js";

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const app = new App3();
    app.init();
    app.render();
  },
  false
);

class App3 {
  static get CAMERA_PARAM() {
    return {
      fovy: 100,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 20.0,
      x: 1.0,
      y: 1.0,
      z: 3.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  static get RENDERER_PARAM() {
    return {
      clearColor: 0x111111,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 1.0,
      x: 1.0,
      y: 2.0,
      z: 3.0,
    };
  }
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 0.3,
    };
  }

  constructor() {
    this.renderer;
    this.scene;
    this.camera;
    this.directionalLight;
    this.ambientLight;
    this.geometry;
    this.hitGeometry;
    this.material;
    this.hitMaterial;
    this.mesh;
    this.initialized;

    this.render = this.render.bind(this);

    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false
    );

    this.raycaster = new THREE.Raycaster();

    window.addEventListener("mousemove", (mouseEvent) => {
      this.setRaycaster(mouseEvent);
      const intersects = this.raycaster.intersectObjects([this.mesh]);

      if (intersects.length) {
        this.mesh.material = this.hitMaterial;
        document.body.style.cursor = "grabbing";
      } else {
        this.mesh.material = this.material;
        document.body.style.cursor = "auto";
      }
    });
    window.addEventListener("click", (mouseEvent) => {
      this.setRaycaster(mouseEvent);
      const intersects = this.raycaster.intersectObjects([this.mesh]);

      if (intersects.length) {
        this.mesh.geometry =
          this.mesh.geometry === this.geometry
            ? this.hitGeometry
            : this.geometry;
      }
    });
  }

  setRaycaster(mouseEvent) {
    const x = (mouseEvent.clientX / window.innerWidth) * 2.0 - 1.0;
    const y = (mouseEvent.clientY / window.innerHeight) * 2.0 - 1.0;

    const v = new THREE.Vector2(x, -y);

    this.raycaster.setFromCamera(v, this.camera);
  }

  asyncLoadTexture() {
    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.load("./hachi.jpg", function (texture) {
        resolve(texture);
      });
    });
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(
      new THREE.Color(App3.RENDERER_PARAM.clearColor)
    );
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );
    const wrapper = document.querySelector("#webgl");
    wrapper.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      App3.CAMERA_PARAM.fovy,
      App3.CAMERA_PARAM.aspect,
      App3.CAMERA_PARAM.near,
      App3.CAMERA_PARAM.far
    );
    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    this.directionalLight = new THREE.DirectionalLight(
      App3.DIRECTIONAL_LIGHT_PARAM.color,
      App3.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.set(
      App3.DIRECTIONAL_LIGHT_PARAM.x,
      App3.DIRECTIONAL_LIGHT_PARAM.y,
      App3.DIRECTIONAL_LIGHT_PARAM.z
    );
    this.scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);

    // テクスチャ
    this.texture = await this.asyncLoadTexture("./hachi.jpg");
    console.log(this.texture);
    const aspectRatio =
      this.texture.source.data.height / this.texture.source.data.width;
    // 板ポリ作る
    this.geometry = new THREE.PlaneGeometry(3.0, 3.0 * aspectRatio);
    this.hitGeometry = new THREE.PlaneGeometry(5.0, 5.0 * aspectRatio);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.2,
      map: this.texture,
      transparent: true,
    });
    this.hitMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: this.texture,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.mesh);

    // ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.initialized = true;
  }

  render() {
    requestAnimationFrame(this.render);

    if (this.initialized) {
      this.controls.update();

      this.renderer.render(this.scene, this.camera);
    }
  }
}
