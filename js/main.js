const wizard = document.querySelector('.wizard');
const FALL = 'assets/wizard-fall.png';
const KNEEL = 'assets/output-onlinegiftools.gif';
const STAND_BACK = 'assets/wizard-stand-back.png';

// per-pose heights (adjust to match sizes)
const H_FALL = '20vh';
const H_KNEEL = '20vh';
const H_STAND = '20vh';

// how long the kneel GIF plays before he stands (seconds)
const KNEEL_HOLD = 2;
const KNEEL_GIF_DURATION = 2.5;

// preload so the pose swaps have no flicker
[FALL, KNEEL, STAND_BACK].forEach(src => { new Image().src = src; });

wizard.src = FALL;
gsap.set(wizard, {
  height: H_FALL,
  y: () => -window.innerHeight,
  scale: 0.6,
  transformOrigin: '50% 100%'
});

gsap.set('.shockwave', { rotationX: 70, scale: 0 });
// ---------- lightning helpers ----------
const NORMAL = 'brightness(1) drop-shadow(0 0 0px rgba(79,195,255,0))';
const GLOW   = 'brightness(3.5) drop-shadow(0 0 35px rgba(120,210,255,1))';
gsap.set(wizard, { filter: NORMAL });

function spawnBolts() {
  const NS = 'http://www.w3.org/2000/svg';
  const hero = document.querySelector('.hero');
  const h = hero.getBoundingClientRect();
  const w = wizard.getBoundingClientRect();

  const cx = w.left - h.left + w.width / 2;
  const headY = w.top - h.top + w.height * 0.12;   // where the bolts land
  const startY = -20;                               // above the screen

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', h.width);
  svg.setAttribute('height', h.height);
  svg.style.cssText =
    'position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;' +
    'filter:drop-shadow(0 0 8px #4fc3ff) drop-shadow(0 0 20px #4fc3ff);';

  const paths = [];
  for (let i = 0; i < 4; i++) {
    const main = i === 0;
    const startX = cx + gsap.utils.random(-w.width * 0.5, w.width * 0.5);
    const endX = cx + (main ? 0 : gsap.utils.random(-w.width * 0.15, w.width * 0.15));
    const steps = 14;
    let d = '';
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = startX + (endX - startX) * t + (s && s < steps ? gsap.utils.random(-16, 16) : 0);
      const y = startY + (headY - startY) * t;
      d += (s ? ' L ' : 'M ') + x + ' ' + y;
    }
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', '#d8f3ff');
    p.setAttribute('stroke-width', main ? 5 : gsap.utils.random(2, 3.5));
    p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('pathLength', 1);
    p.style.strokeDasharray = 1;
    p.style.strokeDashoffset = 1;
    svg.appendChild(p);
    paths.push(p);
  }

  hero.appendChild(svg);

  gsap.timeline()
    .to(paths, { strokeDashoffset: 0, duration: 0.12, ease: 'none', stagger: 0.02 })   // strike downward
    .fromTo(svg, { opacity: 1 }, { opacity: 0.15, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' })
    .to(svg, { opacity: 0, duration: 0.1, onComplete: () => svg.remove() });
}
const tl = gsap.timeline({ delay: 0.8 });

// 1. fall + impact
tl.to(wizard, { y: 0, scale: 1, duration: 1.1, ease: 'power2.in' })
  .addLabel('impact')
  .add(() => {                                   // GIF starts playing from its first frame here
    wizard.src = KNEEL;
    gsap.set(wizard, { height: H_KNEEL });
  }, 'impact')
  .fromTo('.shockwave', { scale: 0, opacity: 0.9 }, { scale: 4, opacity: 0, duration: 1, ease: 'power2.out' }, 'impact')
  .fromTo('.flash', { opacity: 1 }, { opacity: 0, duration: 1.0, ease: 'power2.out' }, 'impact')
  .fromTo('.hero', { x: 0, y: 0 }, { x: 'random(-8, 8)', y: 'random(-6, 6)', duration: 0.04, repeat: 7, repeatRefresh: true, ease: 'none' }, 'impact')
  .set('.hero', { x: 0, y: 0 });

  // 2. lightning strikes exactly when the kneel GIF ends, then he stands
tl.addLabel('strike', 'impact+=' + KNEEL_GIF_DURATION)
  .add(spawnBolts, 'strike')
  .to(wizard, { filter: GLOW, duration: 0.25, ease: 'power2.in' }, 'strike+=0.1')   // glow when the bolt lands
  .fromTo('.hero', { x: 0 }, { x: 'random(-5, 5)', duration: 0.04, repeat: 7, repeatRefresh: true, ease: 'none' }, 'strike+=0.1')
  .set('.hero', { x: 0 })
  // swap at full brightness so the cut is hidden
  .add(() => {
    wizard.src = STAND_BACK;
    gsap.set(wizard, { height: H_STAND });
  }, 'strike+=0.35')
  .fromTo('.flash', { opacity: 1 }, { opacity: 0, duration: 0.8, ease: 'power2.out' }, 'strike+=0.35')
  .to(wizard, { filter: NORMAL, duration: 0.7, ease: 'power2.out' }, 'strike+=0.35')
  .fromTo(wizard, { scaleY: 0.94 }, { scaleY: 1, duration: 0.5, ease: 'back.out(2)' }, 'strike+=0.35');