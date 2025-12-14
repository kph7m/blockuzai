'use client'

import { useEffect, useRef, useState } from 'react'

type GameState = 'playing' | 'paused' | 'gameOver' | 'cleared'

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState<GameState>('paused')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ゲーム変数
    let gameScore = 0
    let gameLives = 3
    let gameStarted = false

    // パドル
    const paddle = {
      width: 100,
      height: 15,
      x: canvas.width / 2 - 50,
      y: canvas.height - 30,
      speed: 8,
      dx: 0
    }

    // ボール
    const ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 8,
      speed: 4,
      dx: 4,
      dy: -4
    }

    // ブロック
    const brickInfo = {
      rows: 5,
      cols: 9,
      width: 80,
      height: 25,
      padding: 10,
      offsetX: 35,
      offsetY: 60
    }

    // ブロック配列を作成
    const bricks: { x: number; y: number; visible: boolean }[][] = []
    for (let row = 0; row < brickInfo.rows; row++) {
      bricks[row] = []
      for (let col = 0; col < brickInfo.cols; col++) {
        bricks[row][col] = {
          x: col * (brickInfo.width + brickInfo.padding) + brickInfo.offsetX,
          y: row * (brickInfo.height + brickInfo.padding) + brickInfo.offsetY,
          visible: true
        }
      }
    }

    // パドルを描画
    function drawPaddle() {
      if (!ctx) return
      ctx.fillStyle = '#fff'
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)
    }

    // ボールを描画
    function drawBall() {
      if (!ctx) return
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.closePath()
    }

    // ブロックを描画
    function drawBricks() {
      if (!ctx) return
      bricks.forEach((row, rowIndex) => {
        row.forEach(brick => {
          if (brick.visible) {
            ctx.fillStyle = `hsl(${rowIndex * 40}, 70%, 60%)`
            ctx.fillRect(brick.x, brick.y, brickInfo.width, brickInfo.height)
            ctx.strokeStyle = '#fff'
            ctx.strokeRect(brick.x, brick.y, brickInfo.width, brickInfo.height)
          }
        })
      })
    }

    // パドルを移動
    function movePaddle() {
      if (!canvas) return
      paddle.x += paddle.dx

      // 壁の衝突判定
      if (paddle.x < 0) {
        paddle.x = 0
      }
      if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width
      }
    }

    // ボールを移動
    function moveBall() {
      if (!canvas) return
      ball.x += ball.dx
      ball.y += ball.dy

      // 壁の衝突判定
      if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1
      }
      if (ball.y - ball.radius < 0) {
        ball.dy *= -1
      }

      // パドルとの衝突判定
      if (ball.y + ball.radius > paddle.y && 
          ball.x > paddle.x && 
          ball.x < paddle.x + paddle.width) {
        ball.dy *= -1
        ball.y = paddle.y - ball.radius
      }

      // 底に落ちた場合
      if (ball.y + ball.radius > canvas.height) {
        gameLives--
        setLives(gameLives)

        if (gameLives === 0) {
          gameStarted = false
          setGameState('gameOver')
        } else {
          // ボールをリセット
          ball.x = canvas.width / 2
          ball.y = canvas.height / 2
          ball.dx = 4
          ball.dy = -4
        }
      }
    }

    // ブロックとの衝突判定
    function checkBrickCollision() {
      bricks.forEach(row => {
        row.forEach(brick => {
          if (brick.visible) {
            if (ball.x + ball.radius > brick.x && 
                ball.x - ball.radius < brick.x + brickInfo.width && 
                ball.y + ball.radius > brick.y && 
                ball.y - ball.radius < brick.y + brickInfo.height) {
              ball.dy *= -1
              brick.visible = false
              gameScore += 10
              setScore(gameScore)

              // 全てのブロックが破壊されたか確認
              if (gameScore === brickInfo.rows * brickInfo.cols * 10) {
                gameStarted = false
                setGameState('cleared')
              }
            }
          }
        })
      })
    }

    // 描画
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      drawBricks()
      drawBall()
      drawPaddle()

      if (gameStarted) {
        movePaddle()
        moveBall()
        checkBrickCollision()
      }
    }

    // キーボード入力
    function keyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'Right') {
        paddle.dx = paddle.speed
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        paddle.dx = -paddle.speed
      } else if (e.key === ' ') {
        gameStarted = true
      }
    }

    function keyUp(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'Right' || 
          e.key === 'ArrowLeft' || e.key === 'Left') {
        paddle.dx = 0
      }
    }

    // イベントリスナー
    document.addEventListener('keydown', keyDown)
    document.addEventListener('keyup', keyUp)

    // ゲームループ
    let animationFrameId: number
    function gameLoop() {
      draw()
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    // クリーンアップ
    return () => {
      document.removeEventListener('keydown', keyDown)
      document.removeEventListener('keyup', keyUp)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const handleRestart = () => {
    setScore(0)
    setLives(3)
    setGameState('paused')
    window.location.reload()
  }

  return (
    <div className="container">
      <h1>🎮 ブロック崩し 🎮</h1>
      <canvas ref={canvasRef} id="gameCanvas" width="800" height="600"></canvas>
      <div className="info">
        <p>スコア: <span id="score">{score}</span> | ライフ: <span id="lives">{lives}</span></p>
      </div>
      <div className="controls">
        <p>← → キーでパドルを動かそう | スペースキーでスタート</p>
      </div>

      {/* Game Over Dialog */}
      {gameState === 'gameOver' && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>😢 ゲームオーバー</h2>
            <p className="final-score">最終スコア: {score}</p>
            <p className="message">もう一度挑戦しますか？</p>
            <div className="button-group">
              <button className="btn btn-primary" onClick={handleRestart}>
                🔄 もう一度プレイ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Cleared Dialog */}
      {gameState === 'cleared' && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>🎉 おめでとう！</h2>
            <p className="final-score">最終スコア: {score}</p>
            <p className="message">全てのブロックを破壊しました！</p>
            <div className="button-group">
              <button className="btn btn-primary" onClick={handleRestart}>
                🔄 もう一度プレイ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
