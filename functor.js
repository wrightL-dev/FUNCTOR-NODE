const axios = require('axios');
const fs = require('fs');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});
const randomUserAgent = require('random-useragent');

const headers = {
  'Host': 'api.securitylabs.xyz',
  'Sec-Ch-Ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
  'Accept': 'application/json, text/plain, */*',
  'Sec-Ch-Ua-Mobile': '?0',
  'User-Agent': randomUserAgent.getRandom(),
  'Sec-Ch-Ua-Platform': 'Linux',
  'Origin': 'https://node.securitylabs.xyz',
  'Sec-Fetch-Site': 'same-site',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  'Referer': 'https://node.securitylabs.xyz/',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'close'
};

function clearConsole() {
  console.clear();
  console.log("===================");
  console.log("\x1b[35mBY: wrightL\x1b[0m");
  console.log("\x1b[34mGITHUB: https://github.com/wrightL-dev\x1b[0m");
  console.log("\x1b[36mTELEGRAM CHANNEL: https://t.me/tahuri01\x1b[0m");
  console.log("\x1b[38;5;150mBOT: Functor Node\x1b[0m");
}

function readAccounts() {
  const data = fs.readFileSync('akun.txt', 'utf-8');
  const lines = data.split('\n').filter(line => line.trim() !== '');
  const accounts = lines.map(line => {
    const [email, password] = line.split('|');
    return { email, password };
  });
  return accounts;
}

async function main() {
  try {
    clearConsole();

    const accounts = readAccounts();

    for (const account of accounts) {
      const { email, password } = account;

      console.log("===================");
      console.log(`\x1b[32mMemproses akun: ${email}\x1b[0m`);

      const checkEmailResponse = await axios.post('https://api.securitylabs.xyz/v1/auth/check-exist-email', {
        email: email,
      }, { headers });

      if (!checkEmailResponse.data) {
        console.log('\x1b[31mEmail tidak ada!\x1b[0m');
        continue;
      }

      const signInResponse = await axios.post('https://api.securitylabs.xyz/v1/auth/signin-user', {
        email: email,
        password: password,
      }, { headers });

      const accessToken = signInResponse.data.accessToken;

      headers['Authorization'] = `Bearer ${accessToken}`;

      const getUserResponse = await axios.get('https://api.securitylabs.xyz/v1/users', { headers });
      const userId = getUserResponse.data.id;

      const getWalletResponse = await axios.get('https://api.securitylabs.xyz/v1/wallets', { headers });

      await claimMiningReward(userId);

      await activateEpoch();

      console.log('\x1b[32mBerhasil login dan klaim reward mining!\x1b[0m');
      console.log(`\x1b[34mAlamat wallet: ${getWalletResponse.data[0].address}\x1b[0m`);
    }

    console.log("===================");
    console.log('\x1b[32mSemua akun telah diproses, Menunggu 24 Jam...\x1b[0m');

    readline.close();
  } catch (error) {
    console.error('\x1b[31mTerjadi kesalahan:\x1b[0m', error.response ? error.response.data : error.message);
  }
}

async function claimMiningReward(userId) {
  try {
    await axios.get(`https://api.securitylabs.xyz/v1/users/earn/${userId}`, { headers });
  } catch (error) {
    console.error('\x1b[31mKesalahan saat klaim reward mining:\x1b[0m', error.response.data);
  }
}

async function activateEpoch() {
  try {
    await axios.get('https://api.securitylabs.xyz/v1/epoch/active', { headers });
  } catch (error) {
    console.error('\x1b[31mKesalahan saat mengaktifkan epoch:\x1b[0m', error.response.data);
  }
}

main();

setInterval(main, 86400000);
