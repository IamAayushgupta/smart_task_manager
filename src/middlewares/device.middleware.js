export function deviceMiddleware(req, res, next) {
  const deviceId = req.headers['x-device-id'];

  if (!deviceId) {
    return res.status(400).json({
      message: 'Device ID is required',
    });
  }

  req.deviceId = deviceId;
  next();
}
