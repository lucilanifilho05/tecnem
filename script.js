const formatar = numero => numero.toLocaleString('pt-BR');
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('dados.json');
    if (!response.ok) throw new Error('Falha ao carregar dados');
    const data = await response.json();
    renderizarRanking(data.turmas, data.informacoesGerais.festa.metaPontos);
    renderizarCalendario(data.calendario);
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
    const tabela = document.getElementById('corpo-ranking');
    tabela.replaceChildren();
    const cell = tabela.insertRow().insertCell();
    cell.colSpan = 4;
    cell.textContent = 'Não foi possível carregar o ranking. Tente atualizar a página.';
    document.getElementById('conteudo-calendario').textContent = 'Não foi possível carregar a programação. Tente atualizar a página.';
  }
});
function elemento(tag, classe, texto) {
  const node = document.createElement(tag);
  if (classe) node.className = classe;
  if (texto !== undefined) node.textContent = texto;
  return node;
}
function renderizarRanking(turmas, metaPontos) {
  const tabela = document.getElementById('corpo-ranking');
  tabela.replaceChildren();
  const ordenadas = [...turmas].sort((a,b) => b.pontos - a.pontos);
  ordenadas.forEach(turma => {
    const row = tabela.insertRow();
    const posicao = ordenadas.findIndex(item => item.pontos === turma.pontos) + 1;
    row.insertCell().append(elemento('span', `rank-number top-${posicao}`, `${posicao}º`));
    const [nome, ...curso] = turma.nome.split(' - ');
    row.insertCell().append(elemento('span', 'class-name', nome), elemento('span', 'class-course', curso.join(' - ')));
    const score = elemento('span', 'score', formatar(turma.pontos));
    score.append(elemento('small', '', ' pts'));
    row.insertCell().append(score);
    const atingiu = turma.pontos >= metaPontos;
    const status = elemento('span', atingiu ? 'meta-atingida' : 'meta-pendente', atingiu ? '✓ Meta atingida' : `Faltam ${formatar(metaPontos - turma.pontos)} pts`);
    const track = elemento('div', 'progress-track');
    track.setAttribute('aria-hidden', 'true');
    const fill = elemento('div', 'progress-fill');
    fill.style.width = `${Math.max(0, Math.min(100, turma.pontos / metaPontos * 100))}%`;
    track.append(fill);
    row.insertCell().append(status, track);
  });
}
function renderizarCalendario(eventos) {
  const calendario = document.getElementById('conteudo-calendario');
  calendario.replaceChildren();
  eventos.forEach((evento,index) => {
    const item = elemento('article', 'evento-item');
    const data = elemento('div', 'evento-data', evento.data);
    data.append(elemento('span', '', `ETAPA ${String(index + 1).padStart(2, '0')}`));
    const info = elemento('div', 'evento-info');
    info.append(elemento('h3', '', evento.atividade), elemento('p', '', evento.turmas));
    item.append(data, info);
    calendario.append(item);
  });
}

// A navegação dos banners funciona independentemente do carregamento do ranking.
document.addEventListener('DOMContentLoaded', iniciarCarrossel);
function iniciarCarrossel() {
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const dots = [...carousel.querySelectorAll('[data-slide]')];
  const play = carousel.querySelector('.carousel-play');
  const status = carousel.querySelector('.carousel-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let paused = reducedMotion.matches;
  let hovered = false;
  let timer;
  let touchStart = null;
  carousel.querySelector('.carousel-controls').hidden = false;

  function schedule() {
    clearInterval(timer);
    play.textContent = paused ? 'Reproduzir' : 'Pausar';
    play.setAttribute('aria-label', paused ? 'Iniciar troca automática de banners' : 'Pausar troca automática de banners');
    if (!paused && !hovered && !document.hidden) timer = setInterval(() => show(current + 1), 7000);
  }
  function show(index, manual = false) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
    if (manual) {
      paused = true;
      status.textContent = `Banner ${current + 1} de ${slides.length}`;
    }
    schedule();
  }
  carousel.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => show(current + Number(button.dataset.direction), true)));
  dots.forEach(button => button.addEventListener('click', () => show(Number(button.dataset.slide), true)));
  play.addEventListener('click', () => { paused = !paused; schedule(); });
  carousel.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  carousel.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  carousel.addEventListener('focusin', () => { paused = true; schedule(); });
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(current + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  const surface = carousel.querySelector('.carousel-slides');
  surface.addEventListener('touchstart', event => {
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  surface.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1), true);
    touchStart = null;
  }, { passive: true });
  surface.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { paused = true; schedule(); } });
  schedule();
}
