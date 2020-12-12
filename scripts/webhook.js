#!env node

let http = require('http');
let url  = require('url');
let exec = require('child_process').exec;
let gitPull = 'git pull';
let port = 2047;
let noop = () => {};

let hmac = function (str) {
  let secret = process.env['secret'];
  let crypto = require('crypto');
  let hmac = crypto.createHmac('sha1', secret);
  hmac.update('pash-related nonce');
  return hmac.digest('hex');
};

let ciLock = false;
let ci = function (req, res) {
  if (ciLock) {
    let msg = "Prior CI Job running";
    res.writeHead(200, {'Content-Type': 'text/plain' });
    res.end(msg);
    console.log(msg);
  } else {
    ciLock = true;
    runTask('Running CI', './ci.sh', req, res, () => {ciLock = false});
  }
};

let docs = function (req, res) {
  runTask('Building docs', '../docs/make.sh', req, res, noop);
};

let pkg = function (req, res) {
  runTask('Packagin PaSh', './pkg.sh', req, res, noop);
};

let echo = function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain' });
  res.end(req.body);
  console.log(req.body);
};

let runTask = function (msg, script, req, res, cleanup) {
  exec(script, function(error, stdout, stderr) {
    if (!error) {
      console.log(script + "\n" + stdout);
    } else {
      let e = msg + "...Error\n" + error.stack + "\n" + stderr;
      console.error(e);
    }
    cleanup();
  });
  res.writeHead(200, {'Content-Type': 'text/plain' });
  res.end(msg + " ...started");
};

let routes = {
  '/ci': ci,
  //  '/doc': docs,
  '/echo': echo,
  '/pkg': pkg
};

function tryPull (req, res) {
  // FIXME -- verify by calculating hmac
  // secret in header: X-Hub-Signature-256
  // https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/webhook-events-and-payloads
  let p = url.parse(req.url).pathname
    console.log(new Date(), p, req.headers['x-hub-signature-256']);

  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    console.log('favicon requested');
    return;
  }

  if (routes[p]) {
    routes[p](req, res);
  } else {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.end("404 Not Found\n");
  }
}

http.createServer(tryPull).listen(port, console.log("server listening on port " + port));
