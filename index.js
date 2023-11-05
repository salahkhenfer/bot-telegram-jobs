

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const TelegramBot = require("node-telegram-bot-api");

const token = "6628430616:AAGuHrDIfDwKy1jfb1YRTlenF2WNFNG_rF0";
const bot = new TelegramBot(token, { polling: true });

async function fetchJobsScraping(link) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    );

    await page.goto(link);

    await page.waitForSelector("li.css-0");

    const content = await page.content();
    const $ = cheerio.load(content);

    const jobListings = $("li.css-0");

    const jobData = jobListings
      .map((index, element) => {
        const title = $(element).find("h3").text();
        const company = $(element).find("p.chakra-text.css-jhqp7z").text();
        const location = $(element).find("p.chakra-text.css-1ejkpji").text();
        const salary = $(element).find("p.chakra-text.css-1ejkpji").text(); // Fix selector
        const link = $(element).find("a").attr("href");
        const description = $(element).find("p.chakra-text.css-1sawo7p").text();

        return {
          title,
          company,
          location,
          salary,
          link,
          description,
        };
      })
      .get();

    return jobData;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

const keywords = [
  "blockchain developer",
  "blockchain Engineer",
  "web3 developer",
  "web3 Engineer",
];

async function runFetchJobs(chatId) {
  let count = 0;
  for (const keyword of keywords) {
    const searchLink = `https://www.simplyhired.com/search?q=${keyword}&l=remote`;
    const jobData = await fetchJobsScraping(searchLink);

    for (const job of jobData) {
      count++;
      const message = `
        <strong> Job Title: ${job.title} </strong>
        <strong> Location: ${job.location} </strong>
        <strong> Company: ${job.company} </strong>
        <strong> Salary: ${job.salary} </strong>
        <strong> Additional Information: ${job.description} </strong>
        <a href="https://www.simplyhired.com${job.link}">Apply</a>
      `;
      if (count <= 10) {
        bot.sendMessage(chatId, message, { parse_mode: "HTML" });
      } else {
        return;
      }
    }
  }

  console.log("Done");
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  runFetchJobs(chatId);
});
