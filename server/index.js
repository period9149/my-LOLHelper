const express = require('express')

const app = express()

app.set('secret', 'or1rir09tu3')

app.use(express.json())
app.use(require('cors')())
app.use('/admin', express.static(__dirname + '/admin'))
app.use('/', express.static(__dirname + '/web'))
app.use('/uploads', express.static(__dirname + '/uploads'))

require('./routes/admin')(app)
require('./routes/web')(app)
require('./plugins/db')(app)

app.listen(3000, () => {
    console.log('http://localhost:3000')
})

