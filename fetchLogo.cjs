const fs = require('fs');

fetch('https://ndu.edu.az')
  .then(r => r.text())
  .then(html => {
    const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      if (m[1].toLowerCase().includes('logo') || m[1].toLowerCase().includes('loqo')) {
        console.log(m[1]);
      }
    }
  });
