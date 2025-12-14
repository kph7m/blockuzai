import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/types'
import {
  createInitialGameState,
  drawPaddle,
  drawBall,
  drawBricks,
  movePaddle,
  moveBall,
  checkBrickCollision,
  resetBall,
  isGameCleared,
} from '../game/engine'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState>(
    createInitialGameState(CANVAS_WIDTH, CANVAS_HEIGHT)
  )
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Keyboard input handlers
    function keyDown(e: KeyboardEvent) {
      const state = gameStateRef.current
      if (e.key === 'ArrowRight' || e.key === 'Right') {
        state.paddle.dx = state.paddle.speed
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        state.paddle.dx = -state.paddle.speed
      } else if (e.key === ' ') {
        state.gameStarted = true
      }
    }

    function keyUp(e: KeyboardEvent) {
      const state = gameStateRef.current
      if (
        e.key === 'ArrowRight' ||
        e.key === 'Right' ||
        e.key === 'ArrowLeft' ||
        e.key === 'Left'
      ) {
        state.paddle.dx = 0
      }
    }

    // Game loop
    function draw() {
      if (!ctx) return
      const state = gameStateRef.current
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      drawBricks(ctx, state.bricks, state.brickInfo)
      drawBall(ctx, state.ball)
      drawPaddle(ctx, state.paddle)

      if (state.gameStarted) {
        movePaddle(state.paddle, CANVAS_WIDTH)

        moveBall(
          state.ball,
          state.paddle,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
          () => {
            // onLifeLost
            state.lives--
            setLives(state.lives)

            if (state.lives === 0) {
              alert('ゲームオーバー！スコア: ' + state.score)
              window.location.reload()
            } else {
              resetBall(state.ball, CANVAS_WIDTH, CANVAS_HEIGHT)
            }
          }
        )

        const newScore = checkBrickCollision(
          state.ball,
          state.bricks,
          state.brickInfo,
          (score) => {
            state.score = score
            setScore(score)
          },
          state.score
        )

        state.score = newScore

        // Check if game is cleared
        if (isGameCleared(state.brickInfo, state.score)) {
          alert('おめでとう！クリア！')
          window.location.reload()
        }
      }
    }

    // Add event listeners
    document.addEventListener('keydown', keyDown)
    document.addEventListener('keyup', keyUp)

    // Start game loop
    let animationFrameId: number
    function gameLoop() {
      draw()
      animationFrameId = requestAnimationFrame(gameLoop)
    }
    gameLoop()

    // Cleanup
    return () => {
      document.removeEventListener('keydown', keyDown)
      document.removeEventListener('keyup', keyUp)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="container">
      <h1>🎮 ブロック崩し 🎮</h1>
      <canvas
        ref={canvasRef}
        id="gameCanvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
      <div className="info">
        <p>
          スコア: <span id="score">{score}</span> | ライフ:{' '}
          <span id="lives">{lives}</span>
        </p>
      </div>
      <div className="controls">
        <p>← → キーでパドルを動かそう | スペースキーでスタート</p>
      </div>
    </div>
  )
}
