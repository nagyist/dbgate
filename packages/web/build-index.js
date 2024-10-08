const fs = require('fs');

const template = fs.readFileSync('./index.html.tpl', 'utf-8');

for (const page of ['', 'not-logged', 'error', 'admin-login', 'login', 'admin', 'license']) {
  const text = template.replace(/{{page}}/g, page);
  fs.writeFileSync(`public/${page || 'index'}.html`, text);
}
