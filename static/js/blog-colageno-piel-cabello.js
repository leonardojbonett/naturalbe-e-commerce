document.addEventListener("DOMContentLoaded", function () {
  var tocLinks = document.querySelectorAll(".toc-card a[href^='#']");
  tocLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      var id = link.getAttribute("href");
      var target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });

  var faqItems = document.querySelectorAll(".faq-list details");
  faqItems.forEach(function (item, idx) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "faq_open",
          faq_index: idx + 1,
          faq_question: item.querySelector("summary") ? item.querySelector("summary").textContent.trim() : "faq"
        });
      } catch (err) {
        // Silent: analytics is optional for this page.
      }
    });
  });
});
