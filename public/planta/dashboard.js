
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const st={get(k,d){try{return localStorage.getItem(k)??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const g=document.getElementById('g'); g.value=st.get('rc2_grupo','Grupo 1'); g.oninput=()=>{st.set('rc2_grupo',g.value.trim()||'Grupo 1');draw()};
const pos={1:[505,238],2:[830,470],3:[600,300],4:[170,560]};
function results(){try{return JSON.parse(st.get('rc2_results','[]'))}catch(e){return[]}}
function draw(){
  const R=results(), grp=g.value.trim()||'Grupo 1';
  document.getElementById('cards').innerHTML=SAS.map(s=>{const last=R.filter(r=>r.sa===s.id&&r.grupo===grp).pop();
    return `<a class="sa" href="sa?sa=${s.id}" data-sa="${s.id}"><img src="/planta/thumb-sa${s.id}.jpg" alt="Cena 3D da SA${s.id}"><div><div class="meta"><b>SA${s.id}</b><span>${s.hora}</span><span>${esc(s.area)}</span></div><h2>${esc(s.titulo)}</h2><p class="fo">${esc(s.foco)}</p><div class="st ${last?'ok':''}">${last?`✓ ${esc(grp)} · ${last.score} pts · ${last.crit} críticos`:'Não iniciada · cerca de 30 min'}</div></div></a>`}).join('');
  document.getElementById('mk').innerHTML=SAS.map(s=>{const [x,y]=pos[s.id];const lx=s.id===2?x+18:s.id===4?x+18:x+18;return `<g class="mk" data-sa="${s.id}" transform="translate(${x} ${y})"><circle class="r" r="11"/><circle class="c" r="11" fill="#e0a43a"/><text text-anchor="middle" y="4" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="600" fill="#15120c">${s.id}</text><text x="18" y="-6" font-family="IBM Plex Mono, monospace" font-size="11" fill="#e9ebee">SA${s.id} · ${s.hora}</text><text x="18" y="9" font-family="IBM Plex Sans, sans-serif" font-size="11" fill="#9aa3ad">${esc(s.os.equip.split(' · ')[0])}</text></g>`}).join('');
  document.querySelectorAll('.mk').forEach(m=>{m.onclick=()=>location.href='sa?sa='+m.dataset.sa;m.onmouseenter=()=>hl(m.dataset.sa,1);m.onmouseleave=()=>hl(m.dataset.sa,0)});
  document.querySelectorAll('.sa').forEach(c=>{c.onclick=e=>{e.preventDefault();location.assign('/sa?sa='+c.dataset.sa)};c.onmouseenter=()=>hl(c.dataset.sa,1);c.onmouseleave=()=>hl(c.dataset.sa,0)});
  const rows=R.slice().reverse();
  document.getElementById('tbl').innerHTML=rows.length?`<table><tr><th>Grupo</th><th>Situação</th><th>Pontos</th><th>Críticos</th><th>Falhas</th><th>Data</th></tr>${rows.map(r=>`<tr><td>${esc(r.grupo)}</td><td>SA${r.sa} · ${esc(SAS[r.sa-1].area)}</td><td class="n">${r.score}</td><td class="n">${esc(r.crit)}</td><td class="n">${esc((r.fails||[]).join(' ')||'—')}</td><td class="n">${new Date(r.data).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</td></tr>`).join('')}</table>`:'<p class="empty">Nenhuma situação concluída ainda.</p>';
}
function hl(id,on){document.querySelectorAll(`[data-sa="${id}"]`).forEach(e=>e.classList.toggle('hl',!!on))}
document.getElementById('clr-g1').onclick=()=>{st.set('rc2_results',JSON.stringify(results().filter(r=>r.grupo!=='Grupo 1')));draw()};
document.getElementById('clr').onclick=()=>{st.set('rc2_results','[]');draw()};
draw();
