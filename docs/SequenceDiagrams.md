# CinéMood - High-Level Sequence Diagrams

This document illustrates the key interaction flows of the CinéMood application.
Each diagram shows how the system components communicate step by step for a given use case.

---

## 1. User Registration:

This sequence covers the full flow when a new user creates an account on CinéMood.

**Actors:**
- `User` - the React Frontend
- `Backend` - the `/auth/register` route of the `FastAPI`
- `Buisiness Logic` - the  User Service of the `FastAPI`
- `Database` - the PostgreSQL database

**Key steps:**
1. The user submits the registration form via the frontend
2. The frontend sends a POST request to /auth/register
3. The backend routes the request to the User Service
4. The User Service validates the input data (name, email, password format)
5. The User Service hashes the password using bcrypt
6. The User Service inserts the new user record into the database
7. If the email already exists, a 409 Conflict is returned
8. If the insert fails, a 500 Internal Server Error is returned
9. If successful, a JWT token is generated and returned with a 201 Created response
10. The frontend redirects the authenticated user to the dashboard


```mermaid
sequenceDiagram
    actor User as User (Frontend)
    participant Back as Backend<br>(FastAPI<br>/auth/register)
    participant BL as Business Logic<br>(User Service)
    participant DB as PostgreSQL<br>Database

    User->>Back: Register account
    Note over User,Back: Fills in registration form<br>first name, last name,<br>email, password

    Back->>BL: Validate and process registration
    Note over Back,BL: POST /auth/register<br>{first_name, last_name,<br>email, password}

    BL->>BL: Validate user data
    Note over BL: validate_name()<br>validate_email()<br>validate_password()

    alt Invalid input data
        BL-->>Back: Reject registration
        Note over BL,Back: 400 Bad Request<br>Validation error details

        Back-->>User: Display error message
        Note over Back,User: Invalid name, email,<br>or password format

    else Valid input data
        BL->>BL: Hash password
        Note over BL: bcrypt hash<br>Password is never stored<br>in plain text

        BL->>DB: Create user
        Note over BL,DB: INSERT INTO users<br>(first_name, last_name,<br>email, hashed_password, ...)
        DB->>DB: Execute INSERT

        alt Email already exists
            DB-->>BL: Reject insert
            Note over DB,BL: Unique constraint violation<br>on users.email

            BL-->>Back: Email conflict
            Note over BL,Back: 409 Conflict<br>"email already in use"

            Back-->>User: Display error message
            Note over Back,User: Account cannot be created<br>with this email address

        else Insert fails
            DB-->>BL: Database error
            Note over DB,BL: Unexpected database<br>or server error

            BL-->>Back: Server error
            Note over BL,Back: 500 Internal Server Error

            Back-->>User: Display generic error
            Note over Back,User: Registration failed<br>Please try again later

        else Insert successful
            DB-->>BL: User created
            Note over DB,BL: New user record<br>returned from database

            BL->>BL: Generate JWT
            Note over BL: Create access token<br>linked to user_id

            BL-->>Back: Return success response
            Note over BL,Back: 201 Created<br>{jwt_token, user_id}

            Back-->>User: Redirect to dashboard
            Note over Back,User: User is authenticated<br>and redirected
        end
    end
```

---

## 2. User Login

This sequence covers the flow when a returning user logs into their account.

**Actors:**
`User` - the React Frontend
`Backend` - the `/auth/login` route of the `FastAPI`
`Business` Logic - the User Service of the `FastAPI`
`Database` - the PostgreSQL database

**Key steps:**
1. The user submits their email and password via the frontend
2. The frontend sends a POST request to /auth/login
3. The backend routes the request to the User Service
4. The User Service queries the database for the user by email
5. If the user is not found, a 401 Unauthorized is returned
6. The User Service verifies the password against the stored bcrypt hash
7. If the password is incorrect, a 401 Unauthorized is returned
8. If valid, a JWT token is generated and returned with a 200 OK response
9. The frontend stores the token and redirects to the dashboard

```mermaid
sequenceDiagram
    actor User as User (Frontend)
    participant Back as Backend<br>(FastAPI<br>/auth/login)
    participant BL as Business Logic<br>(User Service)
    participant DB as PostgreSQL<br>Database

    User->>Back: Log in
    Note over User,Back: Submits login form<br>email, password

    Back->>BL: Route login request
    Note over Back,BL: POST /auth/login<br>{email, password}

    BL->>DB: Fetch user by email
    Note over BL,DB: SELECT * FROM users<br>WHERE email = ?

    DB->>DB: Execute SELECT

    alt User not found
        DB-->>BL: Empty result
        Note over DB,BL: No user matching<br>this email address
        BL-->>Back: User not found
        Note over BL,Back: 401 Unauthorized<br>"invalid credentials"
        Back-->>User: Display error message
        Note over Back,User: Intentionally vague to prevent<br>email enumeration attacks
    else User found
        DB-->>BL: User record
        Note over DB,BL: Returns user including<br>hashed_password

        BL->>BL: Verify password
        Note over BL: verify_password()<br>Compare input with<br>bcrypt hash

        alt Password incorrect
            BL-->>Back: Invalid password
            Note over BL,Back: 401 Unauthorized<br>"invalid credentials"
            Back-->>User: Display error message
            Note over Back,User: Same message as user not found<br>to prevent enumeration
        else Password correct
            BL->>BL: Generate JWT
            Note over BL: Create access token<br>linked to user_id
            BL-->>Back: Return success response
            Note over BL,Back: 200 OK<br>{jwt_token, user_id}
            Back-->>User: Redirect to dashboard
            Note over Back,User: User is authenticated<br>and redirected
        end
    end
```
