import {createNoise2D} from "simplex-noise";
import alea from "alea";

/**
 * @class Noise
 * Represents a noise function that generates random values at given coordinates.
 * @param {number} [octaves=1] The number of octaves.
 * @param {number} [amplitude=1] The amplitude of the noise waves.
 * @param {number} [lacunarity=2] The lacunarity of the noise function.
 * @param {number} [gain=0.5] The gain of the noise function.
 * @param {number} [scale=1] The scaling factor for the noise coordinates.
 * @param {string} [seed="seed"] The seed for the random number generator.
 */
export class Noise {
    /**
     * @description The number of octaves.
     *
     * @type {number}
     */
    octaves = 1;
    /**
     * @description The amplitude of a wave.
     *
     * @type {number}
     */
    amplitude = 1;
    /**
     * @description The lacunarity variable determines the frequency increment between successive octaves in a fractal noise function.
     * It is used to control the change in detail of the noise pattern.
     *
     * @type {number}
     */
    lacunarity = 2;
    /**
     * @description The gain variable represents the value that will incrementally scale the noise amplitude.
     *
     * @type {number}
     */
    gain = 1;
    /**
     * @description The scale of the noise coordinates.
     *
     * @type {number}
     */
    scale = 1;

    /**
     * A NoiseFunction2D object.
     *
     * @type {NoiseFunction2D}
     */
    #noise;
    /**
     * @param {number} [octaves=1] - The number of octaves.
     * @param {number} [amplitude=1] - The amplitude of the noise waves.
     * @param {number} [lacunarity = 2] - The lacunarity of the noise function.
     * @param {number} [gain=0.5] - The gain of the noise function.
     * @param {number} [scale=1] - The scaling factor for the noise coordinates.
     * @param {string} [seed="seed"] - The seed for the random number generator.
     */
    constructor(octaves = 1, amplitude = 1, lacunarity = 2, gain = 0.5, scale= 1, seed="seed") {
        this.octaves = octaves;
        this.amplitude = amplitude;
        this.lacunarity = lacunarity;
        this.gain = gain;
        this.scale = scale;
        this.#noise = createNoise2D(alea(seed));
    }

    /**
     * Sets the seed for generating noise.
     *
     * @param {string} _seed - The seed value to set.
     */
    set seed(_seed) {
        this.#noise = createNoise2D(alea(_seed));
    }

    /**
     * Calculates the noise value at a given (x, y) coordinate.
     *
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {number} - The calculated noise value.
     */
    getValue(x,y) {
        let frequency = 1;
        let amplitude = this.amplitude;
        let totalNoise = 0;
        let totalAmplitude = 0;
        for (let i = 0; i < this.octaves; i++) {
            totalNoise +=
                (this.#noise(
                            (x / this.scale) * frequency,
                            (y / this.scale) * frequency,
                        )

                    ) *
                amplitude;
            totalAmplitude+=amplitude;
            amplitude *= this.gain;
            frequency *= this.lacunarity;
        }
        return totalNoise/totalAmplitude;
    }
}