import * as seedrandom from 'seedrandom';
import { BaseRenderer } from './baseRenderer';
import gsap from 'gsap';
import P5 from 'p5';

const srandom = seedrandom('b');

let squares = [];

let tl;

let image;
let dw = 0, dh = 0;
let freq;
let minSize;
let px = [];

export default class P5Renderer implements BaseRenderer{

    recording: boolean = false;
    colors = ['#D1CDC4', '#340352', '#732A70', '#FF6EA7', '#FFE15F'];
    backgroundColor = '#FFFFFF';

    canvas: HTMLCanvasElement;
    s: any;

    completeCallback: any;
    delta = 0;
    animating = true;

    width: number = 1920 / 2;
    height: number = 1080 / 2;

    size: number;

    img: ImageBitmap;

    constructor(w, h) {

        this.width = w;
        this.height = h;

        const sketch = (s) => {
            this.s = s;
            s.pixelDensity(1);
            s.preload = () => this.preload(s)
            s.setup = () => this.setup(s)
            s.draw = () => this.draw(s)
        }

        new P5(sketch);
    }

    protected preload(s) {
        this.img = s.loadImage('assets/title.png');
    }

    protected setup(s) {
        let renderer = s.createCanvas(this.width, this.height);
        this.canvas = renderer.canvas;
        s.background(0, 0, 0, 255);
        s.colorMode(s.HSB);
    }

    protected draw(s) {
        if (this.animating) { 
            this.delta += 0.1;
            s.noTint();
            s.colorMode(s.RGB);
            s.background(0, 0, 0, 20);

            s.colorMode(s.HSB);
            let x = s.sin(this.delta) * 10;
            let y = s.cos(this.delta) * 10;
            s.translate(x, y);
            s.tint((this.delta * 10) % 255, 255, 255, 100);
            s.image(this.img, 0, 0);

            s.noTint();
            s.image(this.img, 0, 0);
        }
    }

    public render() {

    }

    public play() {
        this.recording = true;
        this.animating = true;

        setTimeout(() => {
            this.completeCallback();
        }, 5000)
    }

    public stop() {
        this.animating = false;
    }

    public setCompleteCallback(completeCallback: any) {
        this.completeCallback = completeCallback;
    }

    public resize() {
        this.s.resizeCanvas(window.innerWidth, window.innerHeight);
        this.s.background(0, 0, 0, 255);
    }
}