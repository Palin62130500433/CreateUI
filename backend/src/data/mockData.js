const { lookupActionDesc } = require('./catalog');

function fmtTs(d) {
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3).slice(0, 2)}`;
}

function daysAgoDate(days, jitterDays = 0) {
  const jitter = jitterDays > 0 ? Math.random() * jitterDays * 86400000 : 0;
  return new Date(Date.now() - days * 86400000 - jitter);
}

const USERS = [
  { username: 'john.doe',    firstname: 'John',    lastname: 'Doe',    group: 'IT',         isAdmin: true,  status: 'Enable'  },
  { username: 'jane.smith',  firstname: 'Jane',    lastname: 'Smith',  group: 'Finance',    isAdmin: false, status: 'Enable'  },
  { username: 'bob.wang',    firstname: 'Bob',     lastname: 'Wang',   group: 'HR',         isAdmin: false, status: 'Enable'  },
  { username: 'alice.lek',   firstname: 'Alice',   lastname: 'Lek',    group: 'Admin',      isAdmin: true,  status: 'Enable'  },
  { username: 'charlie.tan', firstname: 'Charlie', lastname: 'Tan',    group: 'Operations', isAdmin: false, status: 'Disable' },
  { username: 'diana.korn',  firstname: 'Diana',   lastname: 'Korn',   group: 'IT',         isAdmin: false, status: 'Enable'  },
  { username: 'eve.somsri',  firstname: 'Eve',     lastname: 'Somsri', group: 'Finance',    isAdmin: false, status: 'Disable' },
  { username: 'frank.chai',  firstname: 'Frank',   lastname: 'Chai',   group: 'HR',         isAdmin: false, status: 'Enable'  },
  { username: 'grace.pim',   firstname: 'Grace',   lastname: 'Pim',    group: 'Admin',      isAdmin: true,  status: 'Enable'  },
  { username: 'henry.nat',   firstname: 'Henry',   lastname: 'Nat',    group: 'Operations', isAdmin: false, status: 'Enable'  },
];

const IPS = ['192.168.1.10', '10.0.0.5', '172.16.0.3', '192.168.100.25', '10.10.1.50', '192.168.1.55', '10.0.1.100'];
const CLIENT_NAMES = ['PC-JOHN01', 'PC-JANE02', 'PC-BOB03', 'LAPTOP-ALICE01', 'PC-ADMIN01', 'PC-CHARLIE05', 'PC-DIANA06'];
const CATALOG_IDS = ['9010001', '9010002', '9010003', '9010004', '9010005', '9010006', '9010007', '9010008', '9010009', '9010010'];
// Report 11 - 80 records spread across last 85 days
const report11Data = Array.from({ length: 80 }, (_, i) => {
  const user = USERS[i % USERS.length];
  const catalogId = CATALOG_IDS[i % CATALOG_IDS.length];
  const daysAgo = (i / 80) * 85;
  return {
    id: i + 1,
    loginDatetime: fmtTs(daysAgoDate(daysAgo, 0.5)),
    action: 'LOGIN',
    catalogId,
    actionDesc: lookupActionDesc(catalogId),
    userName: user.username,
    groupName: user.group,
    isAdministrator: user.isAdmin ? 'Y' : '',
    firstname: user.firstname,
    lastname: user.lastname,
    clientIpAddress: IPS[i % IPS.length],
    clientName: CLIENT_NAMES[i % CLIENT_NAMES.length],
    userStatus: user.status,
  };
});

// AD Audit Log sample templates — action types and data formats match AD_LOG CSV
const R12_TEMPLATES = [
  // --- User actions ---
  {
    targetType: 'user',
    action: 'CREATE USER',
    resultStatus: 'SUCCESS',
    flagSystem: 1,
    makeUpdated: (u) => `USERNAME[${u.username}],NAME[${u.firstname}],SURNAME[${u.lastname}]`,
    makePrevious: () => null,
  },
  {
    targetType: 'user',
    action: 'CREATE USER',
    resultStatus: 'FAILED',
    flagSystem: 1,
    makeUpdated: (u) => `USERNAME[${u.username}],NAME[${u.firstname}],SURNAME[${u.lastname}]`,
    makePrevious: () => null,
  },
  {
    targetType: 'user',
    action: 'EDIT USER PROFILE',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}],NAME[${u.firstname}],SURNAME[${u.lastname}],EMAIL[],MANAGER[],POSITION[]`,
    makePrevious: (u) => `USERNAME[${u.username}],NAME[OLD_${u.firstname}],SURNAME[OLD_${u.lastname}],EMAIL[],MANAGER[],POSITION[]`,
  },
  {
    targetType: 'user',
    action: 'EDIT USER PROFILE',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}],RESET PASSWORD[1],FORCE CHANGE PASSWORD NEXT LOGON[],NEW PASSWORD[CHANGED],CONFIRM PASSWORD[CHANGED],ADMINISTRATOR[],DISABLED[],TITLE[],NAME[${u.firstname}],SURNAME[${u.lastname}],EMAIL[],MANAGER[],POSITION[]`,
    makePrevious: (u) => `USERNAME[${u.username}],RESET PASSWORD[],FORCE CHANGE PASSWORD NEXT LOGON[],NEW PASSWORD[],CONFIRM PASSWORD[],ADMINISTRATOR[],DISABLED[],TITLE[],NAME[${u.firstname}],SURNAME[${u.lastname}],EMAIL[],MANAGER[],POSITION[]`,
  },
  {
    targetType: 'user',
    action: 'ENABLE USER',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}], ENABLE USER[1]`,
    makePrevious: (u) => `USERNAME[${u.username}], ENABLE USER[0]`,
  },
  {
    targetType: 'user',
    action: 'DISABLE USER',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}], DISABLE USER[1]`,
    makePrevious: (u) => `USERNAME[${u.username}], DISABLE USER[0]`,
  },
  {
    targetType: 'user',
    action: 'DELETE USER',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}], DELETE USER[1]`,
    makePrevious: (u) => `USERNAME[${u.username}], DELETE USER[0]`,
  },
  {
    targetType: 'user',
    action: 'EDIT GROUP MEMBERS',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `GROUP NAME[IT Team], USERNAME[${u.username}]`,
    makePrevious: (u) => `GROUP NAME[IT Team], USERNAME[]`,
  },
  {
    targetType: 'user',
    action: 'EDIT LOGON TIME PERMISSION',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}],DAY[MON],START TIME[8],END TIME TO[18]`,
    makePrevious: () => null,
  },
  {
    targetType: 'user',
    action: 'EDIT USER PRIVILEGE',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}],PRIVILEGES[BACKOFFICE[1],SCM[1],USER[1],GROUP[1],SYSTEM[1],SESSION[1],LOG REPORT[1],ONLINE INQUIRY[1],XIGNAL[1],SIMULATION[1],QUICK SEARCH[1],SEARCH[1]]`,
    makePrevious: (u) => `USERNAME[${u.username}],PRIVILEGES[BACKOFFICE[1],SCM[1],USER[0],GROUP[0],SYSTEM[0],SESSION[0],LOG REPORT[0],ONLINE INQUIRY[1],XIGNAL[1],SIMULATION[1],QUICK SEARCH[1],SEARCH[1]]`,
  },
  {
    targetType: 'user',
    action: 'EDIT INHERIT GROUP USER PRIVILEGES',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}],INHERIT GROUP USER PRIVILEGES[1]`,
    makePrevious: (u) => `USERNAME[${u.username}],INHERIT GROUP USER PRIVILEGES[0]`,
  },
  {
    targetType: 'user',
    action: 'EDIT INHERIT GROUP ADVANCED OPTIONS',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}],INHERIT PARENT GROUP'S ADVANCED OPTIONS[1]`,
    makePrevious: (u) => `USERNAME[${u.username}],INHERIT PARENT GROUP'S ADVANCED OPTIONS[0]`,
  },
  {
    targetType: 'user',
    action: 'EDIT ADVANCED OPTION',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}],MAXIMUM USER CONNECTIONS[],SESSION TIMEOUT DURATION[],PREFERRED LANGUAGE SELECTION[],FORCE CHANGE PASSWORD NEXT LOGON[],PASSWORD EXPIRED IN[],PASSWORD NEVER EXPIRE[],DISABLE USER[],DEFAULT MENU AFTER LOGON[]`,
    makePrevious: (u) => `USERNAME[${u.username}],MAXIMUM USER CONNECTIONS[],SESSION TIMEOUT DURATION[],PREFERRED LANGUAGE SELECTION[],FORCE CHANGE PASSWORD NEXT LOGON[],PASSWORD EXPIRED IN[],PASSWORD NEVER EXPIRE[],DISABLE USER[],DEFAULT MENU AFTER LOGON[]`,
  },
  {
    targetType: 'user',
    action: 'CLEAR SESSION',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `USERNAME[${u.username}], CLIENT IP ADDRESS[], CLIENT NAME[], LOGON TIME[]`,
    makePrevious: () => null,
  },
  // --- Group actions ---
  {
    targetType: 'group',
    action: 'CREATE GROUP',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `GROUP NAME[${u.username}_GRP],GROUP DESCRIPTION[],ADMINISTRATION[],USERNAME[]`,
    makePrevious: () => null,
  },
  {
    targetType: 'group',
    action: 'EDIT GROUP MEMBERS',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `GROUP NAME[${u.username}_GRP],GROUP DESCRIPTION[],ADMINISTRATION[],USERNAME[${u.username}]`,
    makePrevious: (u) => `GROUP NAME[${u.username}_GRP],GROUP DESCRIPTION[],ADMINISTRATION[],USERNAME[]`,
  },
  {
    targetType: 'group',
    action: 'DELETE GROUP',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: () => null,
    makePrevious: (u) => `GROUP NAME[${u.username}_GRP],GROUP DESCRIPTION[],ADMINISTRATION[],USERNAME[]`,
  },
  {
    targetType: 'group',
    action: 'EDIT GROUP PRIVILEGE',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `GROUP NAME[${u.username}_GRP],INQUIRY[1],XIGNAL[1],SIMULATION[1],QUICK SEARCH[1],SEARCH[1],ONLINE INQUIRY[1],MANAGE COLUMN[1],SAVE RETURN LIST COLUMN[1]]`,
    makePrevious: (u) => `GROUP NAME[${u.username}_GRP],INQUIRY[1],XIGNAL[0],SIMULATION[0],QUICK SEARCH[1],SEARCH[1],ONLINE INQUIRY[1],MANAGE COLUMN[1],SAVE RETURN LIST COLUMN[1]]`,
  },
  {
    targetType: 'group',
    action: 'EDIT ADVANCED OPTION',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: (u) => `GROUP NAME[${u.username}_GRP],MAXIMUM USER CONNECTIONS[],SESSION TIMEOUT DURATION[],PREFERRED LANGUAGE SELECTION[],PASSWORD NEVER EXPIRE[],DISABLE USER[],DEFAULT MENU AFTER LOGON[]`,
    makePrevious: (u) => `GROUP NAME[${u.username}_GRP],MAXIMUM USER CONNECTIONS[],SESSION TIMEOUT DURATION[],PREFERRED LANGUAGE SELECTION[],PASSWORD NEVER EXPIRE[],DISABLE USER[],DEFAULT MENU AFTER LOGON[]`,
  },
  // --- System actions ---
  {
    targetType: 'system',
    action: 'EDIT SYSTEM SETTING',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: () => `DEFAULT MAXIMUM USER CONNECTIONS[],DEFAULT SESSION TIMEOUT[30],DEFAULT PREFERRED LANGUAGE[EN],DISABLE INACTIVE USER AFTER CREATION[],DISABLE INACTIVE USER AFTER LAST LOGON[],DISABLE USER AFTER FAILED LOGON ATTEMPTS (TIMES)[]`,
    makePrevious: () => `DEFAULT MAXIMUM USER CONNECTIONS[],DEFAULT SESSION TIMEOUT[60],DEFAULT PREFERRED LANGUAGE[EN],DISABLE INACTIVE USER AFTER CREATION[],DISABLE INACTIVE USER AFTER LAST LOGON[],DISABLE USER AFTER FAILED LOGON ATTEMPTS (TIMES)[]`,
  },
  {
    targetType: 'system',
    action: 'EDIT SYSTEM PASSWORD POLICY',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: () => `MAXIMUM PASSWORD LENGTH[20],MINIMUM PASSWORD LENGTH[8],AT LEAST ONE LOWERCASE AND ONE UPPERCASE CHARACTER[1],AT LEAST ONE NUMERIC CHARACTER[1],AT LEAST ONE SYMBOLIC CHARACTER[1],PREVENT MATCHING LOGIN ID AND PASSWORD[1],PASSWORD EXPIRY FOR FORGOTTEN PASSWORDS (IN MINUTES)[60]`,
    makePrevious: () => null,
  },
  {
    targetType: 'system',
    action: 'EDIT SYSTEM LOGON TIME PERMISSION',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: () => `APPLY ALL[1],DAY[MON],START TIME[8],END TIME TO[18]`,
    makePrevious: () => null,
  },
  {
    targetType: 'system',
    action: 'EDIT NEWS POPUP',
    resultStatus: 'SUCCESS',
    flagSystem: 0,
    makeUpdated: () => `DISPLAY NEWS POPUP[1],NEWS TITLE[System Maintenance],NEWS BODY[Scheduled maintenance this weekend.],NEWS CALENDAR FROM[2026-06-20],TIME FROM[22:00],NEWS CALENDAR TO [2026-06-21],TIME TO[06:00]`,
    makePrevious: () => null,
  },
];

// Report 12 - AD Audit Log, 100 records spread across last 85 days
const report12Data = Array.from({ length: 100 }, (_, i) => {
  const tmpl = R12_TEMPLATES[i % R12_TEMPLATES.length];
  const user = USERS[i % USERS.length];
  const modifierUser = USERS[(i + 3) % USERS.length];
  const daysAgo = (i / 100) * 85;

  const isSystem = tmpl.flagSystem === 1;
  const isUserTarget = tmpl.targetType === 'user';
  const isGroupTarget = tmpl.targetType === 'group';

  const targetId = isUserTarget
    ? `B${String(i % USERS.length + 1).padStart(10, '0')}`
    : isGroupTarget
      ? `G${String((i % 5) + 1).padStart(4, '0')}`
      : null;

  const targetName = isUserTarget
    ? user.username
    : isGroupTarget
      ? `${user.username}_GRP`
      : 'SYSTEM';

  return {
    id: i + 1,
    targetId: tmpl.resultStatus === 'FAILED' && tmpl.action === 'CREATE USER' ? null : targetId,
    targetName,
    action: tmpl.action,
    actionDate: fmtTs(daysAgoDate(daysAgo, 0.5)),
    resultStatus: tmpl.resultStatus,
    ipAddress: isSystem ? null : IPS[(i + 2) % IPS.length],
    updatedData: tmpl.makeUpdated(user),
    previousData: tmpl.makePrevious(user),
    modifyId: isSystem ? null : `A${String(i + 1).padStart(10, '0')}`,
    modifyBy: isSystem ? 'SYSTEM' : modifierUser.username,
    flagSystem: tmpl.flagSystem,
    userStatus: isUserTarget ? user.status : null,
  };
});

// In-memory permission store (simulate DB column has_audit_log_access)
const permissions = {
  admin:       true,
  'john.doe':  true,
  'jane.smith': false,
  'bob.wang':  false,
};

const REPORTS = [
  { id: 1,  name: 'Usage Time Per User',      maxDays: null },
  { id: 2,  name: 'Total Usage User Per Day', maxDays: null },
  { id: 3,  name: 'Usage By Module',          maxDays: null },
  { id: 4,  name: 'Usage Report By Hour',     maxDays: null },
  { id: 5,  name: 'User Not Login',           maxDays: null },
  { id: 6,  name: 'Update Data',              maxDays: null },
  { id: 7,  name: 'Last Login 3 Months',      maxDays: null },
  { id: 8,  name: 'Current User in System',   maxDays: null },
  { id: 9,  name: 'Last Login',               maxDays: null },
  { id: 10, name: 'Successfully Login',       maxDays: null },
  { id: 11, name: 'Failed Login',             maxDays: 90   },
  { id: 12, name: 'Audit Log',                maxDays: 90   },
];

module.exports = { report11Data, report12Data, permissions, REPORTS };
