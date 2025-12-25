export function deviceMiddleware(req, res, next) {
  const deviceId =
    req.headers['x-device-id'] ||
    req.headers['X-DEVICE-ID'] ||
    req.get('X-DEVICE-ID');

  console.log('📱 DEVICE ID:', deviceId); // 👈 TEMP DEBUG

  if (!deviceId) {
    return res.status(400).json({
      message: 'Device ID is required',
    });
  }

  req.deviceId = deviceId;
  next();
}
