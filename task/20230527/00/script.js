import * as THREE from '../../../lib/three.module.js'
import { OrbitControls } from '../../../lib/OrbitControls.js'

window.addEventListener('DOMContentLoaded', () => {
    const app = new App3()
    app.init()
    app.render()
}, false)

class App3 {
    static get CAMERA_PARAM () {
        return {
            fovy: 40,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.1,
            far: 20.0,
            x: 0.0,
            y: 2.0,
            z: 5.0,
            lookAt: new THREE.Vector3(0.0, 1.0, 0.0)
        }
    }
    static get RENDERER_PARAM () {
        return {
            clearColor: 0x110000,
            width: window.innerWidth,
            height: window.innerHeight
        }
    }
    static get DIRECTIONAL_LIGHT_PARAM () {
        return {
            color: 0xffffff,
            intensity: 1.0,
            x: 1.0,
            y: 2.0,
            z: 3.0
        }
    }
    static get AMBIENT_LIGHT_PARAM () {
        return {
            color: 0xffffff,
            intensity: 0.3
        }
    }
    static get MATERIAL_PARAM () {
        return {
            color: 0x3333dd,
        }
    }

    degToRad(deg) {
        return deg * (Math.PI / 180)
    }

    constructor () {
        this.renderer
        this.scene
        this.camera
        this.directionalLight
        this.ambientLight
        this.material
        this.boxGeometry
        this.poleGeometry
        this.moterGeometry
        this.wingNumber = 3
        this.wingGroup
        this.motorGroup
        this.powerStatus = true
        this.maxWingSpeed = 0.3
        this.wingSpeed = 0
        this.swingStatus = {
            vertical: true,
            horizontal: true,
        }
        this.swingCount = {
            vertical: 0,
            horizontal: 0
        }

        this.render = this.render.bind(this);

        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight)
            this.camera.aspect = window.innerWidth / window.innerHeight
            this.camera.updateProjectionMatrix()
        }, false)

        // 電源
        document.getElementById('power').addEventListener('change', (e) => {
            this.powerStatus = e.target.checked
            this.wingSpeed = this.powerStatus ? 0.0 : this.maxWingSpeed
        })
        // 左右の首振り
        document.getElementById('horizontal').addEventListener('change', (e) => {
            this.swingStatus.horizontal = e.target.checked
        })
        // 上下の首振り
        document.getElementById('vertical').addEventListener('change', (e) => {
            this.swingStatus.vertical = e.target.checked
        })
        // ファンの回る速さ
        document.querySelectorAll('#strog input[type=radio]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.maxWingSpeed = Number(e.target.value)
            })
        })
    }
    

    init () {
        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor))
        this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height)
        const wrapper = document.querySelector('#webgl')
        wrapper.appendChild(this.renderer.domElement)

        this.scene = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera(
            App3.CAMERA_PARAM.fovy,
            App3.CAMERA_PARAM.aspect,
            App3.CAMERA_PARAM.near,
            App3.CAMERA_PARAM.far
        )
        this.camera.position.set(
            App3.CAMERA_PARAM.x,
            App3.CAMERA_PARAM.y,
            App3.CAMERA_PARAM.z
        )
        this.camera.lookAt(App3.CAMERA_PARAM.lookAt)

        this.directionalLight = new THREE.DirectionalLight(
            App3.DIRECTIONAL_LIGHT_PARAM.color,
            App3.DIRECTIONAL_LIGHT_PARAM.intensity,
        )
        this.directionalLight.position.set(
            App3.DIRECTIONAL_LIGHT_PARAM.x,
            App3.DIRECTIONAL_LIGHT_PARAM.y,
            App3.DIRECTIONAL_LIGHT_PARAM.z
        )
        this.scene.add(this.directionalLight)
    
        this.ambientLight = new THREE.AmbientLight(
            App3.AMBIENT_LIGHT_PARAM.color,
            App3.AMBIENT_LIGHT_PARAM.intensity
        )
        this.scene.add(this.ambientLight)

        this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM)

        // 支柱
        this.poleGeometry = new THREE.CylinderGeometry(0.06, 0.1, 1.5, 8)
        this.poleGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0.0, 0.75, 0.0))
        const poleMesh = new THREE.Mesh(this.poleGeometry, this.material)
        this.scene.add(poleMesh)

        this.motorGroup = new THREE.Group()
        this.scene.add(this.motorGroup)

        // モーター部分
        this.motorGeometry = new THREE.CylinderGeometry(0.18, 0.1, 0.5, 32)
        const motorMesh = new THREE.Mesh(this.motorGeometry, this.material)
        motorMesh.rotation.z = this.degToRad(90)
        motorMesh.rotation.y = this.degToRad(90)
        this.motorGroup.add(motorMesh)
        this.motorGroup.position.y = 1.5

        this.wingGroup = new THREE.Group()
        this.motorGroup.add(this.wingGroup)

        // 羽
        for(let i=0; i<this.wingNumber; i++) {
            const wingGeometry = new THREE.BoxGeometry(1.0, 0.1, 0.01)
            wingGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, 0.0, 0.0))
            const wingMesh = new THREE.Mesh(wingGeometry, this.material)
            wingMesh.rotateZ(this.degToRad(360 / this.wingNumber * i))
            wingMesh.rotateX(this.degToRad(25))
            this.wingGroup.add(wingMesh)
        }
        this.wingGroup.position.z = 0.3

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.target = App3.CAMERA_PARAM.lookAt

        // ヘルパー
        const axesBarLength = 5.0;
        this.axesHelper = new THREE.AxesHelper(axesBarLength);
        this.scene.add(this.axesHelper);
    }

    render () {
        requestAnimationFrame(this.render)
        this.controls.update()

        if (this.powerStatus) {
            if(this.swingStatus.horizontal) {
                this.motorGroup.rotation.y = Math.cos(++ this.swingCount.horizontal / 100) // -1.0 ... 1.0 首振る角度にちょうどいい感じ
            }
            if(this.swingStatus.vertical) {
                this.motorGroup.rotation.x = Math.cos(++ this.swingCount.vertical / 300) * 0.7
            }
            this.wingSpeed += (this.maxWingSpeed - this.wingSpeed) / 50
            if(this.wingSpeed > this.maxWingSpeed * 0.99) {
                this.wingSpeed = this.maxWingSpeed
            }
            this.wingGroup.rotation.z -= this.wingSpeed
        } else {
            this.wingSpeed -= (this.wingSpeed) / 50
            if(this.wingSpeed < 0.01) {
                this.wingSpeed = 0
            }
            this.wingGroup.rotation.z -= this.wingSpeed
        }
        this.renderer.render(this.scene, this.camera)
    }
}