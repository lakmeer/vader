// The MIT License
// Copyright © 2023 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Signed distance and gradient to a heart. Probably faster than
// central differences or automatic differentiation/dual numbers.

// List of other 2D distances+gradients:
//   https://iquilezles.org/articles/distgradfunctions2d
// and
//   https://www.shadertoy.com/playlist/M3dSRf

// .x = f(p)
// .y = ∂f(p)/∂x
// .z = ∂f(p)/∂y
// .yz = ∇f(p) with ‖∇f(p)‖ = 1
vec3 sdgHeart( in vec2 p )
{
    float sx = p.x<0.0?-1.0:1.0;

    p.x = abs(p.x);

    if( p.y+p.x>1.0 )
    {
        const float r = sqrt(2.0)/4.0;
        vec2 q0 = p - vec2(0.25,0.75);
        float l = length(q0);
        vec3 d = vec3(l-r,q0/l);
        d.y *= sx;
        return d;
    }
    else
    {
        vec2 q1 = p-vec2(0.0,1.0);        vec3 d1 = vec3(dot(q1,q1),q1);
        vec2 q2 = p-0.5*max(p.x+p.y,0.0); vec3 d2 = vec3(dot(q2,q2),q2);
        vec3 d = (d1.x<d2.x) ? d1 : d2;
        d.x = sqrt(d.x);
        d.yz /= d.x;
        d *= ((p.x>p.y)?1.0:-1.0);
        d.y *= sx;
        return d;
    }
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec2 m = (2.0*iMouse.xy-iResolution.xy)/iResolution.y;

    p.y += 0.5;
    m.y += 0.5;

    // sdf(p) and gradient(sdf(p))
    vec3  dg = sdgHeart(p);
    float d = dg.x;
    vec2 g = dg.yz;

    // central differenes based gradient, for comparison
    // g = vec2(dFdx(d),dFdy(d))/(2.0/iResolution.y);

	// coloring
    vec3 col = (d>0.0) ? vec3(0.9,0.6,0.3) : vec3(0.4,0.7,0.85);
    col *= 1.0 + vec3(0.5*g,0.0);
  //col = vec3(0.5+0.5*g,1.0);
    col *= 1.0 - 0.5*exp(-16.0*abs(d));
	col *= 0.9 + 0.1*cos(150.0*d);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(d)) );

    // interaction
    if( iMouse.z>0.001 )
    {
        d = sdgHeart(m).x;
        col = mix(col, vec3(1.0,1.0,0.0), 1.0-smoothstep(0.0, 0.005, abs(length(p-m)-abs(d))-0.0025));
        col = mix(col, vec3(1.0,1.0,0.0), 1.0-smoothstep(0.0, 0.005, length(p-m)-0.015));
    }

	fragColor = vec4(col,1.0);
}
