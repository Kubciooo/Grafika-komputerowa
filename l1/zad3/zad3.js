const svgns = "http://www.w3.org/2000/svg";
const svg = document.getElementById('svg');
const input = document.getElementById('level');

const startX = 500;
const startY = 0;


let x = startX;
let y = startY;
let angle = 0;

let attribute = "";

let rotate = value => {
    angle = (angle - value + 360) % 360;
}

let rotateRight =  value => rotate(value); 

let rotateLeft = value =>  rotate(-value); 


let preparePath =  value => {
    //attribute += "M" + x + " " + y + " ";
    x += value * Math.sin(angle * Math.PI / 180);
    y +=  value * Math.cos(angle * Math.PI / 180);
    attribute += "L " + x + " " + y + " ";
};

let kochCurve = (level, length) => {
    if (level < 1) {
        preparePath (length);
    } else {
        kochCurve (level - 1, length / 3);
        rotateLeft (60);
        kochCurve (level - 1, length / 3);
        rotateRight (120);
        kochCurve (level - 1, length / 3);
        rotateLeft (60);
        kochCurve (level - 1, length / 3);
    }
};

let triangle = length => {
    for(let i = 0; i < 3; i++) {
      preparePath(length); 
      rotateRight(120); 
    }
  }
  let sierpinski = (level, length) => {
        if(level == 0) {
          triangle(length); 
        }
        else { 
          for(let i =0; i < 3; i++) {
            sierpinski(level-1, length/2); 
            preparePath(length);
            rotateRight(120); 
          }
        }
  } 


let drawSierpinski = (length) => {
    // clearujemy svg 
    while (svg.lastChild) {
        svg.removeChild(svg.lastChild);
    }
    // nowy attribute to M -> moveTo(x,y)
    attribute = "M" + x + " " + y + " ";
    // tworzymy koch tak, jak w poprzednim zadaniu 
    sierpinski(parseInt(input.value), length); 
    // Z -> closePath
    attribute += "Z";
    let shape = document.createElementNS(svgns, "path");
    // d -> draw
    shape.setAttributeNS(null, "d", attribute);
    // dodajemy klasę path 
    shape.setAttributeNS(null, "class", "path");
    svg.appendChild(shape);
};


let drawKoch = (length) => {
    // clearujemy svg 
    while (svg.lastChild) {
        svg.removeChild(svg.lastChild);
    }
    // nowy attribute to M -> moveTo(x,y)
    attribute = "M" + x + " " + y + " ";
    // tworzymy koch tak, jak w poprzednim zadaniu 
    for (let i = 0; i < 3; i++) {
        kochCurve(parseInt(input.value), length);
        rotateRight(120);
    }
    // Z -> closePath
    attribute += "Z";
    let shape = document.createElementNS(svgns, "path");
    // d -> draw
    shape.setAttributeNS(null, "d", attribute);
    // dodajemy klasę path 
    shape.setAttributeNS(null, "class", "path");
    svg.appendChild(shape);
};
input.value = 5;
input.min = 1;
input.max = 5;
