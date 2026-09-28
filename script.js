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
