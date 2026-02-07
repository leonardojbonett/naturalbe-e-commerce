// NB-SEO: filtro por producto y contexto informativo
(function(){
  const container = document.getElementById('testimonialsGrid');
  const filterSelect = document.getElementById('reviewsFilter');
  const infoText = document.getElementById('reviewsIntro');
  const data = Array.isArray(window.REVIEWS) ? window.REVIEWS : [];

  function renderReviews(list){
    if(!container) return;
    if(!list.length){
      container.innerHTML = '<p class="no-results">Aún no hay reseñas para este filtro.</p>';
      return;
    }
    container.innerHTML = list.map(r => `
      <article class="review-card">
        <div class="review-header">
          <strong>${r.name}</strong>
          <span class="review-rating" aria-label="Calificación: ${r.rating} de 5">
            <span aria-hidden="true">★</span> ${r.rating}
          </span>
        </div>
        <div class="review-meta">
          <span>${r.city}</span> · <span>${r.product}</span> · <time datetime="${r.date}">${r.date}</time>
        </div>
        <p class="review-comment">${r.comment}</p>
      </article>
    `).join('');
  }

  function uniqueProducts(){
    const set = new Set();
    data.forEach(r=>set.add(r.product));
    return Array.from(set);
  }

  function buildFilter(){
    if(!filterSelect) return;
    const options = ['Todos'].concat(uniqueProducts());
    filterSelect.innerHTML = options.map(o=>`<option value="${o}">${o}</option>`).join('');
    filterSelect.addEventListener('change',()=>{
      const val = filterSelect.value;
      const filtered = val === 'Todos' ? data : data.filter(r=>r.product === val);
      renderReviews(filtered);
    });
  }

  if(infoText){
    infoText.textContent = "Opiniones reales de clientes Natural Be (sin exponer datos sensibles). Filtra por producto para ver casos similares.";
  }

  buildFilter();
  renderReviews(data);
})();
