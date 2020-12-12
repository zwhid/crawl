let debug = require('debug')('crawl:read:tags');
let cheerio = require('cheerio');
let puppeteer = require('puppeteer');
// let fs = require('fs');

let browser = null;
let page = null;


//读取某个文章
let article = async function (id, url) {
  debug(`开始读取文章内容`);

  await page.goto(url, { waitUntil: 'networkidle0' }); // 跳转网页
  const html = await page.$eval('.main-container', element => element.innerHTML); // 拿到 .main-container 的html

  let $ = cheerio.load(html);//cheerio 加载 html，方便处理

  let title = $('h1.article-title').text().trim();//文章的标题

  let content = $('.article-content').html();//文章的内容

  let tagNames = $('.tag-title').map(function (index, item) { // 取到标签名，并把类数组转数组
    return $(this).text();
  })
  tagNames = Array.from(tagNames);

  return {
    id,
    title,
    content,
    tagNames
  }
}
// article('6903717128373796871', 'https://juejin.cn/post/6903717128373796871');


// 读取某个标签的文章列表
let articles = async function (url, tagName) {


  debug(`开始读取${tagName}标签下面的文章列表`);

  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' }); // 跳转网页
  const html = await page.$eval('.entry-list', element => element.innerHTML); // 拿到 .entry-list 的html

  

  let $ = cheerio.load(html);//cheerio 加载 html，方便处理

  let articles = [];

  const items = $('.item .title');

  for (let i = 0; i < items.length; i++) { // 同步迭代，必须用for循环，不能用each
    const item = items[i];

    let href = $(item).attr('href').trim();//取到超链接 /post/5c2f2fd66fb9a049ff4e43f0

    let title = $(item).text().trim();//取到标题
    let id = href.match(/\/(\w+)$/)[1];//取到id /post/(5c2f2fd66fb9a049ff4e43f0)
    href = 'https://juejin.cn' + href;//重新拼接赋值 href



    let { content, tagNames } = await article(id, href);
    articles.push({
      id,
      title,
      href,
      content,
      tagNames//标签是一个名字的数组，是一个字符串的数组
    });
    debug(`读取到文章: ${title}`);

  }

  // fs.writeFileSync('articles.json', JSON.stringify(articles));
  browser.close(); // 关闭浏览器

  return articles;
}

// articles('https://juejin.cn/tag/%E5%89%8D%E7%AB%AF','前端');

module.exports = articles;