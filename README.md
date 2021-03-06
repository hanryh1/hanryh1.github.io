### Dependencies
- Node.js
- MongoDB
- Bower
- Gulp

### Environment Variables
- `SMR_PASSWORD`: password for everyone
- `ADMIN_PASSWORD`: password for admins
- `SMR_SESSION_SECRET`: secret for cookie sessions
- `SECURE_PROXY` (Optional): If you want this app to be run over a secure proxy over HTTPS
- `MONGODB_URI` (Optional): URI to mongo instance
- `PORT` (Optional): Port to run the server on

The authentication scheme is super simplistic because it operates under the assumption that everyone with access
is a generally trusted party.

### Running Locally
- Make sure your Mongo daemon (`mongod`) is running if you're using a local mongo instance.
- Install dependencies with `npm install` and `bower install`
- Build client side scripts with `gulp`
- Start the server with `node app.js`
