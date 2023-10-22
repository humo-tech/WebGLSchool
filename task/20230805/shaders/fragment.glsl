precision mediump float;

uniform sampler2D uTexture; // テクスチャ番号  
varying vec2 vTexCoord; // テクスチャ座標

void main (void) {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    gl_FragColor = texColor;
}