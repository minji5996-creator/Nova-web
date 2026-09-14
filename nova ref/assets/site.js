document.querySelectorAll('a[target="_blank"]').forEach(a=>a.rel='noopener noreferrer');document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));
const art=document.querySelector('.cinema-art');if(art)art.classList.add('loaded');
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.08});
 document.querySelectorAll('.encounter-copy,.powers-heading,.power-card,.universe-inner,.final-call>h2').forEach((el,i)=>{el.classList.add('reveal');el.style.setProperty('--delay',`${i%3*90}ms`);observer.observe(el);});
}
