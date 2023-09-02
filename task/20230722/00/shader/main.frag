precision mediump float;

varying vec4 vColor;
varying float vFragmentNormal;
varying vec3 vNormal;
varying mat4 vNormalMatrix;

// ライトベクトルはひとまず定数で定義する
const vec3 light = vec3(1.0, 1.0, 1.0);

void main() {
  vec4 color = vec4(1.0);
  if (vFragmentNormal == 0.0) {
    color = vColor;
  } else {
    // 法線をまず行列で変換する @@@
    vec3 n = (vNormalMatrix * vec4(vNormal, 0.0)).xyz;
    // 変換した法線とライトベクトルで内積を取る @@@
    float d = dot(normalize(n), normalize(light));
    color = vec4(vColor.rgb * d, vColor.a);
  }
  gl_FragColor = color;
}

