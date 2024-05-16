require('dotenv').config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV}` })

// console.log('incrementStreak.js loaded')

const incrementStreak = async(req) => {
    try {
        let shareId = req.params.setid;
        let date = new Date();
        let currActivityDate = date.getDate();

        let user = await usersModel.findOne({ loginId: req.session.loginId });
        if (!user) {
            throw console.error();
        }
        let lastActivity = user.lastActivity;
        let prevActivityDate = lastActivity.timestamp.getDate();
        console.log(`prev ${prevActivityDate} curr ${currActivityDate}`)

        // reset or increment streak
        if (currActivityDate === prevActivityDate + 1) {
            user = await usersModel.findOneAndUpdate(
                { loginId: req.session.loginId },
                {$set: {
                        'lastActivity.timestamp': date,
                        'lastActivity.shareId': shareId,
                },
                $inc: {
                    streak: 1
                }},
                {returnOriginal: false}
            );
        } else if (currActivityDate === prevActivityDate) {
            user = await usersModel.findOneAndUpdate(
                { loginId: req.session.loginId },
                { $set: {
                    'lastActivity.timestamp': date,
                    'lastActivity.shareId': shareId
                }},
                {returnOriginal: false}
            );
        } else {
            user = await usersModel.findOneAndUpdate(
                { loginId: req.session.loginId },
                { $set: {
                    'lastActivity.timestamp': date,
                    'lastActivity.shareId': shareId,
                    streak: 0
                }},
                {returnOriginal: false}
            );
        }
        console.log(`after:${user}`);
        await user.save();
    } catch (err) {
        console.log(`error occured`);
        return;
    }
    console.log(`outside of try catch`);
    return;
}

module.exports = { incrementStreak }