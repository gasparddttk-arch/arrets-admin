// Lexou animé : des vidéos où la moitié haute porte l'image et la moitié basse la transparence.
// Un petit shader recompose l'image détourée sur un canvas, par-dessus n'importe quel fond.
// En cas d'échec (pas de WebGL, vidéo absente hors ligne), on garde la chouette fixe passée en repli.
import { h } from './ui.js';

const DOSSIER = 'img/lexou/';
export const ANIMATIONS = {
  lecture: { ratio: 420 / 560, boucle: true },
  plume: { ratio: 480 / 500, boucle: true },
  victoire: { ratio: 640 / 600, boucle: false },
};

const VS = 'attribute vec2 p;varying vec2 t;void main(){t=vec2((p.x+1.)/2.,(1.-p.y)/4.);gl_Position=vec4(p,0.,1.);}';
const FS = 'precision mediump float;uniform sampler2D v;varying vec2 t;void main(){vec3 c=texture2D(v,t).rgb;float a=texture2D(v,t+vec2(0.,.5)).r;gl_FragColor=vec4(c*a,a);}';

function programme(gl) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  return pr;
}

// nom : clé d'ANIMATIONS ; hauteur : en pixels CSS ; repli : l'élément affiché tant que la vidéo n'a pas démarré, et pour de bon si elle échoue.
export function lexouAnime(nom, { hauteur = 220, repli, classe = '' } = {}) {
  const def = ANIMATIONS[nom];
  const largeur = Math.round(hauteur * def.ratio);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const canvas = h('canvas', { class: 'lexou-canvas', width: Math.round(largeur * dpr), height: Math.round(hauteur * dpr), 'aria-hidden': 'true' });
  const boite = h('div', { class: `lexou-anime ${classe}`, style: `--h:${hauteur}px;--l:${largeur}px`, role: 'img', 'aria-label': 'Lexou' }, repli || null, canvas);
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl || !programme(gl)) { canvas.remove(); return boite; }
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const video = h('video', { muted: '', playsinline: '', 'webkit-playsinline': '', preload: 'auto', loop: def.boucle ? '' : null },
    h('source', { src: `${DOSSIER}${nom}.mp4`, type: 'video/mp4' }),
    h('source', { src: `${DOSSIER}${nom}.webm`, type: 'video/webm' }));
  video.muted = true; video.defaultMuted = true; video.playsInline = true;
  // Dans la page mais invisible : Safari décode plus sûrement une vidéo attachée au document.
  video.className = 'lexou-source';
  boite.append(video);

  let pret = false;
  const dessiner = () => {
    // Retirée de la page (Lexou touché au Palais, par exemple) : on attend son retour, puis on libère la vidéo.
    if (!boite.isConnected) {
      video.pause();
      let essais = 0;
      const guetter = () => {
        if (boite.isConnected) { video.play().then(dessiner).catch(() => {}); return; }
        if (++essais < 20) setTimeout(guetter, 250);
        else { video.replaceChildren(); video.load(); }
      };
      setTimeout(guetter, 250);
      return;
    }
    if (video.readyState >= 2) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!pret) { pret = true; boite.classList.add('pret'); }
    }
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(dessiner);
    else requestAnimationFrame(dessiner);
  };
  video.addEventListener('error', () => canvas.remove(), true);
  // Le premier rendu attend que la boîte soit dans la page : sans elle, rien ne se lance.
  requestAnimationFrame(() => {
    video.play().then(dessiner).catch(() => canvas.remove());
  });
  boite.rejouer = () => { video.currentTime = 0; video.play().catch(() => {}); };
  return boite;
}
