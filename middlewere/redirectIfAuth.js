module.exports = (req, res, next) => {
    if (req.session.userID) {
        if (req.session.role == 1) {
            return res.redirect('/dashboard');
        }
        else if (req.session.role == 2) { 
            return res.redirect('/dashboardteacher');
        }
        else if (req.session.role == 3) {
            return res.redirect('/homeuser');
        }
    }
   
    next();
}