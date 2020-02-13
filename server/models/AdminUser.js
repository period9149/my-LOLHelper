const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    username: {type: String},
    password: {type: String,
        select: false,
        set(val){
        //密码加密
            return require('bcrypt').hashSync(val, 10)
        }
    }
})

module.exports = mongoose.model('AdminUser', schema)