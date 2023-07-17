import * as THREE from "../../../lib/three.module.js";
import { OrbitControls } from "../../../lib/OrbitControls.js";

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const app = new App3();
    app.init();
    //document.addEventListener("keydown", (e) => {
    //  //console.log(e.key);
    //  if (e.key === " ") {
    //    app.render(false);
    //  }
    //});
    app.render(true);
  },
  false
);

class App3 {
  static get CAMERA_PARAM() {
    return {
      fovy: 40,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 20.0,
      x: 1.0,
      y: 3.0,
      z: 10.0,
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

  static get DEP_POSITION() {
    return {
      lon: 140.3918802566464,
      lat: 35.77236075211366,
      icao: "RJAA", // 成田国際空港
    };
  }

  static get ARR_POSITION() {
    return {
      lon: -73.79224242824078,
      lat: 40.65119586398563,
      icao: "KJFK", // ジョン・F・ケネディ国際空港
    };
  }

  constructor() {
    this.renderer;
    this.scene;
    this.camera;
    this.directionalLight;
    this.ambientLight;
    this.planeGeometry;
    this.planeMaterial;
    this.planeMesh;
    this.planeDirection;
    this.planeAltitude = 0.2;
    this.lineMesh;
    this.time = new THREE.Clock();
    this.time.start();
    this.count = 0;

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

    // airplane
    this.planeGroup = new THREE.Group();
    this.planeParts = new THREE.Group();
    this.planeGroup.add(this.planeParts);
    this.planeMaterial = this.planeMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x990000 })
    );
    this.wingMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.2, 0.01),
      new THREE.MeshLambertMaterial({ color: 0x009900 })
    );
    this.wingMesh.position.y = -0.1;
    this.tailMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.1, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x00ffff })
    );
    this.tailMesh.position.z = -0.1;
    this.tailMesh.position.y = -0.15;
    this.planeParts.add(this.planeMesh);
    this.planeParts.add(this.wingMesh);
    this.planeParts.add(this.tailMesh);
    this.planeParts.rotation.x = Math.PI / 2;
    this.planeDirection = new THREE.Vector3(0.0, 1.0, 0.0).normalize();
    this.scene.add(this.planeGroup);

    // これに沿って回したい、という軸
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(5, 7, 0));
    this.lineMesh = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0xffff00 })
    );
    // this.scene.add(this.lineMesh);

    this.meshHelper = new THREE.AxesHelper(5.0);
    this.planeGroup.add(this.meshHelper);

    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z
    );

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotateSpeed = 3.0;

    // ヘルパー
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);

    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    this.renderer.render(this.scene, this.camera);
  }

  render(autoupdate) {
    this.count++;
    if (autoupdate) requestAnimationFrame(this.render);
    this.controls.update();

    //// 三角錐の向き
    ////console.log(this.planeGroup.rotation);
    //const planeDirection = this.planeDirection;
    //// 軸
    //const normalAxis = new THREE.Vector3(1.0, 1.0, 0).normalize();
    //// 回転
    //const radian = (10 / 360) * Math.PI * 2;
    //// 回転実行
    //this.planeGroup.quaternion.premultiply(
    //  new THREE.Quaternion().setFromAxisAngle(normalAxis, radian)
    //);

    this.renderer.render(this.scene, this.camera);
  }
}
