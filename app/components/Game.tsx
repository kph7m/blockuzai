'use client'

import { useEffect, useRef, useState } from 'react'

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // ゲーム開始フラグ（ローカル変数として管理）
    let gameActive = true

    // キャンバスの高さの割合（画面全体の70%）
    const CANVAS_HEIGHT_RATIO = 0.7

    // レスポンシブなキャンバスサイズを設定
    function resizeCanvas() {
      if (!canvas) return
      const maxWidth = 800
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      
      let canvasWidth = maxWidth
      // キャンバスの高さは画面全体の70%に設定
      let canvasHeight = windowHeight * CANVAS_HEIGHT_RATIO
      
      // スマホサイズの場合は画面に合わせる
      if (windowWidth < maxWidth + 40) {
        canvasWidth = windowWidth - 40
      }
      
      // 最小高さを確保
      if (canvasHeight < 400) {
        canvasHeight = 400
      }
      
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      
      return { width: canvasWidth, height: canvasHeight }
    }

    const canvasSize = resizeCanvas()
    if (!canvasSize) return

    // ゲーム変数
    let gameScore = 0
    let gameLives = 3

    // スケール係数（基準サイズ800に対する横幅の比率）
    // 縦方向は動的な高さに応じて要素を配置するため、横幅のスケールを使用
    const scaleX = canvas.width / 800
    const scaleY = scaleX // 縦横同じスケールを使用してアスペクト比を維持

    // パドル
    const paddle = {
      width: 100 * scaleX,
      height: 15 * scaleY,
      x: canvas.width / 2 - (50 * scaleX),
      y: canvas.height - (30 * scaleY),
      speed: 8 * scaleX,
      dx: 0
    }

    // ボール（パドルの上に配置）
    const ballRadius = 8 * Math.min(scaleX, scaleY)
    const ball = {
      x: paddle.x + paddle.width / 2,
      y: paddle.y - ballRadius,
      radius: ballRadius,
      speed: 4 * Math.min(scaleX, scaleY),
      dx: 4 * scaleX,
      dy: -4 * scaleY
    }

    // ブロックがCanvasの縦方向に占める割合
    const BLOCKS_FILL_RATIO = 0.7
    
    // ブロック
    const brickInfo = {
      cols: 30, // 列数を2倍にしてブロックサイズを維持したまま横幅100%を埋める
      padding: 0,
      offsetX: 0,
      offsetY: 0,
      get width() { return canvas.width / this.cols }, // 正方形にするために幅と高さを同じにする
      get height() { return canvas.width / this.cols }, // 横幅に合わせて正方形を維持
      // Canvasの縦70%を埋めるために必要な行数を計算
      get rows() { return Math.floor((canvas.height * BLOCKS_FILL_RATIO) / this.height) }
    }

    // 7色のカラーパレット
    const blockColors = [
      '#FF6B6B', // 赤
      '#4ECDC4', // シアン
      '#45B7D1', // 青
      '#FFA07A', // サーモン
      '#98D8C8', // ミント
      '#F7DC6F', // 黄色
      '#BB8FCE'  // 紫
    ]

    // ブロックを上から配置（中央揃えをせずに上から詰める）
    const offsetY = 0

    // ブロック配列を作成
    const bricks: { x: number; y: number; visible: boolean; color: string }[][] = []
    for (let row = 0; row < brickInfo.rows; row++) {
      bricks[row] = []
      for (let col = 0; col < brickInfo.cols; col++) {
        bricks[row][col] = {
          x: col * (brickInfo.width + brickInfo.padding) + brickInfo.offsetX,
          y: row * (brickInfo.height + brickInfo.padding) + offsetY,
          visible: true,
          color: blockColors[Math.floor(Math.random() * blockColors.length)]
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
      bricks.forEach((row) => {
        row.forEach(brick => {
          if (brick.visible) {
            ctx.fillStyle = brick.color
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
          alert('ゲームオーバー！スコア: ' + gameScore)
          window.location.reload()
        } else {
          // ボールをリセット（パドルの上に配置）
          ball.x = paddle.x + paddle.width / 2
          ball.y = paddle.y - ball.radius
          ball.dx = 4 * scaleX
          ball.dy = -4 * scaleY
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
                alert('おめでとう！クリア！')
                window.location.reload()
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

      if (gameActive) {
        movePaddle()
        moveBall()
        checkBrickCollision()
      }
    }

    // タッチ入力（スマホ専用・ブラウザ全体で操作可能）
    let lastTouchX: number | null = null

    // パドルの境界チェック（壁の衝突判定）
    function clampPaddlePosition() {
      if (!canvas) return
      if (paddle.x < 0) paddle.x = 0
      if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width
      }
    }

    // パドルを相対的に移動（ドラッグ用）
    function movePaddleByDelta(deltaX: number) {
      if (!canvas) return
      paddle.x += deltaX
      clampPaddlePosition()
    }

    function handleTouchStart(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 0) return
      const touch = e.touches[0]
      lastTouchX = touch.clientX
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 0 || lastTouchX === null) return
      
      const touch = e.touches[0]
      // 指の移動量に応じてパドルを相対移動
      const deltaX = touch.clientX - lastTouchX
      movePaddleByDelta(deltaX)
      lastTouchX = touch.clientX
    }

    function handleTouchEnd(e: TouchEvent) {
      e.preventDefault()
      lastTouchX = null
    }

    // イベントリスナー（ブラウザ全体でタッチ操作可能）
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    // ゲームループ
    let animationFrameId: number
    function gameLoop() {
      draw()
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    // リサイズイベント
    window.addEventListener('resize', resizeCanvas)

    // クリーンアップ
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="container" ref={containerRef}>
      <canvas ref={canvasRef} id="gameCanvas"></canvas>
      <div className="info">
        <p>スコア: <span id="score">{score}</span> | ライフ: <span id="lives">{lives}</span></p>
      </div>
    </div>
  )
}
