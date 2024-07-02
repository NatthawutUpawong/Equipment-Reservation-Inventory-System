module.exports = (req, res, next) => {


    if (req.session.role == 3) {
        return res.redirect('/homeuser');
    }
    next();
}