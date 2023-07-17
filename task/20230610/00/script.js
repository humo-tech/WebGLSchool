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

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

class App3 {
  static get CAMERA_PARAM() {
    return {
      fovy: 40,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 20.0,
      x: 1.0,
      y: 3.0,
      z: 15.0,
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
    this.sphereGeometry;
    this.earthMaterial;
    this.earthMesh;
    this.earthRadius = 3.0;
    this.planeGeometry;
    this.planeMaterial;
    this.planeMesh;
    this.planeAltitude = 0.2;
    this.time = new THREE.Clock();
    // this.time.start()

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
  }

  setPlanePos() {
    const elapsed = this.time.getElapsedTime() * 0.3;
    const pos = new THREE.Vector3(
      Math.cos(elapsed),
      Math.sin(elapsed),
      Math.sin(elapsed)
    ).normalize();
    this.planeMesh.position.x = pos.x * (this.earthRadius + this.planeAltitude);
    this.planeMesh.position.y = pos.y * (this.earthRadius + this.planeAltitude);
    this.planeMesh.position.z = pos.z * (this.earthRadius + this.planeAltitude);
    this.planeMesh.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
  }

  init() {
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

    // earth
    this.sphereGeometry = new THREE.SphereGeometry(this.earthRadius, 128);
    const loader = new THREE.TextureLoader();
    const texture = loader.load("./earthmap1k.jpg");
    this.earthMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xebebeb,
      wireframe: true,
    });
    this.earthMesh = new THREE.Mesh(this.sphereGeometry, this.earthMaterial);

    this.scene.add(this.earthMesh);

    // airplane
    this.planeGeometry = new THREE.TorusGeometry(
      0.2,
      0.05,
      16.0,
      16.0,
      Math.PI * 2.0
    );
    this.planeMaterial = new THREE.MeshLambertMaterial({ color: 0x990000 });
    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);

    this.scene.add(this.planeMesh);

    this.setPlanePos();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotateSpeed = 3.0;
  }

  render() {
    requestAnimationFrame(this.render);
    this.controls.update();
    this.setPlanePos();

    this.renderer.render(this.scene, this.camera);
  }
}
