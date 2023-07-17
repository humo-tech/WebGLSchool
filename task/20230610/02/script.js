import * as THREE from "../../../lib/three.module.js";
import { OrbitControls } from "../../../lib/OrbitControls.js";

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const app = new App3();
    app.loadAirports().then((airports) => {
      app.airports = airports;
      app.init();
      app.render(true);
    });
    //document.addEventListener("keydown", (e) => {
    //  //console.log(e.key);
    //  if (e.key === " ") {
    //    app.render(false);
    //  }
    //});
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
    this.airports;
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
    this.planeDirection;
    this.planeAltitude = 0.2;
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

  loadAirports() {
    console.log("a");
    return fetch("./airports.geojson").then((res) => res.json());
  }

  pickAirports() {
    const index = Math.floor(Math.random() * this.airports.features.length);
    return this.airports.features[index];
  }

  setDepArr() {
    const airports = {
      dep: this.pickAirports(),
      arr: this.pickAirports(),
    };
    console.log(airports);
    this.depPos = this.lonlat2xyz(
      airports.dep.geometry.coordinates[0],
      airports.dep.geometry.coordinates[1],
      this.earthRadius + this.planeAltitude
    );
    this.arrPos = this.lonlat2xyz(
      airports.arr.geometry.coordinates[0],
      airports.arr.geometry.coordinates[1],
      this.earthRadius + this.planeAltitude
    );
  }

  lonlat2xyz(lon, lat, radius) {
    const lonRadian = ((lon + 180) / 360) * Math.PI * 2;
    const latRadian = (lat / 360) * Math.PI * 2;
    const x = -radius * Math.cos(latRadian) * Math.cos(lonRadian);
    const y = radius * Math.sin(latRadian);
    const z = radius * Math.cos(latRadian) * Math.sin(lonRadian);
    console.log(x, y, z);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * https://ics.media/entry/10657/
   *
   * 軌道の座標を配列で返します。
   *
   * @param {THREE.Vector3} startPos 開始点です。
   * @param {THREE.Vector3} endPos 終了点です。
   * @param {number} segmentNum セグメント分割数です。
   * @returns {THREE.Vector3[]} 軌跡座標の配列です。
   */
  createOrbitPoints(startPos, endPos, segmentNum) {
    // 頂点を格納する配列
    const vertices = [];
    const startVec = startPos.clone();
    const endVec = endPos.clone();

    // ２つのベクトルの回転軸
    const axis = startVec.clone().cross(endVec);
    // 軸ベクトルを単位ベクトルに
    axis.normalize();
    // ２つのベクトルが織りなす角度
    const angle = startVec.angleTo(endVec);

    // ２つの点を結ぶ弧を描くための頂点を打つ
    for (let i = 0; i < segmentNum; i++) {
      // axisを軸としたクォータニオンを生成
      const q = new THREE.Quaternion();
      q.setFromAxisAngle(axis, (angle / segmentNum) * i);
      // ベクトルを回転させる
      const vertex = startVec.clone().applyQuaternion(q);
      vertices.push(vertex);
    }

    // 終了点を追加
    vertices.push(endVec);
    return vertices;
  }

  init() {
    this.setDepArr();
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
    this.planeParts.rotation.z = Math.PI;
    this.planeParts.rotation.y = Math.PI;
    this.planeDirection = new THREE.Vector3(0.0, 1.0, 0.0).normalize();
    this.scene.add(this.planeGroup);

    this.meshHelper = new THREE.AxesHelper(5.0);
    this.planeGroup.add(this.meshHelper);

    this.camera.position.set(
      this.depPos.x * 5.0,
      this.arrPos.y * 5.0,
      this.depPos.z * 5.0
    );

    // 外積
    this.normalAxis = new THREE.Vector3().crossVectors(
      this.depPos,
      this.arrPos
    );
    this.normalAxis.normalize();

    // 内積
    const dot = this.depPos
      .clone()
      .normalize()
      .dot(this.arrPos.clone().normalize());
    this.theta = Math.acos(dot);

    // dep - arr
    const route = this.createOrbitPoints(this.depPos, this.arrPos, 32);
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(route);
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ linewidth: 5, color: 0x00ffff })
    );
    this.scene.add(line);

    const portPoint = new THREE.SphereGeometry(0.1);
    const portMaterial = new THREE.MeshStandardMaterial({ color: 0x009999 });
    const depPoint = new THREE.Mesh(portPoint.clone(), portMaterial.clone());
    const arrPoint = new THREE.Mesh(portPoint.clone(), portMaterial.clone());
    depPoint.position.set(this.depPos.x, this.depPos.y, this.depPos.z);
    arrPoint.position.set(this.arrPos.x, this.arrPos.y, this.arrPos.z);
    this.scene.add(depPoint);
    this.scene.add(arrPoint);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotateSpeed = 3.0;

    // ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);
    const boxHelper = new THREE.BoxHelper(this.earthMesh, 0x9900cc);
    this.scene.add(boxHelper);

    this.renderer.render(this.scene, this.camera);
  }

  render(autoupdate) {
    this.count++;
    if (autoupdate) requestAnimationFrame(this.render);
    this.controls.update();

    const prePosition = this.planeGroup.position.clone();

    /**
     * 位置
     */
    // 経過時間
    const elapsed = this.time.getElapsedTime();
    const ratio = autoupdate ? (elapsed % 10) / 10 : this.count / 500; // 全体（10秒）のうちのどこまで進んだ？

    const q = new THREE.Quaternion();
    q.setFromAxisAngle(this.normalAxis, this.theta * ratio);
    const vertex = this.depPos.clone().applyQuaternion(q);
    this.planeGroup.position.set(vertex.x, vertex.y, vertex.z);

    // https://ics.media/entry/15467/
    // 進行方向ベクトル
    const vecPlane = this.planeGroup.clone().position.sub(prePosition);
    // z軸の方向
    const vecZ = new THREE.Vector3(0, 0, 1);
    // その法線
    const normalVec = vecPlane.cross(vecZ);

    this.planeGroup.up.set(normalVec.x, normalVec.y, normalVec.z);
    this.planeGroup.lookAt(prePosition);

    this.renderer.render(this.scene, this.camera);
  }
}
