import '../style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'lil-gui'
import {Terrain} from "./Terrain.js";

const gui = new dat.GUI()

const guiProps = {
	plane: {
		width: 100,
		height: 100,
		widthSegments: 100,
		heightSegments: 100,
		wireframe: true,
	},
	fbm: {
		octaves: 8,
		amplitude: 15,
		lacunarity: 2,
		gain: 0.5,
		scale: 100,
		maxHeight: 10,
		seed: "seed"
	},
	erosion: {
		drops: 1,
		seed: "seed",
		capacity: 30,
		erosionRate: 1,
		depositionRate: 1,
		evaporationRate: 0.1
	}
}

for (const [key, obj] of Object.entries(guiProps)) {
	const folder = gui.addFolder(key.toUpperCase());
	for (const key of Object.keys(obj)) {
		folder.add(obj, key)
	}
}

/**
 * Scene
 */
const scene = new THREE.Scene()

/**
 * BOX
 */
const terrain = new Terrain(new THREE.Mesh())
scene.add(terrain.mesh)
setupMesh(terrain);
gui.onFinishChange((props) => {
	setupMesh(terrain);
})

function setupMesh(terrain) {
	const {plane, fbm, erosion} = guiProps;
	terrain.material = new THREE.MeshNormalMaterial({wireframe: plane.wireframe});
	terrain.geometry = new THREE.PlaneGeometry(plane.width, plane.height, plane.widthSegments, plane.heightSegments);
	terrain.geometry.rotateX(-Math.PI /2);
	terrain.applyFBM(fbm.octaves, fbm.amplitude, fbm.lacunarity, fbm.gain, fbm.scale, fbm.maxHeight, fbm.seed);
	terrain.applyErosion(erosion.drops, erosion.seed, erosion.capacity, erosion.erosionRate, erosion.depositionRate)
}
/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}
/**
 * Camera
 */
const fov = 60
const camera = new THREE.PerspectiveCamera(fov, sizes.width / sizes.height, 0.1)
camera.position.set(10, 10, 10)
camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * Show the axes of coordinates system
 */
const axesHelper = new THREE.AxesHelper(3)
scene.add(axesHelper)

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
	logarithmicDepthBuffer: true,
})
document.body.appendChild(renderer.domElement)
handleResize()

/**
 * OrbitControls
 */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

/**
 * frame loop
 */
function tick() {
	controls.update()
	renderer.render(scene, camera)
	requestAnimationFrame(tick)
}

requestAnimationFrame(tick)

window.addEventListener('resize', handleResize)

function handleResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)
}
