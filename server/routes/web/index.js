module.exports = app => {
    const router = require('express').Router()
    const mongoose = require('mongoose')
    const Article = require('../../models/Article')
    const Category = require('../../models/Category')
    const Hero = require('../../models/Hero')
    //导入新闻数据
    router.get('/news/init', async (req, res) => {
        const parent = await Category.findOne({
            name: '新闻分类'
        })
        const cats = await Category.find().where({
            parent: parent
        }).lean()
        const newsTitles = ["C9豪取六连胜“独孤求败” 选手Zven总KDA高达71","GimGoon重做了？网友感叹：这是从哪儿来的帅哥",
        "Spirit死歌无解发育接管比赛 AF让一追二战胜HLE", "DRX Keria：想和Crisp、Ming交手", "木木撸话：Mayumi和天赐关系发展迅速" ,
            "DRX为武汉应援", "Haru：喜欢韩国G2这个称呼 但更想被人们直接称呼HLE", "DWG赛后采访ShowMaker：10分满分给自己打0.3分",
            "上单琴女成功取代索拉卡 韩服三大黑科技推荐", "云顶六影六光制霸后期！三大玩法成上分新趋势",
            "EZ重回T1行列 版本四大强势英雄推荐", "10.1版本云顶冷门玩法 三大强势上分阵容推荐",
            "云顶二代法海强势崛起 火男至强单核阵容解析, ","魔宗剑姬强势崛起 版本八大冷门套路盘点",
            "双灵风毒游侠崛起 国服云顶套路阵容"]
        const newsList = newsTitles.map( title => {
            const randomCats = cats.slice(0).sort( (a, b) => Math.random() - 0.5)
            return {
                categories: randomCats.slice(0,2),
                title: title
            }
        })
        await Article.deleteMany({})
        await Article.insertMany(newsList)
        res.send(newsList)
    })
    // 新闻列表
    router.get('/news/list', async (req, res)=> {
        const parent = await Category.findOne({
            name: '新闻分类'
        })
        const cats = await Category.aggregate([
            { $match: { parent: parent._id }},
            {
                $lookup: {
                    from: 'articles',
                    localField: '_id',
                    foreignField: 'categories',
                    as: 'newsList'
                }
            },
            {
                $addFields:{
                    newsList: { $slice: ['$newsList', 5] }
                }
            }
        ])
        const subCats = cats.map(v => v._id)
        cats.unshift({
            name: '热门',
            newsList: await Article.find().where({
                categories: { $in: subCats }
            }).populate('categories').limit(5).lean()
        })

        cats.map(cat => {
            cat.newsList.map(news => {
                news.categoryName = (cat.name === '热门')
                    ? news.categories[0].name : cat.name
                return news
            })
        })
        res.send(cats)
    })
// 英雄列表
    router.get('/heroes/list', async (req, res) => {
        const parent = await Category.findOne({
            name: '英雄分类'
        })
        const cats = await Category.aggregate([
            { $match: { parent: parent._id } },
            {
                $lookup: {
                    from: 'heros',
                    localField: '_id',
                    foreignField: 'categories',
                    as: 'heroList'
                }
            }
        ])
        const subCats = cats.map(v => v._id)
        cats.unshift({
            name: '热门',
            heroList: await Hero.find().where({
                categories: { $in: subCats }
            }).limit(10).lean()
        })

        res.send(cats)

    });

// 文章详情
    router.get('/articles/:id',async (req, res) => {
        const data = await Article.findById(req.params.id).lean()
        data.related = await Article.find().where({
            categories: { $in: data.categories }
        }).limit(2)
        res.send(data)
    })

// 英雄详情
    router.get('/heroes/:id', async (req,res) => {
        const data = await Hero.findById(req.params.id)
            .populate('categories items1 items2 partners.hero')
            .lean()
        res.send(data)
    })


    app.use('/web/api',router)
}