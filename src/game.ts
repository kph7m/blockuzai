import type { Paddle, Ball, BrickInfo, Brick } from './types';

export class BlockuzaiGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private score: number = 0;
  private lives: number = 3;
  private gameStarted: boolean = false;
  private paddle: Paddle;
  private ball: Ball;
  private brickInfo: BrickInfo;
  private bricks: Brick[][] = [];

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2d context');
    }
    this.ctx = ctx;

    // Initialize paddle
    this.paddle = {
      width: 100,
      height: 15,
      x: this.canvas.width / 2 - 50,
      y: this.canvas.height - 30,
      speed: 8,
      dx: 0,
    };

    // Initialize ball
    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 8,
      speed: 4,
      dx: 4,
      dy: -4,
    };

    // Initialize brick info
    this.brickInfo = {
      rows: 5,
      cols: 9,
      width: 80,
      height: 25,
      padding: 10,
      offsetX: 35,
      offsetY: 60,
    };

    this.initBricks();
    this.setupEventListeners();
    this.startGameLoop();
  }

  private initBricks(): void {
    for (let row = 0; row < this.brickInfo.rows; row++) {
      this.bricks[row] = [];
      for (let col = 0; col < this.brickInfo.cols; col++) {
        this.bricks[row][col] = {
          x: col * (this.brickInfo.width + this.brickInfo.padding) + this.brickInfo.offsetX,
          y: row * (this.brickInfo.height + this.brickInfo.padding) + this.brickInfo.offsetY,
          visible: true,
        };
      }
    }
  }

  private drawPaddle(): void {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
  }

  private drawBall(): void {
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();
    this.ctx.closePath();
  }

  private drawBricks(): void {
    this.bricks.forEach((row, rowIndex) => {
      row.forEach((brick) => {
        if (brick.visible) {
          this.ctx.fillStyle = `hsl(${rowIndex * 40}, 70%, 60%)`;
          this.ctx.fillRect(brick.x, brick.y, this.brickInfo.width, this.brickInfo.height);
          this.ctx.strokeStyle = '#fff';
          this.ctx.strokeRect(brick.x, brick.y, this.brickInfo.width, this.brickInfo.height);
        }
      });
    });
  }

  private movePaddle(): void {
    this.paddle.x += this.paddle.dx;

    // Wall collision detection
    if (this.paddle.x < 0) {
      this.paddle.x = 0;
    }
    if (this.paddle.x + this.paddle.width > this.canvas.width) {
      this.paddle.x = this.canvas.width - this.paddle.width;
    }
  }

  private moveBall(): void {
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Wall collision detection
    if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
      this.ball.dx *= -1;
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.dy *= -1;
    }

    // Paddle collision detection
    if (
      this.ball.y + this.ball.radius > this.paddle.y &&
      this.ball.x > this.paddle.x &&
      this.ball.x < this.paddle.x + this.paddle.width
    ) {
      this.ball.dy *= -1;
      this.ball.y = this.paddle.y - this.ball.radius;
    }

    // Ball fell to the bottom
    if (this.ball.y + this.ball.radius > this.canvas.height) {
      this.lives--;
      this.updateLivesDisplay();

      if (this.lives === 0) {
        alert('ゲームオーバー！スコア: ' + this.score);
        document.location.reload();
      } else {
        // Reset ball
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = 4;
        this.ball.dy = -4;
      }
    }
  }

  private checkBrickCollision(): void {
    this.bricks.forEach((row) => {
      row.forEach((brick) => {
        if (brick.visible) {
          if (
            this.ball.x + this.ball.radius > brick.x &&
            this.ball.x - this.ball.radius < brick.x + this.brickInfo.width &&
            this.ball.y + this.ball.radius > brick.y &&
            this.ball.y - this.ball.radius < brick.y + this.brickInfo.height
          ) {
            this.ball.dy *= -1;
            brick.visible = false;
            this.score += 10;
            this.updateScoreDisplay();

            // Check if all bricks are destroyed
            if (this.score === this.brickInfo.rows * this.brickInfo.cols * 10) {
              alert('おめでとう！クリア！');
              document.location.reload();
            }
          }
        }
      });
    });
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBricks();
    this.drawBall();
    this.drawPaddle();

    if (this.gameStarted) {
      this.movePaddle();
      this.moveBall();
      this.checkBrickCollision();
    }
  }

  private updateScoreDisplay(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = this.score.toString();
    }
  }

  private updateLivesDisplay(): void {
    const livesElement = document.getElementById('lives');
    if (livesElement) {
      livesElement.textContent = this.lives.toString();
    }
  }

  private keyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
      this.paddle.dx = this.paddle.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
      this.paddle.dx = -this.paddle.speed;
    } else if (e.key === ' ') {
      this.gameStarted = true;
    }
  };

  private keyUp = (e: KeyboardEvent): void => {
    if (
      e.key === 'ArrowRight' ||
      e.key === 'Right' ||
      e.key === 'ArrowLeft' ||
      e.key === 'Left'
    ) {
      this.paddle.dx = 0;
    }
  };

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.keyDown);
    document.addEventListener('keyup', this.keyUp);
  }

  private gameLoop = (): void => {
    this.draw();
    requestAnimationFrame(this.gameLoop);
  };

  private startGameLoop(): void {
    this.gameLoop();
  }
}
