import * as THREE from "three";
import {Noise} from "./Noise.js";
export class Terrain {

    /**
     * Creates a new instance of the constructor.
     *
     * @param {THREE.PlaneMesh} mesh - The mesh object.
     */
    constructor(mesh) {
        this.mesh = mesh;
    }

    /**
     * @description Represents a mesh object.
     * @type {THREE.Mesh}
     */
    mesh = null;

    /**
     *
     * @returns {THREE.BufferGeometry}
     */
    get geometry() {
        return this.mesh.geometry;
    }


    /**
     * Sets the geometry of the mesh.
     *
     * @param {THREE.BufferGeometry} _geometry - The geometry to be set.
     */
    set geometry(_geometry) {
        this.mesh.geometry = _geometry;
    }

    /**
     * Retrieves the material of the mesh.
     *
     * @returns {THREE.Material} The material object of the mesh.
     */
    get material() {
        return this.mesh.material;
    }
    set material(_material) {
        this.mesh.material = _material;
    }

    applyFBM(octaves = 1, amplitude = 1, lacunarity = 2, gain = 0.5, scale= 1, seed="alea") {
        const noise = new Noise(octaves, amplitude, lacunarity, gain, scale, seed);
        const position = this.geometry.getAttribute("position");
        let freq = 1;
        let totalAmplitude = 0;
        for (let i = 0; i < position.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(position, i);
            vertex.y = noise.getValue(vertex.x, vertex.z);
            freq *= lacunarity;
            amplitude *= gain;
            totalAmplitude += amplitude;
            position.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }


        this.geometry.computeVertexNormals();
        position.needsUpdate = true;
    }
}