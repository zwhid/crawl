let express = require('express');
let bodyParser = require('body-parser');
let session = require('express-session');
let { checkLogin } = require('./middleware/auth');
// const elasticsearch = require('../elasticsearch');
let app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  resave: true,//每次都要重新保存session
  saveUninitialized: true,//保存未初始化的session
  secret: 'zwhcyy'//秘钥
}));

//把 user 数据合并到 ejs.render，控制登录按钮的显示/隐藏
app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
});

let path = require('path');
let query = require('../db');
let debug = require('debug')('crawl:web:server');
app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));
app.engine('html', require('ejs').__express);

//index.html 列出所有标签和该标签的文章标题(默认第一个标签)
app.get('/', async function (req, res) {
  let tagId = req.query.tagId;
  let tags = await query(`SELECT * FROM tags`);//查询所有的标签对象
  tagId = tagId || tags[0].id;//查询标签的ID
  let articles = await query(`SELECT articles.* FROM article_tag INNER JOIN articles ON article_tag.article_id=articles.id WHERE article_tag.tag_id = ?`, [tagId]);
  res.render('index', {
    tags,
    articles
  });
});

//根据articles的id获取title、content
app.get('/detail/:id', async function (req, res) {
  let id = req.params.id;
  let articles = await query(`SELECT * FROM articles WHERE id =? LIMIT 1`, [id]);
  res.render('detail', { article: articles[0] });
});


//渲染登录页面
app.get('/login', async function (req, res) {
  res.render('login', { title: '登录' });
});

// 登录的操作
app.post('/login', async function (req, res) {
  let { email } = req.body;
  let oldUsers = await query(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
  let user;
  if (Array.isArray(oldUsers) && oldUsers.length > 0) {
    user = oldUsers[0];
  } else {
    //如果是新用户先写入 users 表
    let result = await query(`INSERT INTO users(email) VALUES(?)`, [email]);
    user = { id: result.insertId, email }
  }
  req.session.user = user;//当前的用户信息放在会话中
  res.redirect('/');//重定向到首页
});

//渲染订阅页面 subscribe.html
app.get('/subscribe', checkLogin, async function (req, res) {
  let tags = await query(`SELECT * FROM tags`);
  let user = req.session.user;//拿到当前会话中的user属性
  let userTags = await query(`SELECT tag_id FROM user_tag WHERE user_id = ? `, [user.id]);
  let userTagIds = userTags.map(item => item.tag_id);//[1,2,3] 用户订阅的标签
  tags.forEach(tag => {
    tag.checked = userTagIds.indexOf(tag.id) != -1 ? "true" : "false";
  });
  res.render('subscribe', { title: '请订阅你感兴趣的标签', tags });
});

// 修改订阅
app.post('/subscribe', checkLogin, async function (req, res) {
  let { tags } = req.body;//[1,2,3]
  let user = req.session.user;
  await query(`DELETE FROM user_tag WHERE user_id = ?`, [user.id]); // 删除原来的订阅标签
  for (let i = 0; i < tags.length; i++) {
    await query(`INSERT INTO user_tag(user_id,tag_id) VALUES(?,?)`, [user.id, parseInt(tags[i])]);
  }
  res.redirect('back');
});
/*
app.get('/search', async function (req, res) {
  res.render('search', { title: '搜索', articles: [] });
});
app.post('/search', async function (req, res) {
  let { keyword } = req.body;
  let result = await elasticsearch.search({
    index: 'crawl',
    type: 'article',
    body: {
      query: {
        match: {
          title: keyword
        }
      }
    }
  });
  let hits = result.hits.hits;
  let articles = hits.map(item => item._source);
  res.render('search', { title: '搜索', articles });
});
*/

//定时任务
let CronJob = require('cron').CronJob;
let { spawn } = require('child_process');

let job = new CronJob('1 */30 * * * *', function () {//每隔30分钟执行一次
  debug('开始执行更新的计划任务');
  let child = spawn(process.execPath, [path.resolve(__dirname, '../main')]);//相当于 node ../main.js
  child.stdout.pipe(process.stdout);//把子进程里的正常输出重定向到父进程里
  child.stderr.pipe(process.stderr);//把子进程里的错误输出重定向到父进程里
  child.on('close', function () {
    console.log('更新任务完毕');
  });
});
// job.start();

app.listen(3000);