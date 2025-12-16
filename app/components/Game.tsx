'use client'

import { useEffect, useRef, useState } from 'react'

// 背景画像のURLリスト（ランダムに1つ選択される）
const BACKGROUND_IMAGE_URLS = [
  'https://assets.st-note.com/production/uploads/images/45054196/rectangle_large_type_2_b981e737a35442958a00bacffee50a60.jpg?width=1280',
  'https://assets.st-note.com/production/uploads/images/44257653/picture_pc_8bd46374d608e955fe6bfaeb6f0696ca.jpg?width=1200',
  'https://assets.st-note.com/production/uploads/images/44257592/picture_pc_cc80e1193bfb0a4bc22a0a0e9288d044.jpg?width=1200'
]

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // useState with lazy initializer to ensure image selection happens only once
  const [selectedImageUrl] = useState(() => 
    BACKGROUND_IMAGE_URLS[Math.floor(Math.random() * BACKGROUND_IMAGE_URLS.length)]
  )
  
  // ゲームの状態管理（waiting: スタート待ち、playing: プレイ中）
  const [gameState, setGameState] = useState<'waiting' | 'playing'>('waiting')
  const gameStateRef = useRef<'waiting' | 'playing'>('waiting')

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

    // パドル（デフォルト幅を3倍に拡大）
    const paddleDefaultWidth = 300 * scaleX // デフォルト値（元の3倍）
    const paddleMinWidth = 50 * scaleX // 最小幅（デフォルトの1/6）
    const paddle = {
      width: paddleDefaultWidth,
      height: 15 * scaleY,
      x: canvas.width / 2 - (150 * scaleX), // 中央配置のためのオフセット調整
      y: canvas.height - (30 * scaleY),
      speed: 8 * scaleX,
      dx: 0
    }
    
    // パドル幅アニメーション用の変数
    let isPressing = false // タッチ/マウスダウン状態
    const shrinkDuration = 1500 // 縮小アニメーション時間（ミリ秒）
    const expandDuration = 500 // 拡大アニメーション時間（ミリ秒）
    let lastAnimationTime = performance.now() // 最後のアニメーション更新時刻
    let isAtMinimumWidth = false // パドルが最小幅かどうか

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
    
    // 貫通力の計算（パドル幅に応じて動的に変化）
    // 最大幅: 10, 最小幅: 100
    function getPenetrationPower(): number {
      // パドル幅の範囲を0-1に正規化
      const widthRange = paddleDefaultWidth - paddleMinWidth
      if (widthRange === 0) return 10 // 安全性チェック: 除算エラーを防ぐ
      const widthRatio = (paddle.width - paddleMinWidth) / widthRange
      // 逆比例: 幅が大きいほど貫通力が小さく、幅が小さいほど貫通力が大きい
      return Math.round(10 + (1 - widthRatio) * 90)
    }
    
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
    
    // 打ち出し時の貫通力を保持（打ち出し後は変わらない）
    let currentPenetrationPower = getPenetrationPower()
    
    // 前のゲーム状態を追跡（状態変化を検出するため）
    let previousGameState: 'waiting' | 'playing' = 'waiting'

    // パドルを描画
    function drawPaddle() {
      if (!ctx) return
      
      // 角丸の半径
      const borderRadius = 8 * scaleY
      
      // グラデーションを作成（ピンク系の可愛い色）
      const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height)
      
      // 最小幅の時はピカピカ光らせる（フラッシュエフェクト）
      if (isAtMinimumWidth) {
        const flashSpeed = 0.01 // フラッシュの速度
        const brightness = Math.abs(Math.sin(performance.now() * flashSpeed))
        const lightness = 0.5 + brightness * 0.5 // 0.5〜1.0の範囲で明るさを変化
        
        // より明るいピンク色でフラッシュ
        gradient.addColorStop(0, `hsl(330, 100%, ${lightness * 85}%)`)  // より明るいライトピンク
        gradient.addColorStop(1, `hsl(330, 100%, ${lightness * 65}%)`)  // より明るいホットピンク
        
        // 影も強くしてピカピカ感を出す
        ctx.shadowColor = `rgba(255, 105, 180, ${brightness})`
        ctx.shadowBlur = 20 * scaleY
      } else {
        gradient.addColorStop(0, '#FFB6D9')  // ライトピンク
        gradient.addColorStop(1, '#FF69B4')  // ホットピンク
        
        // 通常の影
        ctx.shadowColor = 'rgba(255, 105, 180, 0.5)'
        ctx.shadowBlur = 10 * scaleY
      }
      
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4 * scaleY
      
      // 角丸四角形を描画
      ctx.beginPath()
      ctx.moveTo(paddle.x + borderRadius, paddle.y)
      ctx.lineTo(paddle.x + paddle.width - borderRadius, paddle.y)
      ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + borderRadius)
      ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - borderRadius)
      ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - borderRadius, paddle.y + paddle.height)
      ctx.lineTo(paddle.x + borderRadius, paddle.y + paddle.height)
      ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - borderRadius)
      ctx.lineTo(paddle.x, paddle.y + borderRadius)
      ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + borderRadius, paddle.y)
      ctx.closePath()
      
      ctx.fillStyle = gradient
      ctx.fill()
      
      // 影をリセット
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
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
    
    // パドル幅を更新（タッチ/マウス状態に応じて縮小・拡大）
    function updatePaddleWidth() {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastAnimationTime
      lastAnimationTime = currentTime
      
      if (isPressing) {
        // 押している間は縮小（1.5秒で縮小）
        const shrinkRate = (paddleDefaultWidth - paddleMinWidth) / shrinkDuration * deltaTime
        if (paddle.width > paddleMinWidth) {
          const oldWidth = paddle.width
          paddle.width = Math.max(paddleMinWidth, paddle.width - shrinkRate)
          // 幅が変わった分、中心位置を維持するためにx座標を調整
          paddle.x += (oldWidth - paddle.width) / 2
          clampPaddlePosition()
          isAtMinimumWidth = false
        } else {
          isAtMinimumWidth = true
        }
      } else {
        // 離している間は拡大（0.5秒で拡大）
        const expandRate = (paddleDefaultWidth - paddleMinWidth) / expandDuration * deltaTime
        if (paddle.width < paddleDefaultWidth) {
          const oldWidth = paddle.width
          paddle.width = Math.min(paddleDefaultWidth, paddle.width + expandRate)
          // 幅が変わった分、中心位置を維持するためにx座標を調整
          paddle.x -= (paddle.width - oldWidth) / 2
          clampPaddlePosition()
        }
        isAtMinimumWidth = false
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
        destroyedBlocksCount = 0 // パドルに当たったらカウントをリセット
        currentPenetrationPower = getPenetrationPower() // パドルに当たった時の貫通力を記録
      }

      // 底に落ちた場合
      if (ball.y + ball.radius > canvas.height) {
        // ボールをリセット（パドルの上に配置）
        ball.x = paddle.x + paddle.width / 2
        ball.y = paddle.y - ball.radius
        ball.dx = 4 * scaleX
        ball.dy = -4 * scaleY
        // ゲームを待機状態に戻す
        gameStateRef.current = 'waiting'
        setGameState('waiting')
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

              // 貫通力の分だけブロックを破壊したら跳ね返る
              // ただし、下向きに移動している場合（ball.dy > 0）は跳ね返らず、上向きに移動している場合（ball.dy < 0）のみ跳ね返る
              if (destroyedBlocksCount >= currentPenetrationPower) {
                if (ball.dy < 0) {
                  ball.dy *= -1
                }
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

      // パドル幅を更新（常に実行）
      updatePaddleWidth()

      // プレイ中のみボールとパドルを動かす
      if (gameStateRef.current === 'playing') {
        // waiting -> playing に遷移した直後に貫通力を記録
        if (previousGameState === 'waiting') {
          currentPenetrationPower = getPenetrationPower()
          previousGameState = 'playing'
        }
        
        movePaddle()
        moveBall()
        checkBrickCollision()
      } else if (gameStateRef.current === 'waiting') {
        previousGameState = 'waiting'
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
      isPressing = true // タッチ開始時にパドル縮小を開始
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
      isPressing = false // タッチ終了時にパドル拡大を開始
    }

    // マウス入力（Web/デスクトップ用・ブラウザ全体で操作可能）
    function handleMouseMove(e: MouseEvent) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      // マウスのX座標を中心にパドルを配置
      paddle.x = mouseX - paddle.width / 2
      clampPaddlePosition()
    }
    
    function handleMouseDown(e: MouseEvent) {
      e.preventDefault() // デフォルトの動作を防止（テキスト選択など）
      isPressing = true // マウスダウン時にパドル縮小を開始
    }
    
    function handleMouseUp(e: MouseEvent) {
      e.preventDefault() // デフォルトの動作を防止
      isPressing = false // マウスアップ時にパドル拡大を開始
    }

    // イベントリスナー（ブラウザ全体でタッチ操作可能）
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // マウスイベントリスナー（ブラウザ全体でマウス操作可能）
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mousedown', handleMouseDown)
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
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [selectedImageUrl])

  // タップ/クリックでゲームを開始
  const handleStart = () => {
    if (gameStateRef.current === 'waiting') {
      gameStateRef.current = 'playing'
      setGameState('playing')
    }
  }

  return (
    <div className="container" ref={containerRef} onClick={handleStart} onTouchStart={handleStart}>
      <canvas ref={canvasRef} id="gameCanvas"></canvas>
    </div>
  )
}
