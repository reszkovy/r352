/* ═══════════════════════════════════════════════════════
   anim.js — betterguide GSAP animation engine
   GSAP 3.12 + ScrollTrigger + Lenis smooth scroll
   ═══════════════════════════════════════════════════════ */
(function(){
  var CDN='https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/';
  function load(src){return new Promise(function(r){var s=document.createElement('script');s.src=src;s.onload=r;document.head.appendChild(s);})}

  load(CDN+'gsap.min.js')
    .then(function(){return load(CDN+'ScrollTrigger.min.js')})
    .then(function(){return load('https://unpkg.com/lenis@1.3.17/dist/lenis.min.js')})
    .then(boot);

  function boot(){
    gsap.registerPlugin(ScrollTrigger);

    /* ── Lenis smooth scroll ── */
    var lenis=new Lenis({duration:1.35,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t))},touchMultiplier:1.5});
    lenis.on('scroll',ScrollTrigger.update);
    gsap.ticker.add(function(t){lenis.raf(t*1000)});
    gsap.ticker.lagSmoothing(0);

    /* ── Helper: split text into wrapped words ── */
    function splitWords(el){
      // Preserve child HTML elements (spans with classes etc)
      var html=el.innerHTML;
      // Only split plain text nodes
      var tmp=document.createElement('div');
      tmp.innerHTML=html;
      var result='';
      tmp.childNodes.forEach(function(n){
        if(n.nodeType===3){
          // text node — split into words
          var words=n.textContent.split(/(\s+)/);
          words.forEach(function(w){
            if(w.trim()){
              result+='<span class="_w" style="display:inline-block;overflow:hidden;vertical-align:top"><span class="_wi" style="display:inline-block">'+w+'</span></span>';
            } else {
              result+=w;
            }
          });
        } else {
          // element node — wrap the whole element
          result+='<span class="_w" style="display:inline-block;overflow:hidden;vertical-align:top"><span class="_wi" style="display:inline-block">'+n.outerHTML+'</span></span>';
        }
      });
      el.innerHTML=result;
      return el.querySelectorAll('._wi');
    }

    /* ── Helper: split into characters ── */
    function splitChars(el){
      var text=el.textContent;
      el.innerHTML='';
      var spans=[];
      for(var i=0;i<text.length;i++){
        var s=document.createElement('span');
        s.style.display='inline-block';
        s.textContent=text[i]===' '?' ':text[i];
        el.appendChild(s);
        spans.push(s);
      }
      return spans;
    }

    /* ═══ ANIMATION CATALOG ═══ */

    /* 1 ▸ fade-up — smooth section entrance */
    gsap.utils.toArray('[data-anim="fade-up"]').forEach(function(el){
      gsap.from(el,{
        y:50, opacity:0, duration:1.1,
        ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 90%',once:true}
      });
    });

    /* 2 ▸ stagger — children cascade (cards, swatches) */
    gsap.utils.toArray('[data-anim="stagger"]').forEach(function(el){
      var delay=parseFloat(el.dataset.delay)||0;
      gsap.from(el.children,{
        y:40, opacity:0, scale:0.94, duration:0.75,
        ease:'power3.out',
        stagger:0.09,
        delay:delay,
        scrollTrigger:{trigger:el,start:'top 90%',once:true}
      });
    });

    /* 3 ▸ hero-title — word mask reveal */
    gsap.utils.toArray('[data-anim="hero-title"]').forEach(function(el){
      var words=splitWords(el);
      gsap.from(words,{
        yPercent:120, rotationX:-12, opacity:0,
        duration:1, ease:'power4.out',
        stagger:0.065,
        scrollTrigger:{trigger:el,start:'top 92%',once:true}
      });
    });

    /* 4 ▸ hero-chars — character stagger */
    gsap.utils.toArray('[data-anim="hero-chars"]').forEach(function(el){
      var chars=splitChars(el);
      gsap.from(chars,{
        yPercent:100, opacity:0,
        duration:0.6, ease:'power4.out',
        stagger:0.025,
        scrollTrigger:{trigger:el,start:'top 92%',once:true}
      });
    });

    /* 5 ▸ blur-in — frosted glass entrance */
    gsap.utils.toArray('[data-anim="blur-in"]').forEach(function(el){
      gsap.from(el,{
        y:24, opacity:0, filter:'blur(10px)', duration:1,
        ease:'power2.out',
        scrollTrigger:{trigger:el,start:'top 90%',once:true}
      });
    });

    /* 6 ▸ clip-up — curtain reveal */
    gsap.utils.toArray('[data-anim="clip-up"]').forEach(function(el){
      gsap.fromTo(el,
        {clipPath:'inset(100% 0% 0% 0%)',opacity:0},
        {clipPath:'inset(0% 0% 0% 0%)',opacity:1,duration:1.1,
         ease:'power3.inOut',
         scrollTrigger:{trigger:el,start:'top 88%',once:true}
        });
    });

    /* 7 ▸ scale-in — pop entrance */
    gsap.utils.toArray('[data-anim="scale-in"]').forEach(function(el){
      gsap.from(el,{
        scale:0.85, opacity:0, duration:0.9,
        ease:'back.out(1.4)',
        scrollTrigger:{trigger:el,start:'top 88%',once:true}
      });
    });

    /* 8 ▸ slide-left / slide-right */
    gsap.utils.toArray('[data-anim="slide-left"]').forEach(function(el){
      gsap.from(el,{
        x:-60, opacity:0, duration:0.9,
        ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 88%',once:true}
      });
    });
    gsap.utils.toArray('[data-anim="slide-right"]').forEach(function(el){
      gsap.from(el,{
        x:60, opacity:0, duration:0.9,
        ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 88%',once:true}
      });
    });

    /* 9 ▸ draw-line — horizontal rule wipe */
    gsap.utils.toArray('[data-anim="draw-line"]').forEach(function(el){
      gsap.from(el,{
        scaleX:0, transformOrigin:'left center', duration:0.9,
        ease:'power2.inOut',
        scrollTrigger:{trigger:el,start:'top 92%',once:true}
      });
    });

    /* 10 ▸ counter — animated number */
    gsap.utils.toArray('[data-anim="counter"]').forEach(function(el){
      var target=parseInt(el.textContent,10);
      var obj={v:0};
      gsap.to(obj,{
        v:target,duration:1.8,ease:'power2.out',
        onUpdate:function(){el.textContent=Math.round(obj.v)},
        scrollTrigger:{trigger:el,start:'top 88%',once:true}
      });
    });

    /* 11 ▸ reveal-row — children slide in from alternating sides */
    gsap.utils.toArray('[data-anim="reveal-row"]').forEach(function(el){
      Array.from(el.children).forEach(function(child,i){
        gsap.from(child,{
          x:i%2===0?-40:40, opacity:0, duration:0.8,
          ease:'power3.out',
          delay:i*0.1,
          scrollTrigger:{trigger:el,start:'top 88%',once:true}
        });
      });
    });

    /* ═══ BACKWARD COMPAT — old data-reveal system ═══ */
    gsap.utils.toArray('[data-reveal]').forEach(function(el){
      if(el.hasAttribute('data-anim')) return; // skip if new system
      gsap.from(el,{
        y:40, opacity:0, duration:1,
        ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 90%',once:true}
      });
    });
    gsap.utils.toArray('[data-reveal-stagger]').forEach(function(el){
      if(el.hasAttribute('data-anim')) return;
      gsap.from(el.children,{
        y:28, opacity:0, duration:0.7,
        ease:'power3.out',
        stagger:0.08,
        scrollTrigger:{trigger:el,start:'top 90%',once:true}
      });
    });

    /* ═══ MAGNETIC HOVER (opt-in) ═══ */
    gsap.utils.toArray('[data-magnetic]').forEach(function(el){
      var strength=parseFloat(el.dataset.magnetic)||0.08;
      el.addEventListener('mousemove',function(e){
        var r=el.getBoundingClientRect();
        var x=(e.clientX-r.left-r.width/2)*strength;
        var y=(e.clientY-r.top-r.height/2)*strength;
        gsap.to(el,{x:x,y:y,duration:0.4,ease:'power2.out'});
      });
      el.addEventListener('mouseleave',function(){
        gsap.to(el,{x:0,y:0,duration:0.6,ease:'elastic.out(1,0.3)'});
      });
    });

    /* ═══ PARALLAX (opt-in) ═══ */
    gsap.utils.toArray('[data-parallax]').forEach(function(el){
      var speed=parseFloat(el.dataset.parallax)||0.1;
      gsap.to(el,{
        yPercent:speed*100,
        ease:'none',
        scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}
      });
    });

    /* ═══ TILT 3D HOVER (opt-in) ═══ */
    gsap.utils.toArray('[data-tilt]').forEach(function(el){
      var max=parseFloat(el.dataset.tilt)||6;
      el.style.transformStyle='preserve-3d';
      el.style.willChange='transform';
      el.addEventListener('mousemove',function(e){
        var r=el.getBoundingClientRect();
        var rx=((e.clientY-r.top)/r.height-0.5)*-max;
        var ry=((e.clientX-r.left)/r.width-0.5)*max;
        gsap.to(el,{rotateX:rx,rotateY:ry,duration:0.4,ease:'power2.out',transformPerspective:800});
      });
      el.addEventListener('mouseleave',function(){
        gsap.to(el,{rotateX:0,rotateY:0,duration:0.6,ease:'elastic.out(1,0.5)'});
      });
    });

    /* ═══ VISIBLE CLASS TOGGLE (for CSS transitions) ═══ */
    // Fire 'is-visible' class for any remaining CSS-driven animations
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}
        });
      },{rootMargin:'0px 0px -6% 0px',threshold:0.05});
      document.querySelectorAll('[data-reveal],[data-reveal-stagger]').forEach(function(el){io.observe(el)});
    }

    /* Signal ready */
    document.body.classList.add('anim-ready');
  }
})();
