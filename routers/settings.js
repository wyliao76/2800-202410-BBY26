const express = require('express')
const app = express();
app.use(express.json());
const router = new express.Router()
const usersModel = require('../models/users')

router.get('/', async (req, res) => {
    let userId = req.session.userId
    let userPic = await usersModel.findById(userId).select("-_id picture").lean();
    return res.render('settings', {imageId: userPic.picture})
})

router.post('/editName', (req, res) => {
    console.log(req.body)
    return res.json(req.body)
})

router.post('/changePwd', (req, res) => {
    console.log(req.body)
    return res.json(req.body)
})

router.post('/changePic', async (req, res) => {
    let picChoice = req.body.picture;
    let userId = req.session.userId;
    await usersModel.findByIdAndUpdate(userId, {picture: picChoice});
    res.redirect('/settings');
})

module.exports = router
