module.exports = (req, res, next) => {


    if (req.session.role == 1) {
        return res.redirect('/dashboard');
    }
    next();
}