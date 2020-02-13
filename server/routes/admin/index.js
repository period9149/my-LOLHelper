module.exports = app => {
    const express = require('express')
    const jwt = require('jsonwebtoken')
    const AdminUser = require('../../models/AdminUser')
    const assert = require('http-assert')
    const router = express.Router({
        mergeParams: true
    })
    // 创建资源
    router.post('/', async(req, res) => {
        const model = await req.Model.create(req.body)
        res.send(model)
    })
    // 资源列表
    router.get('/', async(req, res) => {
        const queryOptions = {}
        if(req.Model.modelName === 'Category'){
            queryOptions.populate = 'parent'
        }
        const items = await req.Model.find().setOptions(queryOptions).limit(100)
        res.send(items)
    })
    // 资源详情
    router.get('/:id', async (req, res) => {
        const model = await req.Model.findById(req.params.id)
        res.send(model)
    })
    // 更新资源
    router.put('/:id', async (req, res) => {
        const model = await req.Model.findByIdAndUpdate(req.params.id, req.body)
        res.send(model)
    })
    // 删除资源
    router.delete('/:id', async (req, res) => {
        await req.Model.findByIdAndDelete(req.params.id, req.body)
        res.send({
            success: 'true'
        })
    })
    // 登录校验中间件
    const authMiddleware =require('../../middleware/auth')

    // 资源获取中间件
    const resourceMiddleWare = require('../../middleware/resource')

    app.use('/admin/api/rest/:resource', authMiddleware(), resourceMiddleWare(),router)

    const multer = require('multer')
    const upload = multer({ dest: __dirname + '../../../uploads' })
    app.post('/admin/api/upload',upload.single('file'), async (req, res) => {
        const file = req.file
        file.url = `http://lol.yxxsweb.xyz/uploads/${file.filename}`
        res.send(file)
    })
    // 登录验证
    app.post('/admin/api/login', async (req, res) => {
        const { username, password } = req.body
        //1. 根据用户名找用户
        const user = await AdminUser.findOne({ username }).select('+password')
        assert(user, 422, '用户名不存在')
        //2. 校验密码
        const isValid = require('bcrypt').compareSync(password, user.password)
        assert(isValid, 422, '密码错误')
        //3. 返回token
        const token = jwt.sign({ id: user.id }, app.get('secret'))
        res.send({token})
    })
    // 错误处理
    app.use(async (err, req, res, next) => {
        res.status(err.statusCode || 500).send({
            message: err.message
        })
    })
}