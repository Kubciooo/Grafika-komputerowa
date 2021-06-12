import { createProgramAndAttachShaders, normalVectorOfpoints, resize, createAndCompileShader, MouseEventHandler } from "./utils.js";
import { vertexShaderCode, fragmentShaderCode, pixVertexShaderSrc, pixFragmentShaderSrc } from "./shaders/shaders.js";
import { M4 } from "./m4.js";

/**
 * canvas 
 */
let canvas = document.querySelector('#canvas');

let gl = canvas.getContext('webgl', { stencil: true });

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

const Graph = (canvas) => {
    gl = canvas.getContext('webgl', { stencil: true });
    resize(canvas, gl);
    let points = [[],[]];
    let normals = [[],[]];
    let currRotation = [0,0];
    let positionBuffers = [gl.createBuffer(), gl.createBuffer()];
    let normalBuffers = [gl.createBuffer(), gl.createBuffer()];
    /**
     * glInfo to obiekt przechowujący parametry, których używamy do tworzenia naszego gl
     */
    const glInfo = {
        program: null,
        maskProgram: null, 
        positionBuffer: null,
        positionLocation: null,
        normalBuffer: null,
        normalLocation: null,
        worldViewLocation: null,
        projectionLocation: null,
        mMatrix: null,
        fogNearLocation: null,
        forFarLocation: null,
        reverseLightDirection: null,
        ambientLocation: null,
        colorLocation: null,
        pixPosition: null, 
        pixPositionBuffer: null,
    };
    let res = 1000;
    let graphSize = canvas.width;
    let triangles = false;

    const initialize = () => {
        const vertexShader = createAndCompileShader({ gl: gl, type: gl.VERTEX_SHADER, code: vertexShaderCode });
        const fragmentShader = createAndCompileShader({ gl: gl, type: gl.FRAGMENT_SHADER, code: fragmentShaderCode });
        const pixVertexShader = createAndCompileShader({ gl: gl, type: gl.VERTEX_SHADER, code: pixVertexShaderSrc });
        const pixFragmentShader = createAndCompileShader({ gl: gl, type: gl.FRAGMENT_SHADER, code: pixFragmentShaderSrc });
        const program = createProgramAndAttachShaders({ gl: gl, shaders: [vertexShader, fragmentShader] });
        const maskProgram = createProgramAndAttachShaders({gl: gl, shaders: [pixVertexShader, pixFragmentShader] });
        glInfo.program = program;
        glInfo.maskProgram = maskProgram;

        glInfo.pixPosition = gl.getAttribLocation(maskProgram, 'aPosition');
        glInfo.pixPositionBuffer = gl.createBuffer(); 
        gl.bindBuffer(gl.ARRAY_BUFFER, glInfo.pixPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

        glInfo.positionLocation = gl.getAttribLocation(program, 'a_position');
        glInfo.normalLocation = gl.getAttribLocation(program, 'a_normal');
        glInfo.worldViewLocation = gl.getUniformLocation(program, 'u_worldView');
        glInfo.projectionLocation = gl.getUniformLocation(program, 'u_projection');
        glInfo.mMatrix = gl.getUniformLocation(program, 'u_rotation');
        glInfo.fogNearLocation = gl.getUniformLocation(program, 'u_fogNear');
        glInfo.forFarLocation = gl.getUniformLocation(program, 'u_fogFar');
        glInfo.reverseLightDirection = gl.getUniformLocation(program, 'u_reverseLightDirection');
        glInfo.ambientLocation = gl.getUniformLocation(program, 'u_ambient');
        glInfo.colorLocation = gl.getUniformLocation(program, 'u_color');
    }

    const drawArea = (fn, xBounds, yBounds, index, ts = false) => {
        triangles = ts;
        points[index] = [];
        normals[index] = [];

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

                        points[index].push(...firstTriangle, ...secondTriangle);
                        normals[index].push(
                            ...normalVectorOfpoints(firstTriangle),
                            ...normalVectorOfpoints(firstTriangle),
                            ...normalVectorOfpoints(firstTriangle),
                            ...normalVectorOfpoints(secondTriangle, true),
                            ...normalVectorOfpoints(secondTriangle, true),
                            ...normalVectorOfpoints(secondTriangle, true)
                        ); // push normal vector for each point
                    }
                } else {
                    points[index].push(
                        x * graphSize / res - graphSize / 2,
                        y * graphSize / res - graphSize / 2,
                        val
                    );
                }
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffers[index]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points[index]), gl.STATIC_DRAW);

        if (triangles) {
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[index]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals[index]), gl.STATIC_DRAW);
        }
    }

    const maskDraw = (worldView, projection, colors) => {
        //prepare the stencil buffer
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.STENCIL_TEST);
        gl.clearColor(0.5, 0.5, 0.5, 1.0);
        gl.clearStencil(0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    
        gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
        gl.stencilMask(255); // enable modification of stencil buffer
        gl.stencilFunc(gl.ALWAYS, 1, 255);
    
        gl.useProgram(glInfo.maskProgram);
        gl.enableVertexAttribArray(glInfo.pixPosition);
        gl.bindBuffer(
          gl.ARRAY_BUFFER,
          glInfo.pixPositionBuffer
        ); /* refer to the buffer */
    
        gl.vertexAttribPointer(
          glInfo.pixPositionBuffer,
          2 /* floatsPerVertex */,
          gl.FLOAT,
          false,
          0 /* stride */,
          0 /*offset */
        );
    
        gl.drawArrays(
          gl.TRIANGLE_FAN,
          0 /* offset */,
          4 /*NumberOfVertices */
        );
    
        // draw through stencil
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.GL_LESS);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        // draw through reference pixels 1
        for (let index = 0; index < 2; index++) {   
            gl.stencilFunc(gl.EQUAL, index, 255);
            gl.stencilMask(0); // disable modification of stencil buffer
            draw(index, worldView, projection, colors[index]);
        }

      }
    const draw = (index, worldView, projection, color = [0.2, 0.7, 0.2, 1.0]) => {
        const factor = index === 0 ? 1 : -1;
        currRotation[index] += factor * 0.01; 
        let mMatrix = M4.zRotation(currRotation[index]);

        gl.useProgram(glInfo.program);
        gl.enable(gl.DEPTH_TEST);

        gl.uniform1f(glInfo.fogNearLocation, 2000.0);
        gl.uniform1f(glInfo.forFarLocation, 5000.0);

        gl.uniform1f(glInfo.ambientLocation, 0.5);
        gl.uniform4f(glInfo.colorLocation, ...color);

        gl.uniformMatrix4fv(glInfo.worldViewLocation, false, worldView);
        gl.uniformMatrix4fv(glInfo.projectionLocation, false, projection);
        gl.uniformMatrix4fv(glInfo.mMatrix, false, mMatrix);

        gl.uniform3fv(glInfo.reverseLightDirection, M4.normalize([0.5, 0.7, 1]));

        gl.enableVertexAttribArray(glInfo.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffers[index]);
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
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[index]);
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
            triangles ? points[index].length / 3 : res ** 2
        );
    }
    return { maskDraw, draw, drawArea, initialize }
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
                    createGraph(eval(`(x, y) => ${input.value}`),((x,y) => Math.sin(x+y)), { min: parseInt(xFromInput.value), max: parseInt(xToInput.value), }, { min: parseInt(yFromInput.value), max: parseInt(yToInput.value) });
                } catch (e) {
                    console.log('Błąd!', e);
                }
            }
        });
    }
    btn.addEventListener('click', e => {
        e.preventDefault();
        try {
            createGraph(eval(`(x, y) => ${input.value}`),((x,y) => Math.sin(x+y)), { min: parseInt(xFromInput.value), max: parseInt(xToInput.value), }, { min: parseInt(yFromInput.value), max: parseInt(yToInput.value) });
        } catch (e) {
            console.log('Błąd!', e);
        }
    });
    createGraph((x, y) => x ** 2 + y ** 2, ((x,y) => -1*x**2 - y**2));
});

const createGraph = (func1, func2, xBounds = { min: -1, max: 1 }, yBounds = { min: -1, max: 1 }) => {
    const canvas = createNewCanvas();
    const graph = Graph(canvas);
    let currX = 0;
    let currY = Math.PI / 3;

    let distance = 1000;
    graph.initialize();

    const mouse = MouseEventHandler(canvas);
    mouse.addNewListener((x, y) => {
        currY -= y;
        currX += x;
    }, 100, 100);

    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        distance += e.deltaY;
    });

    graph.drawArea(func1, xBounds, yBounds, 1, true);
    graph.drawArea(func2, xBounds, yBounds, 0, true);

    const colors = [
        [0, 0.44, 1, 1],
        [0.1, 0.3, 0.2, 1.0]
    ]
    const drawFunction = () => {
        let projectionMatrix = M4.perspective(Math.PI / 4, canvas.width / canvas.height, 1, 5000);
        let cameraMatrix = M4.xRotation(currY);
        cameraMatrix = M4.yRotate(cameraMatrix, currX);
        cameraMatrix = M4.translate(cameraMatrix, 0, 0, distance);
        graph.maskDraw(M4.inverse(cameraMatrix), projectionMatrix, colors);
    }
    const drawLoop = () => {
        drawFunction();
        requestAnimationFrame(drawLoop);
    };

    drawLoop();

}