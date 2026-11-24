/* Base fotorrealista: texturas procedurais, galpão industrial, luz de galpão, seleção de peças e rótulos (three.js r128)
   Render leve por padrão (ACES nativo). O pipeline HDR opcional (SSAO + bloom + FXAA) só liga com ?post=1. */
const W = (() => {
  const T = THREE;
  const LOW = /[?&]q=low/.test(location.search);
  const NOPOST = LOW || !/[?&]post=1/.test(location.search);
  const TS = LOW ? 256 : 512;
  let ANISO = 8;

  /* ---------- ruído ---------- */
  function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
  function vnoise(size, cells, rand) {
    const g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = rand();
    const out = new Float32Array(size * size), k = cells / size;
    for (let y = 0; y < size; y++) {
      const fy = y * k, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), y1 = (y0 + 1) % cells;
      for (let x = 0; x < size; x++) {
        const fx = x * k, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), x1 = (x0 + 1) % cells;
        const a = g[y0 * cells + x0], b = g[y0 * cells + x1], c = g[y1 * cells + x0], d = g[y1 * cells + x1];
        out[y * size + x] = a + (b - a) * sx + (c - a + (a - b + d - c) * sx) * sy;
      }
    }
    return out;
  }
  function fbm(size, base, oct, seed) {
    const r = rng(seed), out = new Float32Array(size * size); let amp = 1, tot = 0;
    for (let o = 0; o < oct; o++) { const n = vnoise(size, base << o, r); for (let i = 0; i < out.length; i++) out[i] += n[i] * amp; tot += amp; amp *= 0.5; }
    for (let i = 0; i < out.length; i++) out[i] /= tot; return out;
  }
  function canvas(size, fn) { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); fn(g, size); return c; }
  function fromPixels(size, px) { return canvas(size, (g) => { const im = g.createImageData(size, size); for (let i = 0; i < size * size; i++) { const p = px(i); im.data[i * 4] = p[0]; im.data[i * 4 + 1] = p[1]; im.data[i * 4 + 2] = p[2]; im.data[i * 4 + 3] = p[3] ?? 255; } g.putImageData(im, 0, 0); }); }
  function normalFrom(h, size, str) {
    return fromPixels(size, (i) => {
      const x = i % size, y = (i / size) | 0;
      const l = h[y * size + (x - 1 + size) % size], r = h[y * size + (x + 1) % size], u = h[((y - 1 + size) % size) * size + x], d = h[((y + 1) % size) * size + x];
      let nx = (l - r) * str, ny = (u - d) * str, nz = 1; const m = Math.hypot(nx, ny, nz); nx /= m; ny /= m; nz /= m;
      return [(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, (nz * 0.5 + 0.5) * 255];
    });
  }
  const texCache = new WeakMap();
  function tex(c, repeat, srgb = true) {
    const key = (repeat ? repeat.join('x') : '1x1') + srgb; let m = texCache.get(c); if (!m) texCache.set(c, m = {}); if (m[key]) return m[key];
    const t = m[key] = new T.CanvasTexture(c); if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = ANISO;
    t.wrapS = t.wrapT = T.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); return t;
  }
  const hexRGB = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const cache = {};
  const once = (k, f) => cache[k] || (cache[k] = f());

  /* ---------- conjuntos de textura ---------- */
  function concreteSet(tint = 0x8d8f8f, seed = 7) {
    return once('conc' + tint + seed, () => {
      const s = TS * 2 > 1024 ? 1024 : TS * 2, big = fbm(s, 3, 4, seed), fine = fbm(s, 64, 2, seed + 3), stain = fbm(s, 6, 3, seed + 9);
      const [r, g, b] = hexRGB(tint);
      const col = fromPixels(s, (i) => {
        let v = 0.78 + big[i] * 0.32 + (fine[i] - 0.5) * 0.22; const st = Math.max(0, stain[i] - 0.6) * 2.2; v *= 1 - st * 0.35;
        return [r * v, g * v, b * v * 0.98];
      });
      const g2 = col.getContext('2d'); const R = rng(seed + 21);
      g2.strokeStyle = 'rgba(20,20,20,.35)'; g2.lineWidth = 2; g2.strokeRect(0, 0, s, s);
      for (let k = 0; k < 4; k++) { g2.strokeStyle = 'rgba(30,30,30,.25)'; g2.lineWidth = 1; g2.beginPath(); let x = R() * s, y = R() * s; g2.moveTo(x, y); for (let j = 0; j < 14; j++) { x += (R() - 0.5) * 40; y += (R() - 0.3) * 30; g2.lineTo(x, y); } g2.stroke(); }
      for (let k = 0; k < 3; k++) { const x = R() * s, y = R() * s, rr = 30 + R() * 80; const gr = g2.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(25,22,18,.18)'); gr.addColorStop(1, 'rgba(25,22,18,0)'); g2.fillStyle = gr; g2.beginPath(); g2.arc(x, y, rr, 0, 7); g2.fill(); }
      const rough = fromPixels(s, (i) => { const v = 200 + (fine[i] - 0.5) * 60 - Math.max(0, stain[i] - 0.58) * 300; return [v, v, v]; });
      const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) h[i] = fine[i] * 0.6 + big[i] * 0.4;
      return { map: col, rough, normal: normalFrom(h, s, 3) };
    });
  }
  function paintSet(color, wear = 0.5, seed = 3) {
    return once('paint' + color + wear + seed, () => {
      const s = TS, n = fbm(s, 4, 5, seed), chip = fbm(s, 16, 3, seed + 5), grime = fbm(s, 2, 3, seed + 8);
      const [r, g, b] = hexRGB(color);
      const th = 1 - wear * 0.32;
      const col = fromPixels(s, (i) => {
        const y = ((i / s) | 0) / s; const v = 0.9 + n[i] * 0.16; const dirt = Math.pow(y, 3) * 0.35 * wear + grime[i] * 0.1;
        if (chip[i] > th + 0.12) return [72, 64, 58];
        if (chip[i] > th + 0.08) return [118, 84, 58];
        return [r * v * (1 - dirt), g * v * (1 - dirt), b * v * (1 - dirt * 1.1)];
      });
      const rough = fromPixels(s, (i) => { const v = chip[i] > th + 0.08 ? 235 : 120 + n[i] * 70; return [v, v, v]; });
      const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) h[i] = chip[i] > th + 0.08 ? 0 : 0.6 + n[i] * 0.05;
      return { map: col, rough, normal: normalFrom(h, s, 2.2) };
    });
  }
  function brushedSet(tint = 0xb8bcc0, seed = 11) {
    return once('br' + tint + seed, () => {
      const s = TS, R = rng(seed); const [r, g, b] = hexRGB(tint); const n = fbm(s, 4, 3, seed);
      const rows = new Float32Array(s); for (let y = 0; y < s; y++) rows[y] = R();
      const col = fromPixels(s, (i) => { const y = (i / s) | 0; const v = 0.86 + rows[y] * 0.1 + n[i] * 0.08; return [r * v, g * v, b * v]; });
      const rough = fromPixels(s, (i) => { const y = (i / s) | 0; const v = 70 + rows[y] * 60 + n[i] * 50; return [v, v, v]; });
      return { map: col, rough };
    });
  }
  function claddingSet(seed = 13) {
    return once('clad' + seed, () => {
      const s = TS, n = fbm(s, 6, 4, seed), d = fbm(s, 3, 3, seed + 2);
      const col = fromPixels(s, (i) => { const x = i % s, y = (i / s) | 0; const seam = (x % (s / 2) < 4) ? 0.7 : 1; const band = (y % (s / 8) < 2) ? 0.88 : 1; const v = (0.78 + n[i] * 0.18 - d[i] * 0.1) * seam * band; return [196 * v, 200 * v, 204 * v]; });
      const rough = fromPixels(s, (i) => { const v = 90 + n[i] * 80 + d[i] * 40; return [v, v, v]; });
      const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) { const x = i % s; h[i] = (x % (s / 2) < 4) ? 0.2 : 0.6; }
      return { map: col, rough, normal: normalFrom(h, s, 2) };
    });
  }
  function corrugatedSet(color = 0x9aa3a8, seed = 17) {
    return once('corr' + color + seed, () => {
      const s = TS, n = fbm(s, 3, 4, seed), streak = fbm(s, 24, 2, seed + 1); const [r, g, b] = hexRGB(color);
      const col = fromPixels(s, (i) => { const x = i % s, y = (i / s) | 0; const rib = 0.95 + 0.05 * Math.sin(x / s * Math.PI * 12); const run = Math.max(0, streak[(i % s) + 0] - 0.55) * (y / s) * 0.8; const v = (0.8 + n[i] * 0.25) * rib * (1 - run); return [r * v, g * v, b * v]; });
      const rough = fromPixels(s, (i) => { const v = 130 + n[i] * 80; return [v, v, v]; });
      const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) h[i] = 0.5 + 0.5 * Math.sin((i % s) / s * Math.PI * 12);
      return { map: col, rough, normal: normalFrom(h, s, 5) };
    });
  }
  function rubberSet(seed = 19) {
    return once('rub' + seed, () => { const s = TS, n = fbm(s, 32, 3, seed), w = fbm(s, 4, 3, seed + 3); const col = fromPixels(s, (i) => { const v = 30 + n[i] * 16 + w[i] * 10; return [v, v * 0.98, v * 0.96]; }); const rough = fromPixels(s, (i) => { const v = 200 + n[i] * 40; return [v, v, v]; }); return { map: col, rough }; });
  }
  function bauxiteSet(seed = 23) {
    return once('bx' + seed, () => { const s = TS, n = fbm(s, 24, 4, seed), b = fbm(s, 4, 3, seed + 1); const col = fromPixels(s, (i) => { const v = 0.6 + n[i] * 0.5 + b[i] * 0.2; return [128 * v, 62 * v, 38 * v]; }); const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) h[i] = n[i]; return { map: col, normal: normalFrom(h, s, 6) }; });
  }
  function gridAlpha(cells = 16) {
    return once('grid' + cells, () => canvas(256, (g, s) => { g.fillStyle = '#000'; g.fillRect(0, 0, s, s); g.strokeStyle = '#fff'; g.lineWidth = 3; const st = s / cells; for (let i = 0; i <= cells; i++) { g.beginPath(); g.moveTo(i * st, 0); g.lineTo(i * st + s / 2, s); g.stroke(); g.beginPath(); g.moveTo(i * st, 0); g.lineTo(i * st - s / 2, s); g.stroke(); } }));
  }

  /* ---------- materiais ---------- */
  const envI = { v: 0.55 };
  function std(o) { const { envI: intensity, coat, ...options } = o; const m = coat ? new T.MeshPhysicalMaterial(Object.assign(options, { clearcoat: coat, clearcoatRoughness: 0.32 })) : new T.MeshStandardMaterial(options); m.envMapIntensity = intensity ?? envI.v; return m; }
  const MAT = {
    concrete: (rep = [8, 8], tint, seed) => { const s = concreteSet(tint, seed); return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), normalMap: tex(s.normal, rep, false), normalScale: new T.Vector2(0.6, 0.6), roughness: 1, metalness: 0 }); },
    paint: (color, o = {}) => { const s = paintSet(color, o.wear ?? 0.5, o.seed ?? 3); const rep = o.rep || [1, 1]; return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), normalMap: tex(s.normal, rep, false), normalScale: new T.Vector2(0.5, 0.5), roughness: o.rough ?? 0.9, metalness: o.metal ?? 0.25, side: o.side ?? T.FrontSide, coat: o.coat || 0 }); },
    steel: (o = {}) => { const s = brushedSet(o.tint ?? 0xb8bcc0, o.seed ?? 11); const rep = o.rep || [1, 1]; return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), roughness: o.rough ?? 1, metalness: o.metal ?? 0.9, envI: 0.9 }); },
    galv: (o = {}) => { const s = paintSet(0xa9adb0, 0.15, 31); const rep = o.rep || [1, 1]; return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), roughness: 0.8, metalness: 0.75, envI: 0.8 }); },
    clad: (rep = [1, 1]) => { const s = claddingSet(); return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), normalMap: tex(s.normal, rep, false), roughness: 1, metalness: 0.85, envI: 0.9 }); },
    corr: (color, rep = [6, 1]) => { const s = corrugatedSet(color); return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), normalMap: tex(s.normal, rep, false), normalScale: new T.Vector2(1, 1), roughness: 1, metalness: 0.45 }); },
    rubber: (rep = [1, 1]) => { const s = rubberSet(); const m = std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), roughness: 1, metalness: 0 }); return m; },
    bauxite: (rep = [1, 1]) => { const s = bauxiteSet(); return std({ map: tex(s.map, rep), normalMap: tex(s.normal, rep, false), roughness: 0.95, metalness: 0 }); },
    flat: (color, o = {}) => std({ color, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0.1, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.opacity, opacity: o.opacity ?? 1, side: o.side ?? T.FrontSide, depthWrite: o.depthWrite ?? true }),
    water: (rep = [30, 15]) => { const s = TS, h = fbm(s, 8, 5, 77), h2 = fbm(s, 24, 3, 79); const f = new Float32Array(s * s); for (let i = 0; i < f.length; i++) f[i] = h[i] * 0.7 + h2[i] * 0.3;
      const m = std({ color: 0x24444f, normalMap: tex(normalFrom(f, s, 9), rep, false), normalScale: new T.Vector2(0.55, 0.55), roughness: 0.14, metalness: 0.05, envI: 0.9 }); return m; },
    guard: (color = 0xd8a21c) => { const a = tex(gridAlpha(14), [3, 3], false); const s = paintSet(color, 0.35, 41); return std({ map: tex(s.map, [1, 1]), alphaMap: a, alphaTest: 0.5, transparent: false, side: T.DoubleSide, roughness: 0.7, metalness: 0.3 }); },
  };

  ['concrete', 'paint', 'steel', 'galv', 'clad', 'corr', 'rubber', 'bauxite'].forEach(k => { const f = MAT[k], c = new Map(); MAT[k] = (...a) => { const key = JSON.stringify(a); if (!c.has(key)) c.set(key, f(...a)); return c.get(key); }; });

  /* ---------- geometria ---------- */
  function mesh(geo, mat, o = {}) { const m = new T.Mesh(geo, mat); m.castShadow = o.cast ?? true; m.receiveShadow = o.recv ?? true; return m; }
  const rbox = (w, h, d, mat, r = 0.03, o) => mesh(new T.RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), mat, o);
  const box = (w, h, d, mat, o) => mesh(new T.BoxGeometry(w, h, d), mat, o);
  const cyl = (r1, r2, h, mat, seg = 32, o, open) => mesh(new T.CylinderGeometry(r1, r2, h, seg, 1, !!open), mat, o);
  const cylX = (r, len, mat, seg = 32, o) => { const m = cyl(r, r, len, mat, seg, o); m.rotation.z = Math.PI / 2; return m; };
  const cylZ = (r, len, mat, seg = 32, o) => { const m = cyl(r, r, len, mat, seg, o); m.rotation.x = Math.PI / 2; return m; };
  const sphere = (r, mat, o, ws = 24, hs = 16) => mesh(new T.SphereGeometry(r, ws, hs), mat, o);
  const torus = (R, r, mat, arc = Math.PI * 2, o) => mesh(new T.TorusGeometry(R, r, 14, 48, arc), mat, o);
  const at = (obj, x, y, z) => { obj.position.set(x, y, z); return obj; };
  /* funde as malhas estáticas de um grupo por material: mais detalhe com poucas chamadas de desenho.
     Subgrupos com userData.dyn (partes que se movem) e malhas com userData.keep ficam intactos. */
  function bake(root) {
    root.updateMatrixWorld(true); const inv = new T.Matrix4().copy(root.matrixWorld).invert(), rel = new T.Matrix4(), nm = new T.Matrix3(), B = new Map(), rm = [];
    root.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.keep || !o.geometry.attributes.position) return;
      for (let p = o.parent; p && p !== root; p = p.parent) if (p.userData.dyn) return;
      const key = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '') + (o.userData.through ? 't' : '');
      let b = B.get(key); if (!b) B.set(key, b = { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, through: o.userData.through, P: [], N: [], U: [], I: [], n: 0 });
      const g = o.geometry, pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv; rel.multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(rel);
      const v = new T.Vector3(); for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(rel); b.P.push(v.x, v.y, v.z); if (nor) { v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); b.N.push(v.x, v.y, v.z); } else b.N.push(0, 1, 0); if (uv) b.U.push(uv.getX(i), uv.getY(i)); else b.U.push(0, 0); }
      if (g.index) for (let i = 0; i < g.index.count; i++) b.I.push(g.index.getX(i) + b.n); else for (let i = 0; i < pos.count; i++) b.I.push(i + b.n);
      b.n += pos.count; rm.push(o);
    });
    rm.forEach(o => { o.parent.remove(o); o.geometry.dispose(); });
    B.forEach(b => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(b.P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(b.N, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(b.U, 2)); g.setIndex(b.n > 65535 ? new T.Uint32BufferAttribute(b.I, 1) : new T.Uint16BufferAttribute(b.I, 1)); const m = new T.Mesh(g, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; if (b.through) m.userData.through = true; root.add(m); });
    return root;
  }
  /* anel de parafusos sextavados (eixo = 'x' | 'y' | 'z'), já fundido em uma malha */
  function bolts(n, ringR, mat, axis = 'z', o = {}) {
    const g = new T.Group(), hr = o.r ?? 0.022, h = o.h ?? 0.03, off = o.off ?? 0;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + (o.phase ?? 0.3); const m = new T.Mesh(new T.CylinderGeometry(hr, hr, h, 6), mat); m.castShadow = true; m.position.set(Math.cos(a) * ringR, off, Math.sin(a) * ringR); g.add(m); if (o.stud) { const st = new T.Mesh(new T.CylinderGeometry(hr * 0.45, hr * 0.45, o.stud, 6), mat); st.position.set(m.position.x, off + (o.stud + h) / 2 * (off < 0 ? -1 : 1), m.position.z); g.add(st); } }
    if (axis === 'x') g.rotation.z = Math.PI / 2; if (axis === 'z') g.rotation.x = Math.PI / 2;
    return bake(g);
  }
  function ibeam(len, h, w, mat, axis = 'y') {
    const g = new T.Group(); const t = Math.max(0.03, h * 0.08);
    g.add(at(box(w, t, len, mat), 0, h / 2 - t / 2, 0)); g.add(at(box(w, t, len, mat), 0, -h / 2 + t / 2, 0)); g.add(box(t * 0.8, h - 2 * t, len, mat));
    if (axis === 'y') g.rotation.x = Math.PI / 2; if (axis === 'x') g.rotation.y = Math.PI / 2; return g;
  }
  function textPlate(lines, o = {}) {
    const w = o.w || 512, h = o.h || 160;
    const c = canvas(1, () => { }); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = o.bg || '#1b1f24'; g.fillRect(0, 0, w, h);
    if (o.border !== false) { g.strokeStyle = o.fg || '#f2f2f2'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); }
    g.fillStyle = o.fg || '#f2f2f2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const L = Array.isArray(lines) ? lines : [lines]; const fs = o.size || Math.min(72, h / (L.length + 0.6));
    L.forEach((t, i) => { g.font = `${i === 0 ? 700 : 500} ${i === 0 ? fs : fs * 0.62}px "IBM Plex Mono", "DejaVu Sans Mono", monospace`; g.fillText(t, w / 2, h / 2 + (i - (L.length - 1) / 2) * fs * 0.95); });
    if (o.fade) { g.fillStyle = 'rgba(200,190,170,' + o.fade + ')'; for (let i = 0; i < 400; i++) g.fillRect(Math.random() * w, Math.random() * h, 4, 3); }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = ANISO;
    return std({ map: t, roughness: 0.5, metalness: 0.1 });
  }
  function plate(lines, pw, ph, o = {}) { const h = o.h || 160, w = o.w || Math.min(1024, Math.max(128, Math.round(h * pw / ph))); return mesh(new T.PlaneGeometry(pw, ph), textPlate(lines, Object.assign({}, o, { w, h })), { cast: false }); }
  function padlock(color = 0xd9531e, tag = true) {
    const g = new T.Group();
    g.add(rbox(0.11, 0.1, 0.05, MAT.flat(color, { rough: 0.35, metal: 0.2 }), 0.012));
    const sh = torus(0.034, 0.008, MAT.steel(), Math.PI); sh.position.y = 0.05; g.add(sh);
    if (tag) { const t = mesh(new T.PlaneGeometry(0.075, 0.13), textPlate(['PERIGO', 'NÃO OPERE'], { bg: '#b3261e', fg: '#ffffff', w: 192, h: 330, size: 46 }), { cast: true }); t.position.set(0.07, -0.08, 0.03); t.rotation.z = -0.12; g.add(t); }
    return g;
  }
  /* ---------- trabalhador ---------- */
  function lathe(pts, mat, seg = 18, o) { return mesh(new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r, y)), seg), mat, o); }
  function capsule(r1, r2, len, mat, seg = 16) { // de y=0 até y=-len
    const P = []; const n = 6;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * Math.PI / 2; P.push([Math.max(0.0001, r1 * Math.cos(a)), -len + r1 + r1 * Math.sin(a)]); }
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; P.push([Math.max(0.0001, r2 * Math.cos(a)), -r2 + r2 * Math.sin(a)]); }
    return lathe(P, mat, seg);
  }
  function person(o = {}) {
    const g = new T.Group(); g.name = 'pessoa';
    const n = o.seed ?? PEOPLE.length, rr = rng(n * 53 + 17), pick = (a) => a[Math.floor(rr() * a.length)];
    const sc = o.suit ?? 0x2b3a55;
    const skinHex = o.skin ?? pick([0x8d5f43, 0xc08a63, 0x6b4630, 0xd8a77f, 0xa8714f]), hairHex = o.hair ?? pick([0x1d140f, 0x2b1d14, 0x3a2a1c, 0x101010, 0x4a3a2a]);
    const beardOn = o.beard ?? rr() < 0.4, stache = o.mustache ?? (beardOn || rr() < 0.25), muffOn = o.earmuff ?? rr() < 0.5;
    const bh = o.height ?? (0.97 + rr() * 0.08), bw = o.build ?? (0.96 + rr() * 0.1);
    const suit = MAT.paint(sc, { wear: 0.18, seed: 51, metal: 0, rough: 1, rep: [2, 2] });
    const L = (h) => new T.Color(h).convertSRGBToLinear().getHex();
    const skin = MAT.flat(L(skinHex), { rough: 0.6, metal: 0 }); skin.envMapIntensity = 0.25;
    const skinD = MAT.flat(new T.Color(L(skinHex)).multiplyScalar(0.7).getHex(), { rough: 0.7, metal: 0 });
    const refl = MAT.flat(0xc9ccce, { emissive: 0x9a9a9a, ei: 0.22, rough: 0.35, metal: 0.4 });
    const boot = MAT.flat(L(0x2a2018), { rough: 0.55, metal: 0 }), sole = MAT.flat(L(0x111111), { rough: 0.9 }); boot.envMapIntensity = 0.3;
    const bootCap = MAT.flat(L(0x4a3c2e), { rough: 0.35, metal: 0.1 }), lace = MAT.flat(L(0x1b1b1b), { rough: 0.8 }), padM = MAT.flat(L(0x3a3a3c), { rough: 0.9 });
    const glove = MAT.flat(L(o.glove ?? 0x8a6a3a), { rough: 0.9, metal: 0 }); glove.envMapIntensity = 0.25;
    const gloveD = MAT.flat(new T.Color(L(o.glove ?? 0x8a6a3a)).multiplyScalar(0.55).getHex(), { rough: 0.85, metal: 0 });
    const helmM = MAT.flat(L(o.helmet ?? 0xf0efe9), { rough: 0.3, metal: 0 });
    const belt = MAT.flat(0x1c1d1f, { rough: 0.6, metal: 0.2 });
    const seam = MAT.flat(new T.Color(sc).multiplyScalar(0.45).getHex(), { rough: 1, metal: 0 });
    const dark = MAT.flat(0x15161a, { rough: 0.6, metal: 0.3 }), white = MAT.flat(L(0xeceae4), { rough: 0.3 }), lipM = MAT.flat(L(0x7a4036), { rough: 0.5 }), hairM = MAT.flat(L(hairHex), { rough: 0.9 });
    const band = (r, y, parent, sz = 1, h = 0.03) => { const b = cyl(r, r, h, refl, 28, { cast: false }); b.position.y = y; b.scale.z = sz; parent.add(b); };
    // pernas
    const legs = [];
    [-1, 1].forEach(s => {
      const hip = new T.Group(); hip.position.set(s * 0.095, 0, 0); hip.userData.dyn = true;
      hip.add(lathe([[0.001, 0.08], [0.058, 0.085], [0.062, 0.16], [0.066, 0.26], [0.07, 0.36], [0.068, 0.46], [0.073, 0.52], [0.082, 0.62], [0.09, 0.74], [0.096, 0.86], [0.092, 0.93], [0.06, 0.97], [0.001, 0.98]], suit, 28));
      band(0.068, 0.27, hip); band(0.07, 0.35, hip);
      hip.add(at(rbox(0.1, 0.11, 0.03, suit, 0.015), 0, 0.5, 0.072));                                  // joelheira costurada
      hip.add(at(box(0.1, 0.006, 0.032, seam), 0, 0.557, 0.073)); hip.add(at(box(0.1, 0.006, 0.032, seam), 0, 0.443, 0.073));
      hip.add(at(rbox(0.03, 0.14, 0.11, suit, 0.012), s * 0.089, 0.72, 0.012));                         // bolso lateral
      hip.add(at(box(0.034, 0.008, 0.112, seam), s * 0.09, 0.79, 0.012));
      { const c = torus(0.07, 0.008, seam, Math.PI * 2, { cast: false }); c.rotation.x = Math.PI / 2; c.position.y = 0.5; hip.add(c); }       // vinco do joelho
      { const c = torus(0.078, 0.014, suit, Math.PI * 2, { cast: false }); c.rotation.x = Math.PI / 2; c.position.y = 0.2; hip.add(c); }        // calça caindo sobre a bota
      hip.add(at(cyl(0.062, 0.067, 0.12, boot, 24), 0, 0.11, 0));
      { const c = torus(0.066, 0.013, padM, Math.PI * 2, { cast: false }); c.rotation.x = Math.PI / 2; c.position.y = 0.168; hip.add(c); }      // gáspea acolchoada do cano
      hip.add(at(rbox(0.11, 0.085, 0.27, boot, 0.04), 0, 0.055, 0.045));
      hip.add(at(rbox(0.108, 0.055, 0.095, bootCap, 0.024), 0, 0.05, 0.145));                            // bico de aço
      hip.add(at(rbox(0.05, 0.075, 0.02, boot, 0.008), 0, 0.14, 0.066));                                 // lingueta
      [0.095, 0.118, 0.141].forEach((y, i) => { const lc = box(0.075, 0.007, 0.012, lace, { cast: false }); lc.position.set(0, y, 0.071 + i * 0.002); lc.rotation.z = (i % 2 ? 1 : -1) * 0.18; hip.add(lc); });  // cadarço cruzado
      hip.add(at(rbox(0.1, 0.03, 0.05, boot, 0.012), 0, 0.105, 0.02));
      hip.add(at(rbox(0.118, 0.03, 0.285, sole, 0.01), 0, 0.014, 0.045));
      hip.add(at(rbox(0.105, 0.03, 0.05, sole, 0.01), 0, 0.03, -0.075));                                 // salto
      hip.rotation.y = s * 0.1; hip.rotation.z = s * 0.012;
      g.add(hip); legs.push(hip);
    });
    // quadril e tronco
    const pel = lathe([[0.001, 0.86], [0.12, 0.865], [0.165, 0.9], [0.178, 0.98], [0.172, 1.04]], suit, 32); pel.scale.z = 0.7; g.add(pel);
    const bl = cyl(0.176, 0.176, 0.05, belt, 32); bl.scale.z = 0.72; bl.position.y = 1.03; g.add(bl);
    g.add(at(rbox(0.07, 0.05, 0.02, MAT.steel(), 0.01), 0, 1.03, 0.127));
    g.add(at(rbox(0.075, 0.1, 0.05, belt, 0.014), 0.19, 0.97, 0.03));                                    // porta-ferramentas
    { const ov = torus(0.17, 0.02, suit, Math.PI * 2, { cast: false }); ov.rotation.x = Math.PI / 2; ov.scale.set(1.03, 0.7, 1); ov.position.y = 1.07; g.add(ov); }   // blusão caindo sobre o cinto
    const torso = lathe([[0.17, 1.04], [0.165, 1.1], [0.172, 1.2], [0.19, 1.3], [0.205, 1.38], [0.205, 1.44], [0.175, 1.49], [0.08, 1.53], [0.001, 1.54]], suit, 32);
    torso.scale.set(1.04, 1, 0.66); g.add(torso);
    [[0.187, 1.27], [0.2, 1.36]].forEach(([r, y]) => { const b = cyl(r + 0.004, r + 0.004, 0.034, refl, 32, { cast: false }); b.scale.set(1.04, 1, 0.66); b.position.y = y; g.add(b); });
    [-1, 1].forEach(s => {
      g.add(at(rbox(0.09, 0.1, 0.018, suit, 0.01), s * 0.085, 1.31, 0.128));                         // bolsos do peito
      g.add(at(box(0.092, 0.012, 0.02, seam), s * 0.085, 1.365, 0.13));
      g.add(at(rbox(0.1, 0.1, 0.02, suit, 0.01), s * 0.085, 1.31, -0.128));                          // bolsos nas costas
      g.add(at(rbox(0.085, 0.018, 0.07, suit, 0.008), s * 0.15, 1.495, 0).rotateZ(-s * 0.35));        // ombreira
    });
    g.add(at(box(0.008, 0.38, 0.01, seam), 0, 1.27, 0.134));                                           // zíper
    g.add(at(rbox(0.05, 0.07, 0.01, white, 0.005), 0.09, 1.2, 0.134));                                 // crachá
    g.add(at(rbox(0.04, 0.095, 0.03, dark, 0.008), -0.13, 1.42, 0.1));                                // rádio
    const collar = cyl(0.07, 0.078, 0.045, suit, 24); collar.position.y = 1.535; g.add(collar);
    // --- EPIs do tronco: colete refletivo, cinturão de segurança, máscara semifacial
    if (o.vest) {
      const vm = MAT.flat(L(o.vest), { rough: 0.8, metal: 0, emissive: L(o.vest), ei: 0.18 });
      const vest = mesh(new T.LatheGeometry([[0.177, 1.07], [0.175, 1.1], [0.182, 1.2], [0.2, 1.3], [0.214, 1.38], [0.214, 1.44], [0.186, 1.485]].map(([r, y]) => new T.Vector2(r, y)), 32), vm.clone()); vest.material.side = T.DoubleSide; vest.scale.set(1.04, 1, 0.66); g.add(vest);
      [1.16, 1.26].forEach(y => { const b = cyl(0.198 + (y - 1.16) * 0.2, 0.198 + (y - 1.16) * 0.2, 0.04, refl, 32, { cast: false }); b.scale.set(1.045, 1, 0.665); b.position.y = y; g.add(b); });
      [-1, 1].forEach(s => { [1, -1].forEach(f => g.add(at(box(0.05, 0.36, 0.008, refl, { cast: false }), s * 0.085, 1.3, f * 0.141))); });
    }
    if (o.harness) {
      const hm = MAT.flat(L(o.harness), { rough: 0.9, metal: 0 }), mt = MAT.steel();
      [-1, 1].forEach(s => { [1, -1].forEach(f => { const st = box(0.04, 0.4, 0.012, hm); st.position.set(s * 0.075, 1.33, f * 0.144); st.rotation.z = s * 0.2 * f; g.add(st); }); });
      g.add(at(box(0.22, 0.032, 0.012, hm), 0, 1.3, 0.146)); g.add(at(rbox(0.04, 0.05, 0.016, mt, 0.006), 0, 1.3, 0.152));
      const dr = torus(0.032, 0.007, mt); dr.position.set(0, 1.38, -0.152); g.add(dr); g.add(at(rbox(0.05, 0.03, 0.014, mt, 0.006), 0, 1.41, -0.15));
      const wb = cyl(0.182, 0.182, 0.045, hm, 32, { cast: false }); wb.scale.set(1.04, 1, 0.7); wb.position.y = 1.0; g.add(wb);
    }
    if (o.mask) {
      const mm = MAT.flat(L(0x3a5a78), { rough: 0.5, metal: 0 }), cart = MAT.flat(L(0xe07a1f), { rough: 0.5, metal: 0 });
      const st = torus(0.088, 0.006, dark, Math.PI * 2, { cast: false }); st.rotation.x = Math.PI / 2; st.position.y = 1.52; g.add(st);
      [-1, 1].forEach(s => { const cd = box(0.008, 0.16, 0.008, dark, { cast: false }); cd.position.set(s * 0.045, 1.44, 0.1); cd.rotation.z = -s * 0.25; cd.rotation.x = -0.2; g.add(cd); });
      g.add(at(rbox(0.12, 0.08, 0.055, mm, 0.028), 0, 1.36, 0.152));
      [-1, 1].forEach(s => { const c = cylZ(0.026, 0.05, cart, 16); c.position.set(s * 0.055, 1.36, 0.19); g.add(c); const r = cylZ(0.029, 0.01, dark, 16, { cast: false }); r.position.set(s * 0.055, 1.36, 0.215); g.add(r); });
    }
    // braços
    const arms = [], hands = [];
    [-1, 1].forEach(s => {
      const inw = -s;
      const sh = new T.Group(); sh.position.set(s * 0.205, 1.46, 0); sh.userData.dyn = true;
      sh.add(capsule(0.056, 0.066, 0.31, suit, 24));
      band(0.068, -0.135, sh);
      const el = new T.Group(); el.position.y = -0.29; sh.add(el); el.userData.dyn = true;
      el.add(capsule(0.045, 0.054, 0.28, suit, 24));
      band(0.055, -0.1, el);
      el.add(sphere(0.055, suit, undefined, 20, 14));
      el.add(at(rbox(0.07, 0.07, 0.012, suit, 0.008), 0, -0.02, -0.05));
      { const c = torus(0.054, 0.007, seam, Math.PI * 2, { cast: false }); c.rotation.x = Math.PI / 2; c.position.y = -0.03; el.add(c); }       // dobra da manga
      const wr = new T.Group(); wr.position.y = -0.265; el.add(wr); wr.userData.dyn = true;
      wr.add(at(cyl(0.041, 0.04, 0.034, glove, 18), 0, 0.0, 0));                                       // cano da luva
      wr.add(at(rbox(0.036, 0.1, 0.086, glove, 0.016), 0, -0.058, 0));                                   // palma (largura em z)
      wr.add(at(rbox(0.01, 0.074, 0.062, gloveD, 0.005), s * 0.019, -0.058, 0));                         // dorso reforçado
      wr.add(at(rbox(0.01, 0.05, 0.05, gloveD, 0.005), inw * 0.019, -0.065, 0));                         // palma reforçada
      const lens = [0.04, 0.05, 0.046, 0.036];
      for (let k = 0; k < 4; k++) {                                                                      // dedos em duas falanges, levemente curvados
        const f = new T.Group(); f.position.set(inw * 0.002, -0.106, (k - 1.5) * 0.0215); f.rotation.z = inw * (0.16 + k * 0.05 + rr() * 0.05); wr.add(f);
        f.add(at(rbox(0.022, lens[k], 0.02, glove, 0.009), 0, -lens[k] / 2, 0));
        const d = new T.Group(); d.position.y = -lens[k]; d.rotation.z = inw * (0.5 + k * 0.08); f.add(d);
        d.add(at(rbox(0.02, lens[k] * 0.85, 0.018, glove, 0.008), 0, -lens[k] * 0.42, 0));
      }
      const th = new T.Group(); th.position.set(inw * 0.01, -0.035, 0.046); th.rotation.set(-0.75, 0, inw * 0.1); wr.add(th);                  // polegar
      th.add(at(rbox(0.026, 0.044, 0.024, glove, 0.011), 0, -0.022, 0));
      const td = new T.Group(); td.position.y = -0.044; td.rotation.x = -0.35; th.add(td); td.add(at(rbox(0.023, 0.036, 0.021, glove, 0.01), 0, -0.018, 0));
      sh.rotation.z = s * (0.09 + rr() * 0.04); sh.rotation.x = 0.02 + rr() * 0.08; el.rotation.x = -0.18 - rr() * 0.22; wr.rotation.z = -s * 0.08;
      g.add(sh); arms.push(sh); hands.push(wr); sh.userData.elbow = el;
    });
    if (o.pose === 'hold') { arms[1].rotation.set(-0.35, 0, 0.12); arms[1].userData.elbow.rotation.x = -1.15; }
    if (o.pose === 'point') { arms[1].rotation.set(-1.2, 0, 0.15); arms[1].userData.elbow.rotation.x = -0.15; }
    // pescoço e cabeça
    g.add(at(cyl(0.052, 0.06, 0.1, skin, 20), 0, 1.58, 0.005));
    const head = new T.Group(); head.position.set(0, 1.7, 0.01); g.add(head); head.userData.dyn = true;
    const skull = lathe([[0.001, -0.118], [0.03, -0.113], [0.056, -0.098], [0.075, -0.07], [0.087, -0.035], [0.092, 0.005], [0.093, 0.04], [0.088, 0.075], [0.07, 0.105], [0.04, 0.123], [0.001, 0.128]], skin, 32);
    skull.scale.set(0.96, 1, 1.06); head.add(skull);
    const jaw = sphere(0.07, skin, undefined, 24, 14); jaw.scale.set(0.95, 0.8, 0.98); jaw.position.set(0, -0.065, 0.015); head.add(jaw);                       // mandíbula
    [-1, 1].forEach(s => { const ck = sphere(0.024, skin, undefined, 12, 8); ck.scale.set(1, 0.9, 0.8); ck.position.set(s * 0.05, -0.042, 0.06); head.add(ck); });  // maçãs do rosto
    const nose = cyl(0.004, 0.016, 0.052, skin, 12); nose.rotation.x = Math.PI / 2 + 0.3; nose.position.set(0, -0.004, 0.097); head.add(nose);
    head.add(at(sphere(0.012, skin, undefined, 12, 8), 0, -0.03, 0.108)); [-1, 1].forEach(sd => { const w = sphere(0.007, skin, undefined, 8, 6); w.position.set(sd * 0.012, -0.032, 0.101); head.add(w); });
    [-1, 1].forEach(s => {
      const e = sphere(0.024, skin, undefined, 12, 8); e.scale.set(0.5, 1.1, 0.8); e.position.set(s * 0.091, -0.012, -0.005); head.add(e);
      const ei = sphere(0.013, skinD, undefined, 8, 6); ei.scale.set(0.5, 1, 0.8); ei.position.set(s * 0.086, -0.012, -0.001); head.add(ei);
      const sb = box(0.008, 0.045, 0.012, hairM); sb.position.set(s * 0.086, 0.0, 0.02); head.add(sb);
      const br = box(0.044, 0.009, 0.014, hairM); br.position.set(s * 0.036, 0.042, 0.092); br.rotation.z = -s * 0.12; head.add(br);
    });
    const lz = 0.093;
    const lipU = sphere(0.02, lipM, undefined, 12, 8); lipU.scale.set(1.6, 0.32, 0.5); lipU.position.set(0, -0.067, lz); head.add(lipU);
    if (stache) [-1, 1].forEach(s => { const m = box(0.03, 0.01, 0.012, hairM); m.position.set(s * 0.016, -0.054, lz + 0.001); m.rotation.z = s * 0.18; head.add(m); });
    if (beardOn) { const bd = sphere(0.074, hairM, undefined, 24, 12); bd.scale.set(0.95, 0.5, 0.88); bd.position.set(0, -0.094, 0.018); head.add(bd); [-1, 1].forEach(s => { const bc = sphere(0.024, hairM, undefined, 10, 8); bc.scale.set(0.7, 1.2, 0.9); bc.position.set(s * 0.062, -0.06, 0.03); head.add(bc); }); }
    const hairBack = sphere(0.09, hairM, undefined, 18, 10); hairBack.scale.set(0.98, 0.7, 0.92); hairBack.position.set(0, 0.01, -0.035); head.add(hairBack);
    // óculos de segurança (lente escura e opaca: não mostra os olhos)
    const fr = MAT.flat(0x1b1b1b);
    const lens2 = mesh(new T.CylinderGeometry(0.1, 0.1, 0.054, 32, 1, true, -1.0, 2.0), MAT.flat(0x141b21, { rough: 0.1, metal: 0.6, side: T.DoubleSide }), { cast: false });
    lens2.scale.set(0.97, 1, 1.07); lens2.position.set(0, 0.012, 0.0); head.add(lens2);
    [0.04, -0.016].forEach(y => { const f = mesh(new T.CylinderGeometry(0.1015, 0.1015, 0.007, 32, 1, true, -1.0, 2.0), fr, { cast: false }); f.scale.set(0.97, 1, 1.07); f.position.set(0, y, 0); head.add(f); });
    head.add(at(box(0.026, 0.012, 0.014, fr), 0, 0.012, 0.108));
    [-1, 1].forEach(s => { const pad = sphere(0.007, MAT.flat(0xcfd2d4, { rough: 0.3 }), undefined, 8, 6); pad.position.set(s * 0.016, -0.004, 0.106); head.add(pad); const tp = box(0.006, 0.01, 0.11, fr); tp.position.set(s * 0.093, 0.016, -0.04); head.add(tp); });
    // protetor auricular tipo concha (preso ao capacete)
    if (muffOn) {
      const cupM = MAT.flat(0x2b2f33, { rough: 0.55, metal: 0.2 }), accent = MAT.flat(L(0xd8a21c), { rough: 0.5 }), foam = MAT.flat(0x1b1d1f, { rough: 0.95 });
      [-1, 1].forEach(s => {
        const cup = cyl(0.04, 0.043, 0.032, cupM, 20); cup.rotation.z = Math.PI / 2; cup.position.set(s * 0.108, -0.014, -0.004); head.add(cup);
        const fm = cyl(0.043, 0.043, 0.012, foam, 20); fm.rotation.z = Math.PI / 2; fm.position.set(s * 0.098, -0.012, -0.004); head.add(fm);
        const ac = cyl(0.016, 0.016, 0.004, accent, 16, { cast: false }); ac.rotation.z = Math.PI / 2; ac.position.set(s * 0.126, -0.012, -0.004); head.add(ac);
        head.add(at(rbox(0.01, 0.07, 0.016, cupM, 0.004), s * 0.118, 0.036, -0.004));
      });
    }
    // capacete com aba, adesivo frontal e catraca traseira
    const shell = lathe([[0.001, 0.158], [0.04, 0.156], [0.075, 0.148], [0.103, 0.129], [0.12, 0.1], [0.128, 0.07], [0.131, 0.045], [0.1315, 0.032]], helmM, 40); shell.scale.set(1, 1, 1.1); head.add(shell);
    const rat = cyl(0.022, 0.022, 0.03, MAT.flat(0x2b2f33, { rough: 0.6 }), 12); rat.rotation.x = Math.PI / 2; rat.position.set(0, 0.05, -0.146); head.add(rat);
    const brim = mesh(new T.RingGeometry(0.128, 0.152, 48), helmM); brim.rotation.x = -Math.PI / 2; brim.position.set(0, 0.034, 0); brim.scale.set(1, 1.1, 1); brim.material.side = T.DoubleSide; head.add(brim);
    const peak = mesh(new T.RingGeometry(0.128, 0.168, 32, 1, Math.PI * 1.15, Math.PI * 0.7), helmM); peak.rotation.x = -Math.PI / 2 + 0.16; peak.position.set(0, 0.036, 0.02); peak.scale.set(1, 1.1, 1); peak.material.side = T.DoubleSide; head.add(peak);
    const rim = torus(0.131, 0.008, helmM); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 1.1, 1); rim.position.y = 0.035; head.add(rim);
    head.rotation.x = 0.04; head.rotation.y = o.look ?? 0;
    legs.forEach(h => bake(h)); arms.forEach(sh => { bake(sh.userData.elbow.children.find(c => c.userData.dyn) || sh); bake(sh.userData.elbow); bake(sh); }); bake(head); bake(g);
    g.scale.set(bw, bh, bw);
    g.userData.arms = arms; g.userData.hands = hands; g.userData.head = head; g.userData.legs = legs;
    g.userData.ph = Math.random() * 6;
    g.onBeforeRender = () => { };
    PEOPLE.push(g);
    return g;
  }
  const PEOPLE = [];
  function animPeople(t) { PEOPLE.forEach(p => { const ph = p.userData.ph; p.userData.head.rotation.y = (p.userData.look0 ??= p.userData.head.rotation.y) + Math.sin(t * 0.35 + ph) * 0.18; }); }
  function animatePerson(p, dt) {
    if (!p || !p.userData.actionMotion) return;
    const motion = p.userData.actionMotion;
    motion.elapsed = Math.min(motion.duration, motion.elapsed + dt);
    const progress = motion.elapsed / motion.duration;
    const walkProgress = Math.min(1, progress / 0.66);
    const walkEase = walkProgress * walkProgress * (3 - 2 * walkProgress);
    const walkSwing = Math.sin(walkProgress * Math.PI * 4) * (1 - walkProgress);
    const reachProgress = Math.max(0, Math.min(1, (progress - 0.58) / 0.42));
    const reach = Math.sin(reachProgress * Math.PI);
    const arm = p.userData.arms[1];
    const elbow = arm.userData.elbow;
    const hand = p.userData.hands[1];
    const legs = p.userData.legs;
    p.position.x = motion.positionX + (motion.toX - motion.positionX) * walkEase;
    p.position.z = motion.positionZ + (motion.toZ - motion.positionZ) * walkEase;
    p.rotation.y = motion.rotationY + motion.rotationDelta * walkEase;
    arm.rotation.x = motion.armX + walkSwing * 0.28 + reach * 0.62;
    arm.rotation.z = motion.armZ - reach * 0.14;
    elbow.rotation.x = motion.elbowX - reach * 0.72;
    hand.rotation.x = motion.handX + reach * 0.12;
    p.userData.head.rotation.x = motion.headX + reach * 0.11;
    p.userData.head.rotation.y = motion.headY - reach * 0.08;
    p.position.y = motion.positionY + reach * 0.018;
    p.rotation.x = motion.rootX + reach * 0.025;
    legs[0].rotation.z = motion.legLeftZ + walkSwing * 0.48 - reach * 0.025;
    legs[1].rotation.z = motion.legRightZ - walkSwing * 0.48 + reach * 0.025;
    if (progress >= 1) {
      arm.rotation.set(motion.armX, motion.armY, motion.armZ);
      elbow.rotation.x = motion.elbowX;
      hand.rotation.x = motion.handX;
      p.userData.head.rotation.set(motion.headX, motion.headY, motion.headZ);
      p.position.set(motion.toX, motion.positionY, motion.toZ);
      p.rotation.set(motion.rootX, motion.rotationY + motion.rotationDelta, motion.rootZ);
      legs[0].rotation.z = motion.legLeftZ;
      legs[1].rotation.z = motion.legRightZ;
      p.userData.actionMotion = null;
    }
  }

  /* ---------- tonemapping (espelha o ACES do three.js, para o pipeline HDR) ---------- */
  const ACES_IN = [[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]];
  const ACES_OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
  const mul3 = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2], m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
  function aces(c, exposure) {
    let v = mul3(ACES_IN, c.map(x => x * exposure / 0.6));
    v = v.map(x => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081));
    return mul3(ACES_OUT, v).map(x => Math.min(1, Math.max(0, x)));
  }
  const s2l = (x) => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  /* cor HDR que, depois de ACES + sRGB, aparece exatamente como o hex pedido (fundo, névoa e céu mantêm o visual original) */
  function invTone(hex, exposure) {
    const L = hexRGB(hex).map(v => s2l(v / 255)); let x = L.map(v => v * 1.2 + 0.01);
    for (let i = 0; i < 80; i++) { const f = aces(x, exposure); x = x.map((v, k) => Math.min(60, Math.max(1e-4, v + (L[k] - f[k]) * 1.6))); }
    return new T.Color(x[0], x[1], x[2]);
  }

  /* ---------- ambiente de reflexo (IBL) ---------- */
  function buildEnv(renderer, kind) {
    const e = new T.Scene();
    const C = kind === 'sky'
      ? { top: new T.Color(0.2, 0.42, 0.85), hor: new T.Color(0.95, 1.0, 1.08), low: new T.Color(0.34, 0.32, 0.3) }
      : { top: new T.Color(0.05, 0.055, 0.06), hor: new T.Color(0.2, 0.215, 0.23), low: new T.Color(0.2, 0.17, 0.14) };
    const dg = new T.SphereGeometry(60, 48, 24), pos = dg.attributes.position, col = new Float32Array(pos.count * 3), tmp = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = pos.getY(i) / 60; if (h > 0) tmp.copy(C.hor).lerp(C.top, Math.pow(h, 0.55)); else tmp.copy(C.hor).lerp(C.low, Math.pow(-h, 0.4));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    dg.setAttribute('color', new T.BufferAttribute(col, 3));
    const dome = new T.Mesh(dg, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, depthWrite: false }));
    e.add(dome);
    const lite = (r, g, b) => new T.MeshBasicMaterial({ color: new T.Color(r, g, b), side: T.DoubleSide });
    const add = (w, h, d, x, y, z, m) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); e.add(b); return b; };
    if (kind === 'sky') {
      const sun = new T.Mesh(new T.SphereGeometry(2.4, 16, 8), lite(90, 75, 55)); sun.position.set(30, 38, 24); e.add(sun);
    } else {
      const strip = lite(7, 6.4, 5.6);
      for (let i = -3; i <= 3; i++) add(0.9, 0.2, 30, i * 7, 17, 0, strip);            // fileiras de luminárias
      for (let i = -2; i <= 2; i++) add(8, 6, 0.2, i * 11, 11, -30, lite(3.6, 4.2, 5));  // janelas altas ao fundo
      add(0.2, 5, 22, -30, 12, 0, lite(2.6, 3.0, 3.6)); add(0.2, 5, 22, 30, 12, 0, lite(2.6, 3.0, 3.6));
      add(70, 0.2, 70, 0, -8, 0, lite(0.2, 0.19, 0.17));                                  // piso: rebatimento quente e escuro
    }
    const pm = new T.PMREMGenerator(renderer); const tx = pm.fromScene(e, 0.03).texture; pm.dispose(); return tx;
  }

  /* ---------- pós-processamento ---------- */
  function makePost(renderer, scene, camera, cfg) {
    const gl = renderer.getContext();
    const quadGeo = new T.BufferGeometry();
    quadGeo.setAttribute('position', new T.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    quadGeo.setAttribute('uv', new T.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    function fx(fragmentShader, uniforms, extra) {
      const mat = new T.ShaderMaterial(Object.assign({ vertexShader: VS, fragmentShader, uniforms, depthTest: false, depthWrite: false }, extra));
      const mesh = new T.Mesh(quadGeo, mat); mesh.frustumCulled = false; const sc = new T.Scene(); sc.add(mesh);
      return { mat, run(target, clear = true) { const ac = renderer.autoClear; renderer.autoClear = clear; renderer.setRenderTarget(target); renderer.render(sc, qCam); renderer.autoClear = ac; } };
    }
    const U = (v) => ({ value: v });
    const rtOpts = (type, filter = T.LinearFilter) => ({ type, format: T.RGBAFormat, minFilter: filter, magFilter: filter, depthBuffer: false, stencilBuffer: false });
    let sceneRT, aoA, aoB, ldrRT, mips = [], bw = 2, bh = 2;
    const P = { ao: !cfg.noAO, bloom: !cfg.noBloom, k: 1, ok: true };

    const aoFx = fx(`
      varying vec2 vUv; uniform sampler2D tDepth; uniform mat4 projInv; uniform mat4 proj; uniform vec2 texel; uniform float radius; uniform float intensity;
      vec3 vpos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 p = projInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        float d0 = texture2D(tDepth, vUv).x; if (d0 >= 0.99999) { gl_FragColor = vec4(1.0); return; }
        vec3 P = vpos(vUv);
        vec3 pR = vpos(vUv + vec2(texel.x, 0.0)), pL = vpos(vUv - vec2(texel.x, 0.0)), pU = vpos(vUv + vec2(0.0, texel.y)), pD = vpos(vUv - vec2(0.0, texel.y));
        vec3 dx = abs(pR.z - P.z) < abs(P.z - pL.z) ? pR - P : P - pL;
        vec3 dy = abs(pU.z - P.z) < abs(P.z - pD.z) ? pU - P : P - pD;
        vec3 N = normalize(cross(dx, dy));
        float ang = hash(gl_FragCoord.xy) * 6.2831853;
        vec3 rv = vec3(cos(ang), sin(ang), 0.0); vec3 Tn = normalize(rv - N * dot(rv, N)); vec3 Bn = cross(N, Tn);
        float occ = 0.0; const int NS = 14;
        for (int i = 0; i < NS; i++) {
          float t = (float(i) + 0.5) / float(NS); float phi = float(i) * 2.399963 + ang;
          float cz = mix(0.12, 0.98, t); float sr = sqrt(1.0 - cz * cz);
          vec3 dir = Tn * cos(phi) * sr + Bn * sin(phi) * sr + N * cz;
          vec3 sp = P + dir * radius * mix(0.12, 1.0, t * t);
          vec4 pp = proj * vec4(sp, 1.0); vec2 suv = pp.xy / pp.w * 0.5 + 0.5;
          if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) continue;
          vec3 sc = vpos(suv);
          float rc = smoothstep(0.0, 1.0, radius / max(abs(P.z - sc.z), 1e-3));
          occ += (sc.z >= sp.z + 0.025 * (1.0 + -P.z * 0.02) ? 1.0 : 0.0) * rc;
        }
        float ao = 1.0 - occ / float(NS) * intensity;
        float fade = smoothstep(55.0, 18.0, -P.z); ao = mix(1.0, ao, fade);
        gl_FragColor = vec4(vec3(clamp(ao, 0.0, 1.0)), 1.0);
      }`, { tDepth: U(null), projInv: U(new T.Matrix4()), proj: U(new T.Matrix4()), texel: U(new T.Vector2()), radius: U(0.7), intensity: U(1.5) });

    const blurFx = fx(`
      varying vec2 vUv; uniform sampler2D tAO; uniform sampler2D tDepth; uniform mat4 projInv; uniform vec2 dir;
      float lz(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 p = projInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.z / p.w; }
      void main(){
        float z0 = lz(vUv); float sum = texture2D(tAO, vUv).r * 0.2; float wsum = 0.2;
        for (int i = -3; i <= 3; i++) { if (i == 0) continue; vec2 uv = vUv + dir * float(i);
          float w = (1.0 - abs(float(i)) / 4.0) * (abs(lz(uv) - z0) < 0.06 * abs(z0) + 0.03 ? 1.0 : 0.0);
          sum += texture2D(tAO, uv).r * w; wsum += w; }
        gl_FragColor = vec4(vec3(sum / wsum), 1.0);
      }`, { tAO: U(null), tDepth: U(null), projInv: U(new T.Matrix4()), dir: U(new T.Vector2()) });

    const preFx = fx(`
      varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 texel; uniform float thr; uniform float knee;
      vec3 tap(vec2 o){ return min(texture2D(tSrc, vUv + o * texel).rgb, vec3(24.0)); }
      void main(){
        vec3 c = (tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0))) * 0.25;
        float br = max(max(c.r, c.g), c.b); float soft = clamp(br - thr + knee, 0.0, 2.0 * knee); soft = soft * soft / (4.0 * knee + 1e-4);
        c *= max(soft, br - thr) / max(br, 1e-4); gl_FragColor = vec4(c, 1.0);
      }`, { tSrc: U(null), texel: U(new T.Vector2()), thr: U(1.25), knee: U(0.6) });
    const downFx = fx(`
      varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 texel;
      void main(){ vec3 c = texture2D(tSrc, vUv + texel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, -1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, 1.0)).rgb; gl_FragColor = vec4(c * 0.25, 1.0); }`,
      { tSrc: U(null), texel: U(new T.Vector2()) });
    const upFx = fx(`
      varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 texel; uniform float w;
      void main(){ vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
        c += texture2D(tSrc, vUv + texel * vec2(-1.0, 0.0)).rgb * 2.0 + texture2D(tSrc, vUv + texel * vec2(1.0, 0.0)).rgb * 2.0 + texture2D(tSrc, vUv + texel * vec2(0.0, -1.0)).rgb * 2.0 + texture2D(tSrc, vUv + texel * vec2(0.0, 1.0)).rgb * 2.0;
        c += texture2D(tSrc, vUv + texel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, -1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, 1.0)).rgb;
        gl_FragColor = vec4(c / 16.0 * w, 1.0); }`,
      { tSrc: U(null), texel: U(new T.Vector2()), w: U(1) }, { blending: T.AdditiveBlending, transparent: true });

    const finFx = fx(`
      varying vec2 vUv; uniform sampler2D tScene; uniform sampler2D tAO; uniform sampler2D tBloom;
      uniform float exposure; uniform float aoAmt; uniform float bloomAmt; uniform float vig; uniform float grain; uniform float time; uniform vec2 res;
      vec3 rrt(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
      vec3 aces(vec3 c){
        const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
        const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
        c *= exposure / 0.6; c = I * c; c = rrt(c); c = O * c; return clamp(c, 0.0, 1.0);
      }
      vec3 enc(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(0.41666)) - 0.055, step(0.0031308, c)); }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
      void main(){
        vec3 c = texture2D(tScene, vUv).rgb;
        float ao = texture2D(tAO, vUv).r; c *= mix(1.0, ao, aoAmt);
        c += texture2D(tBloom, vUv).rgb * bloomAmt;
        c = aces(c);
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, 1.07);
        c = mix(c, c * c * (3.0 - 2.0 * c), 0.16);
        c += vec3(0.004, 0.0, -0.004) * (1.0 - l);
        vec2 q = vUv - 0.5; c *= 1.0 - vig * dot(q, q) * 1.6;
        c = enc(c);
        c += (hash(vUv * res) - 0.5) * grain;
        gl_FragColor = vec4(c, 1.0);
      }`, { tScene: U(null), tAO: U(null), tBloom: U(null), exposure: U(0.78), aoAmt: U(0.9), bloomAmt: U(0.3), vig: U(0.5), grain: U(0.018), time: U(0), res: U(new T.Vector2(1, 1)) });

    const fxaaFx = fx(`
      varying vec2 vUv; uniform sampler2D tLdr; uniform vec2 px;
      float lm(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
      void main(){
        vec3 M = texture2D(tLdr, vUv).rgb;
        vec3 NW = texture2D(tLdr, vUv + vec2(-1.0, -1.0) * px).rgb, NE = texture2D(tLdr, vUv + vec2(1.0, -1.0) * px).rgb, SW = texture2D(tLdr, vUv + vec2(-1.0, 1.0) * px).rgb, SE = texture2D(tLdr, vUv + vec2(1.0, 1.0) * px).rgb;
        float lM = lm(M), lNW = lm(NW), lNE = lm(NE), lSW = lm(SW), lSE = lm(SE);
        float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
        vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
        float dr = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
        float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + dr);
        dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * px;
        vec3 A = 0.5 * (texture2D(tLdr, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tLdr, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);
        vec3 B = A * 0.5 + 0.25 * (texture2D(tLdr, vUv + dir * -0.5).rgb + texture2D(tLdr, vUv + dir * 0.5).rgb);
        float lB = lm(B); gl_FragColor = vec4((lB < lMin || lB > lMax) ? A : B, 1.0);
      }`, { tLdr: U(null), px: U(new T.Vector2()) });

    function dispose() { [sceneRT, aoA, aoB, ldrRT, ...mips].forEach(r => r && (r.depthTexture && r.depthTexture.dispose(), r.dispose())); mips = []; }
    function build() {
      dispose();
      sceneRT = new T.WebGLRenderTarget(bw, bh, Object.assign(rtOpts(T.HalfFloatType), { depthBuffer: true }));
      sceneRT.depthTexture = new T.DepthTexture(bw, bh); sceneRT.depthTexture.type = T.UnsignedIntType; sceneRT.depthTexture.format = T.DepthFormat;
      sceneRT.depthTexture.minFilter = sceneRT.depthTexture.magFilter = T.NearestFilter;
      const aw = Math.max(2, bw >> 1), ah = Math.max(2, bh >> 1);
      aoA = new T.WebGLRenderTarget(aw, ah, rtOpts(T.UnsignedByteType)); aoB = aoA.clone();
      ldrRT = new T.WebGLRenderTarget(bw, bh, rtOpts(T.UnsignedByteType));
      let w = aw, h = ah; for (let i = 0; i < 5; i++) { mips.push(new T.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), rtOpts(T.HalfFloatType))); w >>= 1; h >>= 1; }
    }
    const v2 = new T.Vector2();
    function setSize() {
      renderer.getDrawingBufferSize(v2); const pr = renderer.getPixelRatio();
      P.k = pr < 1.5 ? 1.35 : 1; // supersampling leve quando a tela tem baixa densidade
      bw = Math.max(2, Math.round(v2.x * P.k)); bh = Math.max(2, Math.round(v2.y * P.k)); build();
      finFx.mat.uniforms.res.value.set(bw, bh); fxaaFx.mat.uniforms.px.value.set(1 / bw, 1 / bh);
    }
    const pj = new T.Matrix4(), pji = new T.Matrix4();
    function render(t) {
      renderer.setRenderTarget(sceneRT); renderer.clear(); renderer.render(scene, camera);
      let aoTex = whiteTex;
      if (P.ao) {
        pj.copy(camera.projectionMatrix); pji.copy(camera.projectionMatrixInverse);
        const u = aoFx.mat.uniforms; u.tDepth.value = sceneRT.depthTexture; u.projInv.value = pji; u.proj.value = pj; u.texel.value.set(1 / bw, 1 / bh);
        u.radius.value = cfg.aoRadius ?? 0.75; u.intensity.value = cfg.aoIntensity ?? 1.6;
        aoFx.run(aoA);
        const b = blurFx.mat.uniforms; b.tDepth.value = sceneRT.depthTexture; b.projInv.value = pji;
        b.tAO.value = aoA.texture; b.dir.value.set(1 / aoA.width, 0); blurFx.run(aoB);
        b.tAO.value = aoB.texture; b.dir.value.set(0, 1 / aoA.height); blurFx.run(aoA);
        aoTex = aoA.texture;
      }
      let bloomTex = blackTex;
      if (P.bloom) {
        preFx.mat.uniforms.tSrc.value = sceneRT.texture; preFx.mat.uniforms.texel.value.set(1 / bw, 1 / bh); preFx.run(mips[0]);
        for (let i = 1; i < mips.length; i++) { downFx.mat.uniforms.tSrc.value = mips[i - 1].texture; downFx.mat.uniforms.texel.value.set(1 / mips[i - 1].width, 1 / mips[i - 1].height); downFx.run(mips[i]); }
        for (let i = mips.length - 2; i >= 0; i--) { upFx.mat.uniforms.tSrc.value = mips[i + 1].texture; upFx.mat.uniforms.texel.value.set(1 / mips[i + 1].width, 1 / mips[i + 1].height); upFx.mat.uniforms.w.value = 0.85; upFx.run(mips[i], false); }
        bloomTex = mips[0].texture;
      }
      const f = finFx.mat.uniforms; f.tScene.value = sceneRT.texture; f.tAO.value = aoTex; f.tBloom.value = bloomTex; f.time.value = (t % 10) * 0.37;
      f.exposure.value = cfg.exposure; f.aoAmt.value = P.ao ? 0.9 : 0; f.bloomAmt.value = P.bloom ? (cfg.bloom ?? 0.3) : 0;
      finFx.run(ldrRT);
      fxaaFx.mat.uniforms.tLdr.value = ldrRT.texture; fxaaFx.run(null);
    }
    const whiteTex = new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1), blackTex = new T.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    whiteTex.needsUpdate = blackTex.needsUpdate = true;
    // degrada sozinho se o quadro ficar lento: primeiro tira o AO, depois o bloom
    let slow = 0, fast = 0, level = 2, warm = 0; const adaptive = !/[?&]perf=0/.test(location.search);
    function perf(dt) {
      if (!adaptive || ++warm < 90) return;
      if (dt > 0.04) { slow++; fast = 0; } else if (dt < 0.026) { fast++; slow = Math.max(0, slow - 1); }
      if (slow > 70) { slow = 0; if (level === 2) { level = 1; P.ao = false; } else if (level === 1) { level = 0; P.bloom = false; } }
    }
    setSize();
    return { render, setSize, perf, params: P, dispose, fx: { ao: aoFx, bloom: preFx, fin: finFx }, rts: () => ({ sceneRT, ldrRT, aoA, mips }) };
  }

  /* ---------- cena ---------- */
  function create(el, o) {
    const wantPost = !NOPOST && !!window.WebGL2RenderingContext;
    const renderer = new T.WebGLRenderer({ antialias: !wantPost, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    const usePost = wantPost && renderer.capabilities.isWebGL2 && !!renderer.extensions.get('EXT_color_buffer_float');
    ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const exposure = o.exposure ?? 0.78;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW ? 1 : 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = usePost ? T.NoToneMapping : T.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
    /* no modo HDR o fundo e a névoa entram "pré-invertidos" para o ACES devolver exatamente a cor original */
    const sceneCol = (hex) => usePost ? invTone(hex, exposure) : new T.Color(hex);
    renderer.domElement.setAttribute('aria-label', 'Cena 3D interativa. Arraste para girar ou, no modo mover câmera, arraste para deslocar a vista. Use o botão direito para deslocar e a roda do mouse para aproximar ou afastar.');
    renderer.domElement.tabIndex = 0;
    el.appendChild(renderer.domElement);
    const ov = document.createElement('div'); ov.className = 'v-ov'; el.appendChild(ov);
    const scene = new T.Scene(); scene.background = sceneCol(o.bg ?? 0x1b2026); scene.fog = new T.Fog(sceneCol(o.fog ?? o.bg ?? 0x1b2026), o.fogNear ?? 22, o.fogFar ?? 75);
    scene.environment = buildEnv(renderer, 'shed'); envI.v = (o.env ?? 0.42) * 1.15;
    const camera = new T.PerspectiveCamera(o.fov ?? 40, 1.6, 0.15, 300); camera.position.set(...o.cam);
    const controls = new T.OrbitControls(camera, renderer.domElement);
    controls.target.set(...o.target); controls.enableDamping = true; controls.dampingFactor = 0.075; controls.enablePan = true;
    controls.rotateSpeed = 0.72; controls.panSpeed = 0.78; controls.zoomSpeed = 0.82; controls.screenSpacePanning = true;
    controls.maxPolarAngle = o.maxPolar ?? 1.45; controls.minDistance = o.minD ?? 3; controls.maxDistance = o.maxD ?? 26;
    scene.add(new T.HemisphereLight(o.sky ?? 0xbcc8d6, o.gnd ?? 0x3a332c, o.hemi ?? 0.34));
    const sun = new T.DirectionalLight(o.sunColor ?? 0xffe2bd, o.sunI ?? 2.35); sun.position.set(...(o.sun ?? [10, 16, 6])); sun.castShadow = true;
    const smap = LOW ? 1024 : 2048; sun.shadow.mapSize.set(smap, smap); const sc = o.shadowSize ?? 14;
    Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 1, far: 70 }); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.018;
    sun.target.position.set(...o.target); scene.add(sun); scene.add(sun.target);
    const labels = [], ticks = [], motions = [], v = new T.Vector3(); let sideW = 0, activePerson = null;
    function resize() {
      const w = el.clientWidth || window.innerWidth, h = el.clientHeight || window.innerHeight;
      renderer.setSize(w, h); camera.aspect = w / h;
      sideW = o.side ? o.side() : 0;
      if (sideW > 0 && w > 760) camera.setViewOffset(w + sideW, h, sideW, 0, w, h); else camera.clearViewOffset();
      camera.updateProjectionMatrix(); post && post.setSize();
    }
    let post = null;
    try { if (usePost) post = makePost(renderer, scene, camera, { exposure, bloom: o.bloom, aoRadius: o.aoRadius, aoIntensity: o.aoIntensity }); } catch (err) { console.warn('pós-processamento indisponível', err); post = null; }
    if (!post && usePost) { renderer.toneMapping = T.ACESFilmicToneMapping; scene.background = new T.Color(o.bg ?? 0x1b2026); scene.fog.color.set(o.fog ?? o.bg ?? 0x1b2026); }
    new ResizeObserver(resize).observe(el); window.addEventListener('resize', resize); resize();
    let tween = null;
    function focus(p, dist) {
      const to = new T.Vector3(...p); const dir = new T.Vector3(...o.cam).sub(to); dir.y = Math.max(dir.y, dir.length() * 0.25); dir.normalize();
      const d = dist ?? Math.min(camera.position.distanceTo(controls.target), 9);
      tween = { t: 0, fT: controls.target.clone(), tT: to, fC: camera.position.clone(), tC: to.clone().add(dir.multiplyScalar(d)) };
    }
    function home() { tween = { t: 0, fT: controls.target.clone(), tT: new T.Vector3(...o.target), fC: camera.position.clone(), tC: new T.Vector3(...o.cam) }; }
    let last = performance.now(), paused = false;
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (tween) { tween.t = Math.min(1, tween.t + dt / 0.9); const e = 1 - Math.pow(1 - tween.t, 3); controls.target.lerpVectors(tween.fT, tween.tT, e); camera.position.lerpVectors(tween.fC, tween.tC, e); if (tween.t >= 1) tween = null; }
      ticks.forEach(f => f(dt, now / 1000)); animPeople(now / 1000); if (activePerson) animatePerson(activePerson, dt);
      for (let i = motions.length - 1; i >= 0; i--) {
        const m = motions[i]; m.elapsed = Math.min(m.duration, m.elapsed + dt); const p = m.elapsed / m.duration; const eased = p * p * (3 - 2 * p);
        m.object[m.key] = m.from + (m.to - m.from) * eased;
        if (p >= 1) motions.splice(i, 1);
      }
      controls.update(); if (!paused) { if (post) { post.render(now / 1000); post.perf(dt); } else renderer.render(scene, camera); }
      const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
      labels.forEach(L => {
        if (L.obj) L.obj.getWorldPosition(v).add(L.off); else v.copy(L.pos);
        v.project(camera); const hide = v.z > 1 || L.hidden || ctx.hideLabels && !L.always;
        L.el.style.display = hide ? 'none' : '';
        if (!hide) L.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px,${(-v.y * 0.5 + 0.5) * h}px)`;
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    /* seleção */
    const ray = new T.Raycaster(), ptr = new T.Vector2(); let down = null; const pickCbs = [], hits = {};
    function pickAt(e) {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      for (const hh of ray.intersectObjects(scene.children, true)) {
        let vis = true, w = hh.object; while (w) { if (w.visible === false) { vis = false; break; } w = w.parent; }
        if (!vis || hh.object.userData.through) continue;
        let ob = hh.object; while (ob && !ob.userData.hit) ob = ob.parent;
        return ob ? ob.userData.hit : null;
      }
      return null;
    }
    let hover = null, lastMove = 0;
    function setGlow(id, on) { (hits[id] || []).forEach(g => g.traverse(m => { if (m.isMesh && m.material && m.material.emissive) { if (on) { m.userData.e0 = m.userData.e0 ?? m.material.emissive.getHex(); m.material.emissive.setHex(0x3a4f66); } else if (m.userData.e0 !== undefined) m.material.emissive.setHex(m.userData.e0); } })); }
    let dragging = false;
    renderer.domElement.addEventListener('pointermove', e => {
      if (dragging) return;
      const n = performance.now(); if (n - lastMove < 60) return; lastMove = n;
      const id = pickAt(e); if (id !== hover) { if (hover) setGlow(hover, false); hover = id; if (id) setGlow(id, true); renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; ctx.onHover && ctx.onHover(id); }
    });
    renderer.domElement.addEventListener('pointerleave', () => { if (hover) setGlow(hover, false); hover = null; ctx.onHover && ctx.onHover(null); });
    renderer.domElement.addEventListener('pointerdown', e => {
      tween = null;
      dragging = e.button === 0 || e.button === 2;
      down = e.button === 0 ? [e.clientX, e.clientY] : null;
      renderer.domElement.style.cursor = e.button === 2 ? 'move' : 'grabbing';
    });
    renderer.domElement.addEventListener('pointerup', e => {
      const shouldPick = down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) <= 6;
      down = null; dragging = false;
      renderer.domElement.style.cursor = hover ? 'pointer' : 'grab';
      if (!shouldPick) return;
      const id = pickAt(e); pickCbs.forEach(cb => cb(id, e));
    });
    renderer.domElement.addEventListener('pointercancel', () => { down = null; dragging = false; renderer.domElement.style.cursor = 'grab'; });
    renderer.domElement.style.cursor = 'grab';
    const ctx = {
      T, scene, camera, renderer, controls, el, ov, sun, focus, home, hideLabels: false, get post() { return post; },
      tick: f => ticks.push(f), onPick: cb => pickCbs.push(cb), pause: p => { paused = p; },
      zoom(factor) {
        const target = controls.target.clone();
        const offset = camera.position.clone().sub(target);
        offset.setLength(T.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
        tween = { t: 0, fT: target, tT: target, fC: camera.position.clone(), tC: target.clone().add(offset) };
      },
      animate(object, path, to, duration = 0.8) {
        const [parentKey, key] = path.split('.'); const target = key ? object?.[parentKey] : object;
        if (!target || !(key || parentKey in target)) return;
        const prop = key || parentKey;
        motions.push({ object: target, key: prop, from: target[prop], to, duration: Math.max(0.1, duration), elapsed: 0 });
      },
      setPanMode(enabled) {
        controls.mouseButtons.LEFT = enabled ? T.MOUSE.PAN : T.MOUSE.ROTATE;
        controls.touches.ONE = enabled ? T.TOUCH.PAN : T.TOUCH.ROTATE;
      },
      perform(person, anchor) {
        if (!person?.userData.arms?.[1]) return;
        activePerson = person;
        const arm = person.userData.arms[1];
        const head = person.userData.head;
        const legs = person.userData.legs;
        const [targetX, , targetZ] = anchor || [person.position.x, 0, person.position.z];
        const dx = targetX - person.position.x;
        const dz = targetZ - person.position.z;
        const distance = Math.hypot(dx, dz);
        const approach = Math.max(0, distance - 1.1);
        const directionX = distance ? dx / distance : 0;
        const directionZ = distance ? dz / distance : 0;
        const targetRotation = distance > 0.15 ? Math.atan2(dx, dz) : person.rotation.y;
        const rotationDelta = Math.atan2(Math.sin(targetRotation - person.rotation.y), Math.cos(targetRotation - person.rotation.y));
        person.userData.actionMotion = {
          duration: Math.max(1.35, Math.min(6, approach / 2.2)),
          elapsed: 0,
          armX: arm.rotation.x,
          armY: arm.rotation.y,
          armZ: arm.rotation.z,
          elbowX: arm.userData.elbow.rotation.x,
          handX: person.userData.hands[1].rotation.x,
          headX: head.rotation.x,
          headY: head.rotation.y,
          headZ: head.rotation.z,
          positionX: person.position.x,
          positionY: person.position.y,
          positionZ: person.position.z,
          toX: person.position.x + directionX * approach,
          toZ: person.position.z + directionZ * approach,
          rotationY: person.rotation.y,
          rotationDelta,
          rootX: person.rotation.x,
          rootZ: person.rotation.z,
          legLeftZ: legs[0].rotation.z,
          legRightZ: legs[1].rotation.z,
        };
      },
      hit(group, id) {
        group.traverse(m => { if (m.isMesh && m.material) m.material = m.material.clone(); });
        group.userData.hit = id; (hits[id] = hits[id] || []).push(group); if (!group.parent) scene.add(group); return group;
      },
      glow: setGlow,
      label(opt) {
        const elL = document.createElement('div'); elL.className = 'v-tag ' + (opt.cls || ''); elL.innerHTML = opt.html || '';
        if (opt.onClick) { elL.style.pointerEvents = 'auto'; elL.style.cursor = 'pointer'; elL.addEventListener('click', e => { e.stopPropagation(); opt.onClick(); }); }
        ov.appendChild(elL);
        const L = { el: elL, obj: opt.obj || null, off: new T.Vector3(...(opt.off || [0, 0, 0])), pos: new T.Vector3(...(opt.pos || [0, 0, 0])), hidden: !!opt.hidden, always: !!opt.always };
        labels.push(L); return L;
      },
      resize,
      /* céu em degradê + reflexo de céu (cenas ao ar livre) */
      sky(opt = {}) {
        const hor = opt.hor ?? o.fog ?? o.bg ?? 0x9fb0bd, top = opt.top ?? 0x5d8fc6, sd = new T.Vector3(...(opt.sun ?? o.sun ?? [12, 20, 14])).normalize();
        const cH = sceneCol(hor), cT = sceneCol(top), cS = sceneCol(0xfff0d8).multiplyScalar(usePost ? 1.6 : 1);
        const g = new T.SphereGeometry(270, 40, 20), p = g.attributes.position, col = new Float32Array(p.count * 3), c = new T.Color(), v3 = new T.Vector3();
        for (let i = 0; i < p.count; i++) { v3.fromBufferAttribute(p, i).normalize(); const h = Math.max(0, v3.y); c.copy(cH).lerp(cT, Math.pow(h, 0.6)); c.lerp(cS, Math.pow(Math.max(0, v3.dot(sd)), 24) * 0.55); col.set([c.r, c.g, c.b], i * 3); }
        g.setAttribute('color', new T.BufferAttribute(col, 3));
        const dome = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, depthWrite: false, fog: false, toneMapped: false }));
        dome.renderOrder = -1000; dome.frustumCulled = false; dome.userData.through = true; scene.add(dome); ticks.push(() => dome.position.copy(camera.position));
        scene.environment = buildEnv(renderer, 'sky'); return dome;
      },
      resize,
    };
    window.__w = ctx;
    return ctx;
  }

  /* ---------- galpão ---------- */
  function shed(ctx, o = {}) {
    const { scene } = ctx; const w = o.w ?? 40, d = o.d ?? 28, h = o.h ?? 11, z0 = o.z0 ?? -10;
    const floor = mesh(new T.PlaneGeometry(w + 30, d + 30), MAT.concrete([(w + 30) / 9, (d + 30) / 9], o.floorTint ?? 0x767774, o.seed ?? 7), { cast: false });
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const colM = MAT.paint(o.steel ?? 0x56616b, { wear: 0.35, seed: 61, rep: [1, 4] });
    const wallM = MAT.corr(o.wall ?? 0x8e979c, [w / 4, 1]);
    if (!o.noBack) {
      const back = mesh(new T.PlaneGeometry(w, h), wallM, { cast: false }); at(back, 0, h / 2, z0); scene.add(back);
      const plinth = box(w, 1.2, 0.3, MAT.concrete([w / 4, 0.3], 0x7d7f7e, 9)); at(plinth, 0, 0.6, z0 + 0.15); scene.add(plinth);
      if (o.windows !== false) {
        const win = mesh(new T.PlaneGeometry(w * 0.9, 1.4), MAT.flat(0xeef3f7, { emissive: 0xdfe8f0, ei: o.winI ?? 1.4, rough: 0.2 }), { cast: false }); at(win, 0, h - 1.8, z0 + 0.02); scene.add(win);
        for (let x = -w * 0.45; x <= w * 0.45; x += 2.4) scene.add(at(box(0.08, 1.45, 0.06, colM), x, h - 1.8, z0 + 0.05));
      }
    }
    if (!o.noSides) [-w / 2, w / 2].forEach(x => { const s = mesh(new T.PlaneGeometry(d, h), wallM.clone(), { cast: false }); s.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; at(s, x, h / 2, z0 + d / 2); scene.add(s); });
    for (let x = -w / 2 + 2; x <= w / 2 - 2; x += o.bay ?? 6) {
      const c = ibeam(h, 0.5, 0.3, colM, 'y'); at(c, x, h / 2, z0 + 0.5); scene.add(c);
      const tr = ibeam(d, 0.6, 0.25, colM, 'z'); at(tr, x, h + 0.3, z0 + d / 2); scene.add(tr);
      const li = Math.round((x + w / 2 - 2) / (o.bay ?? 6));
      if (!o.noLights) {
        const lamp = new T.Group(); lamp.add(cyl(0.32, 0.45, 0.35, MAT.paint(0x3c4247, { wear: 0.2 }), 24)); const lens = cyl(0.42, 0.42, 0.02, MAT.flat(0xfff3dd, { emissive: 0xfff1d6, ei: 2.2 }), 24, { cast: false }); lens.position.y = -0.18; lamp.add(lens);
        lamp.add(at(cyl(0.01, 0.01, 1.2, MAT.steel(), 6), 0, 0.75, 0)); at(lamp, x, h - 1, z0 + d * 0.45); scene.add(lamp);
        if (li % 2 === 1 && !LOW) { const pl = new T.PointLight(o.lampColor ?? 0xffe6c4, o.lampI ?? 0.9, 22, 1.4); pl.position.set(x, h - 1.4, z0 + d * 0.45); scene.add(pl); }
      }
    }
    if (o.details !== false) {
      const st = MAT.steel({ tint: 0x6e7378 }), yel = MAT.paint(0xd8a21c, { wear: 0.5, seed: 131 }), blk = MAT.flat(0x1b1e21, { rough: 0.7 }), gal = MAT.galv({ rep: [4, 1] }), cab = MAT.flat(0x1d2024, { rough: 0.75 });
      const D = new T.Group(); const bx = (w2, h2, d2, m, x, y, z) => { const b = box(w2, h2, d2, m, { cast: true }); b.position.set(x, y, z); D.add(b); return b; };
      for (let x = -w / 2 + 2; x <= w / 2 - 2; x += o.bay ?? 6) {
        bx(0.55, 0.03, 0.5, st, x, 0.015, z0 + 0.5);                                                                              // chapa de base da coluna
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([p, q]) => { const nb = cyl(0.025, 0.025, 0.04, st, 6, { cast: false }); nb.position.set(x + p * 0.2, 0.05, z0 + 0.5 + q * 0.18); D.add(nb); });
        bx(0.36, 0.9, 0.56, yel, x, 0.45, z0 + 0.5); bx(0.37, 0.12, 0.57, blk, x, 0.3, z0 + 0.5); bx(0.37, 0.12, 0.57, blk, x, 0.6, z0 + 0.5);   // proteção amarela e preta
      }
      if (!o.noBack) {
        bx(w * 0.96, 0.05, 0.4, gal, 0, 3.6, z0 + 0.3); bx(w * 0.96, 0.18, 0.02, gal, 0, 3.68, z0 + 0.1);                       // eletrocalha ao longo do fundo
        for (let i = 0; i < 4; i++) { const c = cyl(0.03 + (i % 2) * 0.012, 0.03 + (i % 2) * 0.012, w * 0.94, cab, 8, { cast: false }); c.rotation.z = Math.PI / 2; c.position.set(0, 3.66, z0 + 0.18 + i * 0.07); D.add(c); }
        for (let x = -w * 0.46; x <= w * 0.46; x += 2.4) { bx(0.05, 0.6, 0.05, gal, x, 3.3, z0 + 0.1); bx(0.06, 0.04, 0.4, st, x, 3.57, z0 + 0.3); }
      }
      // grelhas de piso (drenos)
      [[-w * 0.3, z0 + d * 0.4], [w * 0.28, z0 + d * 0.55], [0, z0 + d * 0.8]].forEach(([gx, gz]) => { bx(1.0, 0.012, 0.55, blk, gx, 0.008, gz); for (let k = -4; k <= 4; k++) bx(0.02, 0.014, 0.5, st, gx + k * 0.1, 0.012, gz); });
      scene.add(bake(D));
      // extintor + sinalização
      const ex = new T.Group(); const red = MAT.paint(0xb3261e, { wear: 0.2, seed: 141 });
      ex.add(at(cyl(0.11, 0.11, 0.55, red, 20), 0, 0.42, 0)); ex.add(at(cyl(0.07, 0.11, 0.08, red, 20), 0, 0.73, 0)); ex.add(at(cyl(0.035, 0.035, 0.1, st, 10), 0, 0.82, 0));
      ex.add(at(box(0.16, 0.03, 0.03, blk), 0.04, 0.88, 0)); ex.add(at(torus(0.06, 0.01, blk, Math.PI, { cast: false }), 0.09, 0.78, 0)); ex.add(at(cyl(0.012, 0.012, 0.4, blk, 6), 0.12, 0.62, 0));
      ex.add(at(rbox(0.13, 0.06, 0.012, MAT.flat(0xeceae4, { rough: 0.4 }), 0.004), 0, 0.5, 0.112));
      ex.add(at(cyl(0.13, 0.13, 0.02, blk, 20), 0, 0.2, 0)); bake(ex); ex.position.set(-w / 2 + 0.6, 0, z0 + d * 0.5); scene.add(ex);
      if (!o.noSides) { const sg = plate(['EXTINTOR', 'CO₂ · 6 kg'], 0.5, 0.28, { bg: '#b3261e', fg: '#ffffff' }); sg.rotation.y = Math.PI / 2; scene.add(at(sg, -w / 2 + 0.03, 1.7, z0 + d * 0.5)); }
      if (!o.noBack) { scene.add(at(plate(['ÁREA OPERACIONAL', 'EPI OBRIGATÓRIO'], 1.5, 0.55, { bg: '#1f6f3f', fg: '#ffffff', h: 220, w: 600, size: 44 }), w * 0.12, 2.6, z0 + 0.03));
        scene.add(at(plate(['ATENÇÃO', 'EQUIPAMENTO EM OPERAÇÃO'], 1.5, 0.55, { bg: '#d9a21c', fg: '#1b1f24', h: 220, w: 600, size: 44 }), -w * 0.22, 2.6, z0 + 0.03)); }
    }
    if (o.decals !== false) { const R = rng((o.seed ?? 7) * 101 + 3); for (let i = 0; i < 6; i++) stain(ctx, (R() - 0.5) * (w - 2), z0 + 2 + R() * (d - 3), 0.7 + R() * 1.6, i + 1, { alpha: 70 + R() * 90 }); }
    if (o.roof !== false) { const roof = mesh(new T.PlaneGeometry(w, d), MAT.corr(0x6b7277, [w / 2.4, 1]), { cast: false }); roof.rotation.x = Math.PI / 2; at(roof, 0, h + 0.62, z0 + d / 2); roof.material.side = T.DoubleSide; scene.add(roof); }
  }
  let _halo; const haloTex = () => _halo || (_halo = new T.CanvasTexture(canvas(64, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.25, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); })));
  /* manchas de óleo e marcas de uso no piso (decalques) */
  function stain(ctx, x, z, size = 1.2, seed = 1, o = {}) {
    const R = rng(seed * 977 + 13);
    const c = canvas(128, (g, s) => { const im = g.createImageData(s, s), n = fbm(s, 5, 4, seed * 31 + 5); for (let y = 0; y < s; y++) for (let x2 = 0; x2 < s; x2++) { const dx = x2 / s * 2 - 1, dy = y / s * 2 - 1, r = Math.hypot(dx, dy) * (0.85 + (n[y * s + x2] - 0.5) * 0.9); const a = Math.max(0, 1 - r * r * 1.15); const i = (y * s + x2) * 4; im.data[i] = 22; im.data[i + 1] = 18; im.data[i + 2] = 14; im.data[i + 3] = Math.min(1, a * 1.5) * (o.alpha ?? 150); } g.putImageData(im, 0, 0); });
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    const m = std({ map: t, transparent: true, depthWrite: false, roughness: 0.22, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const p = mesh(new T.PlaneGeometry(size, size * (0.7 + R() * 0.5)), m, { cast: false }); p.rotation.x = -Math.PI / 2; p.rotation.z = R() * 6.28; at(p, x, 0.004 + R() * 0.002, z); p.userData.through = true; ctx.scene.add(p); return p;
  }
  function floorLine(ctx, x, z, len, rot = 0, color = 0xd9a21c, wid = 0.1) {
    const m = MAT.paint(color, { wear: 0.9, seed: 71, rough: 0.8, metal: 0 }); m.transparent = false;
    const p = mesh(new T.PlaneGeometry(len, wid), m, { cast: false }); p.rotation.x = -Math.PI / 2; p.rotation.z = rot; at(p, x, 0.006, z); ctx.scene.add(p); return p;
  }
  function beams(ctx, list) {
    const c = canvas(128, (g, s) => { const im = g.createImageData(s, s); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const u = x / (s - 1) * 2 - 1, v = y / (s - 1); const a = 0.2 * Math.pow(1 - v, 1.4) * Math.pow(Math.max(0, 1 - u * u), 1.6) * (0.55 + 0.45 * Math.sin(u * 7 + v * 3) ** 2); const i = (y * s + x) * 4; im.data[i] = 255; im.data[i + 1] = 240; im.data[i + 2] = 215; im.data[i + 3] = a * 255; } g.putImageData(im, 0, 0); });
    const t = new T.CanvasTexture(c);
    list.forEach(([x, y, z, w, h, ry, rx]) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false })); m.position.set(x, y, z); m.rotation.set(rx ?? -0.5, ry ?? 0, 0); m.userData.through = true; ctx.scene.add(m); });
  }
  function dust(ctx, n = 350, area = [30, 8, 20], color = 0xfff1dc, center = [0, 3, 0]) {
    const g = new T.BufferGeometry(); const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = center[0] + (Math.random() - 0.5) * area[0]; p[i * 3 + 1] = center[1] + Math.random() * area[1]; p[i * 3 + 2] = center[2] + (Math.random() - 0.5) * area[2]; }
    g.setAttribute('position', new T.BufferAttribute(p, 3));
    const spr = new T.CanvasTexture(canvas(32, (c, s) => { const gr = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, s, s); }));
    const pts = new T.Points(g, new T.PointsMaterial({ color, size: 0.05, map: spr, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending }));
    pts.userData.through = true; ctx.scene.add(pts);
    ctx.tick((dt) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { a[i * 3 + 1] += dt * 0.05 * ((i % 5) - 2) * 0.3; a[i * 3] += dt * 0.04; if (a[i * 3] > center[0] + area[0] / 2) a[i * 3] -= area[0]; if (a[i * 3 + 1] > center[1] + area[1]) a[i * 3 + 1] = center[1]; if (a[i * 3 + 1] < center[1]) a[i * 3 + 1] = center[1] + area[1]; } g.attributes.position.needsUpdate = true; });
  }
  function steam(ctx, x, y, z, n = 18, spread = 0.4) {
    const tx = new T.CanvasTexture(canvas(64, (c, s) => { const gr = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, s, s); }));
    const list = []; const grp = new T.Group(); grp.userData.through = true;
    for (let i = 0; i < n; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0.4, color: 0xeef2f5 })); sp.userData = { ph: Math.random(), dx: (Math.random() - 0.5) * spread, through: true }; grp.add(sp); list.push(sp); }
    ctx.scene.add(grp); const st = { on: true, rate: 1 };
    ctx.tick((dt, t) => { grp.visible = st.on; list.forEach(s => { const p = (t * 0.28 * st.rate + s.userData.ph) % 1; s.position.set(x + s.userData.dx + p * 0.6, y + p * 2.2, z + Math.sin(t + s.userData.ph * 9) * 0.15); s.scale.setScalar(0.3 + p * 1.4); s.material.opacity = 0.45 * (1 - p) * Math.min(1, p * 6); }); });
    return st;
  }

  return { create, shed, stain, bake, bolts, floorLine, beams, dust, steam, MAT, mesh, rbox, box, cyl, cylX, cylZ, sphere, torus, at, ibeam, plate, textPlate, padlock, person, LOW };
})();
