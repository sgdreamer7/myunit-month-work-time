/* eslint-disable compat/compat */
const readline = require('readline');
const moment = require('moment');
const getMonthWorkHours = require('./my-unit');

(async () => {
  const defaultUsername = 'vladimir.sherbina@powercode.us';
  const defaultDate = moment().format('YYYY-MM-DD');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('SIGINT', () => {
    process.exit(0);
  });
  const questionPromisified = (prompt) =>
    new Promise((resolve) => rl.question(prompt, async (answer) => resolve(answer)));

  const username =
    (await questionPromisified(
      `Введите имя пользователя для myUnit и нажмите ENTER [${defaultUsername}]:`
    )) || defaultUsername;
  const password = await questionPromisified(
    `Введите пароль для пользователя '${username}' в myUnit и нажмите ENTER:`
  );

  const monthString =
    (await questionPromisified(
      `Введите дату месяца, для которого извлекаются отчеты и нажмите ENTER [${defaultDate}]:`
    )) || defaultDate;

  const { monthHours, startDate, endDate } = await getMonthWorkHours({
    username,
    password,
    monthString
  });
  // eslint-disable-next-line no-console
  console.log(
    `Согласно отчетам myUnit пользователь '${username}' за период с ${startDate} по ${endDate} отработал ${monthHours} часов.`
  );

  rl.close();
  process.exit(0);
})();
