module.exports = (req, res, next) => {
    if (req.session.role == 1) {
        return res.redirect(dashboardcontroller);
    }
    else if(req.session.role == 2){
        return res.redirect(dashboardteachercontroller);
    }
    else if(req.session.role == 3){
        return res.redirect(homeusercontroller);
    }
    next();
}