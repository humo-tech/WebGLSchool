import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.1/dist/tweakpane.min.js";

const PARAMS = {
  difference: 0.6,
  color: { r: 33, g: 33, b: 255 },
};

const pane = new Pane();
pane.addBinding(PARAMS, "difference", { min: 0, max: 0.7 });
pane.addBinding(PARAMS, "color");

const getPaneValue = (pane, key) => {
  return pane.exportState().children.find((p) => p.label === key).binding.value;
};

// webgl 使う環境の準備
const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

const params = new URLSearchParams(location.search);
const nopreview = params.has("nopreview");
const playsInlineByAttr = params.has("playsInlineByAttr");

// テクスチャ読み込む
const img0 = await loadImage("./images/mountains-190055_1280.jpg");
const tex0 = createTexture(gl, img0, gl.TEXTURE0);
const video = await loadVideo("./images/blue.mp4", {
  autoplay: true,
  muted: true,
  playsInline: playsInlineByAttr ? "playsInline" : true,
  controls: !nopreview,
  loop: true,
});
const tex1 = createTexture(gl, video, gl.TEXTURE1);
video.width = 320;

if (nopreview) {
  video.play();
} else {
  document.body.appendChild(video);
}

// 貼り付けるジオメトリを作る
// 板ポリの座標
const position = [
  [-1, 1, 0],
  [1, 1, 0],
  [-1, -1, 0],
  [1, -1, 0],
].flat();

// ポイントの並び順
const index = [
  [0, 1, 2],
  [1, 3, 2],
].flat();

// テクスチャの配置
const texCoord = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
].flat();

const vsSource = await loadShaderSource("./shaders/vertex.glsl");
const fsSource = await loadShaderSource("./shaders/fragment.glsl");
const fsChromaSource = await loadShaderSource("./shaders/chromaFragment.glsl");
const program0 = createProgram(
  gl,
  createShader(gl, vsSource, gl.VERTEX_SHADER),
  createShader(gl, fsSource, gl.FRAGMENT_SHADER)
);
const program1 = createProgram(
  gl,
  createShader(gl, vsSource, gl.VERTEX_SHADER),
  createShader(gl, fsChromaSource, gl.FRAGMENT_SHADER)
);

const attr0Position = gl.getAttribLocation(program0, "aPosition");
const attr0TexCoord = gl.getAttribLocation(program0, "aTexCoord");
const uniform0Texture = gl.getUniformLocation(program0, "uTexture");

const attr1Position = gl.getAttribLocation(program1, "aPosition");
const attr1TexCoord = gl.getAttribLocation(program1, "aTexCoord");
const uniform1Texture = gl.getUniformLocation(program1, "uTexture");
const uniform1ChromaKeyColor = gl.getUniformLocation(
  program1,
  "uChromaKeyColor"
);
const uniform1Difference = gl.getUniformLocation(program1, "uDifference");

const positionVBO = createVBO(gl, position);
const texCoordVBO = createVBO(gl, texCoord);
const ibo = createIBO(gl, index);

// ibo
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

// 背景用
gl.useProgram(program0);
// position
gl.bindBuffer(gl.ARRAY_BUFFER, positionVBO);
gl.enableVertexAttribArray(attr0Position);
gl.vertexAttribPointer(attr0Position, 3, gl.FLOAT, false, 0, 0);

// texuture coordinates
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordVBO);
gl.enableVertexAttribArray(attr0TexCoord);
gl.vertexAttribPointer(attr0TexCoord, 2, gl.FLOAT, false, 0, 0);

// 上乗せ用（クロマキー）
gl.useProgram(program1);
// position
gl.bindBuffer(gl.ARRAY_BUFFER, positionVBO);
gl.enableVertexAttribArray(attr1Position);
gl.vertexAttribPointer(attr1Position, 3, gl.FLOAT, false, 0, 0);

// texuture coordinates
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordVBO);
gl.enableVertexAttribArray(attr1TexCoord);
gl.vertexAttribPointer(attr1TexCoord, 2, gl.FLOAT, false, 0, 0);

const draw = () => {
  gl.disable(gl.BLEND);

  // 背景用
  gl.useProgram(program0);
  // テクスチャをバインド(背景)
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex0);
  gl.uniform1i(uniform0Texture, 0);

  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // 上乗せ用（クロマキー）
  gl.useProgram(program1);
  updateTexture(gl, tex1, video, gl.TEXTURE1);

  gl.uniform1i(uniform1Texture, 1);
  gl.uniform1f(uniform1Difference, getPaneValue(pane, "difference"));
  const chromaKeyColor = getPaneValue(pane, "color");
  gl.uniform3fv(uniform1ChromaKeyColor, [
    chromaKeyColor.r / 255,
    chromaKeyColor.g / 255,
    chromaKeyColor.b / 255,
  ]);
  //gl.uniform1f(uniform1Difference, 0.6);
  //gl.uniform3fv(uniform1ChromaKeyColor, [0.2, 0.2, 1.0]);

  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(draw);
};

draw();

document
  .querySelectorAll("input[type=radio][name=background]")
  .forEach((el) => {
    el.addEventListener("click", async (el) => {
      const img = await loadImage(el.target.value);
      updateTexture(gl, tex0, img, gl.TEXTURE0);
    });
  });
