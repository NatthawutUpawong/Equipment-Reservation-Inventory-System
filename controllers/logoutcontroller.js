module.exports = (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).send("Cannot clear session");
        }
        else {
            res.redirect("/login");
        }
    });
}