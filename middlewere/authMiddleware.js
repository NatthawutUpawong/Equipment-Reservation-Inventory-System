module.exports = (req, res, next) => {

    if (req.session.userID) {
        // return res.redirect('/dashboard');
    } else {
        return res.redirect('/login');
    }
    next();
}