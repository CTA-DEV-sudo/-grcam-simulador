/* Cenas 3D das situações: casa de bombas (Refinaria), ponte rolante (Redução) e correia transportadora (Porto) */
const SCN = (() => {
  const { MAT, mesh, rbox, box, cyl, cylX, cylZ, sphere, torus, at, ibeam, plate, padlock, person, bake, bolts } = W;
  const T = THREE;

  function dialTex(max = 10, unit = 'bar') {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#f4f2ec'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
    g.strokeStyle = '#1b1f24'; g.lineWidth = 3; g.font = '600 22px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1b1f24';
    for (let i = 0; i <= max * 2; i++) { const a = (-225 + i / (max * 2) * 270) * Math.PI / 180; const r1 = i % 2 ? 100 : 92; g.lineWidth = i % 2 ? 2 : 4; g.beginPath(); g.moveTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1); g.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); g.stroke(); if (!(i % 2)) g.fillText(String(i / 2), 128 + Math.cos(a) * 74, 128 + Math.sin(a) * 74); }
    g.strokeStyle = '#b3261e'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 108, (-225 + 0.7 * 270) * Math.PI / 180, 45 * Math.PI / 180); g.stroke();
    g.font = '600 20px "IBM Plex Mono", monospace'; g.fillText(unit, 128, 180);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  const boltM = () => MAT.steel({ tint: 0x6e7378 });
  /* porcas/parafusos sextavados em posições arbitrárias, fundidos numa malha só */
  function boltsAt(list, o = {}) {
    const g = new T.Group(), m = o.mat || boltM(), r = o.r ?? 0.03, h = o.h ?? 0.035;
    list.forEach(([x, y, z, ax]) => { const b = new T.Mesh(new T.CylinderGeometry(r, r, h, 6), m); b.castShadow = true; b.position.set(x, y, z); if (ax === 'x') b.rotation.z = Math.PI / 2; if (ax === 'z') b.rotation.x = Math.PI / 2; g.add(b);
      if (o.stud) { const st = new T.Mesh(new T.CylinderGeometry(r * 0.42, r * 0.42, o.stud, 8), m); st.position.set(x, y + (o.stud + h) / 2, z); g.add(st); } });
    return bake(g);
  }
  /* anéis de isolamento térmico (abraçadeiras) ao longo de um tubo horizontal em X */
  function bandsX(x0, x1, step, y, z, r, mat) {
    const g = new T.Group(); for (let x = x0; x <= x1; x += step) { const t = torus(r, 0.012, mat, Math.PI * 2, { cast: false }); t.rotation.y = Math.PI / 2; t.position.set(x, y, z); g.add(t); }
    return bake(g);
  }
  function handwheel(r, color = 0x8a2a1f) {
    const g = new T.Group(); const m = MAT.paint(color, { wear: 0.45, seed: 81 }), hubM = MAT.steel({ tint: 0x777b80 });
    g.add(torus(r, r * 0.085, m));                                              // aro
    for (let i = 0; i < 6; i++) { const sp = box(r * 1.9, r * 0.1, r * 0.075, m); sp.rotation.z = i * Math.PI / 6; g.add(sp); }   // 6 raios
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const k = rbox(r * 0.07, r * 0.2, r * 0.07, m, 0.01); k.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); k.rotation.z = a; g.add(k); }   // ressaltos do aro
    g.add(cylZ(r * 0.2, r * 0.3, m, 20)); g.add(at(cylZ(r * 0.11, r * 0.4, hubM, 6), 0, 0, r * 0.1));
    return bake(g);
  }
  function flange(r, x, y, z, axis = 'x', mat) {
    const f = axis === 'x' ? cylX(r, 0.07, mat, 40) : axis === 'z' ? cylZ(r, 0.07, mat, 40) : cyl(r, r, 0.07, mat, 40);
    const g = new T.Group(); g.add(f);
    [-1, 1].forEach(sd => { const b = bolts(8, r * 0.78, boltM(), axis, { r: r * 0.065, h: r * 0.09, off: sd * (0.035 + r * 0.045) }); g.add(b); });
    return at(bake(g), x, y, z);
  }
  function gateValve(ctx, x, y, z, axis, wheelDir, mat) {
    const g = new T.Group(); const body = MAT.paint(0x2e3338, { wear: 0.4, seed: 83 }), steel = MAT.steel(), brass = MAT.flat(0xb08d3a, { rough: 0.35, metal: 0.8 });
    g.add(at(rbox(0.55, 0.62, 0.55, body, 0.1), 0, 0, 0));
    g.add(at(rbox(0.62, 0.07, 0.62, body, 0.03), 0, -0.2, 0)); g.add(at(rbox(0.62, 0.07, 0.62, body, 0.03), 0, 0.2, 0));      // nervuras do corpo
    if (axis === 'x') { g.add(at(cylX(0.27, 0.8, body, 32), 0, 0, 0)); g.add(flange(0.38, -0.34, 0, 0, 'x', body)); g.add(flange(0.38, 0.34, 0, 0, 'x', body)); }
    else { g.add(at(cyl(0.27, 0.27, 0.8, body, 32), 0, 0, 0)); g.add(flange(0.36, 0, -0.35, 0, 'y', body)); g.add(flange(0.36, 0, 0.35, 0, 'y', body)); }
    g.add(at(rbox(0.22, 0.1, 0.012, brass, 0.004), 0, -0.06, axis === 'x' ? 0.28 : 0.28));                                      // plaqueta de identificação
    // conjunto superior (haste, castelo, yoke e volante), construído para cima e girado se preciso
    const top = new T.Group();
    top.add(at(cyl(0.27, 0.27, 0.05, body, 32), 0, 0.325, 0)); top.add(bolts(6, 0.22, boltM(), 'y', { r: 0.024, h: 0.03, off: 0.365 }));
    top.add(at(cyl(0.18, 0.22, 0.24, body, 28), 0, 0.45, 0));
    top.add(at(cyl(0.13, 0.13, 0.05, steel, 24), 0, 0.59, 0)); top.add(bolts(2, 0.1, boltM(), 'y', { r: 0.02, h: 0.04, off: 0.63 }));  // sobreposta de gaxeta
    [-1, 1].forEach(sd => top.add(at(box(0.045, 0.36, 0.045, body), sd * 0.16, 0.76, 0))); // colunas do yoke
    top.add(at(rbox(0.4, 0.05, 0.1, body, 0.01), 0, 0.95, 0)); top.add(at(cyl(0.07, 0.07, 0.07, steel, 6), 0, 1.0, 0));
    top.add(at(cyl(0.035, 0.035, 0.62, steel, 12), 0, 0.8, 0));                                                                // haste
    for (let i = 0; i < 9; i++) top.add(at(cyl(0.041, 0.041, 0.008, steel, 12), 0, 0.5 + i * 0.045, 0));                        // rosca
    top.add(at(cyl(0.05, 0.05, 0.05, steel, 6), 0, 1.12, 0));                                                                   // porca do volante
    const hw = handwheel(0.3); hw.rotation.x = Math.PI / 2; hw.position.set(0, 1.05, 0); hw.userData.dyn = true; top.add(hw);
    if (wheelDir !== 'up') top.rotation.x = Math.PI / 2;
    g.add(top); bake(g);
    at(g, x, y, z); g.userData.wheel = hw; return g;
  }
  function cabinet(w, h, d, color, wear = 0.25, seed = 91) {
    const g = new T.Group(), pm = MAT.paint(color, { wear, seed, rep: [1, 1] }), dk = MAT.flat(0x2a2d30, { rough: 0.5, metal: 0.5 });
    g.add(rbox(w, h, d, pm, 0.03));
    g.add(at(rbox(w + 0.04, 0.03, d + 0.04, pm, 0.01), 0, h / 2, 0));                               // aba do teto
    g.add(at(rbox(w + 0.02, Math.max(0.05, h * 0.05), d + 0.02, dk, 0.01), 0, -h / 2 + Math.max(0.05, h * 0.05) / 2, 0)); // rodapé
    const fz = d / 2 + 0.002;
    g.add(at(box(w * 0.94, 0.004, 0.004, dk), 0, h * 0.46, fz)); g.add(at(box(w * 0.94, 0.004, 0.004, dk), 0, -h * 0.42, fz));
    [-1, 1].forEach(sd => g.add(at(box(0.004, h * 0.88, 0.004, dk), sd * w * 0.47, 0.02 * h, fz)));
    g.add(at(rbox(0.02, Math.min(0.2, h * 0.13), 0.028, dk, 0.008), w * 0.36, 0, d / 2 + 0.012)); g.add(at(cyl(0.02, 0.02, 0.02, MAT.steel(), 12), w * 0.36, -Math.min(0.2, h * 0.13) * 0.8, d / 2 + 0.006).rotateX(Math.PI / 2));
    for (let i = 0; i < 3; i++) g.add(at(box(0.022, Math.min(0.08, h * 0.07), 0.016, dk), -w * 0.5 + 0.005, (i - 1) * h * 0.32, d / 2 - 0.01));   // dobradiças
    if (h > 0.9) for (let i = 0; i < 5; i++) g.add(at(box(w * 0.5, 0.012, 0.006, dk), -w * 0.12, h * 0.36 - i * 0.025, fz));                          // venezianas
    g.add(boltsAt([[w * 0.45, h * 0.5 + 0.02, d * 0.45], [-w * 0.45, h * 0.5 + 0.02, d * 0.45], [w * 0.45, h * 0.5 + 0.02, -d * 0.45], [-w * 0.45, h * 0.5 + 0.02, -d * 0.45]], { r: 0.02, h: 0.02 }));
    return bake(g);
  }
  function lamp(color, on) { return sphere(0.04, MAT.flat(color, { emissive: color, ei: on ? 2.5 : 0.05, rough: 0.2 }), { cast: false }, 16, 10); }
  function setLamp(m, on) { m.material.emissiveIntensity = on ? 2.5 : 0.05; }

  /* ================= REFINARIA · BP-201 ================= */
  /* ================= ENTORNO: fundo e arredores de cada cena (tudo fundido por material, poucas chamadas de desenho) ================= */
  const UPV = new T.Vector3(0, 1, 0);
  function rod(g, a, b, r, mat, seg = 10, o) {                                   // cilindro entre dois pontos
    const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), L = d.length();
    const m = cyl(r, r, L, mat, seg, o || { recv: false }); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UPV, d.normalize()); g.add(m); return m;
  }
  function pipePath(g, pts, r, mat) {                                             // tubulação com joelhos
    for (let i = 0; i < pts.length - 1; i++) rod(g, pts[i], pts[i + 1], r, mat, 14);
    for (let i = 1; i < pts.length - 1; i++) g.add(at(sphere(r, mat, { recv: false }, 14, 10), ...pts[i]));
  }
  function railing(g, a, b, mat, o = {}) {                                        // guarda-corpo: postes, 2 corrimãos e rodapé
    const A = new T.Vector3(...a), B = new T.Vector3(...b), L = A.distanceTo(B), n = Math.max(1, Math.ceil(L / 1.4));
    for (let i = 0; i <= n; i++) { const p = A.clone().lerp(B, i / n); g.add(at(cyl(0.024, 0.024, 1.05, mat, 8, { recv: false }), p.x, p.y + 0.525, p.z)); }
    [1.05, 0.55].forEach(h => rod(g, [A.x, A.y + h, A.z], [B.x, B.y + h, B.z], 0.021, mat, 8));
    if (!o.noToe && Math.abs(A.y - B.y) < 0.01) { const t = box(L, 0.1, 0.02, mat, { recv: false }); t.position.set((A.x + B.x) / 2, A.y + 0.05, (A.z + B.z) / 2); t.rotation.y = -Math.atan2(B.z - A.z, B.x - A.x); g.add(t); }
  }
  function stairs(g, x0, z0, x1, z1, y1, w, mat, rmat) {                          // escada industrial com degraus, longarinas e corrimãos
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, px = -uz, pz = ux, n = Math.max(4, Math.round(y1 / 0.19)), run = L / n, rot = -Math.atan2(uz, ux), rise = y1 / n;
    for (let i = 0; i < n; i++) {
      const c = (i + 0.5) * run, t = box(run + 0.03, 0.04, w, mat); t.position.set(x0 + ux * c, (i + 1) * rise - 0.02, z0 + uz * c); t.rotation.y = rot; g.add(t);
      const r = box(0.014, rise - 0.02, w - 0.04, mat, { cast: false }); r.position.set(x0 + ux * i * run, (i + 0.5) * rise, z0 + uz * i * run); r.rotation.y = rot; g.add(r);
    }
    [-1, 1].forEach(s => { const ox = px * s * w / 2, oz = pz * s * w / 2; rod(g, [x0 + ox, 0.12, z0 + oz], [x1 + ox, y1 - 0.12, z1 + oz], 0.05, mat, 8); railing(g, [x0 + ox, 0, z0 + oz], [x1 + ox, y1, z1 + oz], rmat, { noToe: true }); });
  }
  let _hatch;
  function hatchMat() {
    if (_hatch) return _hatch; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#d8a21c'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#1b1e21'; for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 32, 128); g.lineTo(i * 32 + 16, 128); g.lineTo(i * 32 + 144, 0); g.lineTo(i * 32 + 128, 0); g.fill(); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    return _hatch = new T.MeshStandardMaterial({ map: t, roughness: 0.78, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  }
  function hatchStrip(g, x, z, len, wid, rot = 0) {                                // faixa zebrada amarela e preta no piso
    const geo = new T.PlaneGeometry(len, wid), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / (wid * 2), uv.getY(i) * 0.5);
    const m = new T.Mesh(geo, hatchMat()); m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, 0.008, z); m.receiveShadow = true; m.userData.through = true; g.add(m); return m;
  }
  function eyewash(ctx, g, x, z, wallX) {                                           // chuveiro de emergência + lava-olhos
    const w = Math.sign(wallX), gal = MAT.galv(), st = MAT.steel({ tint: 0x9a9ea3 }), gr = MAT.paint(0x2f8a4a, { wear: 0.3, seed: 181 }), yl = MAT.paint(0xd8a21c, { wear: 0.4, seed: 183 });
    g.add(at(box(0.4, 0.03, 0.4, st), x, 0.015, z)); g.add(at(cyl(0.045, 0.045, 2.5, gal, 12), x, 1.25, z));
    rod(g, [x, 2.4, z], [x - w * 0.34, 2.4, z], 0.035, gal, 10); g.add(at(cyl(0.25, 0.11, 0.1, gr, 24), x - w * 0.34, 2.33, z)); g.add(at(cyl(0.06, 0.06, 0.05, st, 10), x - w * 0.34, 2.4, z));
    rod(g, [x - w * 0.34, 2.28, z], [x - w * 0.34, 1.65, z], 0.006, st, 5); g.add(at(torus(0.07, 0.012, yl), x - w * 0.34, 1.6, z));                // corrente e triângulo de acionamento
    rod(g, [x, 1.0, z], [x - w * 0.3, 1.0, z], 0.03, gal, 10); g.add(at(cyl(0.23, 0.15, 0.1, gr, 24), x - w * 0.3, 1.02, z));
    [-0.1, 0.1].forEach(dz => g.add(at(cyl(0.02, 0.02, 0.1, st, 8), x - w * 0.3, 1.1, z + dz)));
    rod(g, [x, 0.4, z], [x - w * 0.3, 0.2, z], 0.02, st, 8); g.add(at(box(0.18, 0.03, 0.12, yl), x - w * 0.3, 0.17, z));                           // pedal
    const ring = new T.Mesh(new T.RingGeometry(0.92, 1.02, 40), MAT.flat(0x2f8a4a, { rough: 0.8 })); ring.rotation.x = -Math.PI / 2; ring.position.set(x - w * 0.3, 0.009, z); ring.userData.through = true; ring.receiveShadow = true; g.add(ring);
    const sg = plate(['CHUVEIRO DE', 'EMERGÊNCIA'], 0.8, 0.4, { bg: '#1f6f3f', fg: '#ffffff', h: 220, w: 440, size: 46 }); sg.rotation.y = w > 0 ? -Math.PI / 2 : Math.PI / 2; ctx.scene.add(at(sg, wallX - w * 0.03, 2.5, z));
  }

  function envPump(ctx) {
    const { scene } = ctx, D = new T.Group();
    const st = MAT.steel({ tint: 0x6e7378 }), gal = MAT.galv({ rep: [4, 1] }), yel = MAT.paint(0xd8a21c, { wear: 0.5, seed: 131 }), blk = MAT.flat(0x1b1e21, { rough: 0.7 }), conc = MAT.concrete([2, 1], 0x8a8b89, 17);
    const blue = MAT.paint(0x3c5a73, { wear: 0.4, seed: 171 }), red = MAT.paint(0xb3261e, { wear: 0.3, seed: 173 }), grn = MAT.paint(0x2f6f4a, { wear: 0.3, seed: 175 }), ylw = MAT.paint(0xd2a024, { wear: 0.3, seed: 177 }), dgr = MAT.paint(0x4a5258, { wear: 0.5, seed: 179 });
    const brass = MAT.flat(0xb08d3a, { rough: 0.35, metal: 0.8 }), bx = (w, h, d, m, x, y, z, o) => { const b = box(w, h, d, m, o); b.position.set(x, y, z); D.add(b); return b; };
    // --- bacia de contenção do vaso TQ-205
    { const cx = 13, cz = -5.2, s = 4.8, t = 0.22, h = 0.22, pad = MAT.flat(0x4a4d4f, { rough: 0.5, metal: 0.05 });
      [-1, 1].forEach(k => { bx(s + t, h, t, conc, cx, h / 2, cz + k * s / 2); bx(t, h, s, conc, cx + k * s / 2, h / 2, cz); bx(s + t, 0.012, 0.08, yel, cx, h + 0.006, cz + k * s / 2); bx(0.08, 0.012, s, yel, cx + k * s / 2, h + 0.006, cz); });
      bx(s, 0.01, s, pad, cx, 0.006, cz, { cast: false }); bx(0.5, 0.012, 0.5, blk, cx - 1.6, 0.012, cz + 1.7, { cast: false }); for (let k = -2; k <= 2; k++) bx(0.02, 0.014, 0.46, st, cx - 1.6 + k * 0.09, 0.016, cz + 1.7, { cast: false }); }
    // --- trocador de calor casco e tubos TC-203
    { const ex = -11.5, ez = -3.6, ey = 1.2, bm = MAT.steel({ tint: 0x6e7378 });
      D.add(at(cylX(0.58, 4.4, blue, 40), ex, ey, ez));
      [-1, 1].forEach(sd => {
        D.add(at(cylX(0.63, 0.45, blue, 40), ex + sd * 2.42, ey, ez)); const dome = sphere(0.63, blue, undefined, 32, 14); dome.scale.set(0.42, 1, 1); D.add(at(dome, ex + sd * 2.62, ey, ez));
        const fl = torus(0.64, 0.045, st); fl.rotation.y = Math.PI / 2; D.add(at(fl, ex + sd * 2.18, ey, ez)); D.add(at(bolts(18, 0.6, bm, 'x', { r: 0.024, h: 0.04 }), ex + sd * 2.18, ey, ez));
        D.add(at(rbox(0.5, 0.62, 0.9, dgr, 0.03), ex + sd * 1.45, 0.31, ez)); D.add(at(box(0.7, 0.03, 1.1, st), ex + sd * 1.45, 0.015, ez));
        D.add(boltsAt([[ex + sd * 1.45 - 0.25, 0.04, ez - 0.45], [ex + sd * 1.45 + 0.25, 0.04, ez - 0.45], [ex + sd * 1.45 - 0.25, 0.04, ez + 0.45], [ex + sd * 1.45 + 0.25, 0.04, ez + 0.45]], { r: 0.035, h: 0.04, stud: 0.05 }));
      });
      D.add(at(cylX(0.66, 0.06, st, 40), ex + 0.2, ey, ez)); [-1, 1].forEach(sd => D.add(at(box(0.04, 0.12, 0.12, st), ex + 0.2, ey + sd * 0.6, ez)));      // anel de dilatação do casco
      [[ex - 1.5, 3.8, -6.0, 5.65, grn], [ex + 0.9, 4.5, -6.75, 5.62, ylw]].forEach(([nx, my, tz, up, pm]) => {
        D.add(at(cyl(0.17, 0.17, 0.55, blue, 20), nx, ey + 0.58 + 0.27, ez)); D.add(at(cyl(0.27, 0.27, 0.05, st, 24), nx, ey + 0.58 + 0.57, ez)); D.add(at(bolts(8, 0.22, bm, 'y', { r: 0.02, h: 0.03, off: 0.04 }), nx, ey + 0.58 + 0.57, ez));
        pipePath(D, [[nx, ey + 1.2, ez], [nx, my, ez], [nx, my, tz], [nx, up, tz]], 0.14, pm);
        D.add(at(cyl(0.24, 0.24, 0.045, st, 20), nx, 3.0, ez)); D.add(at(bolts(8, 0.2, bm, 'y', { r: 0.018, h: 0.03, off: 0.03 }), nx, 3.0, ez));
        D.add(at(cyl(0.02, 0.02, 0.04, st, 8), nx + 0.17, 2.6, ez));
      });
      scene.add(at(plate(['TC-203', 'CASCO E TUBOS'], 0.9, 0.32, { bg: '#e9e6dc', fg: '#1b1f24' }), ex, ey - 0.05, ez + 0.595)); }
    // --- plataforma de manutenção com escada (parede esquerda)
    { const px = -16.65, y = 3.3, z0 = -7.9, z1 = -2.2, zc = (z0 + z1) / 2, L = z1 - z0;
      bx(1.7, 0.06, L, gal, px, y, zc); [-0.78, 0.78].forEach(o => bx(0.1, 0.2, L, st, px + o, y - 0.13, zc));
      [[px + 0.78, z0 + 0.1], [px + 0.78, z1 - 0.1], [px - 0.78, z0 + 0.1], [px - 0.78, z1 - 0.1]].forEach(([x, z]) => bx(0.14, y, 0.14, st, x, y / 2, z));
      rod(D, [px + 0.78, 0.3, z1 - 0.1], [px + 0.78, y - 0.3, zc], 0.035, st, 8); rod(D, [px + 0.78, 0.3, z0 + 0.1], [px + 0.78, y - 0.3, zc], 0.035, st, 8);
      railing(D, [px + 0.82, y, z0], [px + 0.82, y, z1 + 0.1], yel); railing(D, [px - 0.82, y, z0], [px - 0.82, y, z1], yel); railing(D, [px - 0.82, y, z0], [px + 0.82, y, z0], yel);
      stairs(D, px, 2.8, px, z1, y, 0.9, gal, yel);
      const cb = cabinet(0.8, 1.4, 0.5, 0xc5c7c2, 0.3, 185); D.add(at(cb, px - 0.35, y + 0.03 + 0.7, z0 + 0.4)); scene.add(at(plate(['AT-201', 'ANALISADOR'], 0.6, 0.2, { bg: '#1b1f24', fg: '#f2f2f2' }), px - 0.35, y + 1.15, z0 + 0.66));
      bx(0.5, 0.05, 0.4, blk, px + 0.2, y + 0.05, z0 + 0.5); rod(D, [px + 0.2, y + 0.05, z0 + 0.5], [px + 0.2, y + 1.6, z0 + 0.5], 0.03, st, 8); D.add(at(rbox(0.45, 0.16, 0.2, ylw, 0.03), px + 0.2, y + 1.65, z0 + 0.5)); }
    // --- chuveiro de emergência, hidrante e porta de rolo (parede direita / fundo)
    eyewash(ctx, D, 16.9, 7.0, 17.97);
    { const hc = cabinet(0.9, 1.2, 0.3, 0xb3261e, 0.3, 187); D.add(at(hc, 9.9, 1.4, -8.8)); scene.add(at(plate(['HIDRANTE'], 0.8, 0.16, { bg: '#f1efe8', fg: '#b3261e' }), 9.9, 2.18, -8.64)); [-0.3, 0.3].forEach(o => bx(0.05, 0.8, 0.05, gal, 9.9 + o, 0.4, -8.82)); }
    { const dz = 12.5, dxw = 17.9, door = MAT.corr(0x5d6a72, [8, 1]);
      bx(0.1, 4.5, 4.0, door, dxw, 2.25, dz); [-1, 1].forEach(k => { bx(0.26, 4.8, 0.26, st, dxw - 0.02, 2.4, dz + k * 2.13); bx(0.06, 4.5, 0.1, yel, dxw - 0.08, 2.25, dz + k * 1.9); });
      bx(0.26, 0.3, 4.5, st, dxw - 0.02, 4.8, dz); D.add(at(cylZ(0.24, 4.2, gal, 20), dxw - 0.25, 4.55, dz)); bx(0.5, 0.45, 0.7, dgr, dxw - 0.25, 4.45, dz + 2.4); bx(0.06, 0.2, 3.9, blk, dxw - 0.08, 0.12, dz);
      for (let i = 1; i < 9; i++) bx(0.02, 0.025, 3.96, blk, dxw - 0.07, i * 0.5, dz, { cast: false });
      [-1, 1].forEach(k => { const p = cyl(0.1, 0.1, 1.1, yel, 14); p.position.set(dxw - 1.1, 0.55, dz + k * 2.5); D.add(p); bx(0.215, 0.2, 0.215, blk, dxw - 1.1, 0.3, dz + k * 2.5); });
      hatchStrip(D, dxw - 0.6, dz, 4.2, 0.4, Math.PI / 2);
      D.add(at(box(0.5, 0.2, 0.06, MAT.flat(0x1fbf5a, { emissive: 0x1fbf5a, ei: 1.4, rough: 0.5 }), { cast: false }), dxw - 0.1, 5.4, dz)); D.children[D.children.length - 1].rotation.y = Math.PI / 2; }
    // --- teto: duto de ar, sprinklers e eletrocalha
    { const dz = 8, dy = 8.3; bx(34, 0.7, 1.1, gal, 0, dy, dz);
      for (let x = -16; x <= 16; x += 4) { bx(0.06, 0.78, 1.18, st, x, dy, dz); }
      for (let x = -16; x <= 16; x += 6) [-0.4, 0.4].forEach(o => rod(D, [x, dy + 0.35, dz + o], [x, 10.0, dz + o], 0.018, st, 6));
      [-12, -6, 0, 6, 12].forEach(x => { bx(0.7, 0.05, 0.7, gal, x, dy - 0.375, dz); for (let k = -2; k <= 2; k++) bx(0.7, 0.015, 0.03, blk, x, dy - 0.41, dz + k * 0.13, { cast: false }); });
      const sy = 9.35, sz = -1.2; D.add(at(cylX(0.045, 34, red, 10), 0, sy, sz));
      for (let x = -16; x <= 16; x += 3.2) { D.add(at(cyl(0.012, 0.012, 0.16, st, 6), x, sy - 0.12, sz)); D.add(at(cyl(0.05, 0.012, 0.012, brass, 10), x, sy - 0.21, sz)); }
      for (let x = -16; x <= 16; x += 6) rod(D, [x, sy + 0.05, sz], [x, 10.0, sz], 0.012, st, 6);
      const ty = 7.5, tz = -3.0; bx(34, 0.04, 0.45, gal, 0, ty, tz); [-1, 1].forEach(k => bx(34, 0.1, 0.03, gal, 0, ty + 0.06, tz + k * 0.225));
      for (let i = 0; i < 3; i++) D.add(at(cylX(0.03, 33.5, blk, 8, { recv: false }), 0, ty + 0.06, tz - 0.12 + i * 0.12));
      for (let x = -16; x <= 16; x += 4) [-0.2, 0.2].forEach(o => rod(D, [x, ty, tz + o], [x, 10.0, tz + o], 0.012, st, 6)); }
    // --- paletes de tambores com bacia de contenção
    { const px = -14.2, pz = 8.2, ps = [MAT.paint(0x2f4f8f, { wear: 0.3, seed: 191 }), MAT.paint(0xb3261e, { wear: 0.3, seed: 193 }), MAT.paint(0x6c7a82, { wear: 0.3, seed: 195 })];
      bx(2.5, 0.18, 1.5, yel, px, 0.09, pz); [-1, 1].forEach(k => { bx(2.5, 0.14, 0.06, yel, px, 0.25, pz + k * 0.72); bx(0.06, 0.14, 1.5, yel, px + k * 1.22, 0.25, pz); }); bx(2.3, 0.03, 1.3, gal, px, 0.34, pz);
      [[-0.55, -0.32], [0.55, -0.32], [-0.55, 0.32], [0.55, 0.32]].forEach(([dx, dz], i) => { const x = px + dx, z = pz + dz, d = cyl(0.29, 0.29, 0.88, ps[i % 3], 24); D.add(at(d, x, 0.36 + 0.44, z));
        [0.3, 0.7].forEach(h => { const r = torus(0.295, 0.016, ps[i % 3], Math.PI * 2, { recv: false }); r.rotation.x = Math.PI / 2; D.add(at(r, x, 0.36 + h, z)); }); D.add(at(cyl(0.27, 0.27, 0.03, blk, 24), x, 0.36 + 0.89, z)); D.add(at(cyl(0.035, 0.035, 0.03, st, 8), x + 0.12, 0.36 + 0.92, z + 0.08)); });
      rod(D, [px + 1.0, 0.18, pz - 0.7], [px + 1.0, 1.7, pz - 0.7], 0.025, st, 8); scene.add(at(plate(['INFLAMÁVEL', 'SEM FAÍSCAS'], 0.7, 0.3, { bg: '#b3261e', fg: '#ffffff', h: 200, w: 460, size: 40 }), px + 1.0, 1.75, pz - 0.66)); }
    scene.add(bake(D));
  }

  function envCrane(ctx) {
    const { scene } = ctx, D = new T.Group();
    const st = MAT.steel({ tint: 0x6e7378 }), gal = MAT.galv({ rep: [4, 1] }), yel = MAT.paint(0xd8a21c, { wear: 0.5, seed: 131 }), blk = MAT.flat(0x1b1e21, { rough: 0.7 }), alum = MAT.steel({ tint: 0xd5d8db, seed: 15 });
    const groove = MAT.flat(0x9aa0a5, { rough: 0.4, metal: 0.9 }), glass = MAT.flat(0x1f3342, { rough: 0.08, metal: 0.7 }), cond = MAT.flat(0xb3261e, { rough: 0.5 }), wood = MAT.paint(0x8a6a44, { wear: 0.1, seed: 125, rough: 1, metal: 0 }), dgr = MAT.paint(0x4c5661, { wear: 0.5, seed: 201 }), cab = MAT.paint(0xc9ccc8, { wear: 0.3, seed: 203 }), ceram = MAT.flat(0xd9d6cc, { rough: 0.4, metal: 0.05 });
    const bx = (w, h, d, m, x, y, z, o) => { const b = box(w, h, d, m, o); b.position.set(x, y, z); D.add(b); return b; };
    // --- exaustão das cubas: duto principal, descidas, coifas e subida para o telhado
    { const dy = 6.6, dz = -7.6, px = [];
      for (let x = -18; x <= 18; x += 4.2) px.push(x);
      D.add(at(cylX(0.55, 37.6, gal, 32), 0, dy, dz));
      for (let x = -16; x <= 16; x += 4.2) { const f = torus(0.57, 0.035, st); f.rotation.y = Math.PI / 2; D.add(at(f, x, dy, dz)); }
      px.forEach(x => {
        D.add(at(cyl(0.2, 0.2, 4.15, gal, 16), x, 4.525, dz)); D.add(at(cyl(0.24, 0.24, 0.06, st, 16), x, 3.4, dz)); D.add(at(cyl(0.24, 0.24, 0.06, st, 16), x, 5.6, dz));
        D.add(at(cyl(0.25, 1.22, 0.9, gal, 28), x, 2.0, dz)); const lip = torus(1.22, 0.04, st); lip.rotation.x = Math.PI / 2; D.add(at(lip, x, 1.56, dz));
        bx(0.08, 0.08, 0.5, yel, x, 4.5, dz + 0.3); D.add(at(cyl(0.05, 0.05, 0.3, st, 10), x + 0.2, 4.5, dz)); });
      for (let x = -17; x <= 17; x += 4.2) { bx(0.14, 0.14, 2.0, st, x, dy - 0.7, -9.0); rod(D, [x, dy - 0.7, -8.0], [x, dy - 2.0, -9.9], 0.03, st, 6); }
      D.add(at(sphere(0.55, gal, undefined, 24, 14), 18.8, dy, dz)); D.add(at(cyl(0.55, 0.55, 7.2, gal, 28), 19, 10.2, dz)); D.add(at(cyl(0.8, 0.8, 0.08, st, 28), 19, 13.5, dz));
      scene.add(at(plate(['EXAUSTÃO DAS CUBAS', 'TRATAMENTO DE GASES'], 2.0, 0.5, { bg: '#1b1f24', fg: '#e8b93a', h: 200, w: 640, size: 40 }), 16.8, 7.7, -9.97)); }
    // --- barramentos de alta corrente na frente das cubas
    { bx(37.6, 0.1, 0.28, alum, 0, 0.35, -5.4); bx(37.6, 0.1, 0.28, alum, 0, 0.58, -5.4);
      for (let x = -18; x <= 18; x += 2.1) bx(0.16, 0.3, 0.16, ceram, x, 0.15, -5.4);
      for (let x = -18; x <= 18; x += 4.2) { bx(0.1, 1.0, 0.1, alum, x + 1.0, 0.65, -5.78); bx(0.1, 0.1, 0.4, alum, x + 1.0, 0.7, -5.6); } }
    // --- cerca de proteção da linha de cubas (com portão aberto junto ao QA-02)
    { const fz = -5.0, segs = [[-19.5, -6.4], [-4.0, 19.5]];
      segs.forEach(([a, b]) => { const L = b - a, cx = (a + b) / 2; bx(L, 0.05, 0.05, yel, cx, 1.05, fz); bx(L, 0.05, 0.05, yel, cx, 0.55, fz); bx(L, 0.1, 0.02, yel, cx, 0.05, fz); for (let x = a + 0.05; x <= b; x += 2.0) bx(0.07, 1.1, 0.07, yel, x, 0.55, fz); }); }
    // --- lingotes de alumínio em paletes
    { const stack = (x, z, n, rot) => { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rot; D.add(g);
        const a = box(1.3, 0.14, 1.0, wood); a.position.y = 0.07; g.add(a); [-0.45, 0, 0.45].forEach(o => { const f = box(0.14, 0.08, 1.0, wood); f.position.set(o, 0.18, 0); g.add(f); });
        for (let i = 0; i < n; i++) { const l = box(1.15, 0.17, 0.85, alum); l.position.set((((i * 7) % 5) - 2) * 0.008, 0.22 + (i + 0.5) * 0.175, (((i * 3) % 5) - 2) * 0.008); l.rotation.y = (((i * 11) % 7) - 3) * 0.006; g.add(l);
          const gr = box(1.0, 0.012, 0.04, groove, { cast: false }); gr.position.set(0, 0.22 + (i + 1) * 0.175 + 0.001, 0); g.add(gr); }
        const H = n * 0.175; [-0.3, 0.3].forEach(o => { const s = box(0.05, H, 0.9, blk, { cast: false }); s.position.set(o, 0.22 + H / 2, 0); g.add(s); }); };
      [[-16.2, 4.2, 10, 0.05], [-13.8, 4.2, 9, -0.04], [-16.2, 6.4, 8, 0.02], [-13.8, 6.4, 10, 0.06], [11.6, 6.0, 9, 0.03], [13.8, 6.0, 7, -0.05]].forEach(a => stack(...a)); }
    // --- sala de controle elevada, com escada
    { const cx = 16.8, cz = -2.1, fy = 2.86, z1 = cz + 1.3;
      bx(3.4, 0.12, 3.8, gal, cx, fy - 0.06, cz + 0.6); [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]].forEach(([dx, dz]) => bx(0.2, fy, 0.2, st, cx + dx, fy / 2, cz + dz));
      rod(D, [cx - 1.5, 0.3, cz + 1.2], [cx + 1.5, fy - 0.3, cz + 1.2], 0.035, st, 8); rod(D, [cx + 1.5, 0.3, cz + 1.2], [cx - 1.5, fy - 0.3, cz + 1.2], 0.035, st, 8);
      bx(3.2, 2.6, 2.6, cab, cx, fy + 1.3, cz); bx(3.5, 0.1, 2.9, st, cx, fy + 2.65, cz);
      bx(1.6, 0.95, 0.02, st, cx + 0.45, fy + 1.55, z1 + 0.012); bx(1.5, 0.85, 0.02, glass, cx + 0.45, fy + 1.55, z1 + 0.03, { cast: false });
      bx(0.95, 2.05, 0.05, dgr, cx - 1.0, fy + 1.03, z1 + 0.03); bx(0.4, 0.4, 0.02, glass, cx - 1.0, fy + 1.6, z1 + 0.07, { cast: false }); bx(0.05, 0.14, 0.05, st, cx - 0.65, fy + 1.0, z1 + 0.09);
      bx(0.9, 0.5, 0.45, dgr, cx + 1.85, fy + 1.4, cz); bx(0.2, 0.2, 0.2, MAT.flat(0xe8b93a, { emissive: 0xe8b93a, ei: 1.5, rough: 0.3 }), cx + 1.1, fy + 2.86, cz, { cast: false });
      stairs(D, cx + 0.3, 5.2, cx + 0.3, cz + 2.0, fy, 0.9, gal, yel);
      railing(D, [cx - 1.7, fy, cz + 1.3], [cx - 1.7, fy, cz + 2.4], yel); railing(D, [cx + 1.7, fy, cz + 1.3], [cx + 1.7, fy, cz + 2.4], yel); railing(D, [cx - 1.7, fy, cz + 2.4], [cx - 0.25, fy, cz + 2.4], yel); railing(D, [cx + 0.85, fy, cz + 2.4], [cx + 1.7, fy, cz + 2.4], yel);
      scene.add(at(plate(['SALA DE CONTROLE', 'CUBAS · LINHA 3'], 1.5, 0.34, { bg: '#1b1f24', fg: '#f2f2f2', h: 200, w: 640, size: 46 }), cx + 0.45, fy + 2.3, z1 + 0.04)); }
    // --- panela de metal líquido sobre carreta
    { const px = 12.4, pz = 1.5, pm = MAT.paint(0x2f3236, { wear: 0.5, seed: 205 }), glow = MAT.flat(0xff7a2a, { emissive: 0xff6a1a, ei: 2.0, rough: 0.6 });
      D.add(at(rbox(1.9, 0.3, 1.9, dgr, 0.03), px, 0.38, pz)); [[-0.7, -0.9], [0.7, -0.9], [-0.7, 0.9], [0.7, 0.9]].forEach(([dx, dz]) => { D.add(at(cylZ(0.17, 0.1, blk, 18), px + dx, 0.17, pz + dz)); D.add(at(cylZ(0.07, 0.12, st, 10), px + dx, 0.17, pz + dz)); });
      rod(D, [px - 0.9, 0.38, pz], [px - 2.4, 0.2, pz], 0.04, st, 8); D.add(at(torus(0.14, 0.03, st), px - 2.45, 0.2, pz));
      D.add(at(cyl(0.8, 0.6, 1.5, pm, 32), px, 1.28, pz)); [1.0, 1.6].forEach(h => { const b = torus(h > 1.3 ? 0.78 : 0.68, 0.03, st); b.rotation.x = Math.PI / 2; D.add(at(b, px, h, pz)); });
      const rim = torus(0.8, 0.05, st); rim.rotation.x = Math.PI / 2; D.add(at(rim, px, 2.03, pz)); const gd = new T.Mesh(new T.CircleGeometry(0.74, 28), glow); gd.rotation.x = -Math.PI / 2; gd.position.set(px, 2.0, pz); gd.userData.through = true; D.add(gd);
      D.add(at(cylZ(0.06, 2.1, st, 10), px, 1.7, pz)); [-1, 1].forEach(k => D.add(at(rbox(0.16, 0.3, 0.1, st, 0.02), px, 1.7, pz + k * 0.75)));
      D.add(at(rbox(0.3, 0.16, 0.5, pm, 0.03), px + 0.85, 2.0, pz)); }
    // --- batentes do caminho de rolamento, condutor da ponte e purlins
    [[-8.2, -8.4], [8.2, -8.4], [-8.2, 8.4], [8.2, 8.4]].forEach(([x, z]) => { bx(0.3, 0.3, 0.3, yel, x, 9.08, z); D.add(at(cylZ(0.11, 0.15, blk, 14), x, 9.08, z + Math.sign(z) * -0.22)); bx(0.5, 0.05, 0.5, st, x, 8.92, z); });
    [-9.0, -8.85, -8.7].forEach(x => D.add(at(cylZ(0.02, 15.5, cond, 6, { recv: false }), x, 8.05, 0)));
    for (let z = -6.5; z <= 6.5; z += 3.25) bx(0.3, 0.08, 0.05, st, -8.85, 8.05, z);
    for (let z = -6; z <= 14; z += 3.5) bx(40, 0.16, 0.1, gal, 0, 12.9, z, { cast: false });
    // --- exaustores na parede esquerda e chuveiro de emergência
    [2, 9].forEach(z => { const x = -19.88, y = 8.6, ring = torus(0.88, 0.07, st); ring.rotation.y = Math.PI / 2; D.add(at(ring, x, y, z)); D.add(at(cylX(0.14, 0.2, st, 14), x, y, z));
      for (let i = 0; i < 6; i++) { const f = i / 6 * Math.PI * 2, b = box(0.03, 0.7, 0.2, dgr, { cast: false }); b.position.set(x, y + Math.cos(f) * 0.45, z + Math.sin(f) * 0.45); b.rotation.set(f, 0, 0.35); D.add(b); }
      [0.5, 0.82].forEach(r => { const g2 = torus(r, 0.012, st, Math.PI * 2, { cast: false }); g2.rotation.y = Math.PI / 2; D.add(at(g2, x + 0.05, y, z)); });
      for (let i = 0; i < 4; i++) { const b = box(0.02, 1.7, 0.02, st, { cast: false }); b.position.set(x + 0.05, y, z); b.rotation.x = i * Math.PI / 4; D.add(b); } });
    eyewash(ctx, D, -19.1, 14.5, -19.97);
    scene.add(at(plate(['ATENÇÃO', 'ALTA TEMPERATURA'], 1.5, 0.55, { bg: '#d9a21c', fg: '#1b1f24', h: 220, w: 600, size: 44 }), -10, 5.2, -9.97));
    scene.add(at(plate(['RISCO ELÉTRICO', 'CAMPO MAGNÉTICO'], 1.5, 0.55, { bg: '#b3261e', fg: '#ffffff', h: 220, w: 600, size: 40 }), 3, 5.2, -9.97));
    hatchStrip(D, 0, -3.9, 38, 0.3);
    scene.add(bake(D));
  }

  let _blk; const blackM = () => _blk || (_blk = MAT.flat(0x15181b, { rough: 0.8 }));
  /* ---- porto: navio, contêineres, cais, carregador, horizonte ---- */
  function ship(ctx) {
    const { scene } = ctx, D = new T.Group(), cz = -48;
    const hullM = MAT.paint(0x4a2622, { wear: 0.5, seed: 141, rep: [0.1, 0.1] }), deckM = MAT.paint(0x555b52, { wear: 0.6, seed: 211, rep: [0.2, 0.2] }), white = MAT.paint(0xe8e6e0, { wear: 0.3, seed: 143 }), dgr = MAT.paint(0x1d2226, { wear: 0.3, seed: 213, rep: [0.1, 0.1] });
    const hatchM = MAT.paint(0x5b6b73, { wear: 0.55, seed: 215 }), yel = MAT.paint(0xd2a024, { wear: 0.4, seed: 217 }), st = MAT.steel({ tint: 0x6e7378 }), glass = MAT.flat(0x1d2a33, { rough: 0.1, metal: 0.5 }), rope = MAT.flat(0x2a2823, { rough: 0.9, metal: 0 });
    const sh = new T.Shape(); sh.moveTo(50, -8); sh.lineTo(-14, -8); sh.quadraticCurveTo(-30, -7.2, -41, 0); sh.quadraticCurveTo(-30, 7.2, -14, 8); sh.lineTo(50, 8); sh.quadraticCurveTo(52, 8, 52, 5); sh.lineTo(52, -5); sh.quadraticCurveTo(52, -8, 50, -8);
    const hg = new T.ExtrudeGeometry(sh, { depth: 9, bevelEnabled: false, curveSegments: 14 }); hg.rotateX(-Math.PI / 2); const hull = mesh(hg, hullM); hull.position.set(0, -2.1, cz); D.add(hull);
    const bg = new T.ExtrudeGeometry(sh, { depth: 1.3, bevelEnabled: false, curveSegments: 14 }); bg.rotateX(-Math.PI / 2); const band = mesh(bg, dgr); band.scale.set(1.002, 1, 1.012); band.position.set(0, -2.05, cz); D.add(band);
    const dg = new T.ShapeGeometry(sh, 14); dg.rotateX(-Math.PI / 2); const deck = mesh(dg, deckM, { cast: false }); deck.position.set(0, 6.9, cz); D.add(deck);
    const bx = (w, h, d, m, x, y, z, o) => { const b = box(w, h, d, m, o); b.position.set(x, y, z); D.add(b); return b; };
    bx(64, 0.06, 0.3, yel, 18, 6.93, cz - 7.9, { cast: false }); bx(64, 0.06, 0.3, yel, 18, 6.93, cz + 7.9, { cast: false });
    [-15, -4, 7, 18, 29].forEach((x, i) => { bx(9, 0.9, 10.2, hatchM, x, 7.35, cz); bx(9.3, 0.12, 10.5, st, x, 7.86, cz); for (let k = -3; k <= 3; k++) bx(0.12, 0.06, 10.2, st, x + k * 1.2, 7.92, cz, { cast: false }); bx(8.8, 0.04, 0.5, yel, x, 7.9, cz, { cast: false }); });
    [-9.5, 1.5, 12.5, 23.5].forEach(x => { bx(1.7, 2.0, 1.7, MAT.paint(0xd2a024, { wear: 0.5, seed: 219 }), x, 7.9, cz + 6.2); D.add(at(cyl(0.38, 0.45, 4.2, yel, 18), x, 10.9, cz + 6.2)); bx(1.2, 1.3, 1.1, white, x + 0.9, 11.6, cz + 5.7); rod(D, [x, 13.0, cz + 6.2], [x - 12.0, 15.6, cz + 6.2], 0.16, yel, 10); rod(D, [x, 13.0, cz + 6.2], [x, 15.7, cz + 6.2], 0.12, yel, 8); rod(D, [x, 15.7, cz + 6.2], [x - 12.0, 15.6, cz + 6.2], 0.025, st, 6); });
    const tiers = [[12.2, 2.6, 13.4, 6.9], [11.4, 2.6, 12.4, 9.5], [10.4, 2.6, 11.2, 12.1], [8.6, 2.4, 15.6, 14.7]];
    tiers.forEach(([w, h, d, y0], i) => { bx(w, h, d, white, 40, y0 + h / 2, cz); bx(w + 0.08, 0.85, d + 0.08, glass, 40, y0 + h * 0.55, cz, { cast: false }); bx(w + 0.12, 0.05, d + 0.12, st, 40, y0 + h * 0.55 + 0.45, cz, { cast: false }); });
    D.add(at(cyl(1.3, 1.5, 4.0, MAT.paint(0x1f3a6b, { wear: 0.4, seed: 221 }), 28), 44.5, 19.1, cz)); D.add(at(cyl(1.32, 1.32, 0.5, blackM(), 28), 44.5, 21.35, cz)); bx(2.7, 0.7, 0.04, white, 44.5, 19.3, cz + 1.46, { cast: false });
    rod(D, [38.5, 17.1, cz], [38.5, 23.5, cz], 0.12, st, 8); bx(2.6, 0.12, 0.12, st, 38.5, 22.5, cz); bx(1.3, 0.5, 0.2, dgr, 38.5, 23.2, cz);
    for (let x = -14; x <= 50; x += 1.4) { [-1, 1].forEach(s => D.add(at(cyl(0.025, 0.025, 1.05, st, 6, { recv: false }), x, 7.425, cz + s * 7.85))); }
    [-1, 1].forEach(s => { rod(D, [-14, 7.95, cz + s * 7.85], [50, 7.95, cz + s * 7.85], 0.022, st, 6); rod(D, [-14, 7.45, cz + s * 7.85], [50, 7.45, cz + s * 7.85], 0.022, st, 6); });
    [[-12, -12], [-16, -18], [30, 30], [44, 42]].forEach(([sx, qx]) => { const a = [sx, 7.3, cz + 7.7], b = [qx, 0.75, -26.2], m = [(sx + qx) / 2, 3.4, (a[2] + b[2]) / 2]; pipePath(D, [a, m, b], 0.06, rope); D.add(at(cyl(0.2, 0.26, 0.5, st, 12), sx, 7.15, cz + 7.7)); });
    scene.add(bake(D));
    const nm = plate(['MV ALUMINA STAR'], 9, 1.0, { bg: '#4a2622', fg: '#f2f2f2', h: 128, w: 1024, size: 84, border: false }); scene.add(at(nm, 18, 4.6, cz + 8.02));
  }
  function container(g, x, y, z, rot, mat) {
    const b = box(6.06, 2.59, 2.44, mat); b.position.set(x, y + 1.295, z); b.rotation.y = rot; g.add(b);
    const cs = new T.Group(); cs.position.set(x, y + 1.295, z); cs.rotation.y = rot; g.add(cs);
    [-1, 1].forEach(sx => [-1, 1].forEach(sy => [-1, 1].forEach(sz => { const c = box(0.2, 0.17, 0.2, blackM(), { cast: false }); c.position.set(sx * 2.96, sy * 1.25, sz * 1.17); cs.add(c); })));
    [-0.55, 0.55].forEach(o => { const r = box(0.05, 2.3, 0.05, blackM(), { cast: false }); r.position.set(3.04, 0, o); cs.add(r); });
  }
  function envPort(ctx) {
    const { scene } = ctx, D = new T.Group();
    const conc = MAT.concrete([2, 1], 0x8a8784, 13), st = MAT.steel({ tint: 0x6e7378 }), gal = MAT.galv({ rep: [4, 1] }), yel = MAT.paint(0xd8a21c, { wear: 0.5, seed: 131 }), blk = blackM(), rub = MAT.rubber([1, 1]), bm = MAT.paint(0x2f353a, { wear: 0.5, seed: 231 });
    const bx = (w, h, d, m, x, y, z, o) => { const b = box(w, h, d, m, o); b.position.set(x, y, z); D.add(b); return b; };
    // ampliação do pátio e muro do cais
    const gp = mesh(new T.PlaneGeometry(240, 90), MAT.concrete([27, 10], 0x8a7468, 12), { cast: false }); gp.rotation.x = -Math.PI / 2; at(gp, 0, -0.03, 19); scene.add(gp);
    bx(240, 2.5, 0.8, MAT.concrete([30, 1], 0x7d7f7e, 9), 0, -1.2, -26.4); bx(240, 0.12, 0.7, MAT.concrete([30, 1], 0x9a9895, 15), 0, 0.06, -25.75);
    for (let x = -112; x <= 112; x += 8) { D.add(at(cyl(0.3, 0.3, 1.6, rub, 16), x, -0.5, -26.95)); bx(0.12, 2.4, 0.1, st, x, -0.3, -26.78); }                                   // defensas de borracha
    for (let x = -108; x <= 108; x += 6) { D.add(at(cyl(0.2, 0.26, 0.55, bm, 16), x, 0.34, -25.4)); D.add(at(cyl(0.3, 0.2, 0.15, bm, 16), x, 0.68, -25.4)); bx(0.6, 0.04, 0.6, st, x, 0.04, -25.4); }       // cabeços de amarração
    bx(240, 0.02, 0.28, yel, 0, 0.012, -24.8, { cast: false });
    [-22.6, -21.2].forEach(z => { bx(240, 0.1, 0.1, st, 0, 0.08, z); }); bx(240, 0.03, 2.4, MAT.concrete([30, 1], 0x6a6c6b, 19), 0, 0.02, -21.9, { cast: false });
    for (let x = -118; x <= 118; x += 1.6) bx(0.14, 0.05, 2.0, bm, x, 0.035, -21.9, { cast: false });
    // postes de iluminação do cais
    const lampM = MAT.flat(0xfff3dd, { emissive: 0xfff1d6, ei: 1.3, rough: 0.4 });
    [-30, -4, 22].forEach(x => { D.add(at(cyl(0.12, 0.22, 16, st, 12), x, 8, -24)); bx(0.8, 0.1, 0.8, st, x, 0.05, -24); bx(0.14, 0.14, 3.6, st, x, 16.1, -24); [-1.4, -0.7, 0, 0.7, 1.4].forEach(o => bx(0.5, 0.18, 0.14, lampM, x, 15.9, -24 + o, { cast: false })); });
    // contêineres empilhados
    const base = MAT.corr(0xd0d0d0, [22, 1]), cols = [0xc2483a, 0x35669a, 0xdcae3a, 0xd8d6cf, 0x4f8a58, 0x9a5a38].map(c => { const m = base.clone(); m.color.setHex(c); return m; });
    let k = 0; const rnd = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    const place = (xs, zs, maxH, skip) => xs.forEach(x => zs.forEach((z, zi) => { const n = 1 + Math.floor(rnd() * maxH); if (rnd() < skip) return; for (let h = 0; h < n; h++) container(D, x + (rnd() - 0.5) * 0.12, h * 2.59, z, 0, cols[Math.floor(rnd() * cols.length)]); }));
    place([-31, -24.6], [-22.4, -19.5, -16.6, -13.7], 3, 0.15); place([24.6, 31], [-22.4, -19.5, -16.6], 3, 0.1); place([28, 34.5], [-6, -3.1], 2, 0.2);
    // pilha de bauxita na descarga
    { const g = new T.CylinderGeometry(0.4, 5.0, 3.4, 30, 5), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), j = 1 + 0.12 * Math.sin(a * 5 + y) + 0.08 * Math.sin(a * 11 - y * 2); if (y < 1.6) p.setXYZ(i, x * j, y + 0.12 * Math.sin(a * 7), z * j); } g.computeVertexNormals();
      const m = mesh(g, MAT.bauxite([6, 2])); m.position.set(19.2, 1.7, 2.2); scene.add(m); const m2 = mesh(g.clone(), MAT.bauxite([6, 2])); m2.scale.set(0.5, 0.5, 0.5); m2.position.set(22.0, 0.85, -2.0); scene.add(m2); }
    // carregador de navio: contraventamento, plataforma, calha telescópica
    { const sl = MAT.paint(0x5a6168, { wear: 0.5, seed: 145 });
      [3, 7, 11].forEach(y => { rod(D, [-14, y - 3.5, -15], [-9, y + 0.5, -15], 0.07, sl, 8); rod(D, [-9, y - 3.5, -15], [-14, y + 0.5, -15], 0.07, sl, 8); bx(5.2, 0.12, 0.12, sl, -11.5, y + 0.5, -15); });
      bx(6.4, 0.08, 2.2, gal, -11.5, 7.0, -15.4); railing(D, [-14.6, 7.04, -16.5], [-8.4, 7.04, -16.5], yel); railing(D, [-14.6, 7.04, -14.3], [-8.4, 7.04, -14.3], yel);
      [-0.82, 0.82].forEach(o => { for (let x = -23; x <= 1; x += 2) { rod(D, [x, 13.3, -22 + o], [x + 1, 14.7, -22 + o], 0.05, sl, 6); rod(D, [x + 1, 14.7, -22 + o], [x + 2, 13.3, -22 + o], 0.05, sl, 6); } });
      rod(D, [-12.5, 14, -15], [-12.5, 14, -22], 0.14, sl, 10); D.add(at(cyl(0.9, 0.5, 2.4, sl, 20), -23.2, 12.4, -22)); D.add(at(cyl(0.5, 0.42, 2.6, MAT.paint(0x3b4046, { wear: 0.5, seed: 233 }), 20), -23.2, 10, -22)); D.add(at(cyl(0.42, 0.7, 1.2, MAT.paint(0x3b4046, { wear: 0.5, seed: 233 }), 20), -23.2, 8.3, -22));
      bx(2.6, 2.0, 2.0, MAT.paint(0xe8e6e0, { wear: 0.3, seed: 143 }), 0.0, 12.9, -19.9); bx(2.2, 0.8, 0.04, MAT.flat(0x1d2a33, { rough: 0.1, metal: 0.5 }), 0, 13.1, -18.88, { cast: false }); }
    // pátio: via com faixas, placas e cerca
    bx(240, 0.02, 5.2, MAT.concrete([30, 1], 0x4a4c4e, 23), 0, 0.012, 21.5, { cast: false }); { const dash = MAT.flat(0xe8e6e0, { rough: 0.7 }); for (let x = -118; x <= 118; x += 6) bx(3, 0.02, 0.16, dash, x, 0.025, 21.5, { cast: false }); }
    for (let x = -60; x <= 60; x += 3) { bx(0.07, 1.8, 0.07, gal, x, 0.9, 25); } bx(120, 0.04, 0.04, gal, 0, 1.75, 25); bx(120, 0.04, 0.04, gal, 0, 0.9, 25); bx(120, 0.04, 0.04, gal, 0, 0.1, 25);
    hatchStrip(D, 0, -4.2, 28, 0.3); hatchStrip(D, 0, 4.2, 28, 0.3);
    scene.add(bake(D));
    [-17.1, -14.9].forEach(x => bx(0.08, 3.1, 0.08, gal, x, 1.55, -23.25));
    scene.add(at(plate(['PORTO · USO OBRIGATÓRIO', 'DE EPI NA ÁREA DE CAIS'], 2.4, 0.7, { bg: '#1f6f3f', fg: '#ffffff', h: 240, w: 640, size: 40 }), -16, 3.4, -23.2));
    // horizonte: serras distantes e nuvens
    const ridge = (z, hMax, col, seed) => { const sh = new T.Shape(); sh.moveTo(-420, 0); for (let i = 0; i <= 60; i++) { const x = -420 + i * 14; sh.lineTo(x, 6 + hMax * (0.5 + 0.28 * Math.sin(i * 0.37 + seed) + 0.22 * Math.sin(i * 0.91 + seed * 2.3))); } sh.lineTo(420, 0); const gg = new T.ShapeGeometry(sh); const m = new T.Mesh(gg, new T.MeshBasicMaterial({ color: col, fog: false, toneMapped: false })); m.position.set(0, -1, z); m.userData.through = true; m.renderOrder = -900; scene.add(m); };
    ridge(-255, 34, 0x8499a9, 1.3); ridge(-235, 18, 0x7d93a3, 4.1);
    const ct = new T.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d'); for (let i = 0; i < 16; i++) { const x = 40 + Math.random() * 176, y = 30 + Math.random() * 40, r = 18 + Math.random() * 26, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 96); } return c; })());
    [[-90, 80, -170, 120, 32], [10, 105, -200, 150, 36], [95, 90, -150, 110, 28], [-30, 120, -230, 170, 40], [150, 100, -60, 110, 30], [-140, 95, -40, 120, 30], [60, 130, -240, 160, 36]].forEach(([x, y, z, w, h]) => { const s = new T.Sprite(new T.SpriteMaterial({ map: ct, transparent: true, opacity: 0.8, depthWrite: false, fog: false, toneMapped: false })); s.scale.set(w, h, 1); s.position.set(x, y, z); s.userData.through = true; scene.add(s); });
    ship(ctx);
  }

  function pump(ctx) {
    const { scene } = ctx; const R = { parts: {}, anchors: {}, names: {}, state: { running: true, pressure: 4.2, draining: false, hot: true } };
    W.shed(ctx, { w: 36, d: 26, h: 10, z0: -9, wall: 0x8c9599, steel: 0x58636c, bay: 6, lampI: 0.8 });
    W.beams(ctx, [[-8, 6, -4, 3, 9, 0.2, -0.55], [4, 6, -4, 3, 9, 0.2, -0.55], [14, 6, -4, 3, 9, 0.2, -0.55]]);
    W.dust(ctx, 300, [30, 7, 16], 0xfff1dc, [0, 0.5, -1]);
    W.floorLine(ctx, 1, 2.6, 22); W.floorLine(ctx, 1, -2.6, 22); W.floorLine(ctx, -10.95, 0, 5.3, Math.PI / 2); W.floorLine(ctx, 12.95, 0, 5.3, Math.PI / 2);
    // rack de tubos ao fundo
    const rackM = MAT.paint(0x56616b, { wear: 0.4, seed: 63, rep: [1, 3] });
    for (let x = -14; x <= 16; x += 6) { const c = ibeam(5.2, 0.3, 0.2, rackM); at(c, x, 2.6, -6.4); scene.add(c); }
    scene.add(at(ibeam(32, 0.35, 0.2, rackM, 'x'), 1, 5.2, -6.4));
    [[0.34, -6.0], [0.26, -6.75], [0.2, -6.4]].forEach(([r, z], i) => { const p = cylX(r, 32, MAT.clad([12, 1]), 28); at(p, 1, 5.6 + r, z); scene.add(p); if (i === 0) for (let x = -12; x <= 14; x += 3.5) scene.add(flange(r + 0.04, x, 5.6 + r, z, 'x', MAT.steel())); });
    // vaso isolado
    const vs = cyl(1.8, 1.8, 7, MAT.clad([5, 3]), 40); at(vs, 13, 3.5, -5.2); scene.add(vs); scene.add(at(sphere(1.8, MAT.clad([5, 2])), 13, 7, -5.2));
    scene.add(at(plate(['TQ-205', 'LICOR'], 1.2, 0.45, { bg: '#e9e6dc', fg: '#1b1f24' }), 13, 2.4, -3.38));
    // pedestal e base
    scene.add(at(box(7.8, 0.35, 2.3, MAT.concrete([3, 1], 0x8f908e, 5)), -0.1, 0.175, 0));
    const skid = MAT.paint(0x5d666e, { wear: 0.55, seed: 65, rep: [3, 1] });
    scene.add(at(rbox(7.2, 0.22, 1.7, skid, 0.02), -0.1, 0.46, 0));
    const tag = plate(['BP-201'], 0.9, 0.24, { bg: '#e9e6dc', fg: '#1b1f24' }); at(tag, 0.9, 0.46, 0.856); scene.add(tag);
    { const lst = []; for (let x = -3.5; x <= 3.3; x += 1.1) [-0.74, 0.74].forEach(z => lst.push([x, 0.585, z])); scene.add(boltsAt(lst, { r: 0.04, h: 0.045, stud: 0.06 }));
      const cl = []; for (let x = -3.6; x <= 3.4; x += 1.4) [-1.05, 1.05].forEach(z => cl.push([x, 0.36, z])); scene.add(boltsAt(cl, { r: 0.045, h: 0.04 })); }                           // chumbadores do skid e do pedestal
    // motor
    const green = MAT.paint(0x3f5b4b, { wear: 0.35, seed: 67 });
    const motor = new T.Group();
    motor.add(at(cylX(0.56, 1.7, green, 48), -1.65, 1.17, 0));
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; const f = box(1.45, 0.1, 0.035, green); f.position.set(-1.6, 1.17 + Math.sin(a) * 0.58, Math.cos(a) * 0.58); f.rotation.x = -a; motor.add(f); }
    motor.add(at(cylX(0.6, 0.5, MAT.paint(0x34493d, { wear: 0.3, seed: 69 }), 48), -2.72, 1.17, 0));
    const grill = mesh(new T.CircleGeometry(0.5, 32), MAT.flat(0x15181b, { rough: 0.9 })); grill.rotation.y = -Math.PI / 2; at(grill, -2.98, 1.17, 0); motor.add(grill);
    motor.add(at(rbox(0.5, 0.36, 0.5, green, 0.04), -1.6, 1.9, 0));
    motor.add(at(rbox(1.5, 0.24, 1.1, green, 0.03), -1.6, 0.68, 0));
    const np = plate(['M-201', '75 kW · 440 V'], 0.36, 0.2, { bg: '#c9ccc8', fg: '#1b1f24' }); at(np, -1.3, 1.17, 0.625); motor.add(np);
    motor.add(at(cylX(0.07, 0.6, MAT.steel(), 16), -0.55, 1.17, 0));
    { const d = new T.Group(), st = MAT.steel({ tint: 0x9a9ea3 }), gm = MAT.paint(0x34493d, { wear: 0.3, seed: 69 });
      d.add(at(torus(0.05, 0.012, st), -2.1, 1.77, 0)); d.add(at(cyl(0.025, 0.03, 0.05, st, 10), -2.1, 1.74, 0)); d.children[0].rotation.y = Math.PI / 2;           // olhal de içamento
      d.add(at(cyl(0.05, 0.07, 0.08, st, 14), -1.6, 2.19, 0)); d.add(at(cyl(0.03, 0.03, 0.25, MAT.rubber(), 10), -1.6, 2.35, 0));                                   // prensa-cabo
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI; const bar = box(0.02, 0.95, 0.012, MAT.flat(0x2a2d30, { rough: 0.6, metal: 0.5 })); bar.rotation.x = a; at(bar, -2.985, 1.17, 0); d.add(bar); }   // grade da ventoinha
      d.add(at(torus(0.5, 0.012, st), -2.985, 1.17, 0)); d.children[d.children.length - 1].rotation.y = Math.PI / 2;
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => { d.add(at(rbox(0.22, 0.06, 0.2, gm, 0.015), -1.6 + sx * 0.52, 0.55, sz * 0.5)); }));                              // pés do motor
      d.add(boltsAt([[-1.6 + 0.52, 0.6, 0.5], [-1.6 - 0.52, 0.6, 0.5], [-1.6 + 0.52, 0.6, -0.5], [-1.6 - 0.52, 0.6, -0.5]], { r: 0.035, h: 0.04, stud: 0.05 }));
      d.add(boltsAt([[-1.4, 2.04, 0.19], [-1.8, 2.04, 0.19], [-1.4, 2.04, -0.19], [-1.8, 2.04, -0.19]], { r: 0.022, h: 0.02 }));
      d.add(boltsAt([[-0.9, 1.17 + 0.56, 0], [-0.9, 1.17 - 0.56, 0], [-0.9, 1.17, 0.56], [-0.9, 1.17, -0.56]], { r: 0.03, h: 0.03, mat: st }));
      motor.add(bake(d)); }
    R.parts.motor = ctx.hit(motor, 'motor'); R.anchors.motor = [-1.6, 2.3, 0]; R.names.motor = 'M-201 · Motor da bomba';
    // acoplamento + proteção
    const acopl = new T.Group(); const spin = new T.Group(); spin.position.set(-0.2, 1.17, 0);
    spin.add(at(cylX(0.26, 0.16, MAT.steel(), 32), -0.1, 0, 0)); spin.add(at(cylX(0.26, 0.16, MAT.steel(), 32), 0.1, 0, 0));
    spin.add(at(cylX(0.22, 0.06, MAT.flat(0x7a2a18, { rough: 0.9 }), 24), 0, 0, 0));
    for (let i = 0; i < 6; i++) { const b = box(0.36, 0.035, 0.035, MAT.steel()); b.position.set(0, Math.cos(i) * 0.2, Math.sin(i) * 0.2); spin.add(b); }
    acopl.add(spin); R.spin = spin;
    const guard = new T.Group(); const gm = MAT.guard(); const gw = 0.95, gh = 0.95;
    const gshape = mesh(new T.CylinderGeometry(0.46, 0.46, gw, 24, 1, true, 0, Math.PI), gm); gshape.rotation.z = Math.PI / 2; gshape.rotation.y = Math.PI; guard.add(at(gshape, 0, 0, 0));
    [-gw / 2, gw / 2].forEach(x => { const ring = torus(0.46, 0.018, MAT.paint(0xd8a21c, { wear: 0.4 }), Math.PI); ring.rotation.y = Math.PI / 2; at(ring, x, 0, 0); guard.add(ring); });
    guard.add(at(box(gw, 0.04, 0.95, MAT.paint(0xd8a21c, { wear: 0.4 })), 0, -0.02, 0));
    guard.position.set(-0.2, 1.17, 0); acopl.add(guard); R.guard = guard;
    R.parts.acopl = ctx.hit(acopl, 'acopl'); R.anchors.acopl = [-0.2, 1.17, 0]; R.names.acopl = 'Acoplamento e proteção';
    // bomba
    const castM = MAT.paint(0x4c5661, { wear: 0.5, seed: 71 });
    const bomba = new T.Group();
    bomba.add(at(cylX(0.27, 0.8, castM, 28), 0.5, 1.17, 0));
    bomba.add(at(rbox(0.9, 0.5, 0.8, castM, 0.05), 0.5, 0.8, 0));
    bomba.add(at(cylX(0.86, 0.62, castM, 64), 1.28, 1.17, 0));
    const vol = torus(0.74, 0.2, castM); vol.rotation.y = Math.PI / 2; at(vol, 1.28, 1.17, 0); bomba.add(vol);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; [-0.33, 0.33].forEach(dx => bomba.add(at(cylX(0.045, 0.07, MAT.steel(), 6), 1.28 + dx, 1.17 + Math.sin(a) * 0.76, Math.cos(a) * 0.76))); }
    bomba.add(at(cylX(0.3, 0.2, castM, 28), 1.7, 1.17, 0));
    { const d = new T.Group(), st = MAT.steel({ tint: 0x9a9ea3 });
      for (let i = 0; i < 4; i++) { const r = torus(0.275, 0.012, castM); r.rotation.y = Math.PI / 2; r.position.set(0.25 + i * 0.12, 1.17, 0); d.add(r); }                      // aletas do mancal
      d.add(at(cylZ(0.045, 0.04, MAT.flat(0xc98a2a, { rough: 0.1, metal: 0.2, opacity: 0.8 }), 14), 0.5, 1.0, 0.31)); d.add(at(torus(0.05, 0.01, st), 0.5, 1.0, 0.33));   // visor de óleo
      d.add(at(cyl(0.012, 0.012, 0.05, st, 8), 0.8, 1.46, 0)); d.add(at(sphere(0.02, st, undefined, 10, 8), 0.8, 1.5, 0));                                                // graxeira
      d.add(at(cyl(0.05, 0.05, 0.1, castM, 12), 1.28, 0.3, 0)); d.add(at(cyl(0.08, 0.08, 0.02, st, 6), 1.28, 0.24, 0));                                                   // bujão do dreno inferior
      d.add(at(cyl(0.02, 0.02, 0.5, st, 8), 1.0, 1.95, 0.35).rotateZ(0.5));                                                                                               // tubo de selagem
      d.add(boltsAt([[0.15, 0.58, 0.35], [0.85, 0.58, 0.35], [0.15, 0.58, -0.35], [0.85, 0.58, -0.35]], { r: 0.035, h: 0.04, stud: 0.05 }));
      bomba.add(bake(d)); }
    R.parts.bomba = ctx.hit(bomba, 'bomba'); R.anchors.bomba = [1.28, 1.17, 0]; R.names.bomba = 'BP-201 · Bomba de licor';
    // linha de sucção isolada (licor quente)
    const linha = new T.Group();
    linha.add(at(cylX(0.32, 1.7, MAT.clad([2, 1]), 28), 2.75, 1.17, 0));
    linha.add(at(cylX(0.32, 5.6, MAT.clad([5, 1]), 28), 7.4, 1.17, 0));
    linha.add(flange(0.36, 1.85, 1.17, 0, 'x', MAT.steel()));
    for (let x = 6; x <= 10; x += 2) { linha.add(at(box(0.12, 0.9, 0.5, rackM), x, 0.45, 0)); }
    const hot = plate(['LICOR 105 °C'], 0.9, 0.18, { bg: '#d9a21c', fg: '#1b1f24' }); hot.rotation.y = 0; at(hot, 6.6, 1.17, 0.33); linha.add(hot);
    linha.add(bandsX(2.2, 3.4, 0.4, 1.17, 0, 0.325, MAT.steel({ tint: 0x8d9296 }))); linha.add(bandsX(4.8, 9.9, 0.7, 1.17, 0, 0.325, MAT.steel({ tint: 0x8d9296 })));
    R.parts.linha = ctx.hit(linha, 'linha'); R.anchors.linha = [7.2, 1.17, 0]; R.names.linha = 'Linha de sucção · licor quente';
    R.steam = W.steam(ctx, 9.6, 1.5, 0, 12, 0.3);
    W.stain(ctx, 1.3, 1.25, 1.6, 41, { alpha: 170 }); W.stain(ctx, -0.4, 1.3, 1.0, 43, { alpha: 120 });
    // válvula de sucção
    const vsuc = gateValve(ctx, 4.25, 1.17, 0, 'x', 'up'); R.wheelSuc = vsuc.userData.wheel;
    R.parts.vsuc = ctx.hit(vsuc, 'vsuc'); R.anchors.vsuc = [4.25, 1.6, 0]; R.names.vsuc = 'V-201 · Válvula de sucção';
    const capS = new T.Group(); capS.add(cyl(0.34, 0.34, 0.2, MAT.paint(0xa83a16, { wear: 0.3, seed: 85 }), 32)); const lS = padlock(); lS.position.set(0.42, -0.05, 0.08); capS.add(lS);
    capS.position.set(4.25, 2.22, 0); capS.visible = false; scene.add(capS); R.capSuc = capS;
    // recalque
    const disc = new T.Group();
    disc.add(at(cyl(0.24, 0.24, 0.5, castM, 24), 1.28, 2.25, 0));
    disc.add(at(cyl(0.26, 0.26, 1.5, MAT.clad([1, 2]), 24), 1.28, 4.0, 0));
    const elb = torus(0.42, 0.26, MAT.clad([2, 1]), Math.PI / 2); elb.rotation.z = Math.PI / 2; at(elb, 1.7, 4.75, 0); scene.add(elb);
    disc.add(at(cylX(0.26, 6.5, MAT.clad([6, 1]), 24), 5.0, 5.17, 0));
    disc.add(bandsX(1.7, 8.0, 0.75, 5.17, 0, 0.265, MAT.steel({ tint: 0x8d9296 })));
    scene.add(disc);
    const vrec = gateValve(ctx, 1.28, 2.95, 0, 'y', 'z'); R.wheelRec = vrec.userData.wheel;
    R.parts.vrec = ctx.hit(vrec, 'vrec'); R.anchors.vrec = [1.28, 2.95, 0.6]; R.names.vrec = 'V-202 · Válvula de recalque';
    const capR = new T.Group(); capR.add(cylZ(0.34, 0.2, MAT.paint(0xa83a16, { wear: 0.3, seed: 85 }), 32)); const lR = padlock(); lR.position.set(0.4, -0.08, 0.1); capR.add(lR);
    capR.position.set(1.28, 2.95, 1.05); capR.visible = false; scene.add(capR); R.capRec = capR;
    // manômetro
    const man = new T.Group();
    man.add(at(cylZ(0.03, 0.35, MAT.steel(), 10), 1.28, 3.6, 0.38));
    man.add(at(cylZ(0.2, 0.09, MAT.steel(), 32), 1.28, 3.6, 0.6)); man.add(at(torus(0.192, 0.014, MAT.steel({ tint: 0xc9ccd0 }), Math.PI * 2, { cast: false }), 1.28, 3.6, 0.655));
    const face = mesh(new T.CircleGeometry(0.175, 40), new T.MeshStandardMaterial({ map: dialTex(10, 'bar'), roughness: 0.3, metalness: 0 }), { cast: false }); at(face, 1.28, 3.6, 0.648); man.add(face);
    const glass = mesh(new T.CircleGeometry(0.18, 40), MAT.flat(0xffffff, { opacity: 0.12, rough: 0.05, metal: 0 }), { cast: false }); at(glass, 1.28, 3.6, 0.655); glass.userData.through = true; man.add(glass);
    const needle = box(0.012, 0.15, 0.006, MAT.flat(0x111111, { rough: 0.4 }), { cast: false }); needle.geometry.translate(0, 0.06, 0); at(needle, 1.28, 3.6, 0.652); man.add(needle); R.needle = needle;
    R.parts.manometro = ctx.hit(man, 'manometro'); R.anchors.manometro = [1.28, 3.6, 0.65]; R.names.manometro = 'PI-202 · Manômetro do recalque';
    // dreno
    const dreno = new T.Group();
    dreno.add(at(cylZ(0.05, 0.55, MAT.steel(), 12), 1.28, 0.62, 0.65));
    dreno.add(at(rbox(0.16, 0.14, 0.14, MAT.steel(), 0.02), 1.28, 0.62, 0.98));
    const lever = box(0.28, 0.03, 0.04, MAT.paint(0xa8231c, { wear: 0.3 })); at(lever, 1.4, 0.71, 0.98); dreno.add(lever); R.drainLever = lever;
    dreno.add(at(cyl(0.04, 0.04, 0.28, MAT.steel(), 10), 1.28, 0.44, 1.02));
    dreno.add(at(rbox(0.7, 0.12, 0.5, MAT.steel({ tint: 0x8e9398 }), 0.02), 1.28, 0.06, 1.1));
    R.parts.dreno = ctx.hit(dreno, 'dreno'); R.anchors.dreno = [1.28, 0.6, 1.0]; R.names.dreno = 'Dreno da carcaça';
    const dripM = MAT.flat(0xc98a2a, { rough: 0.1, metal: 0.1 }); R.drips = []; for (let i = 0; i < 5; i++) { const d = sphere(0.025, dripM, { cast: false }); d.visible = false; d.userData.through = true; scene.add(d); R.drips.push(d); }
    const puddle = mesh(new T.CircleGeometry(0.2, 24), MAT.flat(0x8a5a1c, { rough: 0.05, metal: 0.2 }), { cast: false }); puddle.rotation.x = -Math.PI / 2; at(puddle, 1.28, 0.125, 1.1); puddle.scale.setScalar(0.01); scene.add(puddle); R.puddle = puddle;
    // CCM-2A
    const ccm = new T.Group(); const cx = -7.2, cz = -2.2; const panelM = MAT.paint(0xc5c7c2, { wear: 0.18, seed: 93 });
    [-1, 0, 1].forEach(i => ccm.add(at(rbox(1.0, 2.3, 0.7, panelM, 0.02), cx + i * 1.02, 1.15, cz)));
    ccm.add(at(box(3.12, 0.12, 0.74, MAT.paint(0x8b8f8c, { wear: 0.3 })), cx, 2.36, cz));
    ccm.add(at(plate(['CCM-2A · 440 V'], 1.6, 0.18, { bg: '#1b1f24', fg: '#f2f2f2' }), cx, 2.16, cz + 0.356));
    R.drawers = {}; const dn = [['G2', 'G2 · BP-202', 1.68, false], ['G1', 'G1 · BP-201', 1.08, true], ['G3', 'G3 · AGITADOR', 0.48, true]];
    dn.forEach(([k, txt, y, on]) => {
      ccm.add(at(rbox(0.9, 0.52, 0.04, MAT.paint(0xbfc1bc, { wear: 0.15, seed: 95 }), 0.01), cx, y, cz + 0.36));
      const pl = plate([txt], 0.5, 0.09, { bg: '#f1efe8', fg: '#1b1f24', border: false, fade: k === 'G2' ? 0.0 : 0 }); at(pl, cx - 0.12, y + 0.17, cz + 0.385); ccm.add(pl);
      const lg = lamp(0x2fbf5a, on); at(lg, cx - 0.32, y - 0.1, cz + 0.39); ccm.add(lg);
      const lr = lamp(0xd93a2b, !on); at(lr, cx - 0.2, y - 0.1, cz + 0.39); ccm.add(lr);
      const h = new T.Group(); h.position.set(cx + 0.28, y - 0.04, cz + 0.4); h.add(at(cyl(0.06, 0.06, 0.04, MAT.flat(0x1b1f24), 20), 0, 0, 0)); h.children[0].rotation.x = Math.PI / 2; h.add(at(rbox(0.05, 0.2, 0.05, MAT.flat(0x1b1f24, { rough: 0.4 }), 0.015), 0, 0.06, 0.03)); h.rotation.z = on ? 0 : -Math.PI / 2; ccm.add(h);
      const lk = padlock(); lk.position.set(cx + 0.28, y - 0.2, cz + 0.45); lk.visible = false; scene.add(lk);
      R.drawers[k] = { on, lg, lr, h, lk, team: [] };
    });
    [-1, 1].forEach(i => { for (let j = 0; j < 3; j++) ccm.add(at(rbox(0.9, 0.52, 0.04, MAT.paint(0xbfc1bc, { wear: 0.15, seed: 97 + j }), 0.01), cx + i * 1.02, 1.68 - j * 0.6, cz + 0.36)); });
    R.drawers.G1.team = [0x2f6db5, 0x6b4fa8].map((c, i) => { const l = padlock(c, false); l.position.set(cx + 0.14 - i * 0.12, 0.88, cz + 0.45); l.visible = false; scene.add(l); return l; });
    R.parts.ccm = ctx.hit(ccm, 'ccm'); R.anchors.ccm = [cx, 1.4, cz + 0.4]; R.names.ccm = 'CCM-2A · Centro de controle de motores';
    // cabo CCM-motor (eletrocalha)
    const tray = MAT.galv(); scene.add(at(box(0.3, 0.06, 5.2, tray), cx + 1.6, 2.6, cz + 0.6 + 1.9));
    const curve = new T.CatmullRomCurve3([new T.Vector3(cx + 1.6, 2.6, 1.0), new T.Vector3(-3.5, 2.4, 0.6), new T.Vector3(-1.9, 2.1, 0.2), new T.Vector3(-1.6, 1.95, 0)]);
    scene.add(mesh(new T.TubeGeometry(curve, 40, 0.04, 8), MAT.flat(0x1d2024, { rough: 0.7 })));
    // botoeira local
    const bot = new T.Group(); const bx = -3.8, bz = 1.6;
    bot.add(at(cyl(0.04, 0.04, 1.4, MAT.galv(), 12), bx, 0.7, bz));
    bot.add(at(rbox(0.3, 0.42, 0.2, MAT.paint(0xd8a21c, { wear: 0.4, seed: 99 }), 0.03), bx, 1.52, bz));
    bot.add(at(cylZ(0.05, 0.05, MAT.flat(0x1f8a43, { rough: 0.4 }), 20), bx, 1.6, bz + 0.12)); bot.add(at(cylZ(0.06, 0.06, MAT.flat(0xb3261e, { rough: 0.4 }), 20), bx, 1.43, bz + 0.12));
    bot.add(at(plate(['BP-201'], 0.22, 0.06, { bg: '#1b1f24', fg: '#f2f2f2', border: false }), bx, 1.7, bz + 0.105));
    R.parts.botoeira = ctx.hit(bot, 'botoeira'); R.anchors.botoeira = [bx, 1.5, bz]; R.names.botoeira = 'Botoeira local liga/desliga';
    // EPI
    const epi = new T.Group(); const ex = -10.4, ez = -1.0;
    epi.add(at(cabinet(1.0, 1.9, 0.5, 0xc5c7c2, 0.2, 101), ex, 0.95, ez));
    epi.add(at(plate(['EPI', 'PRODUTO QUÍMICO'], 0.8, 0.3, { bg: '#1f6f3f', fg: '#ffffff' }), ex, 1.62, ez + 0.26));
    const shield = mesh(new T.SphereGeometry(0.16, 16, 10, 0, Math.PI, 0, Math.PI / 2), MAT.flat(0xcfe3ef, { opacity: 0.5, rough: 0.05 })); shield.rotation.x = Math.PI / 2; at(shield, ex - 0.2, 1.1, ez + 0.3); epi.add(shield);
    epi.add(at(rbox(0.16, 0.26, 0.04, MAT.flat(0x2f4a6b, { rough: 0.7 }), 0.02), ex + 0.2, 1.05, ez + 0.28));
    epi.add(at(rbox(0.3, 0.55, 0.03, MAT.flat(0x2a6a3a, { rough: 0.6 }), 0.02), ex + 0.02, 0.55, ez + 0.28));
    R.parts.epi = ctx.hit(epi, 'epi'); R.anchors.epi = [ex, 1.2, ez + 0.3]; R.names.epi = 'Armário de EPI · produto químico';
    // operador da área
    const op = person({ suit: 0x2b3a55, vest: 0xff6a13, glove: 0x2f6db5, mask: true, earmuff: false }); op.position.set(6.2, 0, 2.2); op.rotation.y = -0.5;
    R.parts.operador = ctx.hit(op, 'operador'); R.anchors.operador = [6.2, 1.4, 2.2]; R.names.operador = 'Operador da área';
    // você (mantenedor)
    const me = person({ suit: 0x3d4a3a, helmet: 0xd8a21c, mask: true, earmuff: true, glove: 0x2f6db5 }); me.position.set(-1.8, 0, 2.4); me.rotation.y = 2.6; scene.add(me); R.me = me;
    // animação
    let pv = R.state.pressure, shake = 0;
    ctx.tick((dt, t) => {
      if (R.state.running) { R.spin.rotation.x += dt * 30; shake = Math.sin(t * 90) * 0.004; } else { shake = 0; }
      motor.position.y = shake;
      pv += (R.state.pressure - pv) * Math.min(1, dt * 1.5); R.needle.rotation.z = -(-225 + Math.min(10, pv) / 10 * 270) * Math.PI / 180 - Math.PI / 2;
      R.steam.on = R.state.hot; R.steam.rate = R.state.hot ? 1 : 0.4;
      R.drips.forEach((d, i) => { d.visible = R.state.draining; if (R.state.draining) { const p = (t * 1.5 + i / 5) % 1; d.position.set(1.28, 0.3 - p * 0.18, 1.02); } });
      if (R.state.draining) R.puddle.scale.setScalar(Math.min(1, R.puddle.scale.x + dt * 0.08));
    });
    R.setDrawer = (k, on) => { const d = R.drawers[k]; d.on = on; setLamp(d.lg, on); setLamp(d.lr, !on); d.h.rotation.z = on ? 0 : -Math.PI / 2; };
    envPump(ctx);
    R.view = { cam: [3.5, 4.6, 11.5], target: [-0.6, 1.4, 0] };
    return R;
  }

  /* ================= REDUÇÃO · PR-301 ================= */
  function crane(ctx) {
    const { scene } = ctx; const R = { parts: {}, anchors: {}, names: {}, state: { moving: true, down: false, area: false } };
    W.shed(ctx, { w: 40, d: 28, h: 13, z0: -10, wall: 0x6e757a, steel: 0x4c545b, bay: 6.5, lampI: 0.7, lampColor: 0xffd9a8, winI: 0.9, floorTint: 0x7b7c7a, seed: 8 });
    W.beams(ctx, [[-10, 8, -5, 3.5, 11, 0.15, -0.5], [6, 8, -5, 3.5, 11, 0.15, -0.5]]);
    W.dust(ctx, 400, [34, 9, 18], 0xffd2a0, [0, 0.5, -2]);
    // linha de cubas ao fundo
    const potM = MAT.paint(0x4a4f53, { wear: 0.6, seed: 111, rep: [2, 1] });
    for (let x = -18; x <= 18; x += 4.2) { scene.add(at(rbox(3.8, 1.3, 3.2, potM, 0.05), x, 0.65, -7.6)); const glow = box(3.2, 0.06, 0.06, MAT.flat(0xff7a2a, { emissive: 0xff6a1a, ei: 2.2 }), { cast: false }); at(glow, x, 1.32, -6.0); scene.add(glow); scene.add(at(box(0.16, 2.4, 0.16, MAT.steel({ tint: 0x6a6e72 })), x - 1.4, 2.4, -7.6)); }
    const warm = new T.PointLight(0xff8a3a, 1.2, 22, 1.8); warm.position.set(0, 2, -6); scene.add(warm);
    // caminho de rolamento
    const runM = MAT.paint(0x4c545b, { wear: 0.4, seed: 113, rep: [6, 1] });
    [-8.2, 8.2].forEach(x => { for (let z = -6.5; z <= 6.5; z += 6.5) { const c = ibeam(8.2, 0.5, 0.35, runM); at(c, x, 4.1, z); scene.add(c); } scene.add(at(ibeam(16, 0.6, 0.35, runM, 'z'), x, 8.5, 0)); scene.add(at(box(0.12, 0.14, 16, MAT.steel()), x + (x < 0 ? 0.3 : -0.3), 8.88, 0)); });
    // ponte
    const yel = MAT.paint(0xd2a024, { wear: 0.6, seed: 115, rep: [6, 1] });
    const bridge = new T.Group();
    bridge.add(at(rbox(16.2, 0.95, 0.55, yel, 0.03), 0, 9.45, -0.75)); bridge.add(at(rbox(16.2, 0.95, 0.55, yel, 0.03), 0, 9.45, 1.0));
    [-8.0, 8.0].forEach(x => bridge.add(at(rbox(0.9, 0.8, 3.2, MAT.paint(0xb88c1e, { wear: 0.6, seed: 117 }), 0.04), x, 9.25, 0.12)));
    { const st = MAT.steel({ tint: 0x7d8186 }), d = new T.Group(); [-8.0, 8.0].forEach(x => [-1.2, 1.4].forEach(zz => { d.add(at(cylX(0.32, 0.14, st, 28), x, 8.98, zz)); d.add(at(cylX(0.1, 0.2, st, 12), x, 8.98, zz)); }));    // rodas das testeiras
      for (let x = -8.0; x <= 8.0; x += 0.8) { d.add(at(box(0.08, 0.04, 0.16, st), x, 9.97, -0.75)); d.add(at(box(0.08, 0.04, 0.16, st), x, 9.97, 1.0)); }                                                               // chapas de reforço dos trilhos do carro
      const l = []; for (let x = -7.6; x <= 7.6; x += 1.9) { l.push([x, 9.98, -0.75]); l.push([x, 9.98, 1.0]); } d.add(boltsAt(l, { r: 0.03, h: 0.03 })); bridge.add(bake(d)); }
    const bpl = plate(['PR-301 · 10 t'], 2.2, 0.42, { bg: '#1b1f24', fg: '#e8b93a' }); at(bpl, -3.2, 9.45, 1.28); bridge.add(bpl);
    scene.add(bridge);
    // passarela da ponte + painel
    scene.add(at(box(5, 0.05, 0.9, MAT.galv()), -5.2, 8.95, 1.8));
    for (let x = -7.6; x <= -2.8; x += 1.2) scene.add(at(cyl(0.025, 0.025, 1.0, MAT.paint(0xd2a024, { wear: 0.4 }), 8), x, 9.45, 2.2));
    scene.add(at(cylX(0.025, 5, MAT.paint(0xd2a024, { wear: 0.4 }), 8), -5.2, 9.95, 2.2));
    const painel = new T.Group();
    painel.add(at(cabinet(1.2, 1.1, 0.5, 0xc5c7c2, 0.3, 119), -6.2, 9.5, 1.6));
    painel.add(at(plate(['PAINEL PR-301'], 0.9, 0.14, { bg: '#1b1f24', fg: '#f2f2f2' }), -6.2, 9.9, 1.856));
    const pl1 = lamp(0x2fbf5a, true), pl2 = lamp(0xe8b93a, true); at(pl1, -6.45, 9.6, 1.87); at(pl2, -6.25, 9.6, 1.87); painel.add(pl1); painel.add(pl2); R.lampMain = pl1; R.lampCmd = pl2;
    R.parts.painel = ctx.hit(painel, 'painel'); R.anchors.painel = [-6.2, 9.5, 1.85]; R.names.painel = 'Painel elétrico da ponte';
    // carro, cabo, gancho, carga
    const trolley = new T.Group();
    trolley.add(at(rbox(1.9, 0.75, 2.3, MAT.paint(0xc7951f, { wear: 0.55, seed: 121 }), 0.04), 0, 10.3, 0.12));
    trolley.add(at(cylX(0.36, 1.4, MAT.steel({ tint: 0x8d9196 }), 28), 0, 9.75, 0.12));
    trolley.add(at(rbox(0.6, 0.45, 0.6, MAT.paint(0x3f5b4b, { wear: 0.3 }), 0.03), 0.7, 10.85, 0.12));
    const cable = cyl(0.025, 0.025, 1, MAT.steel({ tint: 0x6c7076 }), 8); trolley.add(cable);
    const cable2 = cyl(0.025, 0.025, 1, MAT.steel({ tint: 0x6c7076 }), 8); trolley.add(cable2);
    const hook = new T.Group();
    hook.add(rbox(0.5, 0.55, 0.32, MAT.paint(0xd2a024, { wear: 0.5 }), 0.05));
    hook.add(at(cylZ(0.18, 0.34, MAT.steel(), 20), 0, 0.12, 0));
    const hk = torus(0.15, 0.045, MAT.steel({ tint: 0x7d8186 }), Math.PI * 1.45); hk.position.y = -0.44; hk.rotation.z = -0.4; hook.add(hk);
    const load = new T.Group();
    const anode = MAT.paint(0x2f3236, { wear: 0.15, seed: 123, rough: 1, metal: 0 });
    load.add(at(rbox(1.7, 0.6, 0.75, anode, 0.04), 0, -1.75, 0)); load.add(at(rbox(1.7, 0.6, 0.75, anode, 0.04), 0, -2.37, 0));
    const chM = MAT.steel({ tint: 0x8a8e93 }); [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]].forEach(([x, z]) => { const c = cyl(0.02, 0.02, 1.25, chM, 6); c.position.set(x / 2, -0.88, z / 2); c.rotation.z = -x * 0.55; c.rotation.x = z * 0.55; load.add(c); });
    const lpl = plate(['2 t'], 0.4, 0.2, { bg: '#f1efe8', fg: '#1b1f24' }); at(lpl, 0, -1.75, 0.38); load.add(lpl);
    { const st = MAT.steel({ tint: 0x8a8e93 }), yl = MAT.paint(0xd2a024, { wear: 0.5 }), d = new T.Group();
      [-1, 1].forEach(sx => [-0.75, 1.0].forEach(zz => { d.add(at(cylZ(0.15, 0.1, st, 24), sx * 0.7, 9.98, zz)); d.add(at(cylZ(0.05, 0.14, st, 10), sx * 0.7, 9.98, zz)); }));   // rodas do carro
      d.add(at(cylZ(0.3, 0.12, st, 28), 0.45, 9.85, 0.12)); d.add(at(cylZ(0.3, 0.05, MAT.paint(0x3f5b4b, { wear: 0.3 }), 28), 0.45, 9.85, 0.2));                           // tambor do cabo
      for (let i = 0; i < 6; i++) d.add(at(cylZ(0.305, 0.012, st, 28), 0.45, 9.85, 0.07 + i * 0.016));                                                                     // canais do tambor
      d.add(at(box(0.06, 0.3, 0.04, yl), 0.6, 10.75, 1.3)); d.add(boltsAt([[0.8, 10.69, 1.25], [-0.8, 10.69, 1.25], [0.8, 9.95, 1.28], [-0.8, 9.95, 1.28]], { r: 0.04, h: 0.04, ax: 'z' }));
      trolley.add(bake(d));
      const hd = new T.Group(); [-1, 1].forEach(sx => hd.add(at(cylZ(0.13, 0.05, st, 24), sx * 0.12, 0.28, 0))); hd.add(at(rbox(0.04, 0.12, 0.12, yl, 0.01), 0, 0.2, 0.0));                   // polias do moitão
      hd.add(at(box(0.02, 0.2, 0.02, st), 0.1, -0.75, 0.0)); hook.add(bake(hd)); }
    hook.add(load); trolley.add(hook); scene.add(trolley);
    R.trolley = trolley; R.hook = hook;
    // calços
    const wood = MAT.paint(0x8a6a44, { wear: 0.1, seed: 125, rough: 1, metal: 0 });
    scene.add(at(rbox(0.3, 0.3, 1.2, wood, 0.02), 0.45, 0.15, 0.12)); scene.add(at(rbox(0.3, 0.3, 1.2, wood, 0.02), 1.55, 0.15, 0.12));
    // isolamento de área
    const kit = new T.Group(); const coneM = MAT.paint(0xe0571e, { wear: 0.35, seed: 127 });
    for (let i = 0; i < 3; i++) kit.add(at(cyl(0.04, 0.2, 0.6, coneM, 20), 4.4, 0.3 + i * 0.1, 3.6));
    kit.add(at(box(0.42, 0.04, 0.42, MAT.flat(0x1b1f24)), 4.4, 0.02, 3.6));
    for (let i = 0; i < 3; i++) kit.add(at(cyl(0.03, 0.03, 1.0, MAT.paint(0xe8e6e0, { wear: 0.3 }), 8), 5.0 + i * 0.12, 0.5, 3.4));
    R.parts.area = ctx.hit(kit, 'area'); R.anchors.area = [4.6, 0.7, 3.6]; R.names.area = 'Kit de isolamento de área';
    const ring = new T.Group(); const pts = [[-2.2, -2.0], [3.2, -2.0], [3.2, 2.3], [-2.2, 2.3]];
    pts.forEach(([x, z]) => { ring.add(at(cyl(0.04, 0.2, 0.7, coneM, 20), x + 1, 0.35, z)); ring.add(at(cyl(0.02, 0.02, 0.9, MAT.paint(0xe8e6e0), 8), x + 1, 0.8, z)); });
    for (let i = 0; i < 4; i++) { const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % 4]; const len = Math.hypot(x2 - x1, z2 - z1); const ch = box(len, 0.03, 0.03, MAT.flat(0xc9301e, { rough: 0.6 })); ch.position.set((x1 + x2) / 2 + 1, 1.15, (z1 + z2) / 2); ch.rotation.y = -Math.atan2(z2 - z1, x2 - x1); ring.add(ch); }
    ring.visible = false; scene.add(ring); R.ring = ring;
    // chave seccionadora do barramento
    const chave = new T.Group(); const kx = -7.6, kz = 0.8;
    chave.add(at(cabinet(0.7, 0.9, 0.35, 0x8d9296, 0.35, 129), kx + 0.45, 1.6, kz));
    chave.add(at(cylZ(0.13, 0.05, MAT.flat(0xd2a024, { rough: 0.5 }), 24), kx + 0.45, 1.65, kz + 0.2));
    const knob = new T.Group(); knob.position.set(kx + 0.45, 1.65, kz + 0.24); knob.add(rbox(0.06, 0.24, 0.06, MAT.flat(0xb3261e, { rough: 0.4 }), 0.02)); chave.add(knob); R.knob = knob;
    chave.add(at(plate(['Q1 · BARRAMENTO PR-301'], 0.6, 0.08, { bg: '#1b1f24', fg: '#f2f2f2', border: false }), kx + 0.45, 1.98, kz + 0.18));
    chave.add(at(cyl(0.04, 0.04, 6.2, MAT.galv(), 8), kx + 0.45, 5.2, kz));
    R.parts.chave = ctx.hit(chave, 'chave'); R.anchors.chave = [kx + 0.45, 1.6, kz + 0.2]; R.names.chave = 'Q1 · Chave do barramento (440 V)';
    const lkC = padlock(); lkC.position.set(kx + 0.62, 1.45, kz + 0.26); lkC.visible = false; scene.add(lkC); R.lockChave = lkC;
    // QA-02
    const aux = new T.Group(); const ax = -5.2, az = -4.6;
    aux.add(at(cabinet(0.6, 0.75, 0.25, 0xc5c7c2, 0.3, 131), ax, 1.7, az + 0.15));
    const lev = rbox(0.08, 0.2, 0.06, MAT.flat(0x2f6db5, { rough: 0.4 }), 0.02); at(lev, ax, 1.75, az + 0.32); aux.add(lev); R.lever = lev;
    aux.add(at(plate(['QA-02 · 220 V', 'COMANDO / FREIO PR-301'], 0.55, 0.14, { bg: '#1b1f24', fg: '#f2f2f2' }), ax, 2.2, az + 0.3));
    aux.add(at(cyl(0.05, 0.05, 1.4, MAT.galv(), 10), ax, 0.7, az)); aux.add(at(cyl(0.025, 0.025, 6.5, MAT.galv(), 8), ax, 5.3, az + 0.15)); aux.add(at(box(0.5, 0.06, 0.5, MAT.galv()), ax, 0.03, az));
    R.parts.aux = ctx.hit(aux, 'aux'); R.anchors.aux = [ax, 1.8, az + 0.3]; R.names.aux = 'QA-02 · Alimentação auxiliar 220 V';
    const lkA = padlock(); lkA.position.set(ax + 0.18, 1.55, az + 0.34); lkA.visible = false; scene.add(lkA); R.lockAux = lkA;
    // caixa de bloqueio coletivo
    const cx = new T.Group(); const bxp = [7.6, 1.6, 1.4];
    cx.add(at(cabinet(0.6, 0.7, 0.25, 0xb3261e, 0.3, 133), ...bxp));
    cx.add(at(plate(['BLOQUEIO', 'COLETIVO'], 0.45, 0.16, { bg: '#f1efe8', fg: '#b3261e' }), bxp[0], bxp[1] + 0.15, bxp[2] + 0.13));
    R.parts.caixa = ctx.hit(cx, 'caixa'); R.anchors.caixa = [bxp[0], bxp[1], bxp[2] + 0.15]; R.names.caixa = 'Caixa de bloqueio coletivo';
    R.boxLocks = [0xd9531e, 0x2f6db5, 0x6b4fa8].map((c, i) => { const l = padlock(c, false); l.position.set(bxp[0] - 0.15 + i * 0.15, bxp[1] - 0.22, bxp[2] + 0.16); l.visible = false; scene.add(l); return l; });
    // operador com controle
    const op = person({ suit: 0x2b3a55, pose: 'hold', skin: 0xb07c5c, vest: 0xc6e22a, earmuff: true }); op.position.set(4.8, 0, 2.6); op.rotation.y = -0.6;
    const pend = rbox(0.12, 0.26, 0.08, MAT.paint(0xd2a024, { wear: 0.3 }), 0.02); pend.position.set(0, -0.1, 0.05); pend.rotation.x = 1.0; op.userData.hands[1].add(pend);
    R.parts.controle = ctx.hit(op, 'controle'); R.anchors.controle = [4.8, 1.3, 2.6]; R.names.controle = 'Operador com o controle da ponte';
    const me = person({ suit: 0x3d4a3a, helmet: 0xd8a21c, earmuff: true, harness: 0xd2641a }); me.position.set(-4.6, 0, 3.4); me.rotation.y = 2.4; scene.add(me);
    // animação
    let tx = 0, hy = -3.0;
    ctx.tick((dt, t) => {
      const targetX = R.state.moving ? Math.sin(t * 0.35) * 3.5 : 1.0; tx += (targetX - tx) * Math.min(1, dt * (R.state.moving ? 4 : 1.5)); trolley.position.x = tx;
      const targetY = R.state.down ? -6.5 : -3.6; hy += (targetY - hy) * Math.min(1, dt * 0.9);
      hook.position.set(0, 9.75 + hy, 0.12); hook.rotation.z = R.state.moving ? Math.sin(t * 1.3) * 0.03 : 0;
      const len = -hy - 0.3; [cable, cable2].forEach((c, i) => { c.scale.y = len; c.position.set(i ? 0.12 : -0.12, 9.6 - len / 2, 0.12); });
    });
    envCrane(ctx);
    R.view = { cam: [10, 7.5, 18], target: [-0.5, 4.8, 0] };
    return R;
  }

  /* ================= PORTO · CT-101 ================= */
  function conveyor(ctx) {
    const { scene } = ctx; const R = { parts: {}, anchors: {}, names: {}, state: { running: true, tension: true } };
    W.shed(ctx, { w: 40, d: 22, h: 10, z0: -9, wall: 0x8a8580, steel: 0x5a6168, bay: 6, noBack: true, noSides: true, lampI: 0.4, floorTint: 0x8a7468, seed: 12 });
    W.dust(ctx, 500, [36, 6, 18], 0xd99a7a, [0, 0.4, 0]);
    // cais, mar e navio
    ctx.sky();
    const seaM = MAT.water([40, 20]); const sea = mesh(new T.PlaneGeometry(240, 120), seaM, { cast: false }); sea.rotation.x = -Math.PI / 2; at(sea, 0, -1.2, -78); scene.add(sea);
    ctx.tick((dt) => { seaM.normalMap.offset.x += dt * 0.004; seaM.normalMap.offset.y += dt * 0.0025; });
    scene.add(at(box(240, 1.6, 2, MAT.concrete([40, 1], 0x8a8784, 13)), 0, -0.4, -18.2));
    // carregador de navio
    const sl = MAT.paint(0x5a6168, { wear: 0.5, seed: 145 });
    scene.add(at(box(1.2, 14, 1.2, sl), -14, 7, -15)); scene.add(at(box(1.2, 14, 1.2, sl), -9, 7, -15)); scene.add(at(box(26, 1.4, 1.6, sl), -11, 14, -22));
    // estrutura da correia
    const H = 1.25, X0 = -13, X1 = 13; const galv = MAT.galv({ rep: [8, 1] });
    [-0.78, 0.78].forEach(z => { scene.add(at(box(X1 - X0, 0.2, 0.08, galv), 0, H - 0.25, z)); scene.add(at(box(X1 - X0, 0.12, 0.06, galv), 0, 0.42, z)); });
    for (let x = X0 + 0.6; x <= X1 - 0.4; x += 2.4) [-0.78, 0.78].forEach(z => scene.add(at(box(0.1, H - 0.2, 0.1, galv), x, (H - 0.2) / 2, z)));
    { const l = [], pl = new T.Group(); for (let x = X0 + 0.6; x <= X1 - 0.4; x += 2.4) [-0.78, 0.78].forEach(zz => { pl.add(at(box(0.26, 0.02, 0.26, galv), x, 0.01, zz)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => l.push([x + a * 0.09, 0.04, zz + b * 0.09])); });
      scene.add(bake(pl)); scene.add(boltsAt(l, { r: 0.022, h: 0.03, stud: 0.03 })); }
    // roletes de carga
    const rollM = MAT.paint(0x2f3438, { wear: 0.3, seed: 147 }); const R0 = 0.07, cw = 0.42, ang = Math.PI / 6;
    R.idlers = [];
    for (let x = X0 + 0.8; x <= X1 - 0.8; x += 1.2) {
      const g = new T.Group(); g.position.set(x, H, 0);
      g.add(at(cylZ(R0, cw, rollM, 16), 0, 0, 0));
      [-1, 1].forEach(s => { const r = cylZ(R0, cw, rollM, 16); r.rotation.x = Math.PI / 2 + s * ang; r.position.set(0, Math.sin(ang) * (cw / 2 + 0.02) + 0.01, s * (cw / 2 + Math.cos(ang) * cw / 2 + 0.02)); g.add(r); });
      g.add(at(box(0.06, 0.06, 1.5, galv), 0, -0.1, 0));
      [-0.7, 0.7].forEach(z => g.add(at(box(0.05, 0.36, 0.05, galv), 0, 0.05, z)));
      g.add(at(cylZ(R0 * 0.9, 1.3, rollM, 12), 0, -0.82, 0));
      scene.add(g); R.idlers.push(g);
    }
    // correia (calha) + retorno
    const beltM = MAT.rubber([16, 1]);
    const bc = mesh(new T.PlaneGeometry(X1 - X0, cw + 0.02), beltM); bc.rotation.x = -Math.PI / 2; at(bc, 0, H + R0 + 0.01, 0); scene.add(bc);
    [-1, 1].forEach(s => { const b = mesh(new T.PlaneGeometry(X1 - X0, cw), beltM); b.rotation.x = -Math.PI / 2 - s * ang * -1; b.rotation.x = -Math.PI / 2 + s * ang; at(b, 0, H + R0 + 0.01 + Math.sin(ang) * cw / 2, s * (cw / 2 + Math.cos(ang) * cw / 2)); b.material.side = T.DoubleSide; scene.add(b); });
    const ret = mesh(new T.PlaneGeometry(X1 - X0, 1.1), beltM); ret.rotation.x = Math.PI / 2; at(ret, 0, H - 0.82 - R0 - 0.01, 0); ret.material.side = T.DoubleSide; scene.add(ret);
    // bauxita
    const bxm = MAT.bauxite([24, 1]);
    const pile = mesh(new T.CylinderGeometry(0.32, 0.32, X1 - X0 - 1, 20, 1, false, 0, Math.PI), bxm); pile.rotation.z = Math.PI / 2; pile.scale.set(0.5, 1, 1); at(pile, 0, H + R0 + 0.06, 0); scene.add(pile); R.pileTex = bxm.map;
    // tambores e acionamento
    const drum = (x) => { const d = cylZ(0.42, 1.25, MAT.steel({ tint: 0x6f7378 }), 32); at(d, x, H - 0.38, 0); scene.add(d); return d; };
    R.headDrum = drum(X1 + 0.2); R.tailDrum = drum(X0 - 0.2);
    const drv = new T.Group(); drv.add(at(rbox(0.8, 0.7, 0.7, MAT.paint(0x4c5661, { wear: 0.4 }), 0.05), X1 + 0.2, H - 0.4, 1.25));
    drv.add(at(cylX(0.34, 1.1, MAT.paint(0x3f5b4b, { wear: 0.35 }), 32), X1 + 0.2, H - 0.4, 2.3)); drv.children[1].rotation.set(Math.PI / 2, 0, 0);
    scene.add(at(box(1.6, 0.25, 2.2, galv), X1 + 0.2, 0.12, 1.8)); scene.add(drv);
    scene.add(at(plate(['CT-101 · BAUXITA'], 1.6, 0.26, { bg: '#1b1f24', fg: '#e8b93a' }), -4, H - 0.25, 0.83));
    // esticador por gravidade
    const est = new T.Group(); const ex = 8.4;
    [-0.6, 0.6].forEach(z => est.add(at(box(0.12, 3.2, 0.12, galv), ex, 1.6 - 0.0, z + 1.6)));
    est.add(at(box(0.12, 0.12, 1.4, galv), ex, 3.2, 1.6));
    const cw8 = rbox(0.9, 0.7, 0.9, MAT.concrete([1, 1], 0x9a9895, 21), 0.04); at(cw8, ex, 2.0, 1.6); est.add(cw8); R.counter = cw8;
    est.add(at(cyl(0.015, 0.015, 1.2, MAT.steel(), 6), ex, 2.85, 1.6));
    est.add(at(plate(['CONTRAPESO', '3,5 t'], 0.6, 0.22, { bg: '#d9a21c', fg: '#1b1f24' }), ex, 2.0, 2.06));
    const pin = cylZ(0.04, 1.4, MAT.flat(0xb3261e, { rough: 0.4 }), 10); at(pin, ex, 1.55, 1.6); pin.visible = false; est.add(pin); R.pin = pin;
    R.parts.esticador = ctx.hit(est, 'esticador'); R.anchors.esticador = [ex, 2.0, 2.0]; R.names.esticador = 'Esticador por gravidade (contrapeso)';
    // cabo de emergência
    const cabo = new T.Group(); const cy = H + 0.15, cz = 1.0;
    cabo.add(at(cylX(0.008, X1 - X0 - 1, MAT.flat(0xd2a024, { rough: 0.5 }), 6), 0, cy, cz));
    [-10, -2, 6].forEach(x => { cabo.add(at(rbox(0.2, 0.26, 0.16, MAT.paint(0xd2a024, { wear: 0.4 }), 0.02), x, cy, cz + 0.04)); cabo.add(at(box(0.05, 0.4, 0.05, galv), x, cy - 0.3, cz)); });
    R.parts.cabo = ctx.hit(cabo, 'cabo'); R.anchors.cabo = [-2, cy, cz]; R.names.cabo = 'Cabo de emergência (puxar para parar)';
    // rolete travado
    const jam = R.idlers[R.idlers.length / 2 | 0]; jam.children[0].material = MAT.paint(0x7a3b22, { wear: 0.9, seed: 149 });
    const jamHit = new T.Group(); jamHit.position.copy(jam.position); const jb = box(0.35, 0.3, 1.5, MAT.flat(0x000000, { opacity: 0.001 })); jb.material.transparent = true; jb.material.depthWrite = false; jb.castShadow = false; jamHit.add(jb);
    R.parts.rolete = ctx.hit(jamHit, 'rolete'); R.anchors.rolete = [jam.position.x, H, 0]; R.names.rolete = 'Rolete de carga travado';
    R.jam = jam;
    // botoeira local
    const bot = new T.Group(); const bx = -6.2, bz = 2.0;
    bot.add(at(cyl(0.04, 0.04, 1.4, galv, 10), bx, 0.7, bz));
    bot.add(at(rbox(0.3, 0.42, 0.2, MAT.paint(0xd8a21c, { wear: 0.5, seed: 151 }), 0.03), bx, 1.52, bz));
    bot.add(at(cylZ(0.05, 0.05, MAT.flat(0x1f8a43), 20), bx, 1.6, bz + 0.12)); bot.add(at(cylZ(0.06, 0.06, MAT.flat(0xb3261e), 20), bx, 1.43, bz + 0.12));
    R.parts.botoeira = ctx.hit(bot, 'botoeira'); R.anchors.botoeira = [bx, 1.5, bz]; R.names.botoeira = 'Botoeira local CT-101';
    // painel elétrico
    const pn = new T.Group(); const px = -10.5, pz = -2.8;
    pn.add(at(cabinet(1.6, 2.1, 0.6, 0xc5c7c2, 0.35, 153), px, 1.05, pz));
    pn.add(at(plate(['QD-CT101 · 440 V'], 1.2, 0.16, { bg: '#1b1f24', fg: '#f2f2f2' }), px, 1.9, pz + 0.31));
    const pk = new T.Group(); pk.position.set(px + 0.35, 1.25, pz + 0.33); pk.add(rbox(0.07, 0.24, 0.06, MAT.flat(0x1b1f24), 0.02)); pn.add(pk); R.panelKnob = pk;
    const pg = lamp(0x2fbf5a, true), pr = lamp(0xd93a2b, false); at(pg, px - 0.3, 1.5, pz + 0.32); at(pr, px - 0.15, 1.5, pz + 0.32); pn.add(pg); pn.add(pr); R.pLamps = [pg, pr];
    R.parts.painel = ctx.hit(pn, 'painel'); R.anchors.painel = [px, 1.3, pz + 0.3]; R.names.painel = 'QD-CT101 · Painel da correia';
    const lkP = padlock(); lkP.position.set(px + 0.5, 1.05, pz + 0.36); lkP.visible = false; scene.add(lkP); R.lockPanel = lkP;
    // caixa coletiva
    const cxx = new T.Group(); const cp = [-9.2, 1.2, pz + 0.05];
    cxx.add(at(cabinet(0.5, 0.6, 0.22, 0xb3261e, 0.3, 155), ...cp));
    cxx.add(at(plate(['BLOQUEIO', 'COLETIVO'], 0.4, 0.14, { bg: '#f1efe8', fg: '#b3261e' }), cp[0], cp[1] + 0.13, cp[2] + 0.115));
    R.parts.caixa = ctx.hit(cxx, 'caixa'); R.anchors.caixa = [cp[0], cp[1], cp[2] + 0.12]; R.names.caixa = 'Caixa de bloqueio coletivo';
    R.boxLocks = [0xd9531e, 0x2f6db5, 0x1f8a43].map((c, i) => { const l = padlock(c, i === 2); l.position.set(cp[0] - 0.13 + i * 0.13, cp[1] - 0.2, cp[2] + 0.13); l.visible = false; scene.add(l); return l; });
    // pessoas
    const op = person({ suit: 0x2b3a55, vest: 0xff6a13, earmuff: true }); op.position.set(3.2, 0, 3.0); op.rotation.y = -0.7;
    R.parts.operador = ctx.hit(op, 'operador'); R.anchors.operador = [3.2, 1.4, 3.0]; R.names.operador = 'Operador da área';
    const ct = person({ suit: 0x5a6b2a, helmet: 0x2f6db5, vest: 0xc6e22a, glove: 0x6a6f74, earmuff: false }); ct.position.set(-2.4, 0, 3.4); ct.rotation.y = 0.3;
    R.parts.contratado = ctx.hit(ct, 'contratado'); R.anchors.contratado = [-2.4, 1.4, 3.4]; R.names.contratado = 'Mecânico da contratada';
    const me = person({ suit: 0x3d4a3a, helmet: 0xd8a21c, earmuff: true }); me.position.set(-4.4, 0, 2.6); me.rotation.y = 2.8; scene.add(me);
    // animação
    let sp = 1;
    ctx.tick((dt) => {
      sp += ((R.state.running ? 1 : 0) - sp) * Math.min(1, dt * 1.2);
      R.pileTex.offset.x -= dt * 0.35 * sp; beltM.map.offset.x -= dt * 0.8 * sp;
      R.headDrum.rotation.y += 0; [R.headDrum, R.tailDrum].forEach(d => d.rotateY(-dt * 4 * sp));
      R.idlers.forEach(g => { if (g !== R.jam) g.children[0].rotateY(dt * 9 * sp); });
      const ty = R.state.tension ? 2.0 : 1.95; R.counter.position.y += (ty - R.counter.position.y) * dt * 2;
    });
    R.setPanel = (on) => { R.pLamps[0].material.emissiveIntensity = on ? 2.5 : 0.05; R.pLamps[1].material.emissiveIntensity = on ? 0.05 : 2.5; R.panelKnob.rotation.z = on ? 0 : -Math.PI / 2; };
    envPort(ctx);
    R.view = { cam: [2.5, 4.6, 11], target: [-1.5, 1.2, 0] };
    return R;
  }
  return { pump, crane, conveyor };
})();
