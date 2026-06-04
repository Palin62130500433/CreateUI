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
const ACTIONS_R12 = ['UPDATE', 'CREATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'RESET_PASSWORD'];
const RESULTS = ['SUCCESS', 'FAILED'];

// Report 11 - 80 records spread across last 85 days
const report11Data = Array.from({ length: 80 }, (_, i) => {
  const user = USERS[i % USERS.length];
  const catalogId = CATALOG_IDS[i % CATALOG_IDS.length];
  const daysAgo = (i / 80) * 85; // evenly spread 0..85 days ago
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

// Report 12 - 100 records spread across last 85 days
const report12Data = Array.from({ length: 100 }, (_, i) => {
  const targetUser = USERS[i % USERS.length];
  const modifierUser = USERS[(i + 3) % USERS.length];
  const action = ACTIONS_R12[i % ACTIONS_R12.length];
  const hasData = ['UPDATE', 'CREATE', 'DELETE'].includes(action);
  const daysAgo = (i / 100) * 85;

  let updatedData = null;
  let previousData = null;
  if (hasData) {
    updatedData = action === 'CREATE'
      ? JSON.stringify({ status: 'Enable', role: 'User' })
      : JSON.stringify({ status: 'Active', updatedAt: fmtTs(daysAgoDate(daysAgo)) });
    if (action === 'UPDATE') {
      previousData = JSON.stringify({ status: 'Inactive', updatedAt: fmtTs(daysAgoDate(daysAgo + 1)) });
    }
  }

  return {
    id: i + 1,
    username: targetUser.username,
    action,
    actionDate: fmtTs(daysAgoDate(daysAgo, 0.5)),
    actionDesc: `${action} user account`,
    result: RESULTS[i % RESULTS.length],
    ipAddress: IPS[(i + 2) % IPS.length],
    updatedData,
    previousData,
    modifyBy: modifierUser.username,
    userStatus: targetUser.status,
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
