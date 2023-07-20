import { WebGLUtility } from './webgl.js';
import vsSource from './shaders/vs.glsl'
import fsSource from './shaders/fs.glsl'

export function useWebGL (canvasElement) {

    const canvas = canvasElement

    let position
    let positionStride = 3
    let positionVBO
    let color
    let colorStride = 4
    let colorVBO
    let gl
    let program
    let uniformLocation = {}
    let startTime
    let isRender = false
    let polygonVertexNumber = 8

    const init = (vertexNumber) => {
        polygonVertexNumber = vertexNumber

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
     * 正多角形の頂点を生成する関数
     * @param {Number} [vertexNumber=5] 頂点の数
     * @param {Number} [r=0.5] 半径
     */
    const createPolygonVertices = (vertexNumber = 5, r = 0.5) => {
      if(vertexNumber < 3) {
        throw new Error('not enough vertexNumber < 3')
      }
      
      const center = [0, 0, 0]

      const tmpVertices = []
      const vertices = []
      const unitAngle = (360 / vertexNumber) / 180 * Math.PI
      for(let i=0; i<vertexNumber; i++) {
        const angle = unitAngle * i + Math.PI / 2
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        tmpVertices.push([x, y, 0])
      }

      // index順に並べ直す（IBO使わない方法）
      for(let i=0; i<vertexNumber; i++) {
        const ii = i+1 < vertexNumber ? i + 1 : 0
        vertices.push(center)
        vertices.push(tmpVertices[i])
        vertices.push(tmpVertices[ii])
      }

      return vertices.flat()
    }

    /**
     * 
     * @param {Number} h  hue 0-360
     * @param {Number} s  saturation 0-255
     * @param {Number} v  value 0-255
     * @returns {Array<Number>} r, g, b 0-1
     */
    const hsv2rgb = (h, s, v) => {
      const max = v
      const min = max - ((s / 255) * max)
      let r, g, b
      if(h < 60) {
        r = max
        g = (h / 60) * (max - min) + min
        b = min
      } else if(h < 120) {
        r = ((120 - h) / 60) * (max - min) + min
        g = max
        b = min
      } else if(h < 180) {
        r = min
        g = max
        b = ((h - 120) / 60) * (max - min) + min
      } else if(h < 240) {
        r = min
        g = ((240 - h) / 60) * (max - min) + min
        b = max
      } else if(h < 300) {
        r = ((h - 240) / 60) * (max - min) + min
        g = min
        b = max
      } else {
        r = max
        g = min
        b = ((360 - h)/ 60) * (max - min) + min
      }

      return [r/255, g/255, b/255]
    }

    /**
     * 頂点属性（頂点ジオメトリ）のセットアップを行う
     */
    const setupGeometry = () => {
        // 頂点座標の定義
        position = createPolygonVertices(polygonVertexNumber)
        // VBO を生成
        positionVBO = WebGLUtility.createVBO(gl, position);

        // 色作成
        color = []
        const tmpColor = []
        for(let i=0; i<polygonVertexNumber; i++) {
          tmpColor.push(hsv2rgb(i/polygonVertexNumber * 360, 255, 255))
        }

        // index順に並べ直す（IBO使わない方法）
        for(let i=0; i<polygonVertexNumber; i++) {
          const ii = i+1 < polygonVertexNumber ? i + 1 : 0
          color.push([0, 0, 0, 1.0])
          color.push([...tmpColor[i], 1.0])
          color.push([...tmpColor[ii], 1.0])
        }
        // VBO を生成
        colorVBO = WebGLUtility.createVBO(gl, color.flat());
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

    const changeVertexNumber = (vertexNumber) => {
      polygonVertexNumber = vertexNumber
      setupGeometry()
      setupLocation()
    }

    return {
        gl,
        changeVertexNumber,
        init,
        start,
        stop,
    }

}