(function loadCheckoutClarity() {
  var c = window;
  var l = document;
  var a = 'clarity';
  var r = 'script';
  var i = 'vl54hiwglb';
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  var t = l.createElement(r);
  t.async = 1;
  t.src = 'https://www.clarity.ms/tag/' + i + '?ref=bwt';
  var y = l.getElementsByTagName(r)[0];
  if (y && y.parentNode) {
    y.parentNode.insertBefore(t, y);
  } else {
    l.head.appendChild(t);
  }
})();
