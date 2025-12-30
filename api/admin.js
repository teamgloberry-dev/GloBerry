const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  try {
    const adminHtml = fs.readFileSync(path.join(process.cwd(), 'public', 'admin.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(adminHtml);
  } catch (error) {
    res.status(404).send('Admin page not found');
  }
}