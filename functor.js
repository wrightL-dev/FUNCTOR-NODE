const { HttpsProxyAgent } = require("https-proxy-agent");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData
} = require("worker_threads");
const fs = require("fs");
const axios = require("axios");
const randomUserAgent = require("random-useragent");

function clearConsole() {
  console.clear();
  console.log("==========================================================");
  console.log("\x1b[38;5;213mBY: wrightL\x1b[0m");
  console.log("\x1b[38;5;117mGITHUB: https://github.com/wrightL-dev\x1b[0m");
  console.log("\x1b[38;5;159mTELEGRAM CHANNEL: https://t.me/tahuri01\x1b[0m");
  console.log("\x1b[38;5;147mBOT: Functor Node\x1b[0m");
  console.log("==========================================================");
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  const maskedName =
    name.slice(0, 2) + "*".repeat(name.length - 4) + name.slice(-2);
  return `${maskedName}@${domain}`;
}

function maskWalletAddress(wallet) {
  return wallet.slice(0, 6) + "*".repeat(wallet.length - 10) + wallet.slice(-4);
}

function readAccounts() {
  const data = fs.readFileSync("akun.txt", "utf-8");
  const lines = data.split("\n").filter((line) => line.trim() !== "");
  const accounts = lines.map((line) => {
    const [email, password] = line.split("|");
    return { email, password };
  });
  return accounts;
}

async function claimMiningReward(userId, headers, email, axiosConfig) {
  const maskedEmail = maskEmail(email);
  try {
    await axios.get(
      `https://node.securitylabs.xyz/api/v1/users/earn/${userId}`,
      axiosConfig
    );
    parentPort.postMessage(
      `\x1b[38;5;121mReward mining diklaim untuk user ${maskEmail(
        email
      )}\x1b[0m`
    );
  } catch (error) {
    parentPort.postMessage(
      `\x1b[38;5;168m[${maskedEmail}] Error claim reward mining : ${
        error.response?.data?.message || error.message
      }\x1b[0m`
    );
  }
}

async function activateEpoch(headers, email, axiosConfig) {
  const maskedEmail = maskEmail(email);
  try {
    const activateHeaders = { ...headers };
    activateHeaders.Origin =
      "chrome-extension://gahmmgacnfeohncipkjfjfbdlpbfkfhi";

    const response = await axios.get(
      "https://node.securitylabs.xyz/api/v1/epoch/active",
      {
        ...axiosConfig,
        headers: activateHeaders
      }
    );
  } catch (error) {
    parentPort.postMessage(
      `\x1b[38;5;168m[${maskedEmail}]Error activating the epoch: ${error.message}\x1b[0m`
    );
  }
}

async function activateEpochLoop(headers, email, axiosConfig) {
  const maskedEmail = maskEmail(email);
  try {
    await activateEpoch(headers, email, axiosConfig);
    const randomDelay = Math.floor(Math.random() * 3 + 1) * 60000;
    parentPort.postMessage(
      `\x1b[38;5;147m[${maskedEmail}]Activate the epoch. Waiting ${
        randomDelay / 60000
      } minute before reactivating the epoch\x1b[0m`
    );
    setTimeout(
      () => activateEpochLoop(headers, email, axiosConfig),
      randomDelay
    );
  } catch (error) {
    parentPort.postMessage(
      `\x1b[38;5;168m[${maskedEmail}]Error activateEpochLoop: ${error.message}\x1b[0m`
    );
    setTimeout(() => activateEpochLoop(headers, email, axiosConfig), 60000);
  }
}

async function workerMain() {
  const { email, password } = workerData;
  const maskedEmail = maskEmail(email);
  let proxyString = null;
  let proxyStatus = "Without Proxy";

  try {
    const proxyFileContent = fs.existsSync("proxy.txt")
      ? fs.readFileSync("proxy.txt", "utf-8")
      : "";
    if (proxyFileContent.trim() !== "") {
      proxyString = proxyFileContent.trim().split("\n")[0];
    }
  } catch (err) {
    console.error(
      `\x1b[38;5;168m[${maskedEmail}] Gagal membaca file proxy: ${err.message}\x1b[0m`
    );
  }

  const headers = {
    Host: "node.securitylabs.xyz",
    "Sec-Ch-Ua": '"Chromium";v="123", "Not:A-Brand";v="8"',
    Accept: "application/json, text/plain, */*",
    "Sec-Ch-Ua-Mobile": "?0",
    "User-Agent": randomUserAgent.getRandom(),
    "Sec-Ch-Ua-Platform": "Linux",
    Origin: "https://node.securitylabs.xyz",
    "Sec-Fetch-Site": "same-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    Referer: "https://node.securitylabs.xyz/",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    Connection: "close",
    "Content-Type": "application/json"
  };

  let agent = null;
  let axiosConfig = { headers };

  if (proxyString) {
    try {
      agent = new HttpsProxyAgent(proxyString);
      proxyStatus = `${proxyString.split("@")[1] || proxyString}`;
      axiosConfig.httpsAgent = agent;
    } catch (err) {
      console.error(
        `\x1b[38;5;168m[${maskedEmail}] Proxy tidak valid: ${err.message}\x1b[0m`
      );
    }
  }

  try {
    parentPort.postMessage(`[${maskEmail(email)}] Memproses akun...`);

    // Check proxy
    // const cekproxy = await axios.get("https://api.ipify.org?format=json", {
    //   httpsAgent: agent
    // });
    // const ip  = cekproxy?.data.ip
    // parentPort.postMessage(
    //   `[${maskEmail(email)}] IP: ${ip}`
    // );
    const checkEmailResponse = await axios.post(
      "https://node.securitylabs.xyz/api/v1/auth/check-exist-email",
      { email },
      axiosConfig
    );

    if (!checkEmailResponse.data) {
      parentPort.postMessage(
        `\x1b[38;5;168mEmail tidak ditemukan untuk akun: ${maskedEmail}\x1b[0m`
      );
      return;
    }

    const signInResponse = await axios.post(
      "https://node.securitylabs.xyz/api/v1/auth/signin-user",
      { email, password },
      axiosConfig
    );
    const accessToken = signInResponse.data.accessToken;
    parentPort.postMessage(
      `[${maskEmail(email)}] Login success! | Proxy: ${proxyStatus}`
    );
    headers["Authorization"] = `Bearer ${accessToken}`;
    axiosConfig.headers = headers;

    const getUserResponse = await axios.get(
      "https://node.securitylabs.xyz/api/v1/users",
      axiosConfig
    );
    const userId = getUserResponse.data.id;

    const getWalletResponse = await axios.get(
      "https://node.securitylabs.xyz/api/v1/wallets",
      axiosConfig
    );
    const maskedWallet = maskWalletAddress(getWalletResponse.data[0].address);
    parentPort.postMessage(
      `\x1b[38;5;123m[${maskEmail(
        email
      )}] Wallet Address: ${maskedWallet}\x1b[0m`
    );

    claimMiningReward(userId, headers, email, axiosConfig);
    setInterval(
      () => claimMiningReward(userId, headers, email, axiosConfig),
      86400000
    );
    activateEpochLoop(headers, email, axiosConfig);


  } catch (error) {
    parentPort.postMessage(
      `\x1b[38;5;168m[${maskedEmail}] Error acccount ${maskedEmail}: ${error.message}\x1b[0m`
    );
  }
}

if (isMainThread) {
  clearConsole();

  async function main() {
    const accounts = readAccounts();
    for (const account of accounts) {
      const worker = new Worker(__filename, { workerData: account });

      worker.on("message", (message) => {
        console.log(`\x1b[38;5;116m${message}\x1b[0m`);
      });

      worker.on("error", (error) => {
        console.error(`\x1b[38;5;168m[Worker Error] ${error.message}\x1b[0m`);
      });

      worker.on("exit", (code) => {
        if (code !== 0) {
          console.error(`\x1b[38;5;168mWorker exited with code ${code}\x1b[0m`);
        }
      });
    }

    console.log("\x1b[38;5;122mSemua akun sedang diproses.\x1b[0m");
  }

  main();
} else {
  workerMain();
}
