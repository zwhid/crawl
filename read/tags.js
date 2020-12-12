let debug = require('debug')('crawl:read:tags');
let cheerio = require('cheerio');
let puppeteer = require('puppeteer');

const tags = async function (url) {
  debug('开始读取所有的标签列表');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle0' }); // 跳转网页
  const html = await page.$eval('.tag-list', element => element.innerHTML); // 拿到 .tag-list 的html
  browser.close(); // 关闭浏览器

  let $ = cheerio.load(html);//cheerio 加载 html，方便处理

  let tags = [];
  $('li.item').each(function () {
    // 取到图片地址
    let imageUrl = $(this).find('.lazy.thumb').attr('src');
    console.log(imageUrl);
    let indexOfSep = imageUrl.indexOf('?');
    if (indexOfSep != -1) {
      imageUrl = imageUrl.slice(0, indexOfSep);//如果图片地址?后面带有参数，去掉参数
    }

    let name = $(this).find('.title').text().trim();// 取到标签名
    let subscribe = $(this).find('.subscribe').text().match(/(\d+)/)[1];// 取到关注数
    let article = $(this).find('.article').text().match(/(\d+)/)[1];// 取到文章数

    tags.push({
      image: imageUrl,
      name,
      url: `https://juejin.im/tag/${encodeURIComponent(name)}`,
      subscribe: Number(subscribe),
      article: Number(article)
    });

    debug(`读取到一个新的标签:${name}`);
  });
  return tags.slice(0, 3);
}

// tags('https://juejin.cn/subscribe/all');

module.exports = tags;