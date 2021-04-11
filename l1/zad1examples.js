
const examplesCanvas = document.querySelector("canvas");

//// Przykłady zadanie 1 
const canv = document.querySelector(".canvas");
const canvas_pen = document.querySelector(".canvas__pen");
const btn = document.querySelector(".form__button");
const input = document.querySelector(".form__input");
const lastCommands = document.querySelector(".commands");
const positionText = document.querySelector(".canvas__pos");
const angleText = document.querySelector(".canvas__angle");


class Turtle {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d");
    this.ctx.lineWidth = "1";
    this.ctx.strokeStyle = "black";
    this.maxWidth = canvas.width;
    this.maxHeight = canvas.height;
    this.minWidth = 0;
    this.minHeight = 0;
    this.penUp = false;
    this.x = (this.minWidth + this.maxWidth) / 2;
    this.y = (this.minHeight + this.maxHeight) / 2;
    this.angle = 90;

    // initializing turtle
    this.ctx.moveTo(this.x, this.y);
    this.translateCoordinates();
  }

  translateCoordinates() {
    this.ctx.translate(this.minWidth, this.maxWidth);
    this.ctx.scale(1, -1);
  }

  checkCoordinates = (x, y) =>
    x >= this.minWidth &&
    x <= this.maxWidth &&
    y >= this.minHeight &&
    y <= this.maxHeight;

  parseInput(input) {
    input.split(";").forEach((line) => {
      let [command, ...params] = line
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase()
        .split(" ");
      this.executeCommand(command, ...params);
    });
  }
  forward(value) {
    this.move(value);
  }

  backward(value) {
    this.move(-value);
  }

  rotateRight(value) {
    this.rotate(value);
  }

  rotateLeft(value) {
    this.rotate(-value);
  }
  putUp() {
    this.penUp = true;
  }
  putDown() {
    this.penUp = false;
  }

  strokeStyle(value) {
    this.ctx.strokeStyle = value;
  }

  lineWidth(value) {
    this.ctx.lineWidth = value;
  }

  koch(level, length) {
    if (level < 1) {
      this.forward(length);
    } else {
      this.koch(level - 1, length / 3.0);
      this.rotateLeft(60);
      this.koch(level - 1, length / 3.0);
      this.rotateRight(120);
      this.koch(level - 1, length / 3.0);
      this.rotateLeft(60);
      this.koch(level - 1, length / 3.0);
    }
  }

  triangle(length) {
    for (let i = 0; i < 3; i++) {
      this.forward(length);
      this.rotateRight(120);
    }
  }
  sierpinski(level, length) {
    if (level == 0) {
      this.triangle(length);
    }
    else {
      for (let i = 0; i < 3; i++) {
        this.sierpinski(level - 1, length / 2);
        this.forward(length);
        this.rotateRight(120);
      }
    }
  }

  executeCommand(command, ...params) {
    switch (command) {
      case "FD": {
        this.forward(params[0]);
        break;
      }
      case "BK": {
        this.backward(params[0]);
        break;
      }
      case "RT": {
        this.rotateRight(params[0]);
        break;
      }
      case "LT": {
        this.rotateLeft(params[0]);
        break;
      }
      case "PU": {
        this.putUp();
        break;
      }
      case "PD": {
        this.putDown();
        break;
      }
      case "SS": {
        this.strokeStyle(params[0]);
        break;
      }
      case "LW": {
        this.lineWidth(params[0]);
        break;
      }

      case "KOCH": {
        this.putUp();
        this.rotateLeft(90);
        this.forward(100);
        this.rotateRight(90);
        this.putDown();
        for (var i = 0; i < 3; i++) {
          this.koch(params[0], params[1]);
          this.rotateRight(120);
        }
        break;
      }

      case "SIERP": {
        this.sierpinski(params[0], params[1]);
        break;
      }
      case "REPEAT": {
        for (let i = 0; i < params[0]; i++) {
          let [subCommand, ...subParams] = params.slice(1);
          this.executeCommand(subCommand, ...subParams);
        }
        break;
      }
    }
  }

  rotate(angle) {
    this.angle = (this.angle - angle + 360) % 360;
  }

  move(value) {
    this.ctx.beginPath();
    this.ctx.moveTo(this.x, this.y);
    const newX = this.x + value * Math.cos((this.angle * Math.PI) / 180);
    const newY = this.y + value * Math.sin((this.angle * Math.PI) / 180);

    if (this.checkCoordinates(newX, newY)) {
      this.x = newX;
      this.y = newY;
      this.ctx.lineTo(this.x, this.y);
      if (!this.penUp) this.ctx.stroke();
    } else alert("koordynaty wyjdą poza canvas!");
  }
}


console.log(examplesCanvas);
const exampleTurtle = new Turtle(examplesCanvas);

/// kwadrat 
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function generateExamples() {


  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 100; j++) {
      exampleTurtle.forward(1);
      await sleep(1);
    }
    exampleTurtle.rotateRight(90);
  }

  // pięciokąt hehe 
  exampleTurtle.strokeStyle("red");
  exampleTurtle.putUp();
  exampleTurtle.forward(150);
  exampleTurtle.putDown();

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 100; j++) {
      exampleTurtle.forward(1);
      await sleep(1);
    }
    exampleTurtle.rotateRight(72);
  }
}
generateExamples();
