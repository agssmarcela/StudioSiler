const CATALOGO={"note": "Fonte única dos serviços. A seção Serviços, o formulário de agendamento e o cálculo do sinal devem ler daqui. 'block_minutes' é o tempo bloqueado na agenda (usa o maior tempo da faixa).", "technique_note": "Todos os volumes de cílios são feitos na técnica fio a fio. O que muita gente chama de 'fio a fio' é o volume clássico.", "categories": [{"id": "cilios", "name": "Cílios", "items": [{"id": "volume-classico", "name": "Volume clássico", "also_known_as": "Fio a fio", "duration_label": "2h40 a 3h", "block_minutes": 180, "price_brl": 140, "description": "Aplicação com resultado mais natural. É o que muita gente conhece como fio a fio.", "booking_options": ["mapping"]}, {"id": "volume-brasileiro", "name": "Volume brasileiro", "duration_label": "2h40 a 3h", "block_minutes": 180, "price_brl": 140, "description": "Aplicação com maior destaque e preenchimento.", "booking_options": ["mapping"]}, {"id": "volume-egipcio", "name": "Volume egípcio", "duration_label": "2h40 a 3h", "block_minutes": 180, "price_brl": 140, "description": "Aplicação com efeito mais marcante.", "booking_options": ["mapping"]}, {"id": "mega-volume", "name": "Mega volume", "also_known_as": "Capping", "duration_label": "3h a 3h30", "block_minutes": 210, "price_brl": 160, "description": "Aplicação com resultado mais intenso e volumoso. <b>Pode ser feito em qualquer volume: Clássico, Brasileiro ou Egípcio.</b> Não tem manutenção: quando precisar renovar, é uma nova aplicação.", "booking_options": ["mega_volume_base", "mapping"]}, {"id": "efeito-wispy", "name": "Efeito wispy", "duration_label": "2h40 a 3h", "block_minutes": 180, "price_brl": 140, "description": "Olhar marcante e cheio de movimento, com fios de comprimentos alternados que criam textura e destaque. Pode ser feito em qualquer volume: Clássico, Brasileiro ou Egípcio.", "booking_options": ["mapping"]}, {"id": "manutencao-cilios", "name": "Manutenção de cílios", "description": "Pra renovar o resultado sem refazer tudo. O tempo e o valor dependem de quantos fios ainda estão no lugar, e a Julia confirma na hora do atendimento.", "conditional_question": "Mais ou menos quantos dos seus cílios ainda estão no lugar?", "variants": [{"label": "50% ou mais", "duration_label": "1h a 1h30", "block_minutes": 90, "price_brl": 110}, {"label": "Entre 20% e 50%", "duration_label": "1h30 a 2h", "block_minutes": 120, "price_brl": 140}, {"label": "Menos de 20% (vira remoção e nova aplicação)", "duration_label": "2h40 a 3h", "block_minutes": 180, "price_brl": 140}], "needs_confirmation": "A regra de preço está ambígua no texto da Julia. Interpretação usada: com 50% ou mais dos fios, R$ 110; com menos disso, R$ 140. A Julia deve confirmar os limites e os valores."}, {"id": "remocao-cilios", "name": "Remoção de cílios", "duration_label": "30 a 50 min", "block_minutes": 50, "price_brl": 60, "description": "Retirada das extensões com cuidado, quando você quer remover ou fazer uma nova aplicação."}, {"id": "lash-lifting", "name": "Lash lifting", "duration_label": "1h a 1h10", "block_minutes": 70, "price_brl": 80, "description": "Valoriza os seus cílios naturais, com efeito curvado e sem extensão."}]}, {"id": "sobrancelhas", "name": "Sobrancelhas", "items": [{"id": "design-sobrancelhas", "name": "Design de sobrancelhas", "duration_label": "30 a 40 min", "block_minutes": 40, "price_brl": 30, "description": "Organiza e define o formato, respeitando as suas características naturais e buscando harmonia com o rosto."}, {"id": "design-henna", "name": "Design com henna", "duration_label": "40 a 50 min", "block_minutes": 50, "price_brl": 40, "description": "Além do design, a henna acrescenta cor e destaque, deixando a sobrancelha com aparência mais preenchida."}, {"id": "design-tintura", "name": "Design com tintura", "duration_label": "40 a 50 min", "block_minutes": 50, "price_brl": 40, "description": "Combina a definição do formato com a coloração dos fios, pra realçar a sobrancelha."}, {"id": "brow-lamination", "name": "Brow lamination", "duration_label": "50 min a 1h10", "block_minutes": 70, "price_brl": 85, "description": "Alinha e direciona os fios, deixando a sobrancelha com visual mais organizado e definido."}]}, {"id": "combos", "name": "Combos", "note": "Combos de cílios com sobrancelhas, com valor especial. 'Volume simples' significa Clássico, Brasileiro ou Egípcio. Mega volume e wispy não entram nos combos por enquanto (a Julia pode confirmar o wispy).", "items": [{"id": "combo-aplicacao-lamination", "name": "Aplicação de cílios (volume simples) + Brow lamination", "duration_label": "3h30 a 4h", "block_minutes": 240, "price_brl": 200, "booking_options": ["volume_simples", "mapping"]}, {"id": "combo-manutencao-lamination", "name": "Manutenção de cílios + Brow lamination", "duration_label": "3h30 a 4h", "block_minutes": 240, "price_brl": 170, "note": "Usa o maior tempo, porque a manutenção varia conforme os fios que voltaram.", "needs_confirmation": "Valor quando restam menos de 50% dos fios: a Julia deve confirmar."}, {"id": "combo-aplicacao-henna", "name": "Aplicação de cílios (volume simples) + Design com henna", "duration_label": "2h40 a 3h20", "block_minutes": 200, "price_brl": 155, "booking_options": ["volume_simples", "mapping"]}, {"id": "combo-manutencao-henna", "name": "Manutenção de cílios + Design com henna", "duration_label": "cerca de 3h30", "block_minutes": 210, "price_brl": 130, "needs_confirmation": "O tempo informado (3h30) ficou maior que o da aplicação + henna (2h40 a 3h20). A Julia deve confirmar o tempo e o valor quando restam menos de 50% dos fios."}]}], "booking_option_definitions": {"mapping": {"label": "Desenho do olhar (opcional)", "help": "O mapping muda só o desenho do olhar, sem mudar tempo nem valor.", "choices": ["Ainda não sei, quero a indicação da Julia", "Boneca", "Esquilo", "Fox eyes"]}, "mega_volume_base": {"label": "Em qual estilo?", "choices": ["Brasileiro", "Egípcio"]}, "volume_simples": {"label": "Qual volume?", "choices": ["Clássico", "Brasileiro", "Egípcio"]}}};
const CARDS=[{"slug": "extensao-de-cilios", "name": "Extensão de cílios", "image": "servico_extensao", "micro_summary": "Clássico, Brasileiro, Egípcio, Mega volume e Wispy.", "price_label": "a partir de R$ 140"}, {"slug": "manutencao-de-cilios", "name": "Manutenção de cílios", "image": "servico_manutencao", "micro_summary": "Pra renovar o resultado, conforme os fios que ficaram.", "price_label": "a partir de R$ 110"}, {"slug": "remocao-de-cilios", "name": "Remoção de cílios", "image": "servico_remocao", "micro_summary": "Retirada das extensões com cuidado.", "price_label": "R$ 60"}, {"slug": "lash-lifting", "name": "Lash lifting", "image": "servico_lash_lifting", "micro_summary": "Seus cílios naturais, com efeito curvado e sem extensão.", "price_label": "R$ 80"}, {"slug": "design-de-sobrancelhas", "name": "Design de sobrancelhas", "image": "servico_design_sobrancelhas", "micro_summary": "Design simples, com henna ou com tintura.", "price_label": "a partir de R$ 30"}, {"slug": "brow-lamination", "name": "Brow lamination", "image": "servico_brow_lamination", "micro_summary": "Fios alinhados e direcionados, visual organizado e definido.", "price_label": "R$ 85"}, {"slug": "combos", "name": "Combos", "image": "servico_combos", "micro_summary": "Cílios e sobrancelhas no mesmo atendimento.", "price_label": "a partir de R$ 130"}];
const FOTOS={'extensao-de-cilios':'assets/servico-1-extensao.jpg','manutencao-de-cilios':'assets/servico-2-manutencao.jpg','remocao-de-cilios':'assets/servico-3-remocao.jpg','lash-lifting':'assets/servico-4-lash-lifting.jpg','brow-lamination':'assets/servico-5-brow-lamination.jpg','design-de-sobrancelhas':'assets/servico-6-design-sobrancelhas.jpg','combos':'assets/servico-7-combos.jpg'};
const MAPPING={"Boneca": "Fios mais longos na região central, pra um olhar mais arredondado e aberto.", "Esquilo": "O ponto de maior comprimento fica antes do canto externo, o que levanta visualmente o olhar.", "Fox eyes": "Visual mais alongado, com os comprimentos direcionados pro canto externo."};
const PIX_CHAVE='chave-pix-ficticia@exemplo.com',PIX_NOME='Julia (nome fictício, trocar pelo real)',WA='5527988009451';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const brl=n=>'R$ '+(Number.isInteger(n)?n:n.toFixed(2).replace('.',','));
const itens={};CATALOGO.categories.forEach(c=>c.items.forEach(i=>{itens[i.id]=i;i.cat=c.id}));
const PAGINAS={
 'extensao-de-cilios':{tipo:'tec',itens:['volume-classico','volume-brasileiro','volume-egipcio','mega-volume'],intro:"Todos os volumes são feitos fio a fio. O que muita gente chama de 'fio a fio' é o volume clássico."},
 'manutencao-de-cilios':{tipo:'tec',itens:['manutencao-cilios'],intro:"Pra renovar o resultado sem refazer tudo. O tempo e o valor dependem de quantos fios ainda estão no lugar, e a Julia confirma na hora do atendimento."},
 'design-de-sobrancelhas':{tipo:'tec',itens:['design-sobrancelhas','design-henna','design-tintura'],intro:"Escolhe como você quer a sua sobrancelha: só o design, com henna ou com tintura."},
 'combos':{tipo:'tec',itens:['combo-aplicacao-lamination','combo-manutencao-lamination','combo-aplicacao-henna','combo-manutencao-henna'],intro:"Cílios e sobrancelhas no mesmo atendimento, com valor especial. Nos combos, volume simples é Clássico, Brasileiro ou Egípcio."},
 'remocao-de-cilios':{tipo:'simples',itens:['remocao-cilios']},
 'lash-lifting':{tipo:'simples',itens:['lash-lifting']},
 'brow-lamination':{tipo:'simples',itens:['brow-lamination']}
};
const LOGO='assets/simbolo-lilas.svg';
const reduzir=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- navegação ---- */
function mostrarHome(){ $('#home').style.display='';$('#pagina').classList.remove('on'); }
function irPara(id){
  fecharMenu();
  const naPagina=$('#pagina').classList.contains('on');
  if(naPagina)mostrarHome();
  const alvo=document.getElementById(id);
  if(!alvo)return;
  requestAnimationFrame(()=>{
    if(id==='topo'){window.scrollTo({top:0,behavior:naPagina||reduzir?'auto':'smooth'});return}
    const y=alvo.getBoundingClientRect().top+window.scrollY-(id==='agendamento'?0:8);
    window.scrollTo({top:y,behavior:naPagina||reduzir?'auto':'smooth'});
  });
}
$$('[data-home]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();irPara(a.dataset.home)}));
const burger=$('#burger'),nav=$('#nav');
function fecharMenu(){nav.classList.remove('aberto');burger.setAttribute('aria-expanded','false')}
burger.addEventListener('click',()=>{const a=nav.classList.toggle('aberto');burger.setAttribute('aria-expanded',a)});

/* ---- carrossel de serviços ---- */
let atual=0;
function vazioHTML(){return `<div class="vazio"><img src="${LOGO}" alt=""><small>Foto em breve</small></div>`}
function pilhaFoto(slug){const f=FOTOS[slug];return f?`<img src="${f}" alt="" loading="lazy">`:vazioHTML()}
function pintarCard(){
  const c=CARDS[atual],car=$('#carrossel');
  car.innerHTML=`<div class="pilha troca" role="button" tabindex="0" aria-label="Abrir ${c.name}"><div class="fundo f1"></div><div class="fundo f2"></div><div class="foto-card">${pilhaFoto(c.slug)}</div></div>
  <div class="bloco-wrap troca" role="button" tabindex="0" aria-label="Abrir ${c.name}"><div class="bloco"><small>${String(atual+1).padStart(2,'0')} / ${String(CARDS.length).padStart(2,'0')}</small><h3>${c.name}</h3><p>${c.micro_summary}</p><button class="link-seta" tabindex="-1" style="margin-top:22px">${['remocao-de-cilios','lash-lifting','brow-lamination'].includes(c.slug)?'Conhecer opção':'Conhecer opções'}</button></div></div>`;
  $$('[role=button]',car).forEach(el=>{el.addEventListener('click',()=>abrirServico(c.slug));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirServico(c.slug)}})});
  $('#pontos').innerHTML=CARDS.map((_,i)=>`<i class="${i===atual?'on':''}"></i>`).join('');
}
$('#prev').onclick=()=>{atual=(atual-1+CARDS.length)%CARDS.length;pintarCard()};
$('#next').onclick=()=>{atual=(atual+1)%CARDS.length;pintarCard()};
pintarCard();

/* ---- resultados ---- */
(function(){
  const legendas=['assets/res-1.jpg','assets/res-4.jpg','assets/res-3.jpg','assets/res-2.jpg'];
  $('#faixa-fotos').innerHTML=legendas.map(l=>`<figure class="res-item" style="margin:0"><div class="res-foto"><img src="${l}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"></div></figure>`).join('');
  const f=$('#faixa-fotos'),passo=()=>f.clientWidth*(innerWidth<=820?.84:.34);
  $('#rprev').onclick=()=>f.scrollBy({left:-passo(),behavior:reduzir?'auto':'smooth'});
  $('#rnext').onclick=()=>f.scrollBy({left:passo(),behavior:reduzir?'auto':'smooth'});
  const its=$$('.res-item',f),rp=$('#rpontos');
  function pitch(){return its[1].offsetLeft-its[0].offsetLeft}
  function pontosRes(){const n=Math.max(1,Math.round((f.scrollWidth-f.clientWidth)/pitch())+1);const i=Math.min(n-1,Math.round(f.scrollLeft/pitch()));rp.innerHTML=Array.from({length:n},(_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}
  f.addEventListener('scroll',pontosRes,{passive:true});addEventListener('resize',pontosRes);pontosRes();
})();

/* ---- páginas de serviço ---- */
function tempoPreco(i){
  if(i.variants)return '<div class="vars">'+i.variants.map(v=>{const m=v.label.match(/^(.*?)\s*(\(.*\))$/),l=m?m[1]:v.label,s=m?m[2]:'';return `<div class="v-t"><small>${l}${s?`<br>${s}`:''}</small><b>${v.duration_label}</b></div><div class="v-v"><small>Valor</small><b>${brl(v.price_brl)}</b></div>`}).join('')+'</div>';
  return `<div class="meta"><span><small>Tempo</small>${i.duration_label}</span><span><small>Valor</small>${brl(i.price_brl)}</span></div>`;
}
function abrirServico(slug){
  const p=PAGINAS[slug],card=CARDS.find(c=>c.slug===slug);fecharMenu();
  const dados=p.itens.map(id=>itens[id]);if(slug==='combos')dados.sort((a,b)=>a.price_brl-b.price_brl);
  let html=`<button class="link-seta voltar" id="voltar">&#8592; Voltar aos serviços</button>`;
  if(p.tipo==='tec'){
    html+=`<div class="cab"><h1>${card.name}</h1><p>${p.intro}</p></div>`;
    html+=dados.map((i,k)=>{
      const FOTOS_IT={'volume-brasileiro':'assets/tec-volume-brasileiro.jpg','design-henna':'assets/tec-design-henna.jpg','design-tintura':'assets/tec-design-tintura.jpg','volume-egipcio':'assets/tec-volume-egipcio.jpg','mega-volume':'assets/tec-mega-volume.jpg'};
      const foto=(k===0&&FOTOS[slug])?`<img src="${FOTOS[slug]}" alt="" loading="lazy">`:FOTOS_IT[i.id]?`<img src="${FOTOS_IT[i.id]}" alt="" loading="lazy">`:vazioHTML();
      const extra=i.also_known_as?`<div class="tag">Também conhecido como ${i.also_known_as}</div>`:'';
      const dica=i.variants?`<p class="desc" style="margin-top:-6px"><b>${i.conditional_question}</b></p>`:'';
      const semFoto=slug==='combos';
      return `<div class="opcao"${semFoto?' style="grid-template-columns:1fr"':''}>${semFoto?'':`<div class="foto-op"><div>${foto}</div></div>`}<div>${extra}${slug==='manutencao-de-cilios'?'':`<h3>${i.name}</h3><p class="desc">${i.description||''}</p>`}${dica.replace('margin-top:-6px','margin-top:0')}${tempoPreco(i)}<button class="btn" data-ag="${i.id}">Agendar</button></div></div>`;
    }).join('');
    if(slug==='extensao-de-cilios'){
      const w=itens['efeito-wispy'];
      html+=`<div class="mapping wispy-bloco"><div><h3>${w.name}</h3><p class="desc" style="margin:6px 0 22px">${w.description.replace('Pode ser feito em qualquer volume: Clássico, Brasileiro ou Egípcio.','<b>$&</b>')}</p>${tempoPreco(w)}<button class="btn" data-ag="${w.id}">Agendar</button></div><div class="foto-op"><div><img src="assets/tec-efeito-wispy.jpg" alt="" loading="lazy"></div></div></div>`;
      html+=`<div class="mapping"><h3>Mapping (opcional)</h3><p>Mapping é o desenho do olhar. Não muda tempo nem valor. Você escolhe na hora de agendar.</p><div class="tres">${Object.entries(MAPPING).map(([n,t])=>`<div><h4>${n}</h4><p>${t}</p><div class="foto-map"><div>${({'Boneca':'assets/map-boneca.jpg','Esquilo':'assets/map-esquilo.jpg','Fox eyes':'assets/map-fox-eyes.jpg'})[n]?`<img src="${({'Boneca':'assets/map-boneca.jpg','Esquilo':'assets/map-esquilo.jpg','Fox eyes':'assets/map-fox-eyes.jpg'})[n]}" alt="" loading="lazy">`:vazioHTML()}</div></div></div>`).join('')}</div></div>`;
    }
  }else{
    const i=dados[0];
    html+=`<div class="cab"><h1>${i.name}</h1><p>${i.description}</p></div><div class="foto-op" style="justify-self:start;margin:0 0 40px 6px"><div>${FOTOS[slug]?`<img src="${FOTOS[slug]}" alt="">`:vazioHTML()}</div></div><div class="vars"><div class="v-t"><small>Tempo</small><b>${i.duration_label}</b></div><div class="v-v"><small>Valor</small><b>${brl(i.price_brl)}</b></div></div><button class="btn" data-ag="${i.id}">Agendar</button><div style="height:60px"></div>`;
  }
  $('#pagina-conteudo').innerHTML=html;
  $('#voltar').onclick=()=>{mostrarHome();requestAnimationFrame(()=>{const s=$('#servicos');window.scrollTo({top:s.getBoundingClientRect().top+scrollY-8,behavior:'auto'})})};
  $$('[data-ag]',$('#pagina')).forEach(b=>b.onclick=()=>{mostrarHome();escolherServico(b.dataset.ag);irPara('agendamento')});
  $('#home').style.display='none';$('#pagina').classList.add('on');window.scrollTo(0,0);
}
const rodapeHome=null;

/* ---- agendamento ---- */
const selServ=$('#servico');
CATALOGO.categories.forEach(c=>{const g=document.createElement('optgroup');g.label=c.name;c.items.forEach(i=>{const o=document.createElement('option');o.value=i.id;o.textContent=i.name;g.appendChild(o)});selServ.appendChild(g)});
const S={dia:null,hora:null,mes:new Date(),variante:0};
const hoje=new Date();hoje.setHours(0,0,0,0);S.mes=new Date(hoje.getFullYear(),hoje.getMonth(),1);
const limite=new Date(hoje);limite.setDate(limite.getDate()+30);
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS=['D','S','T','Q','Q','S','S'];
const hh=m=>String(Math.floor(m/60)).padStart(2,'0')+'h'+(m%60?String(m%60).padStart(2,'0'):'');
const chaveDia=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function reservas(){try{return JSON.parse(localStorage.getItem('siler-agendamentos')||'[]')}catch(e){return[]}}
function salvarReserva(r){try{const l=reservas();l.push(r);localStorage.setItem('siler-agendamentos',JSON.stringify(l))}catch(e){}}
function ativa(r){return r.status==='confirmado'||(r.status==='aguardando_sinal'&&Date.now()<r.expira)}
function servicoAtual(){
  const i=itens[selServ.value];if(!i)return null;
  if(i.variants){const v=i.variants[S.variante];return{...i,duration_label:v.duration_label,block_minutes:v.block_minutes,price_brl:v.price_brl,variante:v.label}}
  return i;
}
function horariosDoDia(d,bloco){
  const out=[],ocup=reservas().filter(r=>r.dia===chaveDia(d)&&ativa(r));
  const agora=new Date();const ehHoje=chaveDia(d)===chaveDia(agora);const min=agora.getHours()*60+agora.getMinutes();
  for(let t=450;t+bloco<=1200;t+=30){
    if(t<780&&t+bloco>690)continue;
    if(ehHoje&&t<=min)continue;
    if(ocup.some(r=>t<r.ini+r.bloco&&t+bloco>r.ini))continue;
    out.push(t);
  }
  return out;
}
function diaAbre(d){const w=d.getDay();return d>=hoje&&d<=limite&&w>=2&&w<=6}
function pintarCal(){
  const m=S.mes,sv=servicoAtual(),bloco=sv?sv.block_minutes:30;
  $('#mes-nome').textContent=MESES[m.getMonth()]+' '+m.getFullYear();
  const ant=new Date(m.getFullYear(),m.getMonth()-1,1),prox=new Date(m.getFullYear(),m.getMonth()+1,1);
  $('#mes-ant').disabled=new Date(m.getFullYear(),m.getMonth()+1,0)<hoje;
  $('#mes-prox').disabled=prox>limite;
  let h=DIAS.map(d=>`<div class="dow">${d}</div>`).join('');
  const primeiro=m.getDay(),dias=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
  for(let i=0;i<primeiro;i++)h+='<div></div>';
  for(let n=1;n<=dias;n++){
    const d=new Date(m.getFullYear(),m.getMonth(),n);
    const ok=diaAbre(d)&&horariosDoDia(d,bloco).length>0;
    const cls=['dia',ok?'ok':'',chaveDia(d)===chaveDia(hoje)?'hoje':'',S.dia&&chaveDia(d)===S.dia?'sel':''].join(' ');
    h+=`<button type="button" class="${cls}" ${ok?'':'disabled'} data-d="${chaveDia(d)}" aria-label="${n} de ${MESES[m.getMonth()]}">${n}</button>`;
  }
  $('#cal').innerHTML=h;
  $$('.dia.ok').forEach(b=>b.onclick=()=>{S.dia=b.dataset.d;S.hora=null;pintarCal();pintarHorarios();resumo()});
}
function pintarHorarios(){
  const box=$('#horarios'),sv=servicoAtual();
  if(!S.dia){box.textContent='Escolhe um dia pra ver os horários.';return}
  if(!sv){box.textContent='Escolhe o serviço pra ver os horários.';return}
  const [a,m,d]=S.dia.split('-').map(Number);const data=new Date(a,m-1,d);
  const sl=horariosDoDia(data,sv.block_minutes);
  if(!sl.length){box.innerHTML='Esse dia está sem horários. Escolhe outro?';return}
  box.innerHTML=`<strong>${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}</strong>, escolhe o horário:<div class="slots">${sl.map(t=>`<button type="button" class="slot ${S.hora===t?'sel':''}" data-t="${t}">${hh(t)}</button>`).join('')}</div>`;
  $$('.slot',box).forEach(b=>b.onclick=()=>{S.hora=+b.dataset.t;pintarHorarios();resumo();$('#e-slot').hidden=true});
}
$('#mes-ant').onclick=()=>{S.mes=new Date(S.mes.getFullYear(),S.mes.getMonth()-1,1);pintarCal()};
$('#mes-prox').onclick=()=>{S.mes=new Date(S.mes.getFullYear(),S.mes.getMonth()+1,1);pintarCal()};

function camposCondicionais(){
  const i=itens[selServ.value],box=$('#opcoes');box.innerHTML='';if(!i)return;
  if(i.variants){
    box.innerHTML+=`<div class="campo"><label for="var">${i.conditional_question}</label><select id="var">${i.variants.map((v,k)=>`<option value="${k}">${v.label}</option>`).join('')}</select></div>`;
    $('#var').value=S.variante;$('#var').onchange=e=>{S.variante=+e.target.value;S.hora=null;atualiza()};
  }
  (i.booking_options||[]).forEach(k=>{
    const def=CATALOGO.booking_option_definitions[k];
    box.innerHTML+=`<div class="campo"><label for="op-${k}">${def.label}</label><select id="op-${k}" data-op="${k}">${def.choices.map(c=>`<option>${c}</option>`).join('')}</select></div>`;
  });
}
function resumo(){
  const sv=servicoAtual();
  $('#r-serv').textContent=sv?sv.name+(sv.variante?' ('+sv.variante+')':''):'—';
  $('#r-tempo').textContent=sv?sv.duration_label:'—';
  $('#r-valor').textContent=sv?brl(sv.price_brl):'—';
  $('#r-sinal').textContent=sv?brl(sv.price_brl*0.3):'—';
  if(S.dia&&S.hora!=null){const [a,m,d]=S.dia.split('-');$('#r-quando').textContent=d+'/'+m+' às '+hh(S.hora)}else $('#r-quando').textContent='—';
}
function atualiza(){S.hora=null;camposCondicionais();pintarCal();pintarHorarios();resumo();$('#e-serv').hidden=true;$('#c-serv').classList.remove('invalido')}
selServ.addEventListener('change',()=>{S.variante=0;atualiza()});
function escolherServico(id){selServ.value=id;S.variante=0;atualiza()}
$('#aceite').addEventListener('change',e=>{$('#enviar').disabled=!e.target.checked});
['nome','tel'].forEach(id=>$('#'+id).addEventListener('input',()=>{$('#e-'+id.replace('tel','tel')).hidden=true;$('#c-'+(id==='nome'?'nome':'tel')).classList.remove('invalido')}));

function msgWA(r){const hm=String(Math.floor(r.ini/60)).padStart(2,'0')+':'+String(r.ini%60).padStart(2,'0');return `Oi, Julia! Fiz o agendamento no site e estou enviando o comprovante do sinal.\nNome: ${r.nome}\nServiço: ${r.servico}\nDia e horário: ${r.quando}\nSinal: ${brl(r.sinal)}\nRef: ${r.dia} ${hm} ${r.bloco}min ${r.sid}`}
$('#wa-outro').href='https://wa.me/'+WA+'?text='+encodeURIComponent('Oi, Julia! Preciso de um horário fora dos que aparecem no site.');
$('#form').addEventListener('submit',e=>{
  e.preventDefault();
  const nome=$('#nome').value.trim(),tel=$('#tel').value.replace(/\D/g,''),sv=servicoAtual();
  let ok=true;
  const falha=(c,er)=>{$('#'+c).classList.add('invalido');$('#'+er).hidden=false;ok=false};
  if(!nome)falha('c-nome','e-nome');
  if(tel.length<10)falha('c-tel','e-tel');
  if(!sv)falha('c-serv','e-serv');
  if(!S.dia||S.hora==null){$('#e-slot').hidden=false;ok=false}
  if(!ok){const x=$('.invalido,#e-slot:not([hidden])');if(x)x.scrollIntoView({block:'center',behavior:reduzir?'auto':'smooth'});return}
  const [a,m,d]=S.dia.split('-').map(Number);
  if(!horariosDoDia(new Date(a,m-1,d),sv.block_minutes).includes(S.hora)){$('#e-slot').textContent='Esse horário acabou de ser ocupado. Escolhe outro?';$('#e-slot').hidden=false;pintarCal();pintarHorarios();return}
  const opcoes=$$('[data-op]').map(s=>s.value);
  const quando=String(d).padStart(2,'0')+'/'+String(m).padStart(2,'0')+' às '+hh(S.hora);
  const r={id:Date.now(),sid:sv.id+(sv.variants?'-'+(S.variante+1):''),nome,telefone:tel,servico:sv.name+(sv.variante?' ('+sv.variante+')':'')+(opcoes.length?' · '+opcoes.join(' · '):''),dia:S.dia,ini:S.hora,bloco:sv.block_minutes,quando,valor:sv.price_brl,sinal:sv.price_brl*0.3,crianca:$('#crianca').checked,aceite:true,aceite_em:new Date().toISOString(),status:'aguardando_sinal',expira:Date.now()+30*60000};
  salvarReserva(r);mostrarpix(r);
});
function mostrarpix(r){
  const p=$('#pix');$('#ag-grade').hidden=true;
  p.hidden=false;
  p.innerHTML=`<h3>Pague o sinal pelo pix</h3><p>O sinal é de ${brl(r.sinal)}. Copia a chave pix, paga no app do seu banco e manda o comprovante pra Julia no WhatsApp. Assim que ela confirmar, o seu horário fica garantido.</p>
  <div class="valor">${brl(r.sinal)}</div>
  <p><b>${r.servico}</b><br>${r.quando}</p>
  <div class="chave"><code id="chave">${PIX_CHAVE}</code><button class="btn btn-sm" id="copiar" type="button">Copiar chave</button></div>
  <p style="font-size:14px">Quem recebe: ${PIX_NOME}</p>
  <div class="acoes"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent(msgWA(r))}">Enviar comprovante pelo WhatsApp</a><button class="btn btn-verde" id="novo" type="button" style="border:1px solid var(--verde)">Fazer outro agendamento</button></div>
  <div class="ok-msg">Quase lá! Assim que a Julia confirmar o sinal, o seu horário fica garantido.</div>
  <p class="demo-aviso">Prévia do site: a chave pix é fictícia e nada foi enviado à Julia.</p>`;
  $('#copiar').onclick=async()=>{try{await navigator.clipboard.writeText(PIX_CHAVE);$('#copiar').textContent='Chave copiada'}catch(e){const s=getSelection(),rg=document.createRange();rg.selectNodeContents($('#chave'));s.removeAllRanges();s.addRange(rg);$('#copiar').textContent='Selecionada, copie'}};
  $('#novo').onclick=()=>{p.hidden=true;$('#ag-grade').hidden=false;$('#form').reset();$('#enviar').disabled=true;S.dia=null;S.hora=null;selServ.value='';atualiza();irPara('agendamento')};
  p.scrollIntoView({block:'center',behavior:reduzir?'auto':'smooth'});
}
atualiza();

/* ---- fita ---- */
(function(){
  const curva=$('#curva'),g=$('#itens');
  const TEXTO='Beleza e Cuidado',GAP=42,SYM_W=20,SYM_H=24,VEL=22,NS='http://www.w3.org/2000/svg',len=curva.getTotalLength();
  function mk(){const t=document.createElementNS(NS,'text');t.setAttribute('dy','0.35em');const tp=document.createElementNS(NS,'textPath');tp.setAttribute('href','#curva');tp.textContent=TEXTO;t.appendChild(tp);g.appendChild(t);return{t,tp}}
  const probe=mk();
  (document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{
    const tl=probe.t.getComputedTextLength();g.removeChild(probe.t);
    const period=tl+GAP*2+SYM_W,n=Math.ceil(len/period)+2,items=[];
    for(let i=0;i<n;i++){const a=mk();const u=document.createElementNS(NS,'use');u.setAttribute('href','#sim');u.setAttribute('width',SYM_W);u.setAttribute('height',SYM_H);g.appendChild(u);items.push({a,u})}
    let start=performance.now();
    function draw(now){const s=reduzir?0:((now-start)/1000*VEL)%period;
      items.forEach((it,i)=>{const off=i*period-period+s;it.a.tp.setAttribute('startOffset',off);
        const sp=off+tl+GAP+SYM_W/2;if(sp<0||sp>len){it.u.style.display='none';return}it.u.style.display='';
        const p=curva.getPointAtLength(sp),q=curva.getPointAtLength(Math.min(sp+1,len)),ang=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
        it.u.setAttribute('transform','translate('+p.x+' '+p.y+') rotate('+ang+') translate('+(-SYM_W/2)+' '+(-SYM_H/2)+')');});
      if(!reduzir)requestAnimationFrame(draw)}
    requestAnimationFrame(draw);
  });
})();
