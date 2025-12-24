// Authentication middleware
exports.requireAuth = (req, res, next) => {
    if (!req.session.driver && !req.session.admin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

exports.requireAdmin = (req, res, next) => {
    if (!req.session.admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

exports.requireDriver = (req, res, next) => {
    if (!req.session.driver) {
        return res.status(403).json({ error: 'Driver access required' });
    }
    next();
};




