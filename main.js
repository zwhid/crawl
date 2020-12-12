let read = require('./read');
let write = require('./write');
let tagsUrl = 'https://juejin.cn/subscribe/all';//标签列表

(async function () {
    let tags = await read.tags(tagsUrl);
    await write.tags(tags);

    let allArticles = {};

    for (let tag of tags) {
        //先获取 每个标签下面的文章的列表
        let articles = await read.articles(tag.url, tag.name);
        //因为不同标签下面的文章可能有重复，所以不能全部push到数组里，而是借助对象key不重复的特性来去重
        articles.forEach(item => {
            allArticles[item.id] = item
        });
    }
    // 只取对象的值 {231231241: {}}
    await write.articles(Object.values(allArticles));
    process.exit();
})();