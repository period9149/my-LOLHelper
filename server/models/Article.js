const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    title: {type: String},
    categories: [{type: mongoose.SchemaTypes.ObjectId, ref: 'Category'}],
    body: {type: String}
},{
    timestamps: {
        createdAt: 'createdAt',
        updateAt: 'updateAt'
    }
})

module.exports = mongoose.model('Article', schema)