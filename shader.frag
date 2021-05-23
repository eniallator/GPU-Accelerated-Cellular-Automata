uniform highp int time;
uniform lowp vec2 dimensions;

// From: http://www.ozone3d.net/blogs/lab/20110427/glsl-random-generator/
float rand(in vec2 n)
{
  return 0.5 + 0.5 * fract(sin(dot(n.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 getPixel(in sampler2D prevState, in vec2 textureCoords, in vec2 offset) {
    return Texel(prevState, textureCoords + (offset / dimensions));
}

vec4 trySwap(in sampler2D prevState, in vec2 textureCoords, in vec2 offset, in float chance) {
    if (rand(textureCoords + vec2(time) + offset / dimensions) <= chance) {
        return getPixel(prevState, textureCoords, offset);
    }
    return Texel(prevState, textureCoords);
}

vec4 effect(in vec4 inColour, in sampler2D prevState, in vec2 textureCoords, in vec2 screenCoords) {
    if (textureCoords.y <= 0.01) return vec4(max(textureCoords.x, 0.1), textureCoords.y, 1, 1);
    highp float chanceToSwap = 0.97;
    highp float rng = rand(textureCoords + vec2(time));
    if (
        rng <= chanceToSwap
        && Texel(prevState, textureCoords).x > 0
        && getPixel(prevState, textureCoords, vec2(0, 1)).x == 0
        ) {
        return vec4(0, 0, 0, 1);
    }
    return trySwap(prevState, textureCoords, vec2(0, -1), chanceToSwap);
}
