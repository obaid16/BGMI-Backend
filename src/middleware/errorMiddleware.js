const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Mongoose validation errors
  let errors = [];
  if (err.name === 'ValidationError') {
    res.status(400);
    errors = Object.values(err.errors).map(val => val.message);
  }

  // Duplicate key error
  if (err.code && err.code === 11000) {
    res.status(400);
    const field = Object.keys(err.keyValue)[0];
    errors = [`Duplicate value for field: ${field}`];
  }

  res.status(res.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong on the server',
    errors: errors.length > 0 ? errors : [err.message || 'Server error']
  });
};

module.exports = {
  errorHandler
};
