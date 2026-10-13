/* TMM SonoraPort BRICS homepage slideshow. No authentication data is handled here. */
(()=>{'use strict';
 const root=document.getElementById('tmm-showcase');
 if(!root)return;
 const slides=Array.from(root.querySelectorAll('[data-tmm-slide]'));
 const dots=Array.from(root.querySelectorAll('[data-tmm-dot]'));
 const counter=root.querySelector('[data-tmm-count]');
 const toggle=root.querySelector('[data-tmm-toggle]');
 const previous=root.querySelector('[data-tmm-prev]');
 const next=root.querySelector('[data-tmm-next]');
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const interval=7000;
 let current=0,timer=null,paused=Boolean(reduced?.matches),touchX=null;
 function render(index){
  current=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>{
   const active=i===current;
   slide.classList.toggle('is-active',active);
   slide.setAttribute('aria-hidden',String(!active));
   if('inert'in slide)slide.inert=!active;
   // Fallback for browsers without inert.
   slide.querySelectorAll('a').forEach(a=>{if(active)a.removeAttribute('tabindex');else a.setAttribute('tabindex','-1');});
  });
  dots.forEach((dot,i)=>{dot.setAttribute('aria-current',String(i===current));dot.setAttribute('aria-label','Show slide '+(i+1)+' of '+slides.length)});
  if(counter)counter.textContent=String(current+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
 }
 function stop(){if(timer){window.clearInterval(timer);timer=null}}
 function start(){stop();if(!paused&&!document.hidden&&slides.length>1)timer=window.setInterval(()=>render(current+1),interval)}
 function go(index){render(index);start()}
 function paintToggle(){if(toggle){toggle.textContent=paused?'Play slideshow':'Pause slideshow';toggle.setAttribute('aria-pressed',String(paused))}}
 slides.forEach(slide=>{
  const photo=slide.querySelector('img[data-tmm-fallback]');
  if(!photo)return;
  const fallbackImage=()=>{
   const fallback=photo.dataset.tmmFallback;
   if(!photo.dataset.fallbackTried&&fallback&&new URL(fallback,location.href).protocol==='https:'){
    photo.dataset.fallbackTried='yes';photo.src=fallback;
   }else{photo.style.display='none';}
  };
  photo.addEventListener('error',fallbackImage);
  if(photo.complete&&photo.naturalWidth===0)fallbackImage();
 });
 previous?.addEventListener('click',()=>go(current-1));
 next?.addEventListener('click',()=>go(current+1));
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
 toggle?.addEventListener('click',()=>{paused=!paused;paintToggle();start()});
 root.addEventListener('keydown',event=>{
  if(event.target.closest('input,textarea,select'))return;
  if(event.key==='ArrowRight'){event.preventDefault();go(current+1)}
  if(event.key==='ArrowLeft'){event.preventDefault();go(current-1)}
 });
 root.addEventListener('touchstart',event=>{if(event.touches.length===1)touchX=event.touches[0].clientX},{passive:true});
 root.addEventListener('touchend',event=>{
  if(touchX===null||event.changedTouches.length!==1)return;
  const delta=event.changedTouches[0].clientX-touchX;touchX=null;
  if(Math.abs(delta)>=55)go(current+(delta<0?1:-1));
 },{passive:true});
 document.addEventListener('visibilitychange',start);
 reduced?.addEventListener?.('change',e=>{paused=e.matches;paintToggle();start()});
 render(0);paintToggle();start();
})();
