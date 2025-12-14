import type { GameState, Brick } from './types'

export function createInitialGameState(
  canvasWidth: number,
  canvasHeight: number
): GameState {
  const brickInfo = {
    rows: 5,
    cols: 9,
    width: 80,
    height: 25,
    padding: 10,
    offsetX: 35,
    offsetY: 60,
  }

  // Create bricks array
  const bricks: Brick[][] = []
  for (let row = 0; row < brickInfo.rows; row++) {
    bricks[row] = []
    for (let col = 0; col < brickInfo.cols; col++) {
      bricks[row][col] = {
        x: col * (brickInfo.width + brickInfo.padding) + brickInfo.offsetX,
        y: row * (brickInfo.height + brickInfo.padding) + brickInfo.offsetY,
        visible: true,
      }
    }
  }

  return {
    score: 0,
    lives: 3,
    gameStarted: false,
    paddle: {
      width: 100,
      height: 15,
      x: canvasWidth / 2 - 50,
      y: canvasHeight - 30,
      speed: 8,
      dx: 0,
    },
    ball: {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      radius: 8,
      speed: 4,
      dx: 4,
      dy: -4,
    },
    bricks,
    brickInfo,
  }
}

export function drawPaddle(
  ctx: CanvasRenderingContext2D,
  paddle: GameState['paddle']
): void {
  ctx.fillStyle = '#fff'
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: GameState['ball']
): void {
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.closePath()
}

export function drawBricks(
  ctx: CanvasRenderingContext2D,
  bricks: GameState['bricks'],
  brickInfo: GameState['brickInfo']
): void {
  bricks.forEach((row, rowIndex) => {
    row.forEach((brick) => {
      if (brick.visible) {
        ctx.fillStyle = `hsl(${rowIndex * 40}, 70%, 60%)`
        ctx.fillRect(brick.x, brick.y, brickInfo.width, brickInfo.height)
        ctx.strokeStyle = '#fff'
        ctx.strokeRect(brick.x, brick.y, brickInfo.width, brickInfo.height)
      }
    })
  })
}

export function movePaddle(
  paddle: GameState['paddle'],
  canvasWidth: number
): void {
  paddle.x += paddle.dx

  // Wall collision detection
  if (paddle.x < 0) {
    paddle.x = 0
  }
  if (paddle.x + paddle.width > canvasWidth) {
    paddle.x = canvasWidth - paddle.width
  }
}

export function moveBall(
  ball: GameState['ball'],
  paddle: GameState['paddle'],
  canvasWidth: number,
  canvasHeight: number,
  onLifeLost: () => void
): void {
  ball.x += ball.dx
  ball.y += ball.dy

  // Wall collision detection
  if (ball.x + ball.radius > canvasWidth || ball.x - ball.radius < 0) {
    ball.dx *= -1
  }
  if (ball.y - ball.radius < 0) {
    ball.dy *= -1
  }

  // Paddle collision detection
  if (
    ball.y + ball.radius > paddle.y &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    ball.dy *= -1
    ball.y = paddle.y - ball.radius
  }

  // Ball fell to bottom
  if (ball.y + ball.radius > canvasHeight) {
    onLifeLost()
  }
}

export function resetBall(
  ball: GameState['ball'],
  canvasWidth: number,
  canvasHeight: number
): void {
  ball.x = canvasWidth / 2
  ball.y = canvasHeight / 2
  ball.dx = 4
  ball.dy = -4
}

export function checkBrickCollision(
  ball: GameState['ball'],
  bricks: GameState['bricks'],
  brickInfo: GameState['brickInfo'],
  onScoreUpdate: (newScore: number) => void,
  currentScore: number
): number {
  let score = currentScore

  bricks.forEach((row) => {
    row.forEach((brick) => {
      if (brick.visible) {
        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brickInfo.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brickInfo.height
        ) {
          ball.dy *= -1
          brick.visible = false
          score += 10
          onScoreUpdate(score)
        }
      }
    })
  })

  return score
}

export function isGameCleared(
  brickInfo: GameState['brickInfo'],
  score: number
): boolean {
  return score === brickInfo.rows * brickInfo.cols * 10
}
