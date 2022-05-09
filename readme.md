# Social Media API

A RESTful API that serves both of my keystone web applications:

- [Facebook Clone](https://github.com/rcamach7/facebook-clone)
- [Instant Messenger](https://github.com/rcamach7/messenger)

![Chart](https://res.cloudinary.com/de2ymful4/image/upload/v1651969498/portfolio/project_demos/chart_molv2l.png)

## Key Features

- Users maintain same information across both applications, allowing them to sign in with the same credentials, and maintain their friends across both platforms.
- Persistent data across both web applications platforms it serves, allowing users to make only once change and have it reflected across both front end applications.
- RESTful API that performs CRUD operations on the following endpoints; users, posts, messages, and friends.
- Processes multi-form data by validating it and sanitizing it before performing any requests.
- Utilizes Cloudinary as a CDN to manage user uploaded images, and stores them in the cloud for quick access.
- Creates socket connections with users in Messenger app to notify users of new messages, giving them instant messaging capabilities.

<details>
  <summary>...more features</summary>
  <li>User models created to enforce persistent data documents</li>
  <li>Endpoints sanitize and validate data before performing any CRUD operations to enforce data models.</li>
  <li>Password hashing implemented to protect users</li>
  <li>CORS enabled for all endpoints to allow communication with our front end</li>
  <li>PassportJS utilized to validate any log in requests</li>
  <li>Cloudinary utilized to store and set user profile images</li>
</details>

### Technologies Used

- NodeJS, express, express-validator, socket.io, cors, dotenv, passport, passport-local, bcryptjs, jsonwebtoken, multer, mongoose, cloudinary, custom middleware, multi form data, database population script.

#### Local Installation & Running

```bash
git clone https://github.com/rcamach7/social-media-api
cd social-media-api
npm install
npm run serverstart
```

App would need the following environment variables provided to run successfully:

- MONGO_DB, SECRET_STRING, CLOUDINARY_API, CLOUDINARY_CLOUD, CLOUDINARY_SECRET

#### Pending Improvements

- Separate messages into its own schema model.
