# Facebook Clone + Instant Messenger API

A RESTful API that serves both of my keystone web applications:

- [Facebook Clone](https://github.com/rcamach7/facebook-clone)
- [Instant Messenger](https://github.com/rcamach7/messenger)

## Key Features

- Users maintain same information across both applications, allowing them to sign in with the same credentials, and maintain their friends across both platforms.
- RESTful API that performs CRUD operations on the following endpoints
  - users, posts, messages, and friends
- Processes multi-form data to perform CRUD operations on users and posts.

### Technologies Used

- NodeJS: runtime environment
  - express, express-validator, socket.io, cors, dotenv, passport, passport-local, bcryptjs, jsonwebtoken, multer,
- MongoDB: database system
  - mongoose, cloudinary

#### Local Installation & Running

```bash
git clone https://github.com/rcamach7/facebook-messenger-api
cd facebook-clone
npm install
npm run serverstart
```

App would need the following environment variables to run successfully:

- MONGO_DB, SECRET_STRING, CLOUDINARY_API, CLOUDINARY_CLOUD, CLOUDINARY_SECRET

#### Pending Improvements

- Add new function for populating database, adding custom profile pictures to each new user created.
