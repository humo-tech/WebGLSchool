import { WebGLUtility } from './webgl.js';
import vsSource from './shaders/vs.glsl'
import fsSource from './shaders/fs.glsl'

export function useWebGL (canvasElement) {

    const canvas = canvasElement

    let position
    let positionStride
    let positionVBO
    let color
    let colorStride
    let colorVBO
    let gl
    let program
    let uniformLocation = {}
    let startTime
    let isRender = false

    const init = () => {
        const size = Math.min(window.innerWidth, window.innerHeight);
        canvas.width  = size;
        canvas.height = size;

        gl = WebGLUtility.createWebGLContext(canvas)
        const vs = WebGLUtility.createShaderObject(gl, vsSource, gl.VERTEX_SHADER)
        const fs = WebGLUtility.createShaderObject(gl, fsSource, gl.FRAGMENT_SHADER)
        program = WebGLUtility.createProgramObject(gl, vs, fs);

        setupGeometry();
        // ロケーションのセットアップ
        setupLocation();
        // セットアップが完了したら描画を開始する
        start();

    }

    /**
     * 頂点属性（頂点ジオメトリ）のセットアップを行う
     */
    const setupGeometry = () => {
        // 頂点座標の定義
        position = [
           0.0,  0.5,  0.0, // ひとつ目の頂点の x, y, z 座標
           0.5, -0.5,  0.0, // ふたつ目の頂点の x, y, z 座標
          -0.5, -0.5,  0.0, // みっつ目の頂点の x, y, z 座標
        ];
        // 要素数は XYZ の３つ
        positionStride = 3;
        // VBO を生成
        positionVBO = WebGLUtility.createVBO(gl, position);

        // 頂点の色の定義
        color = [
          1.0, 0.0, 0.0, 1.0, // ひとつ目の頂点の r, g, b, a カラー
          0.0, 1.0, 0.0, 1.0, // ふたつ目の頂点の r, g, b, a カラー
          0.0, 0.0, 1.0, 1.0, // みっつ目の頂点の r, g, b, a カラー
        ];
        // 要素数は RGBA の４つ
        colorStride = 4;
        // VBO を生成
        colorVBO = WebGLUtility.createVBO(gl, color);
    }

    /**
     * 頂点属性のロケーションに関するセットアップを行う
     */
    const setupLocation = () => {
      // attribute location の取得
      const attPosition = gl.getAttribLocation(program, 'position');
      const attColor = gl.getAttribLocation(program, 'color');
      // attribute location の有効化
      WebGLUtility.enableAttribute(gl, positionVBO, attPosition, positionStride);
      WebGLUtility.enableAttribute(gl, colorVBO, attColor, colorStride);

      // uniform location の取得
      uniformLocation = {
        time: gl.getUniformLocation(program, 'time'),
      };
    }

    /**
     * レンダリングのためのセットアップを行う
     */
    const setupRendering = () => {
      // ビューポートを設定する
      gl.viewport(0, 0, canvas.width, canvas.height);
      // クリアする色を設定する（RGBA で 0.0 ～ 1.0 の範囲で指定する）
      gl.clearColor(0.3, 0.3, 0.3, 1.0);
      // 実際にクリアする（gl.COLOR_BUFFER_BIT で色をクリアしろ、という指定になる）
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    /**
     * 描画を開始する
     */
    const start = () => {
      // レンダリング開始時のタイムスタンプを取得しておく
      startTime = Date.now();
      // レンダリングを行っているフラグを立てておく
      isRender = true;
      // レンダリングの開始
      render();
    }

    /**
     * 描画を停止する
     */
    const stop = () => {
      isRender = false;
    }

    /**
     * レンダリングを行う
     */
    const render = () => {
      // レンダリングのフラグの状態を見て、requestAnimationFrame を呼ぶか決める
      if (isRender === true) {
        requestAnimationFrame(render);
      }
      // ビューポートの設定やクリア処理は毎フレーム呼び出す
      setupRendering();
      // 現在までの経過時間を計算し、秒単位に変換する
      const nowTime = (Date.now() - startTime) * 0.001;
      // プログラムオブジェクトを選択
      gl.useProgram(program);

      // ロケーションを指定して、uniform 変数の値を更新する（GPU に送る）
      gl.uniform1f(uniformLocation.time, nowTime);
      // ドローコール（描画命令）
      gl.drawArrays(gl.TRIANGLES, 0, position.length / positionStride);
    }

    return {
        gl,
        init,
        start,
        stop,
    }

}