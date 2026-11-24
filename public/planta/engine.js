/* Motor das situações de aprendizagem: 6 momentos, registro de decisões e avaliação por critérios */
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const qp = new URLSearchParams(location.search);
  const SA = SAS[(+qp.get('sa') || 1) - 1] || SAS[0];
  const grupo = (() => { try { return localStorage.getItem('rc2_grupo') || 'Grupo 1'; } catch (e) { return 'Grupo 1'; } })();
  const MOM = ['Contexto', 'AST', 'Execução', 'Cenário', 'Debrief', 'Bancada'];
  const G = { mom: 0, score: 100, log: [], fails: {}, t0: Date.now(), ast: null, cen: null, sel: null, fala: 0 };
  const S = {};
  document.title = `SA${SA.id} · ${SA.titulo}`;

  /* ---------- cena ---------- */
  const side = () => (window.innerWidth > 900 ? $('#side').offsetWidth : 0);
  const ctx = W.create($('#view'), Object.assign({ side }, SA.cfg));
  const R = SCN[SA.scene](ctx);
  SA.init(S, R);
  window.__sa = { G, S, R, ctx, SA };
  const tags = {};
  Object.keys(R.parts).forEach(id => {
    tags[id] = ctx.label({ pos: R.anchors[id], html: `<span>${esc(R.names[id].split(' · ')[0].split(' (')[0])}</span>`, hidden: true });
  });
  const tip = $('#tip');
  ctx.onHover = (id) => { tip.style.display = id && G.mom === 2 ? 'block' : 'none'; if (id) tip.textContent = R.names[id]; };
  window.addEventListener('pointermove', e => { tip.style.left = (e.clientX + 16) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; });
  ctx.onPick((id) => { if (G.mom !== 2 || $('#modal').classList.contains('on')) return; if (!id) return; select(id); });
  window.__sel = (id) => select(id);
  function select(id) { G.sel = id; Object.entries(tags).forEach(([k, L]) => L.el.classList.toggle('sel', k === id)); ctx.focus(R.anchors[id], 6.5); render(); }

  /* ---------- utilidades ---------- */
  const clock = () => { const s = Math.floor((Date.now() - G.t0) / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function add(k, msg, c) { G.log.push({ k, msg, at: clock() }); if (c && (k === 'crit' || k === 'mod')) G.fails[c] = true; if (k === 'crit') G.score -= 20; if (k === 'mod') G.score -= 5; G.score = Math.max(0, G.score); hud(); }
  const api = {
    ok: (m) => add('ok', m), info: (m) => add('info', m), mod: (m, c) => add('mod', m, c),
    animate: (object, path, to, duration) => ctx.animate(object, path, to, duration),
    crit(title, text, c) { add('crit', title + ': ' + text.split('.')[0] + '.', c); showCrit(title, text); return false; },
  };
  function avatar(who) {
    const p = PESSOAS[who] || PESSOAS.nar;
    const svg = who === 'nar' ? '<svg viewBox="0 0 40 44"><circle cx="20" cy="22" r="9" fill="none" stroke="#7d8790" stroke-width="2"/><path d="M20 17v6l4 3" stroke="#7d8790" stroke-width="2" fill="none"/></svg>'
      : '<svg viewBox="0 0 40 44"><path d="M7 44c0-9 6-14 13-14s13 5 13 14z" fill="#3a424c"/><circle cx="20" cy="18" r="8" fill="#4a535e"/><path d="M10.5 16a9.5 9.5 0 0 1 19 0z" fill="' + p.cor + '"/><rect x="9" y="15" width="22" height="2.2" fill="' + p.cor + '"/></svg>';
    return `<div class="av" style="--c:${p.cor}">${svg}</div>`;
  }
  function hud() {
    $('#hud').innerHTML = `<div class="hb"><small><a href="/">← Planta</a></small><b>${esc(SA.area)}</b></div>
      <div class="hb"><small>Turno A</small><b>${SA.hora}</b></div>
      <div class="hb"><small>${esc(grupo)}</small><b>${G.score} pts</b></div>`;
    $('#hud a').onclick = (event) => { event.preventDefault(); location.assign('/'); };
  }

  /* ---------- render da barra lateral ---------- */
  function render() {
    $('#steps').innerHTML = MOM.map((m, i) => `<div class="${i === G.mom ? 'on' : i < G.mom ? 'past' : ''}">${m}</div>`).join('');
    const body = $('#body'), foot = $('#foot');
    Object.values(tags).forEach(L => L.hidden = G.mom !== 2);
    if (G.mom === 0) {
      const os = SA.os;
      body.innerHTML = `<h3>Ordem de serviço</h3><div class="os"><div class="top"><span>${os.num}</span><em>Prioridade ${esc(os.prio)}</em></div>
        <div class="r"><span>Equipamento</span><b>${esc(os.equip)}</b></div><div class="r"><span>Local</span><b>${esc(os.local)}</b></div><div class="r"><span>Serviço</span><b>${esc(os.desc)}</b></div></div>
        <h3>Na área</h3>` + SA.falas.slice(0, G.fala + 1).map(([w, t]) => `<div class="fala ${w === 'nar' ? 'nar' : ''}">${avatar(w)}<div><div class="who">${esc(PESSOAS[w].nome)}</div><p>${esc(t)}</p></div></div>`).join('');
      body.scrollTop = body.scrollHeight;
      const last = G.fala >= SA.falas.length - 1;
      foot.innerHTML = last ? `<button class="btn p" id="go">Montar a AST →</button>` : `<button class="btn p" id="go">Próxima fala</button>`;
      $('#go').onclick = () => { if (last) openAST(); else { G.fala++; render(); } };
      return;
    }
    if (G.mom === 1) { body.innerHTML = `<p class="foco">O grupo está montando a AST no painel central.</p>`; foot.innerHTML = ''; return; }
    if (G.mom === 2 || G.mom === 3) {
      const ch = SA.check(S);
      Object.keys(tags).forEach(k => tags[k].el.classList.remove('done'));
      let sel = '';
      if (G.sel) {
        const A = SA.actions(G.sel, S, R, api);
        const grid = A.some(a => a.small);
        sel = `<div class="sel"><div class="nm">${esc(R.names[G.sel])}</div>` +
          (A.length ? `<div class="hint">Escolha a ação do grupo.</div>` : `<div class="hint">Nada a fazer neste ponto agora.</div>`) +
          (SA.panel ? SA.panel(G.sel, S) : '') +
          `<div class="acts">${A.filter(a => !a.small).map((a, i) => `<button class="act ${a.done ? 'done' : ''}" data-i="${A.indexOf(a)}" ${a.done || a.dis ? 'disabled' : ''}>${esc(a.t)}</button>`).join('')}</div>` +
          (grid ? `<div class="acts grid">${A.filter(a => a.small).map(a => `<button class="act sm" data-i="${A.indexOf(a)}" ${a.dis ? 'disabled' : ''}>${esc(a.t)}</button>`).join('')}</div>` : '') + `</div>`;
        G._acts = A;
      } else sel = `<div class="empty">Clique em um equipamento ou pessoa na cena para ver as ações possíveis.</div>`;
      const lg = G.log.slice(-4).reverse().map(l => `<li><time>${l.at}</time><span class="${l.k}">${esc(l.msg)}</span></li>`).join('');
      body.innerHTML = `<h3>Ponto selecionado</h3>${sel}<h3>Plano da AST</h3><ul class="chk">${ch.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${esc(t)}</li>`).join('')}</ul>` + (lg ? `<h3>Registro</h3><ul class="log">${lg}</ul>` : '');
      body.querySelectorAll('.act').forEach(b => b.onclick = () => act(+b.dataset.i));
      const fin = SA.done(S);
      foot.innerHTML = `<button class="btn g" id="lbl">${ctx.hideLabels ? 'Mostrar' : 'Ocultar'} rótulos</button><button class="btn p" id="go" ${fin ? '' : 'disabled'}>${fin ? 'Ir para o debriefing →' : 'Tarefa em andamento'}</button>`;
      $('#lbl').onclick = () => { ctx.hideLabels = !ctx.hideLabels; render(); };
      $('#go').onclick = () => { if (!G.cen) openCen(); else openDeb(); };
      return;
    }
    if (G.mom >= 4) { body.innerHTML = `<p class="foco">Debriefing em andamento no painel central.</p>`; foot.innerHTML = ''; }
  }
  function act(i) {
    const a = G._acts[i]; if (!a) return;
    const result = a.run(); if (result !== false) ctx.perform(R.me, R.anchors[G.sel]); render();
    if (!G.cen && SA.cen.when(S) && !$('#modal').classList.contains('on')) setTimeout(openCen, 700);
  }

  /* ---------- modal ---------- */
  function modal(html, full) { const m = $('#modal'); m.innerHTML = html; m.classList.add('on'); m.classList.toggle('full', !!full); }
  function close() { const m = $('#modal'); m.classList.remove('on', 'full'); m.innerHTML = ''; clearInterval(G.tmr); }
  function showCrit(title, text) {
    modal(`<div class="pn crit"><div class="ph"><div><div class="eyebrow">Evento crítico · −20 pts</div><h2>${esc(title)}</h2></div></div>
      <div class="pb"><p style="font-size:18px;margin:0">${esc(text)}</p><p class="ctx" style="margin-top:14px">A ação não foi executada. A cena volta ao ponto anterior e o evento fica registrado para o debriefing.</p></div>
      <div class="pf"><button class="btn p" id="mok">Voltar ao ponto anterior</button></div></div>`);
    $('#mok').onclick = () => { close(); render(); };
  }

  /* ---------- AST ---------- */
  function openAST() {
    G.mom = 1; render(); ctx.home();
    const A = SA.ast; const pick = {}; const sel = new Set();
    const draw = (checked) => {
      modal(`<div class="pn w"><div class="ph"><div><div class="eyebrow">Momento 2 · Planejamento</div><h2>Análise de segurança da tarefa</h2></div><div class="eyebrow" style="color:var(--mu)">${esc(SA.os.num)} · ${esc(SA.os.equip)}</div></div>
        <div class="pb"><div class="ast">
          <div><h3>1 · Perigo ou risco?</h3><p class="legend">Perigo é a fonte de dano. Risco é o que pode acontecer com a pessoa exposta a ele.</p><div class="cards">
          ${A.cards.map(([t, k], i) => `<div class="card ${checked ? (pick[i] === k ? 'right' : 'wrong') : ''}"><div>${esc(t)}${checked && pick[i] !== k ? `<small>É ${k === 'P' ? 'perigo' : 'risco'}.</small>` : ''}</div><div class="seg"><button data-c="${i}" data-k="P" class="${pick[i] === 'P' ? 'on' : ''}" ${checked ? 'disabled' : ''}>Perigo</button><button data-c="${i}" data-k="R" class="${pick[i] === 'R' ? 'on' : ''}" ${checked ? 'disabled' : ''}>Risco</button></div></div>`).join('')}
          </div></div>
          <div><h3>2 · Controles críticos</h3><p class="legend">Marquem só o que é barreira de verdade para esta tarefa.</p>
          ${A.controls.map(([t, ok, why], i) => { const on = sel.has(i); const cls = checked ? ((on && ok) ? 'right' : (on && !ok) || (!on && ok) ? 'wrong' : '') : ''; return `<label class="ctl ${cls}"><input type="checkbox" data-k="${i}" ${on ? 'checked' : ''} ${checked ? 'disabled' : ''}><span>${esc(t)}${checked && on && !ok ? `<small>${esc(why)}</small>` : ''}${checked && !on && ok ? '<small>Faltou: este controle é crítico.</small>' : ''}</span></label>`; }).join('')}
          </div></div>
          ${checked ? `<div class="res"><div><div class="eyebrow">Classificação</div><b>${checked.c}/${A.cards.length}</b></div><div><div class="eyebrow">Controles</div><b>${checked.k}/${A.controls.length}</b></div><div class="ctx" style="margin:0">Revisem em voz alta o que ficou vermelho antes de seguir.</div></div>` : ''}
        </div>
        <div class="pf">${checked ? '<button class="btn p" id="ago">Ir para a execução →</button>' : `<button class="btn p" id="ack" ${Object.keys(pick).length < A.cards.length ? 'disabled' : ''}>Conferir a AST</button>`}</div></div>`, true);
      document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { pick[b.dataset.c] = b.dataset.k; draw(); });
      document.querySelectorAll('.ctl input').forEach(b => b.onchange = () => { b.checked ? sel.add(+b.dataset.k) : sel.delete(+b.dataset.k); draw(); });
      if ($('#ack')) $('#ack').onclick = () => {
        const c = A.cards.filter(([, k], i) => pick[i] === k).length;
        const k = A.controls.filter(([, ok], i) => !!ok === sel.has(i)).length;
        G.ast = { c, k }; const wrongC = A.cards.length - c, wrongK = A.controls.length - k;
        if (c / A.cards.length < 0.8) G.fails.C1 = true;
        if (A.controls.some(([, ok], i) => ok && !sel.has(i))) G.fails.C2 = true;
        G.score = Math.max(0, G.score - wrongC * 2 - wrongK * 3);
        add(wrongC + wrongK ? 'info' : 'ok', `AST: ${c}/${A.cards.length} classificações e ${k}/${A.controls.length} controles corretos.`);
        draw({ c, k });
      };
      if ($('#ago')) $('#ago').onclick = () => { close(); G.mom = 2; render(); };
    };
    draw();
  }

  /* ---------- mudança de cenário ---------- */
  function openCen() {
    if (G.cen) return; const C = SA.cen; G.mom = 3; G.cen = { at: clock() }; if (C.before) C.before(S, R); render();
    let left = 60;
    const lab = { best: 'best', ok: 'okk', mod: 'bad', crit: 'bad' };
    const draw = (chosen) => {
      modal(`<div class="pn cen"><div class="ph"><div><div class="eyebrow">Momento 4 · Mudança de cenário</div><h2>Decisão do grupo</h2></div>${chosen == null ? `<div class="timer" id="tm">${left}s</div>` : ''}</div>
        ${chosen == null ? `<div class="tbar"><i id="tb" style="width:${left / 60 * 100}%"></i></div>` : ''}
        <div class="pb"><div class="cen-who">${avatar(C.who)}<div><div class="eyebrow" style="color:var(--mu)">${esc(PESSOAS[C.who].nome)}</div><p>${esc(C.fala)}</p></div></div>
        <p class="ctx">${esc(C.texto)}</p>
        ${C.opts.map((o, i) => `<button class="opt ${chosen == null ? '' : i === chosen ? lab[o.k] : o.k === 'best' ? 'best' : ''}" data-i="${i}" ${chosen != null ? 'disabled' : ''}><b>${String.fromCharCode(65 + i)}</b>${esc(o.t)}</button>`).join('')}
        ${chosen != null ? `<div class="fb ${C.opts[chosen].k === 'best' ? 'best' : C.opts[chosen].k === 'ok' ? '' : 'bad'}">${esc(C.opts[chosen].fb)}</div>` : ''}
        </div>${chosen != null ? '<div class="pf"><button class="btn p" id="cgo">Continuar a tarefa</button></div>' : ''}</div>`);
      document.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(+b.dataset.i));
      if ($('#cgo')) $('#cgo').onclick = () => { close(); G.mom = 2; render(); };
    };
    const choose = (i) => {
      clearInterval(G.tmr); const o = C.opts[i];
      G.cen.choice = i; G.cen.k = o.k;
      const txt = 'Cenário: ' + o.t + '.';
      if (o.k === 'crit') add('crit', txt, o.c); else if (o.k === 'mod') add('mod', txt, o.c); else add('ok', txt);
      G.log[G.log.length - 1].cen = true;
      if (C.after) C.after(S, R, o);
      draw(i);
    };
    draw();
    G.tmr = setInterval(() => { left--; const t = $('#tm'), b = $('#tb'); if (t) t.textContent = left + 's'; if (b) b.style.width = Math.max(0, left / 60 * 100) + '%'; if (left <= 0) { clearInterval(G.tmr); add('mod', 'O grupo não decidiu no tempo da cena.'); } }, 1000);
  }

  /* ---------- debriefing e bancada ---------- */
  function criteria() {
    return SA.crits.map(c => {
      let ok = !G.fails[c];
      if (c === 'C6' && G.cen && G.cen.k !== 'best') ok = false;
      if (c === 'D3' && G.cen && G.cen.k !== 'best') ok = false;
      if (c === 'D2' && SA.cen.opts.some(o => o.c === 'D2') && G.cen && G.cen.k !== 'best') ok = ok && G.cen.k !== 'crit';
      return [c, ok];
    });
  }
  function save(res) {
    try { const all = JSON.parse(localStorage.getItem('rc2_results') || '[]'); all.push(res); localStorage.setItem('rc2_results', JSON.stringify(all.slice(-80))); } catch (e) { }
  }
  function openDeb() {
    G.mom = 4; render(); ctx.home();
    const cr = criteria(); const crOk = cr.filter(([c, ok]) => CRITERIOS[c][0] === 'Crítico' && ok).length, crN = cr.filter(([c]) => CRITERIOS[c][0] === 'Crítico').length;
    const D = SA.deb;
    modal(`<div class="pn w"><div class="ph"><div><div class="eyebrow">Momento 5 · Debriefing</div><h2>SA${SA.id} · ${esc(SA.titulo)}</h2></div><div class="eyebrow" style="color:var(--mu)">${esc(grupo)} · ${clock()}</div></div>
      <div class="pb"><div class="deb">
        <div><div class="score"><div><b>${G.score}</b> <span>pontos</span></div><div><b>${crOk}/${crN}</b> <span>critérios críticos</span></div></div>
          <h3>Linha do tempo das decisões</h3><ul class="tl">${G.log.map(l => `<li class="${l.k} ${l.cen ? 'cen' : ''}"><time>${l.at}</time>${esc(l.msg)}</li>`).join('')}</ul></div>
        <div><div class="fsi"><div class="eyebrow">Evento de FSI · genérico</div><h4>${esc(D.fsi.t)}</h4><p>${esc(D.fsi.d)}</p><p class="l">${esc(D.fsi.l)}</p></div>
          <h3>Perguntas para a turma</h3><ol class="qs">${D.perguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>
          <h3>Critérios desta situação</h3><table class="crt">${cr.map(([c, ok]) => `<tr><td>${CRITERIOS[c][0]}</td><td>${esc(CRITERIOS[c][1])}</td><td class="${ok ? 'y' : 'n'}">${ok ? '✓' : '✗'}</td></tr>`).join('')}</table></div>
      </div></div>
      <div class="pf"><button class="btn p" id="dgo">Ponte para a bancada →</button></div></div>`, true);
    $('#dgo').onclick = () => {
      save({ grupo, sa: SA.id, score: G.score, crit: `${crOk}/${crN}`, fails: Object.keys(G.fails).filter(k => G.fails[k]), data: new Date().toISOString() });
      G.mom = 5; render();
      const nx = SAS[SA.id];
      modal(`<div class="pn"><div class="ph"><div><div class="eyebrow">Momento 6 · Ponte para a bancada</div><h2>O que repetir no laboratório</h2></div></div>
        <div class="pb"><div class="banc"><svg viewBox="0 0 46 46"><rect x="3" y="12" width="40" height="26" fill="none" stroke="#e0a43a" stroke-width="2"/><path d="M3 20h40M14 12V6h18v6" stroke="#e0a43a" stroke-width="2" fill="none"/><circle cx="14" cy="29" r="3" fill="#e0a43a"/><circle cx="32" cy="29" r="3" fill="#e0a43a"/></svg><div>${esc(D.bancada)}</div></div>
        <p class="ctx" style="margin-top:16px">Resultado salvo neste navegador: ${G.score} pontos, ${crOk}/${crN} critérios críticos.</p></div>
        <div class="pf"><a class="btn" href="/" style="text-decoration:none">Mapa da planta</a>${nx ? `<a class="btn p" href="sa?sa=${nx.id}" style="text-decoration:none">SA${nx.id} · ${esc(nx.area)} →</a>` : ''}</div></div>`, true);
    };
  }

  $('#tools').innerHTML = `<button class="tb" id="home" aria-label="Restaurar vista inicial" title="Restaurar vista inicial">Vista inicial</button><button class="tb" id="camera-mode" aria-pressed="false" title="Arraste para mover a câmera sem girar a cena">Mover câmera</button><div class="zoom-controls" aria-label="Controles de zoom"><button class="tb tb-icon" id="zoom-out" aria-label="Afastar a câmera" title="Afastar">−</button><button class="tb tb-icon" id="zoom-in" aria-label="Aproximar a câmera" title="Aproximar">+</button></div><span class="tb tb-help">Arraste para girar · ative Mover câmera para deslocar · roda para zoom</span>`;
  let panMode = false;
  $('#camera-mode').onclick = () => {
    panMode = !panMode;
    ctx.setPanMode(panMode);
    $('#camera-mode').setAttribute('aria-pressed', String(panMode));
    $('#camera-mode').textContent = panMode ? 'Girar câmera' : 'Mover câmera';
    $('#camera-mode').title = panMode ? 'Arraste para girar a cena' : 'Arraste para mover a câmera sem girar a cena';
  };
  $('#home').onclick = () => ctx.home();
  $('#zoom-out').onclick = () => ctx.zoom(1.22);
  $('#zoom-in').onclick = () => ctx.zoom(0.82);
  $('#eyebrow').textContent = `SA${SA.id} · ${SA.area} · ${SA.hora}`;
  $('#title').textContent = SA.titulo; $('#foco').textContent = SA.foco;
  hud(); render(); ctx.resize();
})();
