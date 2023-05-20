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
            x: 2.0,
            y: 3.0,
            z: 7.0,
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
    static get MATERIAL_PARAM_ODD () {
        return {
            color: 0x3333dd,
            opacity: 0.9,
            transparent: true,
        }
    }
    static get MATERIAL_PARAM_EVEN () {
        return {
            color: 0x33dd33,
            opacity: 0.9,
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

        this.render = this.render.bind(this);

        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight)
            this.camera.aspect = window.innerWidth / window.innerHeight
            this.camera.updateProjectionMatrix()
        }, false)

        window.addEventListener('keydown', (KeyboardEvent) => {
            const key = KeyboardEvent.key
            if (['x', 'y', 'z'].includes(key)) {
                this.randomFlags[key] = true
            } else if (key === 'r') {
                this.rotateFlag = true
            }
        })
        window.addEventListener('keyup', (KeyboardEvent) => {
            const key = KeyboardEvent.key
            if (['x', 'y', 'z'].includes(key)) {
                this.randomFlags[key] = false
            } else if (key === 'r') {
                this.rotateFlag = false
            }
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

        this.materialEven = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM_EVEN)
        this.materialOdd = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM_ODD)

        this.boxList = []
        const boxNumbers = {x: 10, y: 10, z: 10}
        const boxSizes = {x: 2.0/boxNumbers.x, y: 2.0/boxNumbers.y, z: 2.0/boxNumbers.z}
        for(let x = 0; x < boxNumbers.x; x ++) {
            const xPos = (x / boxNumbers.x) * 2 - 1 
            for(let y = 0; y < boxNumbers.y; y ++) {
                const yPos = (y / boxNumbers.y) * 2 - 1 
                for(let z = 0; z < boxNumbers.z; z ++) {
                    if ((x + y + z) % 2) continue
                    const zPos = (z / boxNumbers.z) * 2 - 1 
                    this.boxGeometry = new THREE.BoxGeometry(boxSizes.x, boxSizes.y, boxSizes.z)
                    const box = new THREE.Mesh(this.boxGeometry, (x + y + z) % 4 ? this.materialEven : this.materialOdd)

                    box.position.x = xPos
                    box.position.y = yPos
                    box.position.z = zPos

                    this.scene.add(box)
                    this.boxList.push({mesh: box, position: {x: xPos, y: yPos, z: zPos}})
                }
            }
        }

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.autoRotate = true
        this.controls.autoRotateSpeed = 3.0

    }

    render () {
        requestAnimationFrame(this.render)

        Object.keys(this.randomFlags).forEach(axes => {
            this.boxList.forEach(box => {
                if(this.randomFlags[axes]) {
                    box.mesh.position[axes] += ((Math.random() * 2) - 1) * 0.1
                } else {
                    box.mesh.position[axes] = box.position[axes]
                }
                if (this.rotateFlag) {
                    box.mesh.rotation.y += 0.01
                    box.mesh.rotation.x += 0.01
                } else {
                    box.mesh.rotation.y = 0
                    box.mesh.rotation.x = 0

                }

            })
        })

        this.controls.update()
        this.renderer.render(this.scene, this.camera)
    }
}