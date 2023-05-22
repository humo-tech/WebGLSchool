import * as THREE from '../../../lib/three.module.js'
import { OrbitControls } from '../../../lib/OrbitControls.js'

const loadCSV = () => {
    // https://amano-tec.com/data/world.html
    return fetch('./r0411world_utf8.csv')
    .then(res => res.text())
    .then(text => {
        return text.split('\n').map((line, i) => {
            //if(i > 0 && line.match(/^JP/)) {
            if(i > 0) {
                // country_code	name_jp	name_jps	capital_jp	name_en	name_ens	capital_en	lat	lon
                return line.split('\t').map(val => !isNaN(val) ? Number(val) : val)
            }
        }).filter(array => !!array)
    })
}

const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
}
    
window.addEventListener('DOMContentLoaded', async () => {
    const app = new App3()
    const data = await loadCSV()
    app.init(data)
    app.render()
}, false)

class App3 {
    static get CAMERA_PARAM () {
        return {
            fovy: 40,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.1,
            far: 20.0,
            x: 1.0,
            y: 1.0,
            z: 4.0,
            lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
        }
    }
    static get RENDERER_PARAM () {
        return {
            clearColor: 0x111111,
            width: window.innerWidth,
            height: window.innerHeight
        }
    }
    static get DIRECTIONAL_LIGHT_PARAM () {
        return {
            color: 0x9999ff,
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
            color: 0xff3399,
            opacity: 0.7,
            transparent: true,
        }
    }

    constructor () {
        this.renderer
        this.scene
        this.camera
        this.directionalLight
        this.ambientLight
        this.material
        this.boxGeometry
        this.boxList
        this.randomFlags = {x: false, y: false, z: false}
        this.rotateFlag = false
        this.axesHelper

        this.render = this.render.bind(this);

        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight)
            this.camera.aspect = window.innerWidth / window.innerHeight
            this.camera.updateProjectionMatrix()
        }, false)
    }


    async init (dataList) {
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

        this.boxList = []
        dataList.forEach(data => {
            this.boxGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.03)
            const box = new THREE.Mesh(this.boxGeometry, this.material)

            // https://ics.media/entry/10657/
            const lat = deg2rad(data[7])
            const lon = deg2rad(180 + data[8])
            const xPos = - Math.cos(lat) * Math.cos(lon)
            const yPos = Math.sin(lat)
            const zPos = Math.cos(lat) * Math.sin(lon)
            box.position.x = xPos
            box.position.y = yPos
            box.position.z = zPos

            //box.rotation.x = xxx
            //box.rotation.y = yyy
            //box.rotation.z = zzz

            this.scene.add(box)
        })

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.autoRotate = true
        this.controls.autoRotateSpeed = 3.0

        // earth
        // https://planetpixelemporium.com/earth.html
        const loader = new THREE.TextureLoader()
        const earthTexture = loader.load('./earthmap1k.jpg')
        const earthGeometry = new THREE.SphereBufferGeometry(1, 30, 30);
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: earthTexture,
            transparent: true,
            opacity: 0.8
        })
        const earth = new THREE.Mesh(earthGeometry, earthMaterial)

        this.scene.add(earth)

    }

    render () {
        requestAnimationFrame(this.render)

        this.controls.update()
        this.renderer.render(this.scene, this.camera)
    }
}