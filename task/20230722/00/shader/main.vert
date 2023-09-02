
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
uniform mat4 mvpMatrix;
uniform mat4 normalMatrix; // 法線変換行列 @@@
uniform float fragmentNormal; // fragmentシェーダで法線つけるかどうか
varying vec4 vColor;
varying vec3 vNormal;
varying mat4 vNormalMatrix;

// ライトベクトルはひとまず定数で定義する
const vec3 light = vec3(1.0, 1.0, 1.0);

void main() {

  // 内積の結果を頂点カラーの RGB 成分に乗算する
#ifdef FRAGMENT_SHADOW
  vColor = color;
  vNormal = normal;
  vNormalMatrix = normalMatrix;
#else
  // 法線をまず行列で変換する @@@
  vec3 n = (normalMatrix * vec4(normal, 0.0)).xyz;
  // 変換した法線とライトベクトルで内積を取る @@@
  float d = dot(normalize(n), normalize(light));
  vColor = vec4(color.rgb * d, color.a);
#endif

  // MVP 行列と頂点座標を乗算してから出力する
  gl_Position = mvpMatrix * vec4(position, 1.0);
}

