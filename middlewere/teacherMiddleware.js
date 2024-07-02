module.exports = (req, res, next) => {


    if (req.session.role == 2) {
        return res.redirect('/dashboardteacher');
    }
    next();
}