export interface Paddle {
  width: number
  height: number
  x: number
  y: number
  speed: number
  dx: number
}

export interface Ball {
  x: number
  y: number
  radius: number
  speed: number
  dx: number
  dy: number
}

export interface Brick {
  x: number
  y: number
  visible: boolean
}

export interface BrickInfo {
  rows: number
  cols: number
  width: number
  height: number
  padding: number
  offsetX: number
  offsetY: number
}

export interface GameState {
  score: number
  lives: number
  gameStarted: boolean
  paddle: Paddle
  ball: Ball
  bricks: Brick[][]
  brickInfo: BrickInfo
}
