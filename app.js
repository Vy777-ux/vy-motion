(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches,calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
document.documentElement.classList.remove('no-js');

// Titres : les mots apparaissent l'un après l'autre
$$('h2.reveal').forEach(h=>{
  const words=h.textContent.trim().split(/\s+/);h.textContent='';
  words.forEach((w,i)=>{const s=document.createElement('span');s.className='w';s.style.setProperty('--k',i);s.textContent=w;h.append(s,' ')});
  h.classList.add('split');
});

// Apparition douce, une seule fois par élément
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
$$('.reveal').forEach(el=>io.observe(el));

if(fine&&!calm){
  // Légère inclinaison 3D des cartes (une mise à jour par image, seulement sur l'élément survolé)
  $$('.tilt').forEach(el=>{
    const max=+el.dataset.tilt||6;let raf=0;
    el.addEventListener('pointermove',e=>{
      const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{el.style.setProperty('--ry',((x-.5)*max*2).toFixed(2)+'deg');el.style.setProperty('--rx',((.5-y)*max*2).toFixed(2)+'deg')});
      el.classList.add('on');
    });
    el.addEventListener('pointerleave',()=>{cancelAnimationFrame(raf);el.classList.remove('on');el.style.removeProperty('--rx');el.style.removeProperty('--ry')});
  });
  // Bouton principal : se laisse attirer très légèrement par le curseur
  $$('.btn.primary').forEach(b=>{
    b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.setProperty('--tx',(((e.clientX-r.left)/r.width-.5)*8).toFixed(1)+'px');b.style.setProperty('--ty',(((e.clientY-r.top)/r.height-.5)*6).toFixed(1)+'px')});
    b.addEventListener('pointerleave',()=>{b.style.removeProperty('--tx');b.style.removeProperty('--ty')});
  });
}

// Onde douce au clic + petite vibration (Android)
const feedback=el=>el.addEventListener('pointerdown',e=>{
  navigator.vibrate&&navigator.vibrate(8);
  if(calm||!el.matches('.btn,.filters button'))return;
  const r=el.getBoundingClientRect(),d=Math.max(r.width,r.height)*2.2,s=document.createElement('span');
  s.className='ripple';s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
  el.append(s);s.addEventListener('animationend',()=>s.remove());
});
$$('.btn,.social a,.thumb,.filters button').forEach(feedback);

// Vidéos : miniature légère ; le lecteur ne se charge qu'au clic.
// Le lecteur YouTube refuse de démarrer (erreur 153) quand la page n'a pas d'adresse web valide
// (fichier ouvert depuis l'ordinateur) : dans ce cas on ouvre la vidéo sur YouTube.
$$('.proj').forEach(card=>{
  const btn=$('.thumb',card),id=card.dataset.yt,url=card.dataset.link;
  btn.addEventListener('click',()=>{
    if(location.protocol!=='https:'&&location.protocol!=='http:'){window.open(url,'_blank','noopener');return}
    const f=document.createElement('iframe');
    f.src=`https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(location.origin)}`;
    f.title=btn.getAttribute('aria-label').replace('Reproduzir vídeo: ','');
    f.referrerPolicy='strict-origin-when-cross-origin';
    f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;
    const box=document.createElement('div');box.className='thumb';box.append(f);btn.replaceWith(box);
  });
});

// Filtres : seulement s'il y a au moins 2 catégories
const cards=$$('.proj'),cats=[...new Set(cards.map(c=>c.dataset.cat))],bar=$('#filters');
if(cats.length>1){
  bar.hidden=false;
  ['Todos',...cats].forEach((c,i)=>{
    const b=document.createElement('button');b.type='button';b.textContent=c;b.setAttribute('aria-pressed',i===0);
    b.addEventListener('click',()=>{$$('button',bar).forEach(x=>x.setAttribute('aria-pressed',x===b));cards.forEach(k=>k.hidden=i>0&&k.dataset.cat!==c)});
    feedback(b);bar.append(b);
  });
}

// Menu : pastille qui glisse vers la section visible, barre qui se compacte au défilement
const pill=$('.pill'),links=$$('.nav nav a'),nav=$('.nav');
const move=a=>{if(!a)return;pill.style.opacity=1;pill.style.width=a.offsetWidth+'px';pill.style.transform=`translateX(${a.offsetLeft}px)`};
const spy=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)move(links.find(a=>a.hash==='#'+e.target.id))}),{rootMargin:'-45% 0px -50% 0px'});
$$('#about,#works,#commissions').forEach(s=>spy.observe(s));
new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)pill.style.opacity=0}),{rootMargin:'-45% 0px -50% 0px'}).observe($('#home'));
let compact=false;
addEventListener('scroll',()=>{const c=scrollY>40;if(c!==compact){compact=c;nav.classList.toggle('compact',c)}},{passive:true});

// Fond : parallaxe douce à la souris. Les deux plans bougent ensemble (pas de dédoublement),
// et le plan avant se cisaille autour de la ligne de jonction pour donner de la profondeur.
if(fine&&!calm){
  const shift=$('.shift'),depth=$('.front .px');let tx=0,ty=0,cx=0,cy=0,run=0;
  const loop=()=>{
    cx+=(tx-cx)*.06;cy+=(ty-cy)*.06;
    shift.style.transform=`translate3d(${(-cx*5).toFixed(2)}px,${(-cy*3).toFixed(2)}px,0)`;
    depth.style.transform=`skewX(${(-cx*2.4).toFixed(3)}deg) scaleY(${(1+cy*.02).toFixed(4)})`;
    run=(Math.abs(tx-cx)>.002||Math.abs(ty-cy)>.002)?requestAnimationFrame(loop):0;
  };
  addEventListener('pointermove',e=>{tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1;if(!run)run=requestAnimationFrame(loop)},{passive:true});
}

// Verre liquide (réfraction, Chrome/Edge) et fond animé : on mesure la fluidité et on allège tout seul si besoin
const root=document.documentElement;
if(!calm&&navigator.userAgentData&&navigator.userAgentData.brands.some(b=>/Chromium/.test(b.brand)))root.classList.add('refract');
const probe=done=>{let n=0,last=0;const dt=[];const f=ts=>{if(last)dt.push(ts-last);last=ts;if(++n<45)requestAnimationFrame(f);else{dt.sort((a,b)=>a-b);done(dt[dt.length>>1])}};requestAnimationFrame(f)};
setTimeout(()=>probe(m=>{if(m<=24)return;root.classList.remove('refract');probe(m2=>{if(m2>24)root.classList.add('lite')})}),1500);

// Barre de défilement en verre : le défilement reste celui du navigateur, seul le curseur est dessiné ici
const vs=$('.vscroll'),vt=$('.vthumb');
if(vs&&fine){
  const de=document.documentElement,PAD=8;let H=64,travel=1,max=1,raf=0,t=0,drag=null;
  const place=()=>{raf=0;vt.style.transform=`translateY(${PAD+(max>0?scrollY/max*travel:0)}px)`};
  const measure=()=>{
    const vh=innerHeight,sh=de.scrollHeight;max=sh-vh;vs.hidden=max<=1;if(vs.hidden)return;
    const L=vh-PAD*2;H=Math.max(64,L*vh/sh);travel=Math.max(1,L-H);vt.style.height=H+'px';place();
  };
  const wake=()=>{vs.classList.add('on');clearTimeout(t);t=setTimeout(()=>vs.classList.remove('on'),1200)};
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(place);wake()},{passive:true});
  addEventListener('resize',measure);new ResizeObserver(measure).observe(document.body);measure();
  const to=(y,smooth)=>scrollTo({top:Math.min(max,Math.max(0,y)),behavior:smooth?'smooth':'instant'});
  vt.addEventListener('pointerdown',e=>{e.preventDefault();vt.setPointerCapture(e.pointerId);drag={y:e.clientY,s:scrollY};vs.classList.add('drag')});
  vt.addEventListener('pointermove',e=>{if(drag)to(drag.s+(e.clientY-drag.y)/travel*max)});
  const end=()=>{drag=null;vs.classList.remove('drag')};
  vt.addEventListener('pointerup',end);vt.addEventListener('pointercancel',end);
  vs.addEventListener('pointerdown',e=>{if(e.target===vt)return;to((e.clientY-PAD-H/2)/travel*max,true)});
}
})();
