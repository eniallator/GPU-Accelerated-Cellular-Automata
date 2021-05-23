uniform highp int time;
uniform lowp vec2 dimensions;

// From: http://www.ozone3d.net/blogs/lab/20110427/glsl-random-generator/
float rand(vec2 n)
{
  return 0.5 + 0.5 * fract(sin(dot(n.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 getPixel(sampler2D prevState, vec2 textureCoords, vec2 coords) {
    return Texel(prevState, textureCoords + (coords / dimensions));
}

vec4 effect(in vec4 inColour, in sampler2D prevState, in vec2 textureCoords, in vec2 screenCoords) {
    // if (textureCoords.y < 0.05) return vec4(textureCoords.x, textureCoords.y, 1, 1);
    if (rand(textureCoords + vec2(time)) <= 0.7) {
        if (textureCoords.y > 0) {
            return vec4(getPixel(prevState, textureCoords, vec2(0, -1)).x > 0);
        }
    }
    return vec4(0);
}
