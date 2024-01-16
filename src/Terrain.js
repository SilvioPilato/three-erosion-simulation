import * as THREE from "three";
import {Noise} from "./Noise.js";
import Alea from "alea";
import {min} from "three/nodes";
import {Vector3} from "three";
export class Terrain {

    /**
     * Creates a new instance of the constructor.
     *
     * @param {Mesh} mesh - The mesh object.
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

    applyFBM(octaves = 1, amplitude = 1, lacunarity = 2, gain = 0.5, scale= 1, maxHeight=10, seed="alea") {
        const noise = new Noise(octaves, amplitude, lacunarity, gain, scale, seed);
        const position = this.geometry.getAttribute("position");
        let freq = 1;
        let totalAmplitude = 0;
        let max = -100000;
        for (let i = 0; i < position.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(position, i);
            vertex.y = noise.getValue(vertex.x, vertex.z)*maxHeight;
            max = Math.max(vertex.y, max);
            freq *= lacunarity;
            amplitude *= gain;
            totalAmplitude += amplitude;
            position.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        console.log(max);
        this.geometry.computeVertexNormals();
        position.needsUpdate = true;
    }

    /**
     * Applies erosion algorithm to the 3D geometry.
     *
     * @param {number} drops - The number of vertices to be randomly selected for erosion.
     * @param {string} seed - The seed value used for random number generation.
     * @param {number} iterations - The number of erosion iterations.
     * @param {number} erosionRate - The rate at which the terrain is eroded.
     * @param {number} depositionRate - The rate at which sediment is deposited.
     * @returns {void}
     */
    applyErosion(drops=30, seed="alea", iterations =30, erosionRate = 1, depositionRate = 1) {
        const position = this.geometry.getAttribute("position");
        const alea = new Alea(seed);
        const maxVertex = position.count - 1;
        let vertices = [];
        for (let i = 0; i < drops; i++) {
            vertices.push(Math.floor(alea()*maxVertex))
        }

        for (let j = 0; j < vertices.length; j++) {
            this.#applyDrop(j, iterations, erosionRate, depositionRate);
        }
        this.geometry.computeVertexNormals();
        position.needsUpdate = true;
    }

    #applyDrop(index, iterations =30, erosionRate = 1, depositionRate = 1, scale = 1) {
        const position = this.geometry.getAttribute("position");
        let j = index;
        let sediment = 0;
        for (let i = 0; i < iterations; i++) {
            const neigh = this.#getNeighbours(j);
            let min = j;
            for (let n of neigh) {
                const yCurr = position.getY(n)
                const yMin = position.getY(min)
                if (yCurr < yMin) {
                    min = n;
                }
            }
            const start = new THREE.Vector3();
            const end = new THREE.Vector3();
            start.fromBufferAttribute(position, i);
            end.fromBufferAttribute(position, min);
            const deltaVec = new THREE.Vector3(start.x-end.x, start.y-end.y, start.z-end.z).normalize();
            const deltaY = deltaVec.y;

            if (deltaY <=0) {
                return;
            }

            const deposit = sediment * depositionRate * deltaY
            const erosion = erosionRate * deltaY;
            sediment += erosion - deposit;
            const posJ = position.getY(j)-(deposit-erosion);
            position.setY(j, posJ);
            j = min;
        }
    }

    /**
     * Retrieves the neighboring vertices of the given vertex.
     *
     * @param {number} vertex The index of the vertex for which neighbors are to be retrieved.
     * @return {Array} An array containing the indices of the neighboring vertices.
     */
    #getNeighbours(vertex) {
        const { widthSegments } = this.geometry.parameters;
        const position = this.geometry.getAttribute("position");

        const max = position.count;
        const north = vertex - (widthSegments +1);
        const south = vertex + (widthSegments +1);
        const west = vertex - 1;
        const east = vertex + 1;
        let neighbours = [north, south, west, east];
        neighbours = neighbours.filter(vx => vx >=0 && vx<max)
        return neighbours;
    }
}