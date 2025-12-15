'use client'

import { useEffect, useRef, useState } from 'react'

// 背景画像のURLリスト（ランダムに1つ選択される）
const BACKGROUND_IMAGE_URLS = [
  'https://assets.st-note.com/production/uploads/images/45054196/rectangle_large_type_2_b981e737a35442958a00bacffee50a60.jpg?width=1280',
  'https://assets.st-note.com/production/uploads/images/44257653/picture_pc_8bd46374d608e955fe6bfaeb6f0696ca.jpg?width=1200',
  'https://assets.st-note.com/production/uploads/images/44257592/picture_pc_cc80e1193bfb0a4bc22a0a0e9288d044.jpg?width=1200'
]

// モバイルデバイスかどうかを判定する関数
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  // User Agentでモバイルデバイスを判定（最優先）
  // モバイルデバイスのUser Agentが検出された場合は即座にtrueを返す
  const userAgent = navigator.userAgent || navigator.vendor || ''
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  
  if (mobileRegex.test(userAgent.toLowerCase())) {
    return true
  }
  
  // User Agentでモバイルと判定できない場合、
  // タッチデバイスかつ画面幅が768px以下の場合をモバイルと判定
  // （タブレットや小型タッチスクリーンデバイスに対応）
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth <= 768
  
  return isTouchDevice && isSmallScreen
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const gameStartedRef = useRef(false)
  
  // useState with lazy initializer to ensure image selection happens only once
  const [selectedImageUrl] = useState(() => 
    BACKGROUND_IMAGE_URLS[Math.floor(Math.random() * BACKGROUND_IMAGE_URLS.length)]
  )

  // モバイルデバイスチェック
  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 背景画像を読み込む
    const backgroundImage = new Image()
    let imageLoaded = false
    backgroundImage.onload = () => {
      imageLoaded = true
    }
    backgroundImage.onerror = () => {
      console.error('Failed to load background image')
    }
    // イベントハンドラを設定した後にsrcを設定（レースコンディションを防ぐ）
    backgroundImage.src = selectedImageUrl

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
    
    // ボールが跳ね返るまでに必要な破壊ブロック数
    const BLOCKS_TO_DESTROY_BEFORE_BOUNCE = 50
    
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

    // 残りのブロック数を追跡（パフォーマンス向上のため）
    let remainingBricks = brickInfo.rows * brickInfo.cols
    
    // 跳ね返るまでに必要な破壊ブロック数
    let destroyedBlocksCount = 0

    // パドルを描画
    function drawPaddle() {
      if (!ctx) return
      ctx.fillStyle = '#000'
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)
    }

    // ボールを描画
    function drawBall() {
      if (!ctx) return
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#000'
      ctx.fill()
      ctx.closePath()
    }

    // 背景画像を描画
    function drawBackgroundImage() {
      if (!ctx || !canvas || !imageLoaded) return
      
      // 画像の寸法が有効かチェック（naturalWidthを使用）
      if (!backgroundImage.naturalWidth || !backgroundImage.naturalHeight) return
      
      // 画像をキャンバスの上部に配置（幅はキャンバスいっぱいに）
      const imageAspectRatio = backgroundImage.naturalWidth / backgroundImage.naturalHeight
      const drawWidth = canvas.width
      const drawHeight = drawWidth / imageAspectRatio
      
      // キャンバスの一番上から描画
      ctx.drawImage(backgroundImage, 0, 0, drawWidth, drawHeight)
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
        // ボールをリセット（パドルの上に配置）
        ball.x = paddle.x + paddle.width / 2
        ball.y = paddle.y - ball.radius
        ball.dx = 4 * scaleX
        ball.dy = -4 * scaleY
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
              brick.visible = false
              remainingBricks--
              destroyedBlocksCount++

              // 30個破壊したら跳ね返る
              if (destroyedBlocksCount >= BLOCKS_TO_DESTROY_BEFORE_BOUNCE) {
                ball.dy *= -1
                destroyedBlocksCount = 0
              }

              // 全てのブロックが破壊されたか確認
              if (remainingBricks === 0) {
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

      drawBackgroundImage()
      drawBricks()
      drawBall()
      drawPaddle()

      if (gameStartedRef.current) {
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

  // モバイルデバイスチェック中はローディング表示
  if (isMobile === null) {
    return (
      <div className="container" ref={containerRef}>
        <div className="mobile-only-message">
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  // モバイルデバイス以外はメッセージを表示
  if (!isMobile) {
    return (
      <div className="container" ref={containerRef}>
        <div className="mobile-only-message">
          <h1>📱 スマートフォン専用ゲームです</h1>
          <p>このゲームはスマートフォンでのみプレイできます。</p>
          <p>スマートフォンからアクセスしてください。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" ref={containerRef}>
      <canvas ref={canvasRef} id="gameCanvas"></canvas>
      {!gameStarted && (
        <button 
          className="start-button"
          onClick={() => {
            setGameStarted(true)
            gameStartedRef.current = true
          }}
        >
          Start
        </button>
      )}
    </div>
  )
}
