'use client'

import { useEffect, useRef, useState } from 'react'

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // レスポンシブなキャンバスサイズを設定
    function resizeCanvas() {
      if (!canvas) return
      const maxWidth = 800
      const maxHeight = 600
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      
      let canvasWidth = maxWidth
      let canvasHeight = maxHeight
      
      // スマホサイズの場合は画面に合わせる
      if (windowWidth < maxWidth + 40) {
        canvasWidth = windowWidth - 40
        canvasHeight = (canvasWidth / maxWidth) * maxHeight
      }
      
      // 高さも確認
      if (canvasHeight > windowHeight - 200) {
        canvasHeight = windowHeight - 200
        canvasWidth = (canvasHeight / maxHeight) * maxWidth
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

    // スケール係数（基準サイズ800x600に対する比率）
    const scaleX = canvas.width / 800
    const scaleY = canvas.height / 600

    // パドル
    const paddle = {
      width: 100 * scaleX,
      height: 15 * scaleY,
      x: canvas.width / 2 - (50 * scaleX),
      y: canvas.height - (30 * scaleY),
      speed: 8 * scaleX,
      dx: 0
    }

    // ボール
    const ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 8 * Math.min(scaleX, scaleY),
      speed: 4 * Math.min(scaleX, scaleY),
      dx: 4 * scaleX,
      dy: -4 * scaleY
    }

    // ブロック
    const brickInfo = {
      rows: 5,
      cols: 9,
      width: 72 * scaleX,
      height: 30 * scaleY,
      padding: 12 * scaleX,
      offsetX: 30 * scaleX,
      offsetY: 60 * scaleY
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
          alert('ゲームオーバー！スコア: ' + gameScore)
          window.location.reload()
        } else {
          // ボールをリセット
          ball.x = canvas.width / 2
          ball.y = canvas.height / 2
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
        setGameStarted(true)
      }
    }

    function keyUp(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'Right' || 
          e.key === 'ArrowLeft' || e.key === 'Left') {
        paddle.dx = 0
      }
    }

    // タッチ・マウス入力（モバイル対応）
    const DRAG_ZONE_THRESHOLD = 0.7 // 画面下部70%がドラッグゾーン
    let lastTouchX: number | null = null
    let isDragging = false

    // パドルの境界チェック（壁の衝突判定）
    function clampPaddlePosition() {
      if (!canvas) return
      if (paddle.x < 0) paddle.x = 0
      if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width
      }
    }

    // パドルを指定位置に移動（境界チェック付き）
    function movePaddleToPosition(canvasX: number) {
      if (!canvas) return
      paddle.x = canvasX - paddle.width / 2
      clampPaddlePosition()
    }

    // パドルを相対的に移動（ドラッグ用）
    function movePaddleByDelta(deltaX: number) {
      if (!canvas) return
      paddle.x += deltaX
      clampPaddlePosition()
    }

    // ドラッグモードに入るべきかを判定
    function shouldEnterDragMode(canvasX: number, clientY: number, rect: DOMRect): boolean {
      if (!canvas) return false
      const paddleCenterX = paddle.x + paddle.width / 2
      const distanceFromPaddle = Math.abs(canvasX - paddleCenterX)
      // パドル付近または画面下部の場合はドラッグモード
      return distanceFromPaddle < paddle.width || clientY > rect.top + canvas.height * DRAG_ZONE_THRESHOLD
    }

    function handleTouchStart(e: TouchEvent) {
      e.preventDefault()
      if (!canvas || e.touches.length === 0) return
      
      const touch = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      const touchCanvasX = touch.clientX - rect.left
      
      if (shouldEnterDragMode(touchCanvasX, touch.clientY, rect)) {
        isDragging = true
        lastTouchX = touch.clientX
      } else {
        // それ以外はタップで移動
        movePaddleToPosition(touchCanvasX)
        isDragging = false
      }
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (!canvas || e.touches.length === 0) return
      
      const touch = e.touches[0]
      
      if (isDragging && lastTouchX !== null) {
        // ドラッグモード: 指の移動量に応じてパドルを相対移動
        const deltaX = touch.clientX - lastTouchX
        movePaddleByDelta(deltaX)
        lastTouchX = touch.clientX
      } else {
        // 通常モード: タッチ位置に直接移動
        const rect = canvas.getBoundingClientRect()
        const touchCanvasX = touch.clientX - rect.left
        movePaddleToPosition(touchCanvasX)
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      e.preventDefault()
      lastTouchX = null
      isDragging = false
    }

    // マウス入力（デスクトップ対応）
    let isMouseDragging = false
    let lastMouseX: number | null = null

    function handleMouseDown(e: MouseEvent) {
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const mouseCanvasX = e.clientX - rect.left
      
      if (shouldEnterDragMode(mouseCanvasX, e.clientY, rect)) {
        isMouseDragging = true
        lastMouseX = e.clientX
      } else {
        // それ以外はクリックで移動
        movePaddleToPosition(mouseCanvasX)
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (!canvas || !isMouseDragging || lastMouseX === null) return
      
      // ドラッグ中: マウスの移動量に応じてパドルを相対移動
      const deltaX = e.clientX - lastMouseX
      movePaddleByDelta(deltaX)
      lastMouseX = e.clientX
    }

    function handleMouseUp(e: MouseEvent) {
      isMouseDragging = false
      lastMouseX = null
    }

    // イベントリスナー
    document.addEventListener('keydown', keyDown)
    document.addEventListener('keyup', keyUp)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    canvas.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

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
      document.removeEventListener('keydown', keyDown)
      document.removeEventListener('keyup', keyUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      canvas.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [gameStarted])

  const handleStartGame = () => {
    setGameStarted(true)
  }

  return (
    <div className="container" ref={containerRef}>
      <h1>🎮 ブロック崩し 🎮</h1>
      <canvas ref={canvasRef} id="gameCanvas"></canvas>
      <div className="info">
        <p>スコア: <span id="score">{score}</span> | ライフ: <span id="lives">{lives}</span></p>
      </div>
      {!gameStarted && (
        <button className="start-button" onClick={handleStartGame}>
          ゲームスタート
        </button>
      )}
      <div className="controls">
        <p>PC: ← → キーまたは画面クリック/ドラッグでパドル移動 | スペースでスタート</p>
        <p>スマホ: 画面をタップまたはスワイプ/ドラッグしてパドル移動 | ボタンでスタート</p>
        <p className="hint">💡 パドルを指でドラッグすると滑らかに操作できます</p>
      </div>
    </div>
  )
}
