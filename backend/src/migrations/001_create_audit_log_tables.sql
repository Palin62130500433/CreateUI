-- Migration: 001_create_audit_log_tables
-- Creates core tables for the Backoffice Audit Log system.

-- ---------------------------------------------------------------------------
-- ACTION_CATALOG
-- Reference table mapping internal catalog IDs to human-readable descriptions.
-- ---------------------------------------------------------------------------
CREATE TABLE ACTION_CATALOG (
    CATALOG_ID    VARCHAR(20)  NOT NULL,
    NAME_EN       VARCHAR(200) NOT NULL,
    NAME_TH       VARCHAR(200),
    CREATED_AT    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_ACTION_CATALOG PRIMARY KEY (CATALOG_ID)
);

-- Seed data
INSERT INTO ACTION_CATALOG (CATALOG_ID, NAME_EN) VALUES
    ('9010001', 'User Login'),
    ('9010002', 'User Logout'),
    ('9010003', 'Password Change'),
    ('9010004', 'Profile Update'),
    ('9010005', 'Permission Grant'),
    ('9010006', 'Permission Revoke'),
    ('9010007', 'Data Export'),
    ('9010008', 'Report Access'),
    ('9010009', 'Account Lock'),
    ('9010010', 'Account Unlock');

-- ---------------------------------------------------------------------------
-- USERS
-- Application user accounts with audit log access control.
-- ---------------------------------------------------------------------------
CREATE TABLE USERS (
    USER_ID             BIGINT       NOT NULL AUTO_INCREMENT,
    USERNAME            VARCHAR(100) NOT NULL,
    FIRSTNAME           VARCHAR(100),
    LASTNAME            VARCHAR(100),
    GROUP_NAME          VARCHAR(100),
    IS_ADMINISTRATOR    CHAR(1)      NOT NULL DEFAULT 'N',  -- 'Y' or 'N'
    STATUS              VARCHAR(10)  NOT NULL DEFAULT 'ENABLE',  -- 'ENABLE' | 'DISABLE'
    HAS_AUDIT_LOG_ACCESS TINYINT(1)  NOT NULL DEFAULT 0,
    CREATED_AT          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT PK_USERS         PRIMARY KEY (USER_ID),
    CONSTRAINT UQ_USERS_USERNAME UNIQUE (USERNAME),
    CONSTRAINT CK_USERS_IS_ADMIN CHECK (IS_ADMINISTRATOR IN ('Y', 'N')),
    CONSTRAINT CK_USERS_STATUS   CHECK (STATUS IN ('ENABLE', 'DISABLE'))
);

CREATE INDEX IDX_USERS_STATUS ON USERS (STATUS);
CREATE INDEX IDX_USERS_ACCESS ON USERS (HAS_AUDIT_LOG_ACCESS);

-- ---------------------------------------------------------------------------
-- FAILED_LOGIN_LOG  (Report 11 source — login activity)
-- Records every login attempt regardless of success/failure.
-- ---------------------------------------------------------------------------
CREATE TABLE FAILED_LOGIN_LOG (
    LOG_ID            BIGINT       NOT NULL AUTO_INCREMENT,
    LOGIN_DATETIME    DATETIME(3)  NOT NULL,
    ACTION            VARCHAR(50)  NOT NULL,
    ACTION_CATALOG_ID VARCHAR(20),
    USER_NAME         VARCHAR(100),
    GROUP_NAME        VARCHAR(100),
    IS_ADMINISTRATOR  CHAR(1)      NOT NULL DEFAULT 'N',
    FIRSTNAME         VARCHAR(100),
    LASTNAME          VARCHAR(100),
    CLIENT_IP_ADDRESS VARCHAR(45),   -- supports IPv6
    CLIENT_NAME       VARCHAR(255),
    USER_STATUS       VARCHAR(10),   -- snapshot of USERS.STATUS at login time
    CONSTRAINT PK_FAILED_LOGIN_LOG PRIMARY KEY (LOG_ID),
    CONSTRAINT FK_FLL_CATALOG FOREIGN KEY (ACTION_CATALOG_ID)
        REFERENCES ACTION_CATALOG (CATALOG_ID) ON DELETE SET NULL
);

CREATE INDEX IDX_FLL_LOGIN_DT   ON FAILED_LOGIN_LOG (LOGIN_DATETIME);
CREATE INDEX IDX_FLL_USER_NAME  ON FAILED_LOGIN_LOG (USER_NAME);
CREATE INDEX IDX_FLL_USER_STATUS ON FAILED_LOGIN_LOG (USER_STATUS);

-- ---------------------------------------------------------------------------
-- AUDIT_LOG  (Report 12 source — data change activity)
-- Records all user actions that mutate system state.
-- Excludes VIEW, LOGIN, LOGOUT at query time (not at insert time).
-- ---------------------------------------------------------------------------
CREATE TABLE AUDIT_LOG (
    LOG_ID         BIGINT        NOT NULL AUTO_INCREMENT,
    USERNAME       VARCHAR(100),
    ACTION         VARCHAR(50)   NOT NULL,
    ACTION_DATE    DATETIME(3)   NOT NULL,
    ACTION_DESC    VARCHAR(500),
    RESULT         VARCHAR(20),              -- 'SUCCESS' | 'FAILED'
    IP_ADDRESS     VARCHAR(45),
    UPDATED_DATA   TEXT,
    PREVIOUS_DATA  TEXT,
    MODIFY_BY      VARCHAR(100),
    USER_STATUS    VARCHAR(10),              -- snapshot of USERS.STATUS at action time
    CONSTRAINT PK_AUDIT_LOG PRIMARY KEY (LOG_ID),
    CONSTRAINT CK_AUDIT_LOG_RESULT CHECK (RESULT IN ('SUCCESS', 'FAILED', NULL))
);

CREATE INDEX IDX_AL_ACTION_DATE  ON AUDIT_LOG (ACTION_DATE);
CREATE INDEX IDX_AL_USERNAME     ON AUDIT_LOG (USERNAME);
CREATE INDEX IDX_AL_ACTION       ON AUDIT_LOG (ACTION);
CREATE INDEX IDX_AL_USER_STATUS  ON AUDIT_LOG (USER_STATUS);

-- ---------------------------------------------------------------------------
-- Useful query patterns (not DDL — kept as reference comments)
-- ---------------------------------------------------------------------------

-- Report 11: login activity within a date range with optional user status filter
-- SELECT f.LOGIN_DATETIME, f.ACTION,
--        COALESCE(c.NAME_EN, f.ACTION_CATALOG_ID) AS ACTION_DESC,
--        f.USER_NAME, f.GROUP_NAME, f.IS_ADMINISTRATOR,
--        f.FIRSTNAME, f.LASTNAME, f.CLIENT_IP_ADDRESS, f.CLIENT_NAME
-- FROM   FAILED_LOGIN_LOG f
-- LEFT JOIN ACTION_CATALOG c ON c.CATALOG_ID = f.ACTION_CATALOG_ID
-- WHERE  f.LOGIN_DATETIME BETWEEN :fromPeriod AND :toPeriod
--   AND  (:userStatus = 'All' OR f.USER_STATUS = :userStatus)
--   AND  f.LOGIN_DATETIME >= DATE_SUB(NOW(), INTERVAL 90 DAY)  -- 90-day clamp
-- ORDER BY f.LOGIN_DATETIME DESC;

-- Report 12: data change activity (VIEW/LOGIN/LOGOUT excluded)
-- SELECT a.USERNAME, a.ACTION, a.ACTION_DATE, a.ACTION_DESC,
--        a.RESULT, a.IP_ADDRESS, a.UPDATED_DATA, a.PREVIOUS_DATA, a.MODIFY_BY
-- FROM   AUDIT_LOG a
-- WHERE  a.ACTION NOT IN ('VIEW', 'LOGIN', 'LOGOUT')
--   AND  a.ACTION_DATE BETWEEN :fromPeriod AND :toPeriod
--   AND  (:userStatus = 'All' OR a.USER_STATUS = :userStatus)
--   AND  a.ACTION_DATE >= DATE_SUB(NOW(), INTERVAL 90 DAY)  -- 90-day clamp
-- ORDER BY a.ACTION_DATE DESC;
