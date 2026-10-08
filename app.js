// благодарственные письма листаются сами: дублируем ленту для бесконечной прокрутки
const lt=document.querySelector('.letters .track');
if(lt){
  [...lt.children].forEach(a=>{const c=a.cloneNode(true);c.setAttribute('aria-hidden','true');c.tabIndex=-1;lt.appendChild(c)});
  lt.parentElement.classList.add('auto');
}

// интро: показываем один раз за визит
const intro=document.documentElement.classList.contains('has-intro');
if(intro)setTimeout(()=>{document.documentElement.classList.remove('has-intro');try{sessionStorage.setItem('bb-intro','1')}catch(e){}},1650);

// появление при прокрутке: блоки всплывают по очереди
const rvSel='.hero .crumb,.hero h1,.hero .lead,.hero .btns,.hero .trust,.stage,.page-hero h1,.facts,.stats .card,.bento .svc,.mapcard';
const rvItems=[...document.querySelectorAll(rvSel)].filter(e=>!e.closest('.intro,.fab,.topbar,.foot,.steps4'));
if('IntersectionObserver' in window){
  rvItems.forEach(e=>e.classList.add('rv'));
  const rvo=new IntersectionObserver(es=>{
    const vis=es.filter(e=>e.isIntersecting).map(e=>e.target);
    vis.forEach((el,i)=>{
      const base=intro&&el.closest('.hero,.page-hero')?1.3:0;
      el.style.transitionDelay=(base+i*0.08)+'s';
      el.classList.add('in');rvo.unobserve(el);
      setTimeout(()=>el.style.transitionDelay='',(base+i*0.08+1)*1000);
    });
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  rvItems.forEach(e=>rvo.observe(e));
}

// свет следует за курсором
document.querySelectorAll('.card').forEach(c=>{
  c.addEventListener('mousemove',e=>{
    const r=c.getBoundingClientRect();
    c.style.setProperty('--x',(e.clientX-r.left)+'px');
    c.style.setProperty('--y',(e.clientY-r.top)+'px');
  });
});

// цифры-табло: при появлении на экране прокручиваются до нужного значения
const odos=[...document.querySelectorAll('[data-odo]')];
if(odos.length&&'IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  odos.forEach(el=>{
    const txt=el.textContent;el.setAttribute('aria-label',txt);el.textContent='';el.classList.add('odo');
    let k=0;
    for(const ch of txt){
      if(/\d/.test(ch)){
        const col=document.createElement('span'),strip=document.createElement('span');
        col.className='odo-d';strip.className='odo-s';
        strip.innerHTML=Array.from({length:20},(_,i)=>'<span>'+(i%10)+'</span>').join('');
        strip.dataset.to=10+ +ch;strip.style.transitionDelay=(k++*0.05)+'s';
        col.appendChild(strip);el.appendChild(col);
      }else{const s=document.createElement('span');s.textContent=ch===' '?'\u00a0':ch;el.appendChild(s)}
    }
  });
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    e.target.querySelectorAll('.odo-s').forEach(s=>s.style.transform='translateY(-'+(s.dataset.to*1.3)+'em)');
    io.unobserve(e.target);
  }),{threshold:0,rootMargin:'0px 0px -12% 0px'});
  odos.forEach(el=>io.observe(el));
}

const rub=n=>n.toLocaleString('ru-RU')+' ₽';

// заявка: открываем WhatsApp с готовым сообщением на рабочий номер
const form=document.getElementById('order');
if(form){
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const lines=['Здравствуйте! Заявка с сайта БИГ-БАС'];
    for(let [k,v] of new FormData(form)){
      v=String(v).trim();if(!v)continue;
      if(k==='Дата'){const d=v.split('-');if(d.length===3)v=d[2]+'.'+d[1]+'.'+d[0];}
      lines.push(k+': '+v);
    }
    const url='https://wa.me/79996667738?text='+encodeURIComponent(lines.join('\n'));
    // на телефоне сразу в приложение, на компьютере в новой вкладке
    const w=matchMedia('(pointer:coarse)').matches?null:window.open(url,'_blank');
    if(w)w.opener=null;else location.href=url;
  });
}

// автопарк: фильтр по типу и числу пассажиров
const cars=[...document.querySelectorAll('.car')];
if(cars.length){
  const chips=[...document.querySelectorAll('.chip')],people=document.getElementById('people'),empty=document.querySelector('.empty');
  let kind='all';
  const apply=()=>{
    const n=+people.value||0;let shown=0;
    cars.forEach(c=>{
      const ok=(kind==='all'||c.dataset.kind===kind)&&(+c.dataset.seats>=n);
      c.classList.toggle('hide',!ok);if(ok)shown++;
    });
    chips.forEach(ch=>ch.classList.toggle('on',ch.dataset.kind===kind));
    empty.style.display=shown?'none':'block';
  };
  chips.forEach(ch=>ch.onclick=()=>{kind=ch.dataset.kind;apply()});
  people.oninput=apply;
  const h=location.hash.slice(1);
  if(chips.some(c=>c.dataset.kind===h)){kind=h;apply();}

  // калькулятор
  const sel=document.getElementById('car'),hours=document.getElementById('hours'),out=document.getElementById('hours-out'),
        sum=document.getElementById('sum'),how=document.getElementById('how');
  cars.forEach((c,i)=>{const o=document.createElement('option');o.value=i;o.textContent=c.dataset.name+' · '+c.dataset.seatsText;sel.appendChild(o)});
  const calc=()=>{
    const c=cars[sel.value],price=+c.dataset.price,min=+c.dataset.min,extra=+c.dataset.extra,h=+hours.value;
    const work=Math.max(h,min),total=price*(work+extra);
    out.textContent=h+' ч';
    sum.innerHTML=rub(total).replace(' ₽','<small> ₽</small>');
    how.textContent=rub(price)+'/час × ('+work+' ч работы'+(h<min?', минимум '+min:'')+' + '+extra+' ч подачи)';
  };
  sel.onchange=calc;hours.oninput=calc;calc();
  cars.forEach((c,i)=>c.querySelector('.pick').onclick=()=>{sel.value=i;calc();document.getElementById('calc').scrollIntoView({behavior:'smooth'})});
}

// карта подачи: подсветка маршрута и подстановка в заявку
const routeEls=[...document.querySelectorAll('[data-route]')];
const hlRoute=(name,on)=>routeEls.forEach(e=>{if(e.dataset.route===name)e.classList.toggle('on',on)});
routeEls.forEach(el=>{
  if(el.tagName==='g')return;
  el.addEventListener('mouseenter',()=>hlRoute(el.dataset.route,true));
  el.addEventListener('mouseleave',()=>hlRoute(el.dataset.route,false));
  el.addEventListener('click',e=>{
    const f=document.querySelector('#order [name="Маршрут"]');
    if(!f)return;
    e.preventDefault();
    f.value='Подольск → '+el.dataset.route;
    document.getElementById('contacts').scrollIntoView({behavior:'smooth'});
    setTimeout(()=>{f.focus({preventScroll:true});f.classList.add('filled');setTimeout(()=>f.classList.remove('filled'),1600)},700);
  });
});

// «Четыре шага»: автобус едет по волне и останавливается у каждого шага
const road2=document.querySelector('.road2');
if(road2){
  const NS='http://www.w3.org/2000/svg',svg=road2.querySelector('svg'),bg=road2.querySelector('.wave-bg'),wv=road2.querySelector('.wave'),
        stopsG=road2.querySelector('.stops'),bus=road2.querySelector('.mini-bus'),steps=[...document.querySelectorAll('.steps4 .card')];
  let stops=[],len=0,cur=0,running=false;
  const mobQ=matchMedia('(max-width:900px)'),motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const grid=steps[0].parentElement;grid.classList.add('slide');steps[0].classList.add('on');
  const build=()=>{
    const W=road2.clientWidth,H=road2.clientHeight,rr=road2.getBoundingClientRect();
    if(!W)return;
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    // на телефоне карточки идут слайдом, остановки ровно по ширине экрана
    const mob=mobQ.matches;
    const xs=mob?[.13,.38,.63,.88].map(f=>f*W):steps.map(c=>{const r=c.getBoundingClientRect();return r.left-rr.left+r.width/2});
    const ys=mob?[H*.74,H*.46,H*.74,H*.46]:[H*.78,H*.38,H*.78,H*.38];
    const pts=[[-60,H*.45],...xs.map((x,i)=>[x,ys[i]]),[W+60,H*.78]];
    let d='M'+pts[0][0]+' '+pts[0][1];
    for(let i=1;i<pts.length;i++){const[x0,y0]=pts[i-1],[x1,y1]=pts[i],mx=(x0+x1)/2;d+=' C'+mx+' '+y0+' '+mx+' '+y1+' '+x1+' '+y1}
    bg.setAttribute('d',d);wv.setAttribute('d',d);
    len=wv.getTotalLength();wv.style.strokeDasharray=len;
    stops=xs.map(x=>{let lo=0,hi=len;for(let k=0;k<30;k++){const m=(lo+hi)/2;wv.getPointAtLength(m).x<x?lo=m:hi=m}return lo});
    stopsG.innerHTML='';
    stops.forEach(l=>{const p=wv.getPointAtLength(l),c=document.createElementNS(NS,'circle');c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r',8);c.setAttribute('class','stop');stopsG.appendChild(c)});
    place(cur);
  };
  const place=l=>{
    cur=l;if(!len)return;
    const p=wv.getPointAtLength(l),q=wv.getPointAtLength(Math.min(len,l+2)),o=wv.getPointAtLength(Math.max(0,l-2));
    const a=Math.atan2(q.y-o.y,q.x-o.x),w=bus.offsetWidth,h=bus.offsetHeight;
    bus.style.transform='translate('+(p.x-w/2)+'px,'+(p.y-h*.92)+'px) rotate('+a+'rad)';
    wv.style.strokeDashoffset=len-l;
  };
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const tween=(a,b,ms)=>new Promise(res=>{const t0=performance.now();const f=t=>{let k=Math.min(1,(t-t0)/ms);k=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;place(a+(b-a)*k);k<1?requestAnimationFrame(f):res()};requestAnimationFrame(f)});
  // едет без остановок: шаг загорается, когда автобус проезжает мимо
  const drive=ms=>new Promise(res=>{const t0=performance.now();let last=-2;const f=t=>{const k=Math.min(1,(t-t0)/ms);const a=.08,r=k<a?k*k/(2*a):k<=1-a?k-a/2:1-a-(1-k)*(1-k)/(2*a),e=r/(1-a);const l=e*len;place(l);const idx=stops.filter(x=>l>=x-2).length-1;if(idx!==last){last=idx;setOn(idx)}k<1?requestAnimationFrame(f):res()};requestAnimationFrame(f)});
  const setOn=i=>{const ci=mobQ.matches?Math.max(i,0):i;steps.forEach((c,k)=>c.classList.toggle('on',k===ci));stopsG.querySelectorAll('.stop').forEach((c,k)=>c.classList.toggle('on',k<=i))};
  const loop=async()=>{
    if(running)return;running=true;
    while(true){
      setOn(-1);place(0);bus.style.opacity=1;
      await drive(7600);bus.style.opacity=0;await sleep(700);
    }
  };
  build();addEventListener('resize',build);
  if(document.fonts)document.fonts.ready.then(build);
  // телефон: карусель со свайпом и стрелками, автобус едет к открытому шагу
  let mi=0,tok=0,auto=null;
  const pre=new Image();pre.src='img/bus.webp';
  const snav=document.createElement('div');snav.className='snav';
  snav.innerHTML='<button class="sprev" aria-label="Предыдущий шаг"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>'
    +'<span class="scount"><b>01</b> / 04</span>'
    +'<button class="snext" aria-label="Следующий шаг"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>';
  grid.after(snav);
  const cnt=snav.querySelector('.scount');
  const moveTo=(to,ms)=>{const my=++tok,from=cur,t0=performance.now();
    const f=t=>{if(my!==tok)return;let k=Math.min(1,(t-t0)/ms);k=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;place(from+(to-from)*k);if(k<1)requestAnimationFrame(f)};
    motion?requestAnimationFrame(f):place(to)};
  const goM=(i,fromScroll)=>{
    i=(i+steps.length)%steps.length;
    if(!fromScroll)grid.scrollTo({left:steps[i].offsetLeft-steps[0].offsetLeft,behavior:motion?'smooth':'auto'});
    if(i===mi&&fromScroll)return;
    const back=i<mi;mi=i;setOn(i);
    cnt.innerHTML='<b>0'+(i+1)+'</b> / 0'+steps.length;
    bus.src=back?'img/bus.webp':'img/bus-right.webp';
    moveTo(stops[i],back&&i===0&&stops.length>2?1500:900);
  };
  const stopAuto=()=>{clearInterval(auto);auto=null};
  snav.querySelector('.sprev').onclick=()=>{stopAuto();goM(mi-1)};
  snav.querySelector('.snext').onclick=()=>{stopAuto();goM(mi+1)};
  grid.addEventListener('touchstart',stopAuto,{passive:true});
  let st;grid.addEventListener('scroll',()=>{if(!mobQ.matches)return;clearTimeout(st);st=setTimeout(()=>{const w=steps[1].offsetLeft-steps[0].offsetLeft;goM(Math.round(grid.scrollLeft/w),true)},80)});
  const startMobile=()=>{build();place(stops[mi]);bus.style.opacity=1;setOn(mi);if(motion&&!auto)auto=setInterval(()=>goM(mi+1),3800)};

  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();mobQ.matches?startMobile():(motion&&loop())}},{threshold:.35});
    io.observe(road2);
  }else if(mobQ.matches){startMobile()}
}

// меню на телефоне: тёмное, раскрывается кругом от кнопки бургера
document.querySelectorAll('.burger').forEach(d=>{
  const sum=d.querySelector('summary'),nav=d.querySelector('nav');
  d.classList.add('js-menu');d.open=true;sum.setAttribute('aria-expanded','false');
  const set=open=>{
    const r=sum.getBoundingClientRect();
    nav.style.setProperty('--mx',(r.left+r.width/2)+'px');nav.style.setProperty('--my',(r.top+r.height/2)+'px');
    d.classList.toggle('is-open',open);document.documentElement.classList.toggle('menu-open',open);
    const tc=document.querySelector('meta[name=theme-color]');if(tc)tc.setAttribute('content',open?'#efa95e':'#ffffff');
    sum.setAttribute('aria-expanded',open?'true':'false');
  };
  sum.addEventListener('click',e=>{e.preventDefault();set(!d.classList.contains('is-open'))});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));
  d.addEventListener('click',e=>{if(e.target===d&&d.classList.contains('is-open'))set(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&d.classList.contains('is-open'))set(false)});
});

// iPhone показывает нажатие (:active) только если на странице есть обработчик касаний
document.addEventListener('touchstart',()=>{},{passive:true});

// пустая дата серая, как подсказки в других полях
document.querySelectorAll('input[type=date]').forEach(i=>{const f=()=>i.classList.toggle('is-empty',!i.value);f();i.addEventListener('input',f);i.addEventListener('change',f)});