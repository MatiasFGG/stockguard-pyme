-- StockGuard PyME
-- Migración 001: creación de usuarios y roles

CREATE TABLE users (
    id SERIAL PRIMARY KEY,

    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(150),

    password_hash TEXT NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'VENDEDOR',

    active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_login_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_user_full_name_not_blank
        CHECK (BTRIM(full_name) <> ''),

    CONSTRAINT chk_user_username_not_blank
        CHECK (BTRIM(username) <> ''),

    CONSTRAINT chk_user_role
        CHECK (
            role IN (
                'ADMINISTRADOR',
                'VENDEDOR'
            )
        )
);

CREATE UNIQUE INDEX uq_users_username_lower
    ON users (LOWER(username));

CREATE UNIQUE INDEX uq_users_email_lower
    ON users (LOWER(email))
    WHERE email IS NOT NULL;