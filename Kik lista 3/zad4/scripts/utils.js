/**
 * Calculates a normal vector of a points
 * @param points [x0, y0, z0, x1, y1, z1, x2, y2, z2]
 *        index:     0,  1,  2,  3,  4,  5,  6,  7,  8
 */
export const normalVectorOfpoints = (points, swap = false) => {
    let U = [points[3] - points[0], points[4] - points[1], points[5] - points[2]];
    let V = [points[6] - points[0], points[7] - points[1], points[8] - points[2]];

    if(swap) [U,V] = [V,U];
    return [
        U[1] * V[2] - U[2] * V[1],
        U[2] * V[0] - U[0] * V[2],
        U[0] * V[1] - U[1] * V[0]
    ];
}
/**
 * funkcja utils obsługująca eventy myszki
 * @param {*} newListener 
 * @returns 
 */
export const MouseEventHandler = newListener => {
    const listener = newListener;
    let isDragged = false;
    const listenerCallbacks = new Array();

    const addNewListener = (callback, xPrecision, yPrecision) => {
        listenerCallbacks.push({ callback, xPrecision, yPrecision });
    }
    listener.addEventListener('mousedown', () => isDragged = true);
    listener.addEventListener('mouseup', () => isDragged = false);
    listener.addEventListener('mouseout', () => isDragged = false);
    listener.addEventListener('mousemove', e => {
        if (isDragged) {
            for (const l of listenerCallbacks) {
                l.callback(-e.movementX / l.xPrecision, e.movementY / l.yPrecision);
            }
        }
    });

    return { addNewListener };
}

export const createProgramAndAttachShaders = ({
    shaders,
    gl
}) => {
    const program = gl.createProgram();
    shaders.forEach(shader => {
        gl.attachShader(program, shader);
    })
    gl.linkProgram(program);
    gl.useProgram(program);
    return program;
};

export const createAndCompileShader = ({
    type,
    code,
    gl
}) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    return shader;
};

/**
 * Funkcja wspomagająca obsługująca resize całego canvasa
 * @param {*} canvas 
 * @param {*} gl 
 */
export const resize = (canvas, gl) => {
    if (canvas.width !== canvas.clientWidth) {
        canvas.width = canvas.clientWidth;
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    }

    if (canvas.height !== canvas.clientHeight) {
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
}