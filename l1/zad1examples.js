
const examplesCanvas = document.querySelector(".canvas_example"); 

//// Przykłady zadanie 1 

const exampleTurtle = new Turtle(examplesCanvas); 

/// kwadrat 

for(let i = 0; i<4; i++) {
  exampleTurtle.forward(100); 
  exampleTurtle.rotateRight(90);
}
