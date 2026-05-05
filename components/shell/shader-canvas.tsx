"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { cn } from "@/lib/cn";

/**
 * WebGL aurora shader. Adapted from 21st.dev "Animated Shader Background"
 * (https://21st.dev/) and tuned for a dashboard context — slower drift,
 * lower amplitude, theme-aware tint via `--shader-*` tokens.
 *
 * Renders as a fixed full-bleed canvas behind the rest of the shell. Pauses
 * on `prefers-reduced-motion: reduce` and on tab visibility change.
 */
export function ShaderCanvas({
  className,
  intensity = 0.55,
}: {
  className?: string;
  intensity?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const readTokens = () => {
      const styles = getComputedStyle(document.documentElement);
      const parse = (key: string, fallback: [number, number, number]) => {
        const raw = styles.getPropertyValue(key).trim();
        const [h, s, l] = raw
          ? raw.split(/\s+/).map((v) => parseFloat(v))
          : fallback;
        return new THREE.Vector3(h ?? fallback[0], s ?? fallback[1], l ?? fallback[2]);
      };
      return {
        a: parse("--shader-a", [235, 90, 60]),
        b: parse("--shader-b", [285, 80, 55]),
        c: parse("--shader-c", [195, 90, 50]),
      };
    };

    const tokens = readTokens();

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new THREE.Vector2(container.clientWidth, container.clientHeight),
        },
        uIntensity: { value: intensity },
        uColorA: { value: tokens.a },
        uColorB: { value: tokens.b },
        uColorC: { value: tokens.c },
      },
      vertexShader: /* glsl */ `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float iTime;
        uniform vec2 iResolution;
        uniform float uIntensity;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;

        // Cheap HSL -> RGB.
        vec3 hsl2rgb(vec3 c) {
          float h = c.x / 360.0;
          float s = c.y / 100.0;
          float l = c.z / 100.0;
          float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
          float p = 2.0 * l - q;
          vec3 t = vec3(h + 1.0/3.0, h, h - 1.0/3.0);
          t = fract(t);
          vec3 rgb;
          for (int i = 0; i < 3; i++) {
            float v;
            float ti = t[i];
            if (ti < 1.0/6.0) v = p + (q - p) * 6.0 * ti;
            else if (ti < 0.5) v = q;
            else if (ti < 2.0/3.0) v = p + (q - p) * (2.0/3.0 - ti) * 6.0;
            else v = p;
            rgb[i] = v;
          }
          return rgb;
        }

        float rand(vec2 n) {
          return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 u = fract(p);
          u = u * u * (3.0 - 2.0 * u);
          float res = mix(
            mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
            mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
            u.y
          );
          return res * res;
        }

        float fbm(vec2 x) {
          float v = 0.0;
          float a = 0.35;
          vec2 shift = vec2(100.0);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < 3; i++) {
            v += a * noise(x);
            x = rot * x * 2.0 + shift;
            a *= 0.45;
          }
          return v;
        }

        void main() {
          // Slow time so the aurora drifts gently for a dashboard.
          float t = iTime * 0.18;

          vec2 p = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.y *
                   mat2(5.0, -3.0, 3.0, 5.0);

          float f = 1.6 + fbm(p + vec2(t * 1.5, 0.0)) * 0.4;
          vec4 acc = vec4(0.0);

          for (float i = 0.0; i < 22.0; i++) {
            vec2 v = p + cos(i * i + (t + p.x * 0.06) * 0.02 +
                              i * vec2(13.0, 11.0)) * 3.0;
            float tail = fbm(v + vec2(t * 0.25, i)) * 0.25 *
                         (1.0 - (i / 22.0));

            float waveA = 0.5 + 0.5 * sin(i * 0.20 + t * 0.40);
            float waveB = 0.5 + 0.5 * cos(i * 0.30 + t * 0.50);
            float waveC = 0.5 + 0.5 * sin(i * 0.40 + t * 0.30);

            vec3 baseRgb = hsl2rgb(uColorA) * waveA +
                           hsl2rgb(uColorB) * waveB +
                           hsl2rgb(uColorC) * waveC;
            // Normalise so the colour stays bounded.
            baseRgb /= max(waveA + waveB + waveC, 0.001);

            float g = exp(sin(i * i + t * 0.7));
            float dist = length(max(v, vec2(v.x * f * 0.012, v.y * 1.4)));
            vec4 contrib = vec4(baseRgb, 1.0) * g / max(dist, 0.001);

            float thinness = smoothstep(0.0, 1.0, i / 22.0) * 0.55;
            acc += contrib * (1.0 + tail * 0.6) * thinness;
          }

          // Tone-mapping + intensity multiplier. Result is premultiplied alpha
          // so the canvas blends nicely over the underlying gradient body.
          vec4 col = tanh(pow(acc / 80.0, vec4(1.6))) * 1.1;
          col.rgb *= uIntensity;
          col.a = clamp(max(max(col.r, col.g), col.b) * 1.4, 0.0, 1.0);
          gl_FragColor = col;
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let frameId = 0;
    let last = performance.now();
    let running = true;

    const render = (now: number) => {
      if (!running) return;
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      material.uniforms.iTime.value += delta;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame((now) => {
      last = now;
      render(now);
    });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      material.uniforms.iResolution.value.set(w, h);
    };
    window.addEventListener("resize", handleResize);

    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameId);
      } else if (!running) {
        running = true;
        last = performance.now();
        frameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // React to theme switch — palette tokens change, sample again.
    const observer = new MutationObserver(() => {
      const next = readTokens();
      material.uniforms.uColorA.value.copy(next.a);
      material.uniforms.uColorB.value.copy(next.b);
      material.uniforms.uColorC.value.copy(next.c);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    />
  );
}
