const canvas = document.querySelector(".canvas");
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
    canvas_pen.innerHTML = "rysowanie jest wyłączone";
  }
  putDown() {
    this.penUp = false;
    canvas_pen.innerHTML = "rysowanie jest włączone";
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

  sierpinski(level, lenght) {
    const half = parseInt(lenght / 2);
    console.log(half);
    if (level == 0) {
      for (let i = 0; i < 3; i++) {
        this.forward(lenght);
        this.rotateLeft(120);
      }
    }
    else {
        this.sierpinski(level-1, half);
        this.forward(half);
        this.sierpinski(level-1, half);
        this.forward(half);
        this.rotateLeft(120);
        this.forward(half);
        this.rotateLeft(120);
        this.forward(half);
        this.rotateLeft(120);
        this.sierpinski(level-1, half);
        this.rotateRight(120);
        this.forward(half);
        this.rotateLeft(120);
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
    angleText.textContent = `kąt: ${this.angle}`;
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
      positionText.textContent = `X: ${this.x}, Y: ${this.y}`;
      if (!this.penUp) this.ctx.stroke();
    } else alert("koordynaty wyjdą poza canvas!");
  }
}

const turtle = new Turtle(canvas);
btn.addEventListener("click", () => {
  turtle.parseInput(input.value);
  const el = document.createElement("li");
  el.textContent = input.value;
  lastCommands.appendChild(el);
  input.value = "";
});

