import * as THREE from 'three';
import { BaseRenderer } from './baseRenderer';
import * as seedrandom from 'seedrandom';
import gsap from 'gsap';
import bgVertShader from './shaders/bgVertShader.txt';
import bgFragShader from './shaders/bgFragShader.txt';
import glowVertShader from './shaders/glowVertShader.txt';
import glowFragShader from './shaders/glowFragShader.txt';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const srandom = seedrandom('a');

let tl;

const BLOOM_SCENE = 1;

const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );

const params = {
    exposure: 1,
    bloomStrength: 3,
    bloomThreshold: 2,
    bloomRadius: 1,
    scene: "Scene with Glow"
};

const darkMaterial = new THREE.MeshBasicMaterial( { color: "black" } );
const materials = {};

export default class ThreeRenderer implements BaseRenderer{
    canvas: HTMLCanvasElement;

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    mesh: THREE.Mesh;
    renderer: THREE.Renderer;
    group: THREE.Object3D;
    bg: THREE.Mesh;
    completeCallback: any;
    bloomComposer: EffectComposer;
    finalComposer: EffectComposer;

    width: number = 1920 / 2;
    height: number = 1080 / 2;

    constructor(w: number, h: number) {

        this.width = w;
        this.height = h;

        this.camera = new THREE.PerspectiveCamera( 70, w / h, 0.01, 100 );
        this.camera.position.z = 1;
    
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x04B2D9 );

        this.scene.add( new THREE.AmbientLight( 0x404040 ) );

        let pointLight = new THREE.PointLight( 0xffffff, 1, 100 );
        pointLight.position.set( 0, 0, 0 );
        this.scene.add( pointLight );

        this.renderer = new THREE.WebGLRenderer( { 
            antialias: true,
            preserveDrawingBuffer: true
        } );

        this.canvas = this.renderer.domElement;
        document.body.appendChild(this.canvas);
        this.renderer.setSize( w, h );

        const renderScene = new RenderPass( this.scene, this.camera );

        const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;

        this.bloomComposer = new EffectComposer( this.renderer );
        this.bloomComposer.renderToScreen = false;
        this.bloomComposer.addPass( renderScene );
        this.bloomComposer.addPass( bloomPass );

        const finalPass = new ShaderPass(
            new THREE.ShaderMaterial( {
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
                },
                vertexShader: glowVertShader,
                fragmentShader: glowFragShader,
                defines: {}
            } ), "baseTexture"
        );
        finalPass.needsSwap = true;

        this.finalComposer = new EffectComposer( this.renderer );
        this.finalComposer.addPass( renderScene );
        this.finalComposer.addPass( finalPass );

        this.bloomComposer.setSize( w, h );
        this.finalComposer.setSize( w, h );

        // ADD ITEMS HERE

        let bgUniforms = {
            delta: {
                value: 0.0
            },
            dw: {
                value: 0.0
            },
            dh: {
                value: 0.0
            }
        };

        let bgGeometry = new THREE.PlaneGeometry(19, 10, 40, 40);
        
        let bgMaterial = new THREE.ShaderMaterial({
            uniforms: bgUniforms,
            vertexShader: bgVertShader, 
            fragmentShader: bgFragShader,
            side: THREE.DoubleSide
        }); 
    
        
        //let bgMaterial = new THREE.MeshLambertMaterial({color: 0x00ff00});
        this.bg = new THREE.Mesh( bgGeometry, bgMaterial );
        this.bg.position.set(0, 0, -20);
        this.scene.add(this.bg);


        setInterval(() => {
            //this.bg.rotation.y += 0.1;
            bgMaterial.uniforms.dw.value += this.map(100, 0, 1.0, .16, -0.16);
            bgMaterial.uniforms.dh.value += this.map(100, 0, 1.0, .16, -0.16);
        }, 100)

    }

    private map(value, min1, max1, min2, max2) {
        return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    }

    private handleRepeat() {
        if (this.completeCallback) {
            this.completeCallback();
        }
    }

    private handleComplete() {

    }

    public render() {
        this.renderer.render(this.scene, this.camera);

        //this.renderBloom();
        //this.finalComposer.render();
    }

    public play() {
        //tl.restart();
        setTimeout(() => {
            console.log('go');
            if (this.completeCallback) {
                this.completeCallback();
            }
        }, 10000);
    }

    public stop() {
        tl.pause(true);
        tl.time(0);
    }

    public setCompleteCallback(completeCallback: any) {
        this.completeCallback = completeCallback;
    }

    public resize() {
        this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 0.01, 10 );
        this.camera.position.z = 1;

        this.renderer.setSize( this.width, this.height );
    }

    private renderBloom() {
        this.scene.traverse( this.darkenNonBloomed );
        this.bloomComposer.render();
        this.scene.traverse( this.restoreMaterial );
    }

    private darkenNonBloomed( obj ) {
        if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
            materials[ obj.uuid ] = obj.material;
            obj.material = darkMaterial;
        }
    }

    private restoreMaterial( obj ) {
        if ( materials[ obj.uuid ] ) {
            obj.material = materials[ obj.uuid ];
            delete materials[ obj.uuid ];
        }
    }
}