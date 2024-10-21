# EyesOnBlog

## Description
This project is a Node.js application that serves various APIs and static files. It uses Express.js for routing and middleware, and it includes several routers and controllers for handling different parts of the application.


## Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add your environment variables:
    ```
    DB_HOST=""
    DB_USER=""
    DB_PASSWORD=""
    DB_DATABASE=""
    BLOG_BASE_URL=""
    EMAIL_NOTIFICATION_ENDPOINT_REGISTER=""
    EMAIL_NOTIFICATION_ENDPOINT_REVIEW=""
    GPT_ENDPOINT=""
    ROLE_MANAGEMENT_ENDPOINT=""
    TID_RETRIEVE_ENDPOINT=""
    ```

## Usage

1. Start the server:
    ```sh
    npm start
    ```

2. The server will be running on `http://0.0.0.0:8000`.

## API Endpoints

- **Stats**: `/api/stats` handled by [`statsRouter`](app/router/stats-router.js)
- **Blog**: `/api/blog` handled by [`blogRouter`](app/router/blog-router.js)
- **User**: `/api/user` handled by [`userRouter`](app/router/user-router.js)
- **Review**: `/api/review` handled by [`reviewRouter`](app/router/review-router.js)
- **Analytics**: `/api/analytics` handled by [`analyticsRouter`](app/router/analytics-router.js)
- **Pod**: `/api/pod` handled by [`podRouter`](app/router/pod-router.js)

## Static Files

Static files are served from the `www` directory.

## Controllers

- **Stats Controller**: [`statsController`](app/controller/stats-controller.js) handles syncing stats every hour.

## License

This project is licensed under the MIT License.