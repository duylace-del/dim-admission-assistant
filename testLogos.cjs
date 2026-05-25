const urls = [
  'https://bdu.edu.az/images/logo.png',
  'https://unec.edu.az/wp-content/themes/unec/images/logo.png',
  'https://adnsu.edu.az/assets/img/logo.png',
  'https://ada.edu.az/assets/images/logo.png',
  'https://aztu.edu.az/assets/images/logo/logo.png',
  'https://sdu.edu.az/assets/images/logo.png'
];

async function check() {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(url, res.status);
    } catch(e) {
      console.log(url, 'Error');
    }
  }
}
check();
