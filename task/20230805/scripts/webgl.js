/**
 * テクスチャ用の画像を読み込む関数
 * @param {String} src
 * @returns {Promise<HTMLImageElement>}
 */
const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.addEventListener("load", () => {
      // 2の累乗にリサイズする
      const canvas = document.createElement("canvas");
      const size = 2 ** Math.round(Math.log2(Math.max(img.width, img.height)));
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas);
      //resolve(img);
    });
    img.src = src;
  });
};

/**
 * テクスチャ用の動画を読み込む関数
 * @param {String} src
 * @param {Object} options
 * @returns {Promise<HTMLVideoElement>}
 */
const loadVideo = (src, options) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        video[key] = value;
      });
    }
    video.addEventListener("canplay", () => {
      resolve(video);
    });
    video.src = src;
  });
};

/**
 * テクスチャを生成する関数
 * @param {WebGLRenderbuffer} gl
 * @param {HTMLImageElement|HTMLCanvasElement} resource
 * @param {Number} texUnit
 * @returns {WebGLTexture}
 */
const createTexture = (gl, resource, texUnit = gl.TEXTURE0) => {
  const texture = gl.createTexture();
  gl.activeTexture(texUnit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resource);

  // mipmap
  if (resource.nodeName !== "VIDEO") {
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // bind解除
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
};

/**
 * テクスチャを更新する関数
 * @param {WebGLRenderbuffer} gl
 * @param {HTMLCanvasElement|HTMLVideoElement} resource
 * @param {Number} texUnit
 */
const updateTexture = (gl, texture, resource, texUnit = gl.TEXTURE0) => {
  gl.activeTexture(texUnit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resource);
};

/**
 * VBOを生成する関数
 * @param {WebGLRenderbuffer} gl
 * @param {Array} vertexArray
 * @returns {WebGLBuffer}
 */
const createVBO = (gl, vertexArray) => {
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return vbo;
};

/**
 * IBOを生成する関数
 * @param {WebGLRenderbuffer} gl
 * @param {Array} indexArray
 * @returns {WebGLBuffer}
 */
const createIBO = (gl, indexArray) => {
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Int16Array(indexArray),
    gl.STATIC_DRAW
  );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return ibo;
};

/**
 * シェーダーオブジェクトを作成する関数
 * @param {WebGLRenderingContext} gl
 * @param {String} source
 * @param {String} type  gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
 * @returns {WebGLShader}
 */
const createShader = (gl, source, type) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  } else {
    throw new Error(gl.getShaderInfoLog(shader));
    return null;
  }
};

/**
 * プログラムオブジェクトを作成する関数
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @returns {WebGLProgram}
 */
const createProgram = (gl, vertexShader, fragmentShader) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.useProgram(program);
    return program;
  } else {
    throw new Error(gl.getProgramInfoLog(program));
    return null;
  }

  return program;
};

/**
 * シェーダーを読み込む関数
 * @param {String} shaderPath
 * @returns {String}
 */
const loadShaderSource = (shaderPath) => {
  return fetch(shaderPath).then((res) => res.text());
};
