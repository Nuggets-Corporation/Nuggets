const loadingSrc = `<head>
    <link rel="stylesheet" href="${replacement}/assets/css/loading.css">
</head>
<body class="load">
    <div class="loading"></div>
</body>`;

if (window.routeQuery!='undefined') {
    const iframe = document.getElementById("iframe");
    if (iframe && iframe.contentWindow) {
        const iframeSrc = iframe.contentWindow.document;
        iframeSrc.open();
        iframeSrc.write(loadingSrc);
        iframeSrc.close();
    }
}

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  prefix: "/~/s/",
	files: {
		wasm: `${replacement}/sj/scramjet.wasm.wasm`,
		all: `${replacement}/sj/scramjet.all.js`,
		sync: `${replacement}/sj/scramjet.sync.js`,
	},

});

try {
  if (navigator.serviceWorker) {
    scramjet.init();
    navigator.serviceWorker.register(`./sw.js?r=${replacement}`);
  } else {
    console.warn("Service workers not supported");
  }
} catch (e) {
  console.error("Failed to initialize Scramjet:", e);
}

let wispUrl;
const wispVal = window.wispVal;
const routeQuery = window.routeQuery;
if (wispVal === 'default' || wispVal === 'undefined') {
  wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
} else {
  wispUrl = 'wss://' + String(wispVal).replace(/^(https?|wss?):\/\//i, '');
}
console.log(wispUrl);
const connection = new BareMux.BareMuxConnection(`${replacement}/baremux/worker.js`);
async function setTransport(transportsel) {
  switch (transportsel) {
    case "epoxy":
      await connection.setTransport(`${replacement}/epoxy/index.mjs`, [{ wisp: wispUrl }]);
      break;
    case "libcurl":
      await connection.setTransport(`${replacement}/libcurl/index.mjs`, [{ websocket: wispUrl }]);
      break;
  }
}

setTransport("epoxy");
let proxy = 'scramjet';
let url;
let newUrl;

function search(input) {
  let template = "https://www.google.com/search?q=%s";
  try {
    return new URL(input).toString();
  } catch (err) {}

  try {
    let url = new URL(`https://${input}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch (err) {}

  return template.replace("%s", encodeURIComponent(input));
}

function load(input) {
  newUrl = search(input);
  if ( proxy === 'scramjet') {
    url = scramjet.encodeUrl(newUrl);
  } else url = __uv$config.prefix + __uv$config.encodeUrl(newUrl);
  document.getElementById("iframe").src = url;
  document.getElementById("url").value = decodeURIComponent(newUrl);
}

if (routeQuery!='undefined') {
  newUrl=decodeURIComponent(routeQuery);
  load(newUrl);
}

document.getElementById("search").addEventListener("submit", async (event) => {
  event.preventDefault();
  newUrl = document.getElementById("url").value;
  load(newUrl);
});