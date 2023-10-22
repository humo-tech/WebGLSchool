precision mediump float;

uniform sampler2D uTexture; // テクスチャ番号  
uniform vec3 uChromaKeyColor; // クロマキーの色
uniform float uDifference;
varying vec2 vTexCoord; // テクスチャ座標

void main (void) {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    float diff = length(texColor.rgb - uChromaKeyColor);
    if(diff < uDifference) {
        discard;
    } else {
        gl_FragColor = texColor;
    }
}