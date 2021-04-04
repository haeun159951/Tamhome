const authenticated = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
};

const authenticatedForAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.redirect("/userDashboard");
  }
};

const middlewares = {
  authenticated,
  authenticatedForAdmin,
};

module.exports = middlewares;
