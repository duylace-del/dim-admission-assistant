module.exports = function(req, res) {
  res.json({ pong: true, url: req.url });
};
