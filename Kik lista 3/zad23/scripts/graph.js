import { createProgramAndAttachShaders, normalVectorOfpoints, resize, createAndCompileShader, MouseEventHandler } from "./utils.js";
import { vertexShaderCode, fragmentShaderCode } from "./shaders/shaders.js";
import { M4 } from "./m4.js";

/**
 * canvas 
 */
let canvas = document.querySelector('#canvas');

let gl = canvas.getContext('webgl');

const createNewCanvas = () => {
    const parent = document.querySelector('main');
    console.log(parent);
    while (parent.firstChild) parent.removeChild(parent.firstChild);
    const newCanvas = document.createElement('canvas');
    newCanvas.id = '#canvas';
    newCanvas.width = 500;
    newCanvas.height = 500;
    canvas = newCanvas;
    parent.appendChild(canvas);
    return newCanvas;
}

const Graph = (func, canvas) => {
    gl = canvas.getContext('webgl');
    resize(canvas, gl);
    let fn = func;
    console.log(fn);
    let points = [];
    let normals = [];
    /**
     * glInfo to obiekt przechowujący parametry, których używamy do tworzenia naszego gl
     */
    const glInfo = {
        program: null,
        positionBuffer: null,
        positionLocation: null,
        normalBuffer: null,
        normalLocation: null,
        worldViewLocation: null,
        projectionLocation: null,
        fogNearLocation: null,
        forFarLocation: null,
        reverseLightDirection: null,
        ambientLocation: null
    };
    let res = 1000;
    let graphSize = canvas.width;
    let triangles = false;

    const initialize = () => {
        const vertexShader = createAndCompileShader({ gl: gl, type: gl.VERTEX_SHADER, code: vertexShaderCode });
        const fragmentShader = createAndCompileShader({ gl: gl, type: gl.FRAGMENT_SHADER, code: fragmentShaderCode });
        const program = createProgramAndAttachShaders({ gl: gl, shaders: [vertexShader, fragmentShader] });
        glInfo.program = program;
        glInfo.positionLocation = gl.getAttribLocation(program, 'a_position');
        glInfo.normalLocation = gl.getAttribLocation(program, 'a_normal');
        glInfo.worldViewLocation = gl.getUniformLocation(program, 'u_worldView');
        glInfo.projectionLocation = gl.getUniformLocation(program, 'u_projection');
        glInfo.fogNearLocation = gl.getUniformLocation(program, 'u_fogNear');
        glInfo.forFarLocation = gl.getUniformLocation(program, 'u_fogFar');
        glInfo.reverseLightDirection = gl.getUniformLocation(program, 'u_reverseLightDirection');
        glInfo.ambientLocation = gl.getUniformLocation(program, 'u_ambient');
    }

    const drawArea = (xBounds, yBounds, ts = false) => {
        triangles = ts;
        points = [];
        normals = [];

        const scaleFactor = graphSize / Math.abs(xBounds.max - xBounds.min);

        for (let x = 0; x < res; x++) {
            for (let y = 0; y < res; y++) {
                const val = fn(
                    xBounds.min + x * (xBounds.max - xBounds.min) / res,
                    yBounds.min + y * (yBounds.max - yBounds.min) / res
                ) * scaleFactor;

                if (triangles) {
                    let nextY = null, nextX = null, nextYX = null;
                    if (y !== res - 1) {
                        nextY = fn(
                            xBounds.min + x * (xBounds.max - xBounds.min) / res,
                            yBounds.min + (y + 1) * (yBounds.max - yBounds.min) / res
                        ) * scaleFactor;
                    }
                    if (x !== res - 1) {
                        nextX = fn(
                            xBounds.min + (x + 1) * (xBounds.max - xBounds.min) / res,
                            yBounds.min + y * (yBounds.max - yBounds.min) / res
                        ) * scaleFactor;
                    }
                    if (x !== res - 1 && y !== res - 1) {
                        nextYX = fn(
                            xBounds.min + (x + 1) * (xBounds.max - xBounds.min) / res,
                            yBounds.min + (y + 1) * (yBounds.max - yBounds.min) / res
                        ) * scaleFactor;
                    }

                    if (nextX !== null && nextY !== null && nextYX !== null) {
                        const firstTriangle = [
                            x * graphSize / res - graphSize / 2,
                            y * graphSize / res - graphSize / 2,
                            val,
                            (x + 1) * graphSize / res - graphSize / 2,
                            y * graphSize / res - graphSize / 2,
                            nextX,
                            x * graphSize / res - graphSize / 2,
                            (y + 1) * graphSize / res - graphSize / 2,
                            nextY
                        ];

                        const secondTriangle = [
                            (x + 1) * graphSize / res - graphSize / 2,
                            (y + 1) * graphSize / res - graphSize / 2,
                            nextYX,
                            (x + 1) * graphSize / res - graphSize / 2,
                            y * graphSize / res - graphSize / 2,
                            nextX,
                            x * graphSize / res - graphSize / 2,
                            (y + 1) * graphSize / res - graphSize / 2,
                            nextY
                        ];

                        points.push(...firstTriangle, ...secondTriangle);
                        normals.push(
                            ...normalVectorOfpoints(firstTriangle),
                            ...normalVectorOfpoints(firstTriangle),
                            ...normalVectorOfpoints(firstTriangle),
                            ...normalVectorOfpoints(secondTriangle, true),
                            ...normalVectorOfpoints(secondTriangle, true),
                            ...normalVectorOfpoints(secondTriangle, true)
                        ); // push normal vector for each point
                    }
                } else {
                    points.push(
                        x * graphSize / res - graphSize / 2,
                        y * graphSize / res - graphSize / 2,
                        val
                    );
                }
            }
        }

        glInfo.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glInfo.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        if (triangles) {
            glInfo.normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glInfo.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        }
    }

    const draw = (worldView, projection) => {
        gl.useProgram(glInfo.program);
        gl.enable(gl.DEPTH_TEST);

        gl.uniform1f(glInfo.fogNearLocation, 2000.0);
        gl.uniform1f(glInfo.forFarLocation, 5000.0);

        gl.uniform1f(glInfo.ambientLocation, 0.5);

        gl.uniformMatrix4fv(glInfo.worldViewLocation, false, worldView);
        gl.uniformMatrix4fv(glInfo.projectionLocation, false, projection);

        gl.uniform3fv(glInfo.reverseLightDirection, M4.normalize([0.5, 0.7, 1]));

        gl.enableVertexAttribArray(glInfo.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, glInfo.positionBuffer);
        gl.vertexAttribPointer(
            glInfo.positionLocation,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );

        if (triangles) { // point surfaces don't use lighting
            gl.enableVertexAttribArray(glInfo.normalLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, glInfo.normalBuffer);
            gl.vertexAttribPointer(
                glInfo.normalLocation,
                3,
                gl.FLOAT,
                false,
                0,
                0
            );
        }

        gl.drawArrays(
            triangles ? gl.TRIANGLES : gl.POINTS,
            0,
            triangles ? points.length / 3 : res ** 2
        );
    }
    return { draw, drawArea, initialize }
}

window.addEventListener('load', () => {
    const input = document.getElementById('input_function');
    const xFromInput = document.getElementById('input_xFrom');
    const xToInput = document.getElementById('input_xTo');
    const yFromInput = document.getElementById('input_yFrom');
    const yToInput = document.getElementById('input_yTo');
    const btn = document.querySelector('button');
    for (const inp of [input, xFromInput, xToInput, yFromInput, yToInput]) {
        inp.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                try {
                    createGraph(eval(`(x, y) => ${input.value}`), { min: parseInt(xFromInput.value), max: parseInt(xToInput.value), }, { min: parseInt(yFromInput.value), max: parseInt(yToInput.value) });
                } catch (e) {
                    console.log('Błąd!', e);
                }
            }
        });
    }
    btn.addEventListener('click', e => {
        e.preventDefault();
        try {
            createGraph(eval(`(x, y) => ${input.value}`), { min: parseInt(xFromInput.value), max: parseInt(xToInput.value), }, { min: parseInt(yFromInput.value), max: parseInt(yToInput.value) });
        } catch (e) {
            console.log('Błąd!', e);
        }
    });
    createGraph((x, y) => x ** 2 + y ** 2);
});

const  createGraph = (func, xBounds = { min: -1, max: 1 }, yBounds = { min: -1, max: 1 }) => {
    const canvas = createNewCanvas();
    const graph = Graph(func, canvas);
    let currX = 0; 
    let currY = Math.PI / 4; 
    let distance = 1000; 
    let hasChanged = true; 
    graph.initialize();

    const mouse = MouseEventHandler(canvas);
    mouse.addNewListener((x, y) => {
        currY -= y;
        currX += x;
        hasChanged = true;
    }, 100, 100);

    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        distance += e.deltaY;
        hasChanged = true
    });

    graph.drawArea(xBounds, yBounds, true);

    let projectionMatrix = M4.perspective(Math.PI / 4, canvas.width / canvas.height, 1, 5000);

    const drawLoop = () => {
        if (hasChanged) {
            let cameraMatrix = M4.xRotation(currY);
            cameraMatrix = M4.yRotate(cameraMatrix, currX);
            cameraMatrix = M4.translate(cameraMatrix, 0, 0, distance);
            graph.draw(M4.inverse(cameraMatrix), projectionMatrix);
            hasChanged = false;
        }
        requestAnimationFrame(drawLoop);
    };

    drawLoop();

}