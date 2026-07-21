const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong, please try again later";

    res.status(statusCode).json({message});
};

module.exports = errorHandler;