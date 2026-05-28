const app = require('./app');
const env = require('./config/env');

app.listen(env.port, env.host, () => {
  console.log(`Online Appointment System listening on http://${env.host}:${env.port}`);
});
