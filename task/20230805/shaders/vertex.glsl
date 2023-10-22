attribute vec4 aPosition; // 頂点
attribute vec2 aTexCoord; // テクスチャ座標
varying vec2 vTexCoord;

void main(void) {
    vTexCoord = aTexCoord;
    gl_Position = aPosition;
}