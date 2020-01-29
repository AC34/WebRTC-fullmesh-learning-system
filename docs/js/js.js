window.onload = function() {
  if (navigator.language === "ja") {
    var jp = "index.jp.html";
    if (!document.location.pathname.endsWith(jp)) {
      location.href = jp;
    }
  }
};
