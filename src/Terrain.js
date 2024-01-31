import * as THREE from "three";
import {Noise} from "./Noise.js";
import Alea from "alea";
import {Vector3} from "three";
export class Terrain {

    /**
     * Creates a new instance of the constructor.
     *
     * @param {THREE.Mesh} mesh - The mesh object.
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
     * @typedef {boolean} Debug
     */
    debug = false;
    /**
     * Represents a collection of debugging helpers.
     *
     * @type {THREE.Object3D[]}
     * @name debugHelpers
     */
    debugHelpers= [];

    /**
     * Represents a debug line material used in THREE.js.
     *
     * @class LineBasicMaterial
     * @constructor
     * @param {number} color - The color of the material represented as hexadecimal value.
     */



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

    /**
     * Sets the material of the mesh.
     *
     * @param {THREE.Material} _material - The new material to be applied to the mesh.
     *                               This should be a valid three.js material object.
     */
    set material(_material) {
        this.mesh.material = _material;
    }

    applyFBM(
        octaves = 1,
        amplitude = 1,
        lacunarity = 2,
        gain = 0.5,
        scale= 1,
        maxHeight=10,
        seed="alea"
    ) {
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

        this.geometry.computeVertexNormals();
        position.needsUpdate = true;
    }

    /**
     * Apply erosion to the terrain mesh using the given parameters.
     *
     * @param {number} drops - The number of erosion drops to apply.
     * @param {string} seed - The seed value for generating random numbers.
     * @param {number} capacity - The maximum amount of sediment a vertex can hold.
     * @param {number} erosionRate - The rate at which sediment is eroded from a vertex.
     * @param {number} depositionRate - The rate at which sediment is deposited to a vertex.
     * @param {number} evaporationRate - The rate at which each drop evaporates.
     * @param {boolean} debug - Flag indicating whether to enable debug mode.
     *
     * @return {void}
     */
    applyErosion(drops=30, seed="alea", capacity =30, erosionRate = 1, depositionRate = 1, evaporationRate = 0.1, debug = false) {
        const position = this.geometry.getAttribute("position");
        const alea = new Alea(seed);
        const maxVertex = position.count - 1;
        let vertices = [];
        this.debugHelpers = [];
        for (let i = 0; i < drops; i++) {
            vertices.push(Math.floor(alea()*maxVertex))
        }
        console.log(vertices);
        for (let j = 0; j < vertices.length; j++) {
            this.#applyDrop(vertices[j], capacity, erosionRate, depositionRate, evaporationRate,  debug);
        }
        this.geometry.computeVertexNormals();
        position.needsUpdate = true;
    }

    /**
     * Applies erosion and deposition to the terrain at the specified index.
     *
     * @param {number} index - The index of the terrain vertex to apply erosion and deposition to.
     * @param {number} [capacity=30] - The maximum capacity of sediment the vertex can hold.
     * @param {number} [erosionRate=1] - The rate at which the terrain erodes.
     * @param {number} [depositionRate=0.1] - The rate at which sediment is deposited.
     * @param {number} [evaporationRate=0.1] - The rate at which water evaporates.
     * @param {boolean} [debug=false] - Whether or not to enable debug mode.
     *
     * @return {void}
     */
    #applyDrop(
        index,
        capacity =30,
        erosionRate = 1,
        depositionRate = 0.1,
        evaporationRate =0.1,
        debug = false) {
        const position = this.geometry.getAttribute("position");
        let j = index;
        let sediment = 0;
        const start = new THREE.Vector3();
        const end = new THREE.Vector3();
        let deltaVec = new THREE.Vector3();
        const debugPoints =
            debug ? [new Vector3(position.getX(j),position.getY(j), position.getZ(j))]: [];
        while (capacity >= 0) {
            const neigh = this.#getNeighbours(j);
            let min = j;
            for (let n of neigh) {
                const yCurr = position.getY(n)
                const yMin = position.getY(min)
                if (yCurr < yMin) {
                    min = n;
                }
            }

            start.fromBufferAttribute(position, j);
            end.fromBufferAttribute(position, min);
            deltaVec.x = start.x-end.x;
            deltaVec.y = start.y-end.y;
            deltaVec.z = start.z-end.z;
            console.log(start, end);
            if (debug) {
                debugPoints.push(new Vector3(end.x, end.y, end.z));
            }

            deltaVec = deltaVec.normalize();
            const deltaY = deltaVec.y;

            if (deltaY <= 0) {
                position.setY(j, position.getY(j)+sediment);
                break;
            }
            let deposit = sediment * depositionRate * deltaY;
            let erosion = erosionRate * (1-deltaY);

            capacity*=evaporationRate * deltaY;
            erosion = Math.min(erosion, deltaY);
            sediment += Math.min(deltaY, erosion) - deposit;

            if(sediment > capacity) {
                deposit += sediment - capacity;
                sediment = capacity;
            } else {
                capacity-=sediment;
            }

            const posJ = position.getY(j)-erosion + deposit;
            position.setY(j, posJ);
            j = min;
        }
        console.log("---");
        if (debug) {
            const debugLineMaterial  = new THREE.LineBasicMaterial( { color: 0xff00000, linewidth: 3 } );
            const debugGeometry = new THREE.BufferGeometry();
            debugGeometry.setFromPoints(debugPoints);
            this.debugHelpers.push(new THREE.Line(debugGeometry, debugLineMaterial));
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