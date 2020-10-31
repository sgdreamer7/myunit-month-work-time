/* eslint-disable compat/compat */
const download = require('download-chromium');
const puppeteer = require('puppeteer');
const tmp = require('os').tmpdir();
const fetch = require('node-fetch');
const moment = require('moment');

const getMonthWorkHours = async ({ username, password, monthString }) => {
  const exec = await download({ revision: 756035, installPath: `${tmp}/.local-chromium` });

  const browser = await puppeteer.launch({ headless: true, executablePath: exec });
  const page = await browser.newPage('');
  // eslint-disable-next-line no-console
  console.log(`Осуществляется вход в myUnit для пользователя '${username}'...`);

  await page.goto('https://powercode.myunit.io/auth/login/?next=/');

  await page.setViewport({ width: 1680, height: 970 });

  await page.waitForSelector('table #id_username');
  await page.click('table #id_username');
  await page.type('table #id_username', username);

  await page.waitForSelector('table #id_password');
  await page.click('table #id_password');
  await page.type('table #id_password', password);

  await page.waitForSelector('body > .container > form > input:nth-child(3)');
  await page.click('body > .container > form > input:nth-child(3)');

  await page.waitForNavigation({ waitUntil: ['load', 'domcontentloaded'] });

  await page.waitForSelector('img.logo');
  const cookies = await page.cookies();

  await browser.close();

  const cookiesString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  // eslint-disable-next-line no-console
  console.log(`Вход в myUnit для пользователя '${username}' завершен.`);

  const startDate = moment(monthString)
    .startOf('month')
    .format('YYYY-MM-DD');
  const endDate = moment(monthString)
    .endOf('month')
    .format('YYYY-MM-DD');
  // eslint-disable-next-line no-console
  console.log(
    `Получение данных по отчетам myUnit для пользователя '${username}' за период с ${startDate} по ${endDate}.`
  );
  const url = `https://powercode.myunit.io/api/reports/?report_date_0=${startDate}&report_date_1=${endDate}`;
  let json = await fetch(url, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'ru-UA,ru;q=0.9,en-US;q=0.8,en;q=0.7,ru-RU;q=0.6',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'sec-ch-ua': '"Chromium";v="86", "\\"Not\\\\A;Brand";v="99", "Google Chrome";v="86"',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      cookie: cookiesString
    },
    referrer: 'https://powercode.myunit.io/devreports/',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors'
  }).then((response) => response.json());
  const results = [...json.results];
  while (json.page_number < json.total_pages) {
    // eslint-disable-next-line no-await-in-loop
    json = await fetch(`${url}&page=${json.page_number + 1}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'ru-UA,ru;q=0.9,en-US;q=0.8,en;q=0.7,ru-RU;q=0.6',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'sec-ch-ua': '"Chromium";v="86", "\\"Not\\\\A;Brand";v="99", "Google Chrome";v="86"',
        'sec-ch-ua-mobile': '?0',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        cookie: cookiesString
      },
      referrer: 'https://powercode.myunit.io/devreports/',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: null,
      method: 'GET',
      mode: 'cors'
    }).then((response) => response.json());
    results.push(...json.results);
  }
  // eslint-disable-next-line no-console
  console.log(
    `Получение данных по отчетам myUnit для пользователя '${username}' за период с ${startDate} по ${endDate} завершено.`
  );

  const monthHours =
    results.reduce(
      (daysAcc, result) =>
        daysAcc + result.dailyreporttask.reduce((acc, item) => acc + item.hours_amount, 0),
      0
    ) / 60;
  return { monthHours, startDate, endDate };
};

module.exports = getMonthWorkHours;
